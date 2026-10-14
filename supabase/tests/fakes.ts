/**
 * Test doubles for the `pm-` functions' ports: SQL over PGlite (with the real migrations), and
 * in-memory Storage, Auth and network.
 */
import type { PGlite, Transaction } from "@electric-sql/pglite";

import type { Bucket, Deps, Sql } from "../functions/_shared/deps.ts";

export const SITE = "https://akarshan-pm.vercel.app";
export const STUDIO_ORIGIN = SITE;
export const SERVICE_KEY = "test-service-role-key";
export const DEPLOY_HOOK = "https://api.vercel.test/hook";

function sqlOver(db: PGlite | Transaction): Sql {
  return {
    async query<T>(text: string, params: unknown[] = []) {
      return (await db.query<T>(text, params)).rows;
    },
    async transaction<T>(fn: (tx: Sql) => Promise<T>) {
      if ("transaction" in db) return db.transaction((tx) => fn(sqlOver(tx)));
      return fn(sqlOver(db));
    },
  };
}

export interface FakeWorld {
  deps: Deps;
  files: Record<Bucket, Set<string>>;
  calls: { url: string; method: string }[];
  /** Responses for outbound URLs; anything else answers 200. */
  responses: Map<string, () => Response>;
  tokens: Map<string, string>;
  /** DNS answers by host; anything else resolves to a public documentation-free address. */
  dns: Map<string, string[]>;
  created: Map<string, Date>;
  clock: { now: Date };
}

export function fakeWorld(db: PGlite): FakeWorld {
  const files: Record<Bucket, Set<string>> = { "pm-media-draft": new Set(), "pm-media-public": new Set() };
  const calls: FakeWorld["calls"] = [];
  const responses = new Map<string, () => Response>();
  const tokens = new Map<string, string>();
  const dns = new Map<string, string[]>();
  /** When a file was uploaded; files without an entry count as old. */
  const created = new Map<string, Date>();
  const clock = { now: new Date() };
  let seed = 1;
  const deps: Deps = {
    sql: sqlOver(db),
    env: {
      siteUrl: SITE,
      allowedOrigins: [SITE, "http://localhost:4340"],
      deployHookUrl: DEPLOY_HOOK,
      serviceRoleKey: SERVICE_KEY,
    },
    auth: { userId: (jwt) => Promise.resolve(tokens.get(jwt) ?? null) },
    storage: {
      list: (bucket, prefix, before) =>
        Promise.resolve(
          [...files[bucket]]
            .filter((n) => n.startsWith(prefix) && (!before || (created.get(n) ?? new Date(0)) < before))
            .sort(),
        ),
      publish(name) {
        if (!files["pm-media-draft"].has(name)) return Promise.reject(new Error("missing"));
        files["pm-media-public"].add(name);
        return Promise.resolve();
      },
      remove(bucket, names) {
        for (const n of names) files[bucket].delete(n);
        return Promise.resolve();
      },
      signedUrl: (name, seconds) =>
        Promise.resolve(
          `https://ref.supabase.test/storage/v1/object/sign/pm-media-draft/${name}?ttl=${seconds}`,
        ),
    },
    fetch: (input, init) => {
      const url = input instanceof Request ? input.url : input.toString();
      calls.push({ url, method: init?.method ?? "GET" });
      const r = responses.get(url);
      return Promise.resolve(r ? r() : new Response("ok", { status: 200 }));
    },
    resolveHost: (host) => Promise.resolve(dns.get(host) ?? ["93.184.215.14"]),
    now: () => clock.now,
    randomBytes: (n) => new Uint8Array(n).map(() => (seed = (seed * 1103515245 + 12345) % 256)),
  };
  return { deps, files, calls, responses, tokens, dns, created, clock };
}

export function request(
  method: string,
  path: string,
  options: { token?: string; body?: unknown; origin?: string } = {},
): Request {
  const headers: Record<string, string> = {};
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.origin) headers.origin = options.origin;
  if (options.body !== undefined) headers["content-type"] = "application/json";
  return new Request(`https://ref.supabase.test/functions/v1/${path}`, {
    method,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
}

export async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
