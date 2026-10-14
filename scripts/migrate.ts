/**
 * `npm run db:migrate` (06 · Running migrations). Applies `supabase/pm/migrations/NNNN_*.sql` in
 * order, each in one transaction with `set local search_path = pm, extensions`, and records it in
 * `pm.schema_migrations`. It never uses the Supabase CLI's migration history, which belongs to
 * lumina-photography in the shared project (06 · The shared project).
 *
 * It connects with `PM_DATABASE_URL` (the session-pooler connection string), set in the owner's
 * shell for this one command. It reads no .env file and never prints the URL. Every file must pass
 * the migration lint first; one finding and nothing runs.
 *
 *   PM_DATABASE_URL=… npm run db:migrate            apply what's pending
 *   PM_DATABASE_URL=… npm run db:migrate -- --dry   list what's pending, change nothing
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { lintSql, migrationFiles, MIGRATIONS_DIR, type Finding } from "./migration-lint.ts";

export interface Migration {
  version: string;
  file: string;
  sql: string;
}

/** What a database connection must offer the runner. Tests use PGlite; the script uses `postgres`. */
export interface MigrationTarget {
  /** Versions already in `pm.schema_migrations` (empty before 0001 created it). */
  applied(): Promise<Set<string>>;
  /** Runs one file and records its version, in one transaction. */
  apply(migration: Migration): Promise<void>;
}

/** The SQL that wraps one file: the search path, the file, and its record. */
export function transactionBody(m: Migration): string[] {
  return [
    "set local search_path = pm, extensions",
    m.sql,
    `insert into pm.schema_migrations (version) values ('${m.version.replace(/[^0-9a-z_]/g, "")}')`,
  ];
}

export function loadMigrations(dir = MIGRATIONS_DIR): Migration[] {
  return migrationFiles(dir).map((file) => ({
    version: file.replace(/\.sql$/, ""),
    file,
    sql: readFileSync(join(dir, file), "utf8"),
  }));
}

export function lintMigrations(migrations: Migration[]): Finding[] {
  return migrations.flatMap((m) => lintSql(m.file, m.sql));
}

/** Applies every pending migration in order. Returns the versions applied. */
export async function runMigrations(target: MigrationTarget, migrations: Migration[]): Promise<string[]> {
  const findings = lintMigrations(migrations);
  if (findings.length > 0) {
    throw new Error(`Migration lint failed:\n${findings.map((f) => `  ${f.file}: ${f.message}`).join("\n")}`);
  }
  const done = await target.applied();
  const ran: string[] = [];
  for (const m of migrations) {
    if (done.has(m.version)) continue;
    await target.apply(m);
    ran.push(m.version);
  }
  return ran;
}

async function main(): Promise<void> {
  const url = process.env.PM_DATABASE_URL;
  if (!url) {
    console.error("Set PM_DATABASE_URL in your shell for this command only (06 · Running migrations).");
    process.exit(1);
  }
  const dry = process.argv.includes("--dry");
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  const target: MigrationTarget = {
    async applied() {
      const [exists] = await sql<
        { t: string | null }[]
      >`select to_regclass('pm.schema_migrations')::text as t`;
      if (!exists?.t) return new Set();
      const rows = await sql<{ version: string }[]>`select version from pm.schema_migrations`;
      return new Set(rows.map((r) => r.version));
    },
    async apply(m) {
      if (dry) {
        console.log(`pending  ${m.file}`);
        return;
      }
      await sql.begin(async (tx) => {
        for (const part of transactionBody(m)) await tx.unsafe(part);
      });
      console.log(`applied  ${m.file}`);
    },
  };
  try {
    const ran = await runMigrations(target, loadMigrations());
    if (ran.length === 0) console.log("Nothing to apply.");
  } catch (error) {
    // Postgres messages only; never the connection string.
    console.error(error instanceof Error ? error.message : "Migration failed.");
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
