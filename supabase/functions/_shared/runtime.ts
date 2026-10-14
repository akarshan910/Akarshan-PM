/**
 * The Deno side of the `pm-` functions: fills `Deps` from the function's environment. Supabase
 * provides SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_DB_URL to every function; the
 * owner sets PM_SITE_URL, PM_ALLOWED_ORIGINS and PM_DEPLOY_HOOK_URL as Edge Function secrets
 * (06 · The shared project). Nothing here logs a value.
 */
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

import type { Bucket, Deps, Handler, Sql } from "./deps.ts";

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing the ${name} secret.`);
  return value;
}

/** jsonb parameters go as JSON text; plain arrays of scalars stay arrays (uuid[], text[]). */
function param(v: unknown): unknown {
  if (v === null || v === undefined || typeof v !== "object") return v ?? null;
  if (Array.isArray(v) && v.every((x) => x === null || typeof x !== "object")) return v;
  return JSON.stringify(v);
}

type Pg = ReturnType<typeof postgres>;

function adapter(db: Pg | postgres.TransactionSql): Sql {
  return {
    async query<T>(text: string, params: unknown[] = []): Promise<T[]> {
      // deno-lint-ignore no-explicit-any
      return (await db.unsafe(text, params.map(param) as any[])) as unknown as T[];
    },
    async transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T> {
      if (!("begin" in db)) return fn(adapter(db));
      return (await (db as Pg).begin((tx) => fn(adapter(tx)))) as T;
    },
  };
}

let deps: Deps | undefined;

function makeDeps(): Deps {
  const url = required("SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const pg = postgres(required("SUPABASE_DB_URL"), { prepare: false, max: 2, idle_timeout: 20 });
  const sql = adapter(pg);
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return {
    sql,
    env: {
      siteUrl: required("PM_SITE_URL"),
      allowedOrigins: required("PM_ALLOWED_ORIGINS")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
      deployHookUrl: Deno.env.get("PM_DEPLOY_HOOK_URL") || undefined,
      serviceRoleKey,
    },
    auth: {
      async userId(jwt) {
        const { data, error } = await admin.auth.getUser(jwt);
        return error ? null : (data.user?.id ?? null);
      },
    },
    storage: {
      async list(bucket: Bucket, prefix: string) {
        const rows = await sql.query<{ name: string }>(
          "select name from storage.objects where bucket_id = $1 and starts_with(name, $2) order by name",
          [bucket, prefix],
        );
        return rows.map((r) => r.name);
      },
      async publish(name) {
        const from = admin.storage.from("pm-media-draft");
        let { error } = await from.copy(name, name, { destinationBucket: "pm-media-public" });
        if (error) {
          await admin.storage.from("pm-media-public").remove([name]);
          ({ error } = await from.copy(name, name, { destinationBucket: "pm-media-public" }));
        }
        if (error) throw new Error("Couldn't copy a file to pm-media-public.");
      },
      async remove(bucket, names) {
        if (names.length === 0) return;
        const { error } = await admin.storage.from(bucket).remove(names);
        if (error) throw new Error(`Couldn't remove files from ${bucket}.`);
      },
      async signedUrl(name, seconds) {
        const { data, error } = await admin.storage.from("pm-media-draft").createSignedUrl(name, seconds);
        if (error || !data) throw new Error("Couldn't sign a draft file.");
        return data.signedUrl;
      },
    },
    fetch: (input, init) => fetch(input, init),
    async resolveHost(host) {
      const out: string[] = [];
      for (const type of ["A", "AAAA"] as const) {
        try {
          out.push(...(await Deno.resolveDns(host, type)));
        } catch {
          // no records of this type
        }
      }
      return out;
    },
    now: () => new Date(),
    randomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
  };
}

export function serve(handler: Handler): void {
  Deno.serve((req) => {
    deps ??= makeDeps();
    return handler(req, deps);
  });
}
