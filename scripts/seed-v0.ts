/**
 * `npm run seed:v0` (07 · Extraction, 10 · WP3.4): the launch content, once, into an empty `pm` schema.
 * The logic is in scripts/seed-v0-core.ts. Runs in the owner's shell with the values set for this
 * one command, never from a file:
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… PM_DATABASE_URL=… npm run seed:v0
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import type { Sql } from "../supabase/functions/_shared/deps.ts";
import { coverUploader, nodeDeps, pgParam, seedV0 } from "./seed-v0-core.ts";

const PROTOTYPES_FILE = "scripts/v0-prototypes.json";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Set ${name} in your shell for this command only (07 · Extraction).`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const url = required("SUPABASE_URL");
  const key = required("SUPABASE_SERVICE_ROLE_KEY");
  const dbUrl = required("PM_DATABASE_URL");
  const { createClient } = await import("@supabase/supabase-js");
  const { default: postgres } = await import("postgres");
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const pg = postgres(dbUrl, { max: 1, onnotice: () => undefined });
  const prototypes = existsSync(PROTOTYPES_FILE)
    ? (JSON.parse(readFileSync(PROTOTYPES_FILE, "utf8")) as Record<string, string>)
    : {};
  try {
    const result = await pg.begin(async (tx) => {
      const sql: Sql = {
        query: async <T>(text: string, params: unknown[] = []) =>
          (await tx.unsafe(text, params.map(pgParam) as never[])) as unknown as T[],
        transaction: (fn) => fn(sql),
      };
      const deps = nodeDeps(sql, admin, process.env.PM_SITE_URL ?? "https://akarshan-pm.vercel.app");
      return seedV0(deps, {
        readCover: (path) => readFileSync(path),
        upload: coverUploader(admin),
        prototypes,
        uuid: randomUUID,
      });
    });
    console.log(
      `Seeded ${result.projects} projects: published ${result.published.join(", ")}; drafts ${result.drafts.join(", ")}.`,
    );
    console.log("Next: deploy the site (or publish once in Studio) so the build reads the new content.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "The seed failed; nothing was written.");
    process.exitCode = 1;
  } finally {
    await pg.end();
  }
}

await main();
