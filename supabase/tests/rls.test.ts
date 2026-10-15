/**
 * Row-level security and grants for the `pm` schema (06 · Row-level security › Tests, 08 · Drafts
 * never leak step 4, 10 · Security gates › Database). Every table is probed as a visitor (`anon`),
 * as a signed-in non-owner, as lumina's admin, and as the owner.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadMigrations } from "../../scripts/migrate.ts";
import { as, failure, freshProject, type Db } from "./harness.ts";

const OWNER = "00000000-0000-4000-8000-000000000001";
const STRANGER = "00000000-0000-4000-8000-000000000002";
const LUMINA_ADMIN = "00000000-0000-4000-8000-000000000003";

const P_LIVE = "10000000-0000-4000-8000-000000000001";
const P_DRAFT = "10000000-0000-4000-8000-000000000002";
const P_UNLISTED = "10000000-0000-4000-8000-000000000003";
const P_DELETED = "10000000-0000-4000-8000-000000000004";
const P_UNPUBLISHED = "10000000-0000-4000-8000-000000000005";
const S_LIVE = "20000000-0000-4000-8000-000000000001";
const S_SCHEDULED = "20000000-0000-4000-8000-000000000002";
const S_DELETED = "20000000-0000-4000-8000-000000000003";
const MEDIA = "30000000-0000-4000-8000-000000000001";

/** Every marker lives only in drafts or in rows a visitor must never see. */
const LEAK = "LEAK-7f3a";

const TABLES = [
  "owners",
  "schema_migrations",
  "profile",
  "site_layout",
  "site_revisions",
  "projects",
  "project_revisions",
  "posts",
  "post_revisions",
  "media",
  "slug_redirects",
  "preview_links",
  "link_checks",
  "deploys",
] as const;

const SEED = /* sql */ `
insert into auth.users (id, email) values
  ('${OWNER}', 'owner@example.test'), ('${STRANGER}', 'stranger@example.test'), ('${LUMINA_ADMIN}', 'admin@example.test');
insert into pm.owners (user_id) values ('${OWNER}');
insert into public.admin_users (user_id) values ('${LUMINA_ADMIN}');
insert into public.photos (title) values ('lumina draft photo');

insert into pm.profile (draft, published, published_at) values
  ('{"name":"${LEAK}-profile-draft"}', '{"name":"Live name"}', now());
insert into pm.site_layout (draft, published, published_at) values
  ('{"sections":"${LEAK}-layout-draft"}', '{"sections":[]}', now());
insert into pm.site_revisions (profile, layout) values ('{"r":"${LEAK}-rev"}', '{}');

insert into pm.projects (id, slug, published_slug, visibility, draft, published, published_at, first_published_at, deleted_at) values
  ('${P_LIVE}', 'live-draft-address', 'live', 'public', '{"t":"${LEAK}-live-draft"}', '{"t":"Live project"}', now(), now(), null),
  ('${P_DRAFT}', 'draft-only', null, 'public', '{"t":"${LEAK}-draft"}', null, null, null, null),
  ('${P_UNLISTED}', 'unlisted', 'unlisted', 'unlisted', '{"t":"${LEAK}-unlisted-draft"}', '{"t":"${LEAK}-unlisted"}', now(), now(), null),
  ('${P_DELETED}', 'deleted', 'deleted', 'public', '{"t":"${LEAK}-deleted-draft"}', '{"t":"${LEAK}-deleted"}', now(), now(), now()),
  ('${P_UNPUBLISHED}', 'was-live', 'was-live', 'public', '{"t":"${LEAK}-unpublished-draft"}', null, null, now() - interval '9 days', null);
insert into pm.project_revisions (project_id, published) values ('${P_LIVE}', '{"t":"${LEAK}-project-rev"}');

insert into pm.posts (id, slug, published_slug, draft, published, published_at, scheduled_for, deleted_at) values
  ('${S_LIVE}', 'post', 'post', '{"t":"${LEAK}-post-draft","topics":["Data","growth"]}', '{"t":"Live post"}', now(), null, null),
  ('${S_SCHEDULED}', 'scheduled', null, '{"t":"${LEAK}-scheduled","topics":["data"]}', null, null, now() + interval '1 day', null),
  ('${S_DELETED}', 'gone-post', 'gone-post', '{"t":"${LEAK}-deleted-post"}', '{"t":"${LEAK}-deleted-post-live"}', now(), null, now());
insert into pm.post_revisions (post_id, published) values ('${S_LIVE}', '{"t":"${LEAK}-post-rev"}');

insert into pm.media (id, rev, key, kind, mime, bytes, filename, alt) values
  ('${MEDIA}', 1, '${MEDIA}/r1', 'image', 'image/webp', 1000, '${LEAK}-filename.jpg', 'Alt');
insert into pm.slug_redirects (old_path, project_id) values
  ('/work/old-live', '${P_LIVE}'), ('/work/old-draft', '${P_DRAFT}'), ('/work/old-unlisted', '${P_UNLISTED}');
insert into pm.slug_redirects (old_path, post_id) values ('/writing/old-post', '${S_LIVE}'), ('/writing/old-scheduled', '${S_SCHEDULED}');
insert into pm.preview_links (token_hash, kind, project_id, expires_at) values
  (repeat('a', 64), 'project', '${P_DRAFT}', now() + interval '7 days');
insert into pm.link_checks (url, status, detail) values ('https://example.com/${LEAK}', 'ok', null);
insert into pm.deploys (reason) values ('project:${LEAK}');

insert into storage.objects (bucket_id, name) values
  ('pm-media-draft', '${MEDIA}/r1/960.webp'), ('pm-media-public', '${MEDIA}/r1/960.webp'), ('portfolio', 'lumina.jpg');
`;

let db: Db;

beforeAll(async () => {
  db = await freshProject(loadMigrations());
  await db.exec(SEED);
});

afterAll(async () => {
  await db.close();
});

const anon = { role: "anon" } as const;
const stranger = { role: "authenticated", userId: STRANGER } as const;
const luminaAdmin = { role: "authenticated", userId: LUMINA_ADMIN } as const;
const owner = { role: "authenticated", userId: OWNER } as const;

async function rows(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  return (await db.query<Record<string, unknown>>(sql, params)).rows;
}

/** A write per table that would succeed for the owner if it had the privilege. */
const WRITES: Record<(typeof TABLES)[number], string[]> = {
  owners: [`insert into pm.owners (user_id) values ('${STRANGER}')`, "delete from pm.owners"],
  schema_migrations: [
    "insert into pm.schema_migrations (version) values ('9999_x')",
    "delete from pm.schema_migrations",
  ],
  profile: ["update pm.profile set draft = '{}'", "delete from pm.profile"],
  site_layout: ["update pm.site_layout set draft = '{}'", "delete from pm.site_layout"],
  site_revisions: [
    "insert into pm.site_revisions (profile, layout) values ('{}', '{}')",
    "delete from pm.site_revisions",
  ],
  projects: [
    "insert into pm.projects (slug, draft) values ('x-new', '{}')",
    "update pm.projects set draft = '{}'",
    "delete from pm.projects",
  ],
  project_revisions: [
    `insert into pm.project_revisions (project_id, published) values ('${P_LIVE}', '{}')`,
    "delete from pm.project_revisions",
  ],
  posts: [
    "insert into pm.posts (slug, draft) values ('x-new', '{}')",
    "update pm.posts set draft = '{}'",
    "delete from pm.posts",
  ],
  post_revisions: [
    `insert into pm.post_revisions (post_id, published) values ('${S_LIVE}', '{}')`,
    "delete from pm.post_revisions",
  ],
  media: ["update pm.media set alt = 'x'", "delete from pm.media"],
  slug_redirects: [
    `insert into pm.slug_redirects (old_path, project_id) values ('/work/x', '${P_LIVE}')`,
    "delete from pm.slug_redirects",
  ],
  preview_links: [
    `insert into pm.preview_links (token_hash, kind, expires_at) values (repeat('b', 64), 'site', now())`,
    "delete from pm.preview_links",
  ],
  link_checks: [
    "insert into pm.link_checks (url, status) values ('https://x.test', 'ok')",
    "delete from pm.link_checks",
  ],
  deploys: ["insert into pm.deploys (reason) values ('x')", "delete from pm.deploys"],
};

/** Row counts of every pm table, read as postgres, to prove a write changed nothing. */
async function snapshot(): Promise<string> {
  const counts: string[] = [];
  for (const t of TABLES) {
    const r = await rows(
      `select md5(coalesce(string_agg(x::text, '|' order by x::text), '')) as h from pm.${t} x`,
    );
    counts.push(`${t}:${String(r[0]?.h)}`);
  }
  return counts.join(",");
}

describe("the catalogue", () => {
  it("has RLS on for every pm table, and policies on all but owners and schema_migrations", async () => {
    const tables = await rows(`
      select c.relname, c.relrowsecurity, (select count(*) from pg_policy p where p.polrelid = c.oid)::int as policies
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'pm' and c.relkind in ('r', 'p') order by 1`);
    expect(tables.map((t) => t.relname).sort()).toEqual([...TABLES].sort());
    for (const t of tables) {
      expect(t.relrowsecurity, String(t.relname)).toBe(true);
      if (t.relname === "owners" || t.relname === "schema_migrations") expect(t.policies).toBe(0);
      else expect(t.policies, String(t.relname)).toBeGreaterThan(0);
    }
  });

  it("has no view, and no policy in pm that refers to lumina's public schema", async () => {
    expect(await rows("select 1 from pg_views where schemaname = 'pm'")).toEqual([]);
    const policies = await rows(
      `select policyname, qual, with_check from pg_policies where schemaname = 'pm'`,
    );
    for (const p of policies) expect(`${String(p.qual)} ${String(p.with_check)}`).not.toMatch(/public\./);
  });

  it("scopes every storage.objects policy, lumina's included, to a bucket", async () => {
    const { rows: policies } = await db.query<{
      policyname: string;
      qual: string;
      with_check: string | null;
    }>(
      `select policyname, qual, with_check from pg_policies where schemaname = 'storage' and tablename = 'objects'`,
    );
    expect(policies.map((p) => p.policyname).sort()).toEqual(["lumina_admin", "pm_owner_draft"]);
    for (const p of policies) {
      expect(p.qual).toMatch(/bucket_id = '/);
      if (p.with_check !== null) expect(p.with_check).toMatch(/bucket_id = '/);
    }
  });

  it("creates only the two pm- buckets, with the right public flags", async () => {
    const buckets = await rows("select id, public from storage.buckets order by id");
    expect(buckets).toEqual([
      { id: "pm-media-draft", public: false },
      { id: "pm-media-public", public: true },
      { id: "portfolio", public: false },
    ]);
  });

  it("sets search_path = '' on every pm function", async () => {
    const fns = await rows(`
      select p.proname, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'pm'`);
    expect(fns.length).toBeGreaterThan(0);
    for (const f of fns) expect(f.proconfig, String(f.proname)).toEqual(['search_path=""']);
  });

  it("lets anon execute public_redirects only, and authenticated is_owner, topic_counts and public_redirects", async () => {
    const fns = await rows(`
      select p.proname,
        has_function_privilege('anon', p.oid, 'execute') as anon,
        has_function_privilege('authenticated', p.oid, 'execute') as auth
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'pm' order by 1`);
    expect(fns.filter((f) => f.anon).map((f) => f.proname)).toEqual(["public_redirects"]);
    expect(fns.filter((f) => f.auth).map((f) => f.proname)).toEqual([
      "is_owner",
      "public_redirects",
      "topic_counts",
    ]);
  });

  it("gives anon column grants only, and only on the four published tables", async () => {
    const grants = await rows(`
      select table_name, privilege_type from information_schema.role_table_grants
      where table_schema = 'pm' and grantee in ('anon', 'PUBLIC')`);
    expect(grants).toEqual([]);
    const cols = await rows(`
      select table_name, column_name, privilege_type from information_schema.column_privileges
      where table_schema = 'pm' and grantee = 'anon' order by 1, 2`);
    expect(
      cols.map((c) => `${String(c.table_name)}.${String(c.column_name)}:${String(c.privilege_type)}`),
    ).toEqual([
      "posts.id:SELECT",
      "posts.published:SELECT",
      "posts.published_at:SELECT",
      "posts.published_slug:SELECT",
      "profile.published:SELECT",
      "profile.published_at:SELECT",
      "projects.first_published_at:SELECT",
      "projects.id:SELECT",
      "projects.index_allowed:SELECT",
      "projects.published:SELECT",
      "projects.published_at:SELECT",
      "projects.published_slug:SELECT",
      "site_layout.published:SELECT",
      "site_layout.published_at:SELECT",
    ]);
  });

  it("gives authenticated nothing on owners and schema_migrations, and no write on published columns", async () => {
    const t = await rows(`
      select table_name, privilege_type from information_schema.role_table_grants
      where table_schema = 'pm' and grantee = 'authenticated' and table_name in ('owners', 'schema_migrations')`);
    expect(t).toEqual([]);
    const writes = await rows(`
      select table_name || '.' || column_name || ':' || privilege_type as g from information_schema.column_privileges
      where table_schema = 'pm' and grantee = 'authenticated' and privilege_type in ('INSERT', 'UPDATE')
        and column_name in ('published', 'published_slug', 'published_at', 'first_published_at', 'visibility',
          'index_allowed', 'deleted_at', 'scheduled_for', 'schedule_error')`);
    expect(writes).toEqual([]);
  });

  it("records every migration in pm.schema_migrations, with its checksum", async () => {
    const applied = await rows("select version, checksum from pm.schema_migrations order by 1");
    expect(applied.map((r) => r.version)).toEqual([
      "0001_init",
      "0003_migration_checksums",
      "0004_anon_index_allowed",
    ]);
    for (const r of applied) expect(String(r.checksum)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("as a visitor (anon)", () => {
  for (const t of TABLES) {
    it(`can't select draft or every column from pm.${t}`, async () => {
      await as(db, anon, async () => {
        expect(await failure(db, `select * from pm.${t}`)).toMatch(/permission denied/);
        if (["profile", "site_layout", "projects", "posts"].includes(t)) {
          expect(await failure(db, `select draft from pm.${t}`)).toMatch(/permission denied/);
        }
      });
    });

    it(`can't write to pm.${t}`, async () => {
      const before = await snapshot();
      await as(db, anon, async () => {
        for (const w of WRITES[t]) expect(await failure(db, w), w).toMatch(/permission denied/);
      });
      expect(await snapshot()).toBe(before);
    });
  }

  it("reads only the live, public project and post", async () => {
    await as(db, anon, async () => {
      expect(await rows("select id, published_slug from pm.projects")).toEqual([
        { id: P_LIVE, published_slug: "live" },
      ]);
      expect(await rows("select id, published_slug from pm.posts")).toEqual([
        { id: S_LIVE, published_slug: "post" },
      ]);
      expect(await rows("select published from pm.profile")).toEqual([{ published: { name: "Live name" } }]);
      expect(await rows("select published from pm.site_layout")).toEqual([{ published: { sections: [] } }]);
    });
  });

  it("gets no marker from anything it can reach", async () => {
    await as(db, anon, async () => {
      const reachable = [
        "select id, published_slug, published, published_at, first_published_at, index_allowed from pm.projects",
        "select id, published_slug, published, published_at from pm.posts",
        "select published, published_at from pm.profile",
        "select published, published_at from pm.site_layout",
        "select * from pm.public_redirects()",
        "select * from storage.objects",
      ];
      for (const q of reachable) expect(JSON.stringify(await rows(q)), q).not.toContain(LEAK);
    });
  });

  it("sees no file in either pm- bucket through storage.objects", async () => {
    await as(db, anon, async () => {
      expect(await rows("select name from storage.objects")).toEqual([]);
      expect(
        await failure(db, "insert into storage.objects (bucket_id, name) values ('pm-media-draft', 'x')"),
      ).toMatch(/row-level security/);
    });
  });

  it("can't call is_owner or topic_counts", async () => {
    await as(db, anon, async () => {
      expect(await failure(db, "select pm.is_owner()")).toMatch(/permission denied/);
      expect(await failure(db, "select * from pm.topic_counts('post')")).toMatch(/permission denied/);
    });
  });

  it("gets redirects for live public pages only, and moved notes only for pages that were public", async () => {
    const r = await as(db, anon, () =>
      rows("select old_path, new_path from pm.public_redirects() order by 1"),
    );
    expect(r).toEqual([
      { old_path: "/work/deleted", new_path: "/work?moved=1" },
      { old_path: "/work/old-live", new_path: "/work/live" },
      { old_path: "/work/was-live", new_path: "/work?moved=1" },
      { old_path: "/writing/gone-post", new_path: "/writing?moved=1" },
      { old_path: "/writing/old-post", new_path: "/writing/post" },
    ]);
  });
});

describe.each([
  ["a signed-in non-owner", stranger],
  ["lumina's admin, signed in", luminaAdmin],
])("as %s", (_name, actor) => {
  it("is not the owner", async () => {
    expect(await as(db, actor, () => rows("select pm.is_owner() as o"))).toEqual([{ o: false }]);
  });

  for (const t of TABLES) {
    it(`reads zero rows from pm.${t} and can't change it`, async () => {
      const before = await snapshot();
      await as(db, actor, async () => {
        const err = await failure(db, `select * from pm.${t}`);
        if (t === "owners" || t === "schema_migrations") expect(err).toMatch(/permission denied/);
        else expect(await rows(`select * from pm.${t}`)).toEqual([]);
        for (const w of WRITES[t]) {
          const e = await failure(db, w);
          // A denied privilege, a policy violation, or (update/delete) zero rows matched.
          if (e !== null) expect(e, w).toMatch(/permission denied|row-level security/);
        }
      });
      expect(await snapshot()).toBe(before);
    });
  }

  it("sees no pm- files and can't upload one", async () => {
    await as(db, actor, async () => {
      expect(
        (await rows("select bucket_id from storage.objects")).filter((o) =>
          String(o.bucket_id).startsWith("pm-"),
        ),
      ).toEqual([]);
      expect(
        await failure(db, "insert into storage.objects (bucket_id, name) values ('pm-media-draft', 'x')"),
      ).toMatch(/row-level security/);
    });
  });

  it("gets no topics", async () => {
    expect(await as(db, actor, () => rows("select * from pm.topic_counts('post')"))).toEqual([]);
  });
});

describe("as the owner", () => {
  it("is the owner", async () => {
    expect(await as(db, owner, () => rows("select pm.is_owner() as o"))).toEqual([{ o: true }]);
  });

  it("reads every Studio table, drafts included", async () => {
    await as(db, owner, async () => {
      for (const t of TABLES.filter((x) => x !== "owners" && x !== "schema_migrations")) {
        expect((await rows(`select * from pm.${t}`)).length, t).toBeGreaterThan(0);
      }
    });
  });

  it("autosaves with the version check, and a stale version matches nothing", async () => {
    await as(db, owner, async () => {
      const saved = await rows(
        "update pm.projects set draft = $1, version = version + 1 where id = $2 and version = $3 returning version, updated_at",
        [{ t: "edited" }, P_DRAFT, 1],
      );
      expect(saved).toHaveLength(1);
      expect(saved[0]?.version).toBe(2);
      const stale = await rows(
        "update pm.projects set draft = $1, version = version + 1 where id = $2 and version = $3 returning version",
        [{ t: "other tab" }, P_DRAFT, 1],
      );
      expect(stale).toEqual([]);
      expect(
        await rows(
          "update pm.profile set draft = '{}', version = version + 1 where id = 1 and version = 1 returning version",
        ),
      ).toEqual([{ version: 2 }]);
    });
  });

  it("creates drafts and edits addresses, but never writes the live columns itself", async () => {
    await as(db, owner, async () => {
      expect(
        await rows(
          "insert into pm.projects (slug, draft) values ('new-one', '{}') returning slug, published",
        ),
      ).toEqual([{ slug: "new-one", published: null }]);
      expect(
        await rows("insert into pm.posts (slug, draft) values ('new-post', '{}') returning slug"),
      ).toEqual([{ slug: "new-post" }]);
      for (const w of [
        `update pm.projects set published = '{}' where id = '${P_DRAFT}'`,
        `update pm.projects set published_slug = 'x' where id = '${P_DRAFT}'`,
        `update pm.projects set visibility = 'unlisted' where id = '${P_LIVE}'`,
        `update pm.projects set deleted_at = now() where id = '${P_LIVE}'`,
        `update pm.posts set scheduled_for = now() where id = '${S_LIVE}'`,
        `update pm.profile set published = '{}'`,
        `update pm.media set published = true`,
        `insert into pm.projects (slug, draft, published) values ('sneaky', '{}', '{}')`,
        `delete from pm.projects where id = '${P_DRAFT}'`,
        ...WRITES.project_revisions,
        ...WRITES.site_revisions,
        ...WRITES.slug_redirects,
        ...WRITES.preview_links,
        ...WRITES.link_checks,
        ...WRITES.deploys,
        ...WRITES.owners,
      ]) {
        expect(await failure(db, w), w).toMatch(/permission denied/);
      }
    });
  });

  it("manages media rows", async () => {
    const id = "30000000-0000-4000-8000-000000000009";
    await as(db, owner, async () => {
      await db.query(
        `insert into pm.media (id, rev, key, kind, mime, bytes, filename) values ($1, 1, $2, 'image', 'image/jpeg', 10, 'a.jpg')`,
        [id, `${id}/r1`],
      );
      expect(
        await rows("update pm.media set rev = 2, key = id || '/r2', alt = 'x' where id = $1 returning key", [
          id,
        ]),
      ).toEqual([{ key: `${id}/r2` }]);
      expect(await failure(db, "update pm.media set key = 'elsewhere/r2' where id = $1", [id])).toMatch(
        /check constraint/,
      );
      expect(await rows("delete from pm.media where id = $1 returning id", [id])).toEqual([{ id }]);
    });
  });

  it("uploads to pm-media-draft only, and never sees lumina's files", async () => {
    await as(db, owner, async () => {
      expect(
        await rows(
          "insert into storage.objects (bucket_id, name) values ('pm-media-draft', 'new/r1/480.webp') returning name",
        ),
      ).toEqual([{ name: "new/r1/480.webp" }]);
      for (const bucket of ["pm-media-public", "portfolio"]) {
        expect(
          await failure(db, `insert into storage.objects (bucket_id, name) values ('${bucket}', 'x')`),
        ).toMatch(/row-level security/);
      }
      const seen = (await rows("select bucket_id from storage.objects")).map((o) => o.bucket_id);
      expect(new Set(seen)).toEqual(new Set(["pm-media-draft"]));
    });
  });

  it("can't read lumina's tables through the pm owner check", async () => {
    await as(db, owner, async () => {
      expect(await rows("select * from public.photos")).toEqual([]);
    });
  });

  it("counts topics case-insensitively, from drafts that aren't deleted", async () => {
    const topics = await as(db, owner, () => rows("select topic, uses from pm.topic_counts('post')"));
    expect(topics).toEqual([
      { topic: "Data", uses: 2 },
      { topic: "growth", uses: 1 },
    ]);
  });

  it("bumps updated_at on every update", async () => {
    // Backdate it with triggers off, or the trigger would set it to now() straight away.
    await db.exec(
      "set session_replication_role = replica; update pm.site_layout set updated_at = now() - interval '1 day'; set session_replication_role = origin",
    );
    expect(await rows("select updated_at < now() - interval '1 hour' as old from pm.site_layout")).toEqual([
      { old: true },
    ]);
    await as(db, owner, () => rows("update pm.site_layout set draft = draft, version = version + 1"));
    expect(
      await rows("select updated_at > now() - interval '1 minute' as fresh from pm.site_layout"),
    ).toEqual([{ fresh: true }]);
  });
});

describe("as the service role (Edge Functions, cron, scripts)", () => {
  it("reads and writes everything in pm", async () => {
    await as(db, { role: "service_role" }, async () => {
      expect((await rows("select draft from pm.projects")).length).toBeGreaterThan(0);
      expect(await rows("select user_id from pm.owners")).toEqual([{ user_id: OWNER }]);
      await db.query(`update pm.projects set published = draft where id = '${P_DRAFT}'`);
      await db.query(`update pm.projects set published = null where id = '${P_DRAFT}'`);
    });
  });
});
