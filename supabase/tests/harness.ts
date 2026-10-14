/**
 * A local stand-in for the shared Supabase project, for the migration and RLS tests (06 · Tests).
 * It's real Postgres (PGlite, compiled to WebAssembly), so it runs on any machine and in CI with no
 * Docker. Supabase's parts that the `pm` migrations depend on are stubbed the way Supabase defines
 * them: the `anon`, `authenticated` and `service_role` roles, `auth.users` and `auth.uid()`,
 * `storage.buckets` and `storage.objects`, and Vault, pg_cron and pg_net for 0002.
 *
 * It also plays lumina-photography: tables in `public`, `public.admin_users`, `public.is_admin()`,
 * the `portfolio` bucket and its policy, so the tests can prove neither site reaches the other.
 * And it grants the API roles everything by default, the most permissive setup a project can have,
 * so the migrations must revoke and grant explicitly to pass.
 */
import { PGlite } from "@electric-sql/pglite";

import { runMigrations, type Migration, type MigrationTarget } from "../../scripts/migrate.ts";

export const SUPABASE_STUBS = /* sql */ `
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

-- The most permissive defaults a project can have: migrations must not rely on them.
alter default privileges grant all on tables to anon, authenticated, service_role;
alter default privileges grant all on sequences to anon, authenticated, service_role;
alter default privileges grant execute on functions to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (id uuid primary key, email text unique not null);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  ), '')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;

create schema storage;
grant usage on schema storage to anon, authenticated, service_role;
create table storage.buckets (
  id text primary key, name text not null unique, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null, owner uuid, created_at timestamptz default now(),
  unique (bucket_id, name)
);
alter table storage.objects enable row level security;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;

-- Lumina-photography's side of the shared project.
create table public.admin_users (user_id uuid primary key references auth.users);
create table public.photos (id serial primary key, title text, draft boolean default true);
alter table public.photos enable row level security;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;
create policy admin_all on public.photos for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', false);
create policy lumina_admin on storage.objects for all to authenticated
  using (bucket_id = 'portfolio' and public.is_admin()) with check (bucket_id = 'portfolio' and public.is_admin());
`;

/** Vault, pg_cron and pg_net, as far as 0002 uses them. */
export const CRON_STUBS = /* sql */ `
create schema vault;
create table vault.secrets (name text primary key, secret text not null);
create view vault.decrypted_secrets as select name, secret as decrypted_secret from vault.secrets;
revoke all on vault.secrets, vault.decrypted_secrets from anon, authenticated, service_role;
create schema cron;
create table cron.job (jobid bigserial primary key, jobname text unique, schedule text, command text);
create function cron.schedule(job_name text, schedule text, command text) returns bigint language sql as $$
  insert into cron.job (jobname, schedule, command) values (job_name, schedule, command)
  on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command
  returning jobid
$$;
create schema net;
create table net.requests (id bigserial primary key, url text, headers jsonb, body jsonb);
create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}',
  headers jsonb default '{}', timeout_milliseconds int default 5000) returns bigint language sql as $$
  insert into net.requests (url, headers, body) values (url, headers, body) returning id
$$;
`;

/** The guard at the top of 0002 needs real extensions; the stubs stand in for them. */
export function withoutExtensionGuard(sql: string): string {
  return sql.replace(/^do \$\$[\s\S]*?^\$\$;\n/m, "");
}

export type Db = PGlite;

export function migrationTarget(db: Db): MigrationTarget {
  return {
    query: async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows,
    async transaction(fn) {
      await db.transaction(async (tx) => {
        await fn(
          async <T>(sql: string, params: unknown[] = []) => (await tx.query<T>(sql, params)).rows,
          async (sql) => {
            await tx.exec(sql);
          },
        );
      });
    },
  };
}

/** A fresh project with the stubs and every migration applied. */
export async function freshProject(migrations: Migration[], options: { cron?: boolean } = {}): Promise<Db> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  if (options.cron) await db.exec(CRON_STUBS);
  const list = migrations.map((m) =>
    m.version.endsWith("_cron") ? { ...m, sql: withoutExtensionGuard(m.sql) } : m,
  );
  await runMigrations(
    migrationTarget(db),
    options.cron ? list : list.filter((m) => !m.version.endsWith("_cron")),
  );
  return db;
}

export type Actor =
  | { role: "anon" }
  | { role: "authenticated"; userId: string }
  | { role: "service_role" }
  | { role: "postgres" };

/** Runs queries as one actor, the way PostgREST does: a role plus the JWT claims. */
export async function as<T>(db: Db, actor: Actor, fn: () => Promise<T>): Promise<T> {
  const sub = actor.role === "authenticated" ? actor.userId : "";
  const claims =
    actor.role === "postgres" ? "" : JSON.stringify({ role: actor.role, ...(sub ? { sub } : {}) });
  await db.query("select set_config('request.jwt.claims', $1, false)", [claims]);
  if (actor.role !== "postgres") await db.exec(`set role ${actor.role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims', '', false)");
  }
}

/** The error message a statement fails with, or null when it succeeds. */
export async function failure(db: Db, sql: string, params: unknown[] = []): Promise<string | null> {
  try {
    await db.query(sql, params);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
