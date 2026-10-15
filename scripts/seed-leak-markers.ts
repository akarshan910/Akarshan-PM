/**
 * `npm run seed:leaks`: prepares a LOCAL Supabase stack (`supabase start`) for the build-level
 * no-leaks suite (08 · Drafts never leak; tests/e2e/no-leaks.spec.ts in CI). It:
 *
 * 1. refuses to run unless SUPABASE_URL and PM_DATABASE_URL both point at this machine;
 * 2. switches on pg_cron and pg_net (local only: on the shared project the owner does this) and
 *    applies the pm migrations with db:migrate's runner;
 * 3. makes the test owner `owner@example.test` and runs the V0 seed;
 * 4. adds every 08 marker (scripts/leak-markers.ts), publishes through pm-publish's handler, makes a
 *    preview link, and prints the manifest as JSON (also to $LEAK_MANIFEST_OUT when set).
 *
 *   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=… SUPABASE_ANON_KEY=… (supabase status) \
 *   PM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run seed:leaks
 *
 * The local stack's keys are the CLI's public demo keys, read from `supabase status` at run time.
 */
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import type { Sql } from "../supabase/functions/_shared/deps.ts";
import { addLeakMarkers } from "./leak-markers.ts";
import { loadMigrations, runMigrations, type MigrationTarget, type Query } from "./migrate.ts";
import { coverUploader, nodeDeps, pgParam, seedV0 } from "./seed-v0-core.ts";

export const TEST_OWNER = "owner@example.test";
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

/** Whether an address points at this machine (or a CI runner's own services). */
export function isLocal(value: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Set ${name} (the local stack's value from \`supabase status\`).`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const url = required("SUPABASE_URL");
  const key = required("SUPABASE_SERVICE_ROLE_KEY");
  const dbUrl = required("PM_DATABASE_URL");
  const anonKey = required("SUPABASE_ANON_KEY");
  if (!isLocal(url) || !isLocal(dbUrl)) {
    console.error(
      "seed:leaks runs only against a local stack (127.0.0.1 or localhost). Nothing was changed.",
    );
    process.exit(1);
  }
  const { createClient } = await import("@supabase/supabase-js");
  const { default: postgres } = await import("postgres");
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const pg = postgres(dbUrl, { max: 1, onnotice: () => undefined });
  const over =
    (db: { unsafe: (q: string, p?: never[]) => Promise<unknown> }): Query =>
    async <T>(q: string, params: unknown[] = []) =>
      (await db.unsafe(q, params.map(pgParam) as never[])) as T[];
  try {
    await pg
      .unsafe("create extension if not exists pg_cron; create extension if not exists pg_net;")
      .simple();
    const target: MigrationTarget = {
      query: over(pg),
      async transaction(fn) {
        await pg.begin((tx) =>
          fn(over(tx), async (q) => {
            await tx.unsafe(q).simple();
          }),
        );
      },
    };
    await runMigrations(target, loadMigrations());

    let userId: string | undefined;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = list.users.find((u) => u.email === TEST_OWNER)?.id;
    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({ email: TEST_OWNER, email_confirm: true });
      if (error || !data.user) throw new Error("Couldn't create the local test owner.");
      userId = data.user.id;
    }
    await pg`insert into pm.owners (user_id) values (${userId}) on conflict do nothing`;

    const owner = { token: `local-${randomUUID()}`, userId };
    const manifest = await pg.begin(async (tx) => {
      const sql: Sql = { query: over(tx), transaction: (fn) => fn(sql) };
      const deps = nodeDeps(sql, admin, process.env.PM_SITE_URL ?? "http://127.0.0.1:4173", owner);
      await seedV0(deps, {
        readCover: (path) => readFileSync(path),
        upload: coverUploader(admin),
        prototypes: {},
        uuid: randomUUID,
      });
      return addLeakMarkers(deps, owner);
    });
    // tests/e2e/no-leaks.spec.ts also wants the stack's address and anon key, the draft addresses, and a
    // preview it can revoke with a real owner session (signed in here with a one-time code).
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: TEST_OWNER,
    });
    if (linkError) throw new Error("Couldn't make a sign-in code for the local test owner.");
    const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: signedIn, error: otpError } = await anon.auth.verifyOtp({
      email: TEST_OWNER,
      token: link.properties.email_otp,
      type: "email",
    });
    const jwt = signedIn.session?.access_token;
    if (otpError || !jwt) throw new Error("Couldn't sign the local test owner in.");
    const fn = `${url.replace(/\/$/, "")}/functions/v1`;
    const text = JSON.stringify(
      {
        ...manifest,
        supabaseUrl: url,
        anonKey,
        missingPaths: manifest.notFound,
        unlistedPath: manifest.unlisted.path,
        preview: {
          ...manifest.preview,
          url: `${fn}/pm-preview?token=${manifest.preview.token}`,
          revokeUrl: `${fn}/pm-preview?tokenHash=${manifest.preview.tokenHash}`,
          revokeHeaders: { authorization: `Bearer ${jwt}`, apikey: anonKey },
        },
      },
      null,
      2,
    );
    if (process.env.LEAK_MANIFEST_OUT) writeFileSync(process.env.LEAK_MANIFEST_OUT, text);
    console.log(text);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "seed:leaks failed.");
    process.exitCode = 1;
  } finally {
    await pg.end();
  }
}

if (!process.env.VITEST) await main();
