/**
 * Migration lint (06 · Running migrations, 10 · Security gates › Database). The Supabase project is
 * shared with lumina-photography, so every statement in `supabase/pm/migrations/` must stay inside
 * the `pm` schema and the `pm-` buckets. `db:migrate` refuses a file with any finding, and CI runs
 * this on every push (`node scripts/migration-lint.ts`).
 *
 * Rules, per file:
 *  - no reference to `public.` (lumina's schema), and no `create extension` (project-wide);
 *  - nothing is created, altered or written in `auth`; only `auth.uid()`, `auth.jwt()` and
 *    `references auth.users` may name it;
 *  - every top-level statement targets `pm`, or is one of the few allowed outside it: `pm-`
 *    buckets in `storage.buckets`, `storage.objects` policies scoped to a `pm-` bucket, and
 *    `cron.schedule` / `cron.unschedule` for `pm-` jobs;
 *  - every function sets `search_path = ''` and has an explicit `revoke all … from public`;
 *  - every table created gets `enable row level security`, and a policy unless it is one of the
 *    two policy-less tables (`owners`, `schema_migrations`).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const MIGRATIONS_DIR = "supabase/pm/migrations";

/** Schemas a body may not name, except for the allowed objects below (Supabase's and lumina's). */
const GUARDED_SCHEMAS = new Set([
  "public",
  "auth",
  "storage",
  "cron",
  "vault",
  "net",
  "extensions",
  "realtime",
  "graphql",
  "graphql_public",
  "pgsodium",
  "supabase_functions",
  "supabase_migrations",
  "pg_catalog",
  "information_schema",
]);
/** The only objects outside pm that a function or do-block body may name. */
const BODY_ALLOWED = new Set(["auth.uid", "auth.jwt", "vault.decrypted_secrets", "net.http_post"]);

/** Tables that have RLS on and, by design, no policies (06 · Row-level security). */
const POLICY_LESS = new Set(["owners", "schema_migrations"]);

export interface Finding {
  file: string;
  message: string;
  statement?: string;
}

/** Removes `--` comments, keeping quoted strings and dollar-quoted bodies intact. */
export function stripComments(sql: string): string {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (c === "'") {
      const end = sql.indexOf("'", i + 1);
      const stop = end === -1 ? sql.length : end + 1;
      out += sql.slice(i, stop);
      i = stop;
      continue;
    }
    if (c === "$") {
      const tag = /^\$[A-Za-z_]*\$/.exec(sql.slice(i))?.[0];
      if (tag) {
        const end = sql.indexOf(tag, i + tag.length);
        const stop = end === -1 ? sql.length : end + tag.length;
        out += sql.slice(i, stop);
        i = stop;
        continue;
      }
    }
    if (c === "-" && sql[i + 1] === "-") {
      const nl = sql.indexOf("\n", i);
      i = nl === -1 ? sql.length : nl;
      continue;
    }
    if (c === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Splits SQL into top-level statements, respecting quotes and dollar-quoted bodies. */
export function splitStatements(sql: string): string[] {
  const text = stripComments(sql);
  const out: string[] = [];
  let start = 0;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === "'") {
      const end = text.indexOf("'", i + 1);
      i = end === -1 ? text.length : end + 1;
      continue;
    }
    if (c === "$") {
      const tag = /^\$[A-Za-z_]*\$/.exec(text.slice(i))?.[0];
      if (tag) {
        const end = text.indexOf(tag, i + tag.length);
        i = end === -1 ? text.length : end + tag.length;
        continue;
      }
    }
    if (c === ";") {
      const stmt = text.slice(start, i).trim();
      if (stmt) out.push(stmt);
      start = i + 1;
    }
    i++;
  }
  const last = text.slice(start).trim();
  if (last) out.push(last);
  return out;
}

/** The statement with dollar-quoted bodies blanked, so their contents can't satisfy a rule. */
function outsideBodies(stmt: string): string {
  return stmt.replace(/(\$[A-Za-z_]*\$)[\s\S]*?\1/g, () => "$$body$$");
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** Whether one top-level statement stays inside the portfolio's namespace. Returns a reason if not. */
export function checkStatement(stmt: string): string | null {
  const s = norm(outsideBodies(stmt)).toLowerCase();

  if (/^create schema (if not exists )?pm$/.test(s)) return null;
  if (/^(grant|revoke) usage on schema pm (to|from) /.test(s)) return null;
  if (/^alter default privileges in schema pm /.test(s)) return null;
  if (/^(grant|revoke) [a-z_, ()]+ on all (tables|sequences|functions) in schema pm (to|from) /.test(s))
    return null;

  if (/^(grant|revoke) /.test(s)) {
    // grant … on [table|function] pm.x, pm.y to …
    const on = / on (?:table |function |sequence )?(.+?) (?:to|from) /.exec(s)?.[1];
    if (!on) return "grant/revoke without a recognisable target";
    const targets = on.split(/,(?![^(]*\))/).map((t) => t.trim());
    return targets.every((t) => t.startsWith("pm.")) ? null : `grant/revoke outside pm: ${on}`;
  }

  if (
    /^create (or replace )?(table|function|view|sequence|type|materialized view) (if not exists )?pm\./.test(
      s,
    )
  )
    return null;
  if (/^(alter|drop) (table|function|view|sequence|type|index|materialized view) (if exists )?pm\./.test(s))
    return null;
  if (/^create (unique )?index (if not exists )?[a-z0-9_]* ?on pm\./.test(s)) return null;
  if (/^create (or replace )?trigger [a-z0-9_]+ (before|after|instead of) [a-z ,]+ on pm\./.test(s))
    return null;
  if (/^drop trigger (if exists )?[a-z0-9_]+ on pm\./.test(s)) return null;
  if (/^comment on [a-z ]+ pm\./.test(s)) return null;
  if (/^(insert into|update|delete from) pm\./.test(s)) return null;

  if (/^(create|alter|drop) policy [a-z0-9_]+ on pm\./.test(s)) return null;
  if (/^(create|alter) policy [a-z0-9_]+ on storage\.objects /.test(s)) {
    const buckets = [...s.matchAll(/bucket_id = '([^']*)'/g)].map((m) => m[1] ?? "");
    if (buckets.length === 0) return "a storage.objects policy must name its bucket (bucket_id = 'pm-…')";
    if (!buckets.every((b) => b.startsWith("pm-")))
      return "a storage.objects policy may only name pm- buckets";
    if (/ with check /.test(s) && !/ with check \(bucket_id = 'pm-/.test(s)) {
      return "a storage.objects policy's with check must start with bucket_id = 'pm-…'";
    }
    if (/ using /.test(s) && !/ using \(bucket_id = 'pm-/.test(s)) {
      return "a storage.objects policy's using must start with bucket_id = 'pm-…'";
    }
    return null;
  }
  if (/^drop policy (if exists )?[a-z0-9_]+ on storage\.objects$/.test(s)) {
    return /^drop policy (if exists )?pm_/.test(s) ? null : "only pm_ storage policies may be dropped";
  }

  if (/^insert into storage\.buckets /.test(s)) {
    const values = / values (.+?)( on conflict .*)?$/.exec(s)?.[1] ?? "";
    const rows = [...values.matchAll(/\(\s*'([^']*)'\s*,\s*'([^']*)'/g)];
    if (rows.length === 0) return "storage.buckets insert without recognisable rows";
    return rows.every((r) => r[1]?.startsWith("pm-") && r[2]?.startsWith("pm-")) &&
      (values.match(/\(\s*'/g)?.length ?? 0) === rows.length
      ? null
      : "only pm- buckets may be created";
  }

  if (/^select cron\.(schedule|unschedule)\('/.test(s)) {
    return /^select cron\.(schedule|unschedule)\('pm-[a-z-]+'/.test(s)
      ? null
      : "cron jobs must be named pm-…";
  }

  if (/^do \$\$body\$\$$/.test(s)) return null; // anonymous blocks: their bodies get the file-wide checks

  return "statement outside the pm schema";
}

/** Lints one migration file's SQL. */
export function lintSql(file: string, sql: string): Finding[] {
  const findings: Finding[] = [];
  const text = stripComments(sql);
  const add = (message: string, statement?: string) => {
    findings.push(
      statement ? { file, message, statement: norm(statement).slice(0, 160) } : { file, message },
    );
  };

  if (/\bpublic\s*\./i.test(text)) add("references the public schema (lumina's)");
  if (/\bcreate\s+extension\b/i.test(text))
    add("creates an extension; extensions are project-wide, the owner enables them");

  for (const m of text.matchAll(/\bauth\s*\.\s*([a-z_]+)/gi)) {
    const name = (m[1] ?? "").toLowerCase();
    if (name === "uid" || name === "jwt") continue;
    const before = text.slice(Math.max(0, (m.index ?? 0) - 20), m.index).toLowerCase();
    if (name === "users" && /references\s*$/.test(before)) continue;
    add(`touches auth.${name}; only auth.uid(), auth.jwt() and references auth.users are allowed`);
  }

  // Bodies of functions and do-blocks: no dynamic SQL, and nothing outside pm but the allowlist.
  for (const body of text.matchAll(/(\$[A-Za-z_]*\$)([\s\S]*?)\1/g)) {
    const code = (body[2] ?? "").replace(/'(?:[^']|'')*'/g, "''").toLowerCase();
    if (/\bexecute\b/.test(code)) add("a function or do-block body uses execute (dynamic SQL)");
    if (/\bformat\s*\(/.test(code)) add("a function or do-block body uses format() (dynamic SQL)");
    for (const m of code.matchAll(/\b([a-z_][a-z0-9_]*)\s*\.\s*([a-z_][a-z0-9_]*)/g)) {
      const schema = m[1] ?? "";
      const name = `${schema}.${m[2] ?? ""}`;
      if (GUARDED_SCHEMAS.has(schema) && !BODY_ALLOWED.has(name)) add(`a body names ${name}, outside pm`);
    }
  }

  const statements = splitStatements(sql);
  for (const stmt of statements) {
    const reason = checkStatement(stmt);
    if (reason) add(reason, stmt);
  }

  const lower = norm(text).toLowerCase();
  for (const stmt of statements) {
    const s = norm(stmt).toLowerCase();
    const fn = /^create (?:or replace )?function (pm\.[a-z0-9_]+)\s*\(([^)]*)\)/.exec(s);
    if (fn) {
      if (!/ set search_path = ''/.test(norm(outsideBodies(stmt)).toLowerCase())) {
        add(`${fn[1] ?? ""} must set search_path = ''`, stmt);
      }
      if (!lower.includes(`revoke all on function ${fn[1] ?? ""}(`)) {
        add(`${fn[1] ?? ""} needs an explicit revoke all … from public`, stmt);
      }
    }
    const table = /^create table (?:if not exists )?pm\.([a-z0-9_]+)/.exec(s)?.[1];
    if (table) {
      if (!lower.includes(`alter table pm.${table} enable row level security`)) {
        add(`pm.${table} needs enable row level security in the same migration`);
      }
      if (!POLICY_LESS.has(table) && !new RegExp(`create policy [a-z0-9_]+ on pm\\.${table} `).test(lower)) {
        add(`pm.${table} needs its policies in the same migration`);
      }
    }
  }
  return findings;
}

/** Every migration file, in order. */
export function migrationFiles(dir = MIGRATIONS_DIR): string[] {
  return readdirSync(dir)
    .filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f))
    .sort();
}

export function lintDir(dir = MIGRATIONS_DIR): Finding[] {
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
  const bad = files.filter((f) => !/^\d{4}_[a-z0-9_]+\.sql$/.test(f));
  const findings: Finding[] = bad.map((f) => ({ file: f, message: "migration names are NNNN_what.sql" }));
  for (const f of migrationFiles(dir)) findings.push(...lintSql(f, readFileSync(join(dir, f), "utf8")));
  return findings;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const findings = lintDir();
  for (const f of findings)
    console.error(`${f.file}: ${f.message}${f.statement ? `\n    ${f.statement}` : ""}`);
  if (findings.length > 0) process.exit(1);
  console.log(`Migration lint: ${migrationFiles().length} files, no findings.`);
}
