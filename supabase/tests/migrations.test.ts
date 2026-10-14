/**
 * The migration runner, the migration lint (06 · Running migrations) and 0002's cron jobs.
 */
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

import { lintDir, lintSql, splitStatements } from "../../scripts/migration-lint.ts";
import { loadMigrations, runMigrations } from "../../scripts/migrate.ts";
import { CRON_STUBS, freshProject, migrationTarget, SUPABASE_STUBS } from "./harness.ts";

const lint = (sql: string) => lintSql("t.sql", sql).map((f) => f.message);

describe("the migration lint", () => {
  it("passes the committed migrations", () => {
    expect(lintDir()).toEqual([]);
  });

  it("splits statements around quotes and dollar-quoted bodies", () => {
    expect(
      splitStatements(
        "select ';'; create function pm.f() returns int language sql as $$ select 1; $$; -- x;\nselect 2",
      ),
    ).toEqual([
      "select ';'",
      "create function pm.f() returns int language sql as $$ select 1; $$",
      "select 2",
    ]);
  });

  it.each([
    ["create table public.x (id int)", /public schema/],
    ["select * from public.photos", /public schema/],
    ["grant select on all tables in schema public to anon", /outside pm/],
    ["create extension if not exists pgcrypto", /extension/],
    ["alter table auth.users add column x int", /auth\.users/],
    ["insert into auth.identities values (1)", /auth\.identities/],
    ["create table other.x (id int)", /outside the pm schema/],
    ["drop table lumina_things", /outside the pm schema/],
    [
      "insert into storage.buckets (id, name, public) values ('portfolio2', 'portfolio2', true)",
      /only pm- buckets/,
    ],
    ["insert into storage.buckets (id, name) values ('pm-a', 'pm-a'), ('x', 'x')", /only pm- buckets/],
    ["create policy p on storage.objects for select to anon using (true)", /must name its bucket/],
    [
      "create policy p on storage.objects for select to anon using (pm.is_owner() or bucket_id = 'pm-x')",
      /must start with bucket_id/,
    ],
    [
      "create policy p on storage.objects for all to anon using (bucket_id = 'portfolio')",
      /only name pm- buckets/,
    ],
    ["select cron.schedule('lumina-job', '* * * * *', 'select 1')", /pm-/],
    [
      "create function pm.f() returns int language sql as $$ select 1 $$; revoke all on function pm.f() from public",
      /search_path/,
    ],
    ["create function pm.f() returns int language sql set search_path = '' as $$ select 1 $$", /revoke all/],
    [
      "create table pm.t (id int); create policy p on pm.t for all to authenticated using (true)",
      /row level security/,
    ],
    ["create table pm.t (id int); alter table pm.t enable row level security", /policies/],
  ])("flags %s", (sql, message) => {
    expect(lint(sql).join("\n")).toMatch(message);
  });

  it.each([
    "create table pm.owners (user_id uuid references auth.users on delete cascade); alter table pm.owners enable row level security",
    "create function pm.f() returns uuid language sql set search_path = '' as $$ select auth.uid() $$; revoke all on function pm.f() from public",
    "create policy pm_x on storage.objects for all to authenticated using (bucket_id = 'pm-media-draft' and pm.is_owner()) with check (bucket_id = 'pm-media-draft')",
    "grant select (id, published) on pm.projects, pm.posts to anon",
    "select cron.schedule('pm-x', '* * * * *', $j$select 1$j$)",
  ])("allows %s", (sql) => {
    expect(lint(sql)).toEqual([]);
  });
});

describe("the migration runner", () => {
  it("applies every file once, then nothing", async () => {
    const db = new PGlite();
    await db.exec(SUPABASE_STUBS);
    const all = loadMigrations().filter((m) => !m.version.endsWith("_cron"));
    expect(await runMigrations(migrationTarget(db), all)).toEqual(["0001_init"]);
    expect(await runMigrations(migrationTarget(db), all)).toEqual([]);
    await db.close();
  });

  it("refuses to run anything when a file fails the lint", async () => {
    const db = new PGlite();
    await db.exec(SUPABASE_STUBS);
    const bad = [
      ...loadMigrations(),
      { version: "0099_bad", file: "0099_bad.sql", sql: "drop table public.photos" },
    ];
    await expect(runMigrations(migrationTarget(db), bad)).rejects.toThrow(/lint failed/);
    expect((await db.query("select to_regclass('pm.projects') as t")).rows).toEqual([{ t: null }]);
    await db.close();
  });

  it("rolls a failing file back whole", async () => {
    const db = new PGlite();
    await db.exec(SUPABASE_STUBS);
    const [init] = loadMigrations();
    if (!init) throw new Error("no 0001");
    const broken = { ...init, sql: `${init.sql}\nselect pm.no_such_function();` };
    await expect(runMigrations(migrationTarget(db), [broken])).rejects.toThrow();
    expect((await db.query("select to_regclass('pm.projects') as t")).rows).toEqual([{ t: null }]);
    expect(
      (await db.query("select count(*)::int as n from storage.buckets where id like 'pm-%'")).rows,
    ).toEqual([{ n: 0 }]);
    await db.close();
  });
});

describe("0002 · cron", () => {
  it("stops with a clear message when pg_cron and pg_net aren't switched on", async () => {
    const db = new PGlite();
    await db.exec(SUPABASE_STUBS);
    await db.exec(CRON_STUBS);
    await expect(runMigrations(migrationTarget(db), loadMigrations())).rejects.toThrow(
      /Switch on pg_cron and pg_net/,
    );
    await db.close();
  });

  it("schedules the three pm- jobs, which call pm- functions with the Vault key", async () => {
    const db = await freshProject(loadMigrations(), { cron: true });
    const jobs = await db.query<{ jobname: string; schedule: string; command: string }>(
      "select jobname, schedule, command from cron.job order by jobname",
    );
    expect(jobs.rows.map((j) => [j.jobname, j.schedule])).toEqual([
      ["pm-link-check", "23 2 * * *"],
      ["pm-purge", "17 3 * * *"],
      ["pm-scheduled-posts", "*/5 * * * *"],
    ]);

    await expect(db.query("select pm.invoke_function('pm-purge')")).rejects.toThrow(/Add pm_project_url/);
    await db.exec(
      `insert into vault.secrets values ('pm_project_url', 'https://ref.supabase.co/'), ('pm_service_role_key', 'test-key')`,
    );
    for (const j of jobs.rows) await db.exec(j.command);
    const calls = await db.query<{ url: string; auth: string; body: unknown }>(
      "select url, headers ->> 'Authorization' as auth, body from net.requests order by id",
    );
    expect(calls.rows).toEqual([
      {
        url: "https://ref.supabase.co/functions/v1/pm-check-link",
        auth: "Bearer test-key",
        body: { nightly: true },
      },
      { url: "https://ref.supabase.co/functions/v1/pm-purge", auth: "Bearer test-key", body: {} },
      { url: "https://ref.supabase.co/functions/v1/pm-post-scheduler", auth: "Bearer test-key", body: {} },
    ]);
    await expect(db.query("select pm.invoke_function('lumina-fn')")).rejects.toThrow(/Not a pm- function/);

    for (const role of ["anon", "authenticated", "service_role"]) {
      const r = await db.query<{ ok: boolean }>(
        `select has_function_privilege('${role}', 'pm.invoke_function(text, jsonb)', 'execute') as ok`,
      );
      expect(r.rows, role).toEqual([{ ok: false }]);
    }
    await db.close();
  });
});
