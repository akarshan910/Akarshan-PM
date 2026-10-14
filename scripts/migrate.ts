/**
 * `npm run db:migrate` (06 · Running migrations). Applies `supabase/pm/migrations/NNNN_*.sql` in
 * order, each in one transaction with `set local search_path = pm, extensions`, and records it in
 * `pm.schema_migrations`. It never uses the Supabase CLI's migration history, which belongs to
 * lumina-photography in the shared project (06 · The shared project).
 *
 * It connects with `PM_DATABASE_URL` (the session-pooler connection string), set in the owner's
 * shell for this one command. It reads no .env file and never prints the URL. Nothing runs when a
 * file fails the migration lint, or when a file that was already applied has changed since (its
 * SHA-256 is recorded from 0003 on): a change always goes in a new migration.
 *
 *   PM_DATABASE_URL=… npm run db:migrate            apply what's pending
 *   PM_DATABASE_URL=… npm run db:migrate -- --dry   list what's pending, change nothing
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { lintSql, migrationFiles, MIGRATIONS_DIR, type Finding } from "./migration-lint.ts";

export interface Migration {
  version: string;
  file: string;
  sql: string;
}

export type Query = <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
/** Runs SQL that may hold several statements (a whole migration file), with no parameters. */
export type Exec = (sql: string) => Promise<void>;

/** What a database connection must offer the runner. Tests use PGlite; the script uses `postgres`. */
export interface MigrationTarget {
  query: Query;
  /** Runs `fn` in one transaction; a throw rolls it all back. */
  transaction(fn: (query: Query, exec: Exec) => Promise<void>): Promise<void>;
}

/** A file's SHA-256, as recorded in `pm.schema_migrations.checksum`. */
export function checksum(sql: string): string {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

async function hasChecksums(query: Query): Promise<boolean> {
  const [row] = await query<{ n: number }>(
    `select count(*)::int as n from information_schema.columns
     where table_schema = 'pm' and table_name = 'schema_migrations' and column_name = 'checksum'`,
  );
  return (row?.n ?? 0) > 0;
}

/** Applied versions with their checksums (null for files applied before 0003 added the column). */
export async function appliedVersions(query: Query): Promise<Map<string, string | null>> {
  const [table] = await query<{ t: string | null }>("select to_regclass('pm.schema_migrations')::text as t");
  if (!table?.t) return new Map();
  const rows = await query<{ version: string; checksum: string | null }>(
    (await hasChecksums(query))
      ? "select version, checksum from pm.schema_migrations"
      : "select version, null::text as checksum from pm.schema_migrations",
  );
  return new Map(rows.map((r) => [r.version, r.checksum]));
}

/** Runs one file and records it, inside the caller's transaction. */
export async function applyOne(query: Query, exec: Exec, m: Migration): Promise<void> {
  await exec("set local search_path = pm, extensions");
  await exec(m.sql);
  await query("insert into pm.schema_migrations (version) values ($1)", [m.version]);
  if (await hasChecksums(query)) {
    await query("update pm.schema_migrations set checksum = $2 where version = $1", [
      m.version,
      checksum(m.sql),
    ]);
  }
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

/** What would run, after the lint and the checksum check. Throws instead of returning a bad plan. */
export async function plan(target: MigrationTarget, migrations: Migration[]): Promise<Migration[]> {
  const findings = lintMigrations(migrations);
  if (findings.length > 0) {
    throw new Error(`Migration lint failed:\n${findings.map((f) => `  ${f.file}: ${f.message}`).join("\n")}`);
  }
  const done = await appliedVersions(target.query);
  for (const [version, sum] of done) {
    const m = migrations.find((x) => x.version === version);
    if (!m) throw new Error(`${version} was applied, but its file is missing.`);
    if (sum !== null && sum !== checksum(m.sql)) {
      throw new Error(`${m.file} changed after it was applied. Put the change in a new migration.`);
    }
  }
  return migrations.filter((m) => !done.has(m.version));
}

/** Applies every pending migration in order. Returns the versions applied. */
export async function runMigrations(target: MigrationTarget, migrations: Migration[]): Promise<string[]> {
  const pending = await plan(target, migrations);
  for (const m of pending) await target.transaction((query, exec) => applyOne(query, exec, m));
  // Files applied before 0003 existed get their checksum from the files as they are now.
  if (await hasChecksums(target.query)) {
    for (const [version, sum] of await appliedVersions(target.query)) {
      const m = migrations.find((x) => x.version === version);
      if (sum === null && m) {
        await target.query(
          "update pm.schema_migrations set checksum = $2 where version = $1 and checksum is null",
          [version, checksum(m.sql)],
        );
      }
    }
  }
  return pending.map((m) => m.version);
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
  const over =
    (db: { unsafe: (q: string, p?: never[]) => Promise<unknown> }): Query =>
    async <T>(q: string, params: unknown[] = []) =>
      (await db.unsafe(q, params as never[])) as T[];
  const target: MigrationTarget = {
    query: over(sql),
    async transaction(fn) {
      await sql.begin((tx) =>
        fn(over(tx), async (q) => {
          await tx.unsafe(q).simple();
        }),
      );
    },
  };
  try {
    if (dry) {
      const pending = await plan(target, loadMigrations());
      for (const m of pending) console.log(`pending  ${m.file}`);
      if (pending.length === 0) console.log("Nothing to apply.");
      return;
    }
    const ran = await runMigrations(target, loadMigrations());
    for (const v of ran) console.log(`applied  ${v}`);
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
