// @vitest-environment node
/**
 * The `supabase` content source (WP3.5) against the real `pm` migrations on PGlite, reading as a
 * visitor (`anon`) the way PostgREST would: RLS and the column grants decide what comes back.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PublicContent } from "~/lib/content-source";
import { readRedirects, vercelRedirects } from "~/lib/redirects";
import {
  ContentReadError,
  readPublicContent,
  supabaseSource,
  type PublicReader,
} from "~/lib/sources/supabase";
import { loadLocalV0 } from "~/lib/sources/local-v0";

import { loadMigrations } from "../../scripts/migrate.ts";
import { as, freshProject, type Db } from "../../supabase/tests/harness.ts";

const AT = "2026-10-13T12:30:00.000Z";
const LEAK = "LEAK-wp35";
const v0: PublicContent = loadLocalV0(new Date(AT));

/** PostgREST hands timestamps over as strings. */
const plain = (row: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]));

function anonReader(db: Db): PublicReader {
  return {
    async select(table: string, columns: string) {
      try {
        const res = await as(db, { role: "anon" }, () =>
          db.query<Record<string, unknown>>(`select ${columns} from pm.${table}`),
        );
        return { data: res.rows.map(plain), error: null };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
      }
    },
    async redirects() {
      const res = await as(db, { role: "anon" }, () =>
        db.query<Record<string, unknown>>("select old_path, new_path from pm.public_redirects() order by 1"),
      );
      return { data: res.rows, error: null };
    },
  };
}

const json = (v: unknown) => JSON.stringify(v);
let db: Db;

beforeAll(async () => {
  db = await freshProject(loadMigrations());
  await db.query(`insert into pm.profile (draft, published, published_at) values ($1, $2, $3)`, [
    json({ name: `${LEAK}-profile-draft` }),
    json(v0.profile),
    AT,
  ]);
  await db.query(`insert into pm.site_layout (draft, published, published_at) values ($1, $2, $3)`, [
    json({ sections: `${LEAK}-layout-draft` }),
    json(v0.layout),
    "2026-10-01T00:00:00.000Z",
  ]);
  for (const p of v0.projects) {
    await db.query(
      `insert into pm.projects (id, slug, published_slug, visibility, draft, published, published_at, first_published_at)
       values ($1, $2, $3, 'public', $4, $5, $6, $7)`,
      [
        crypto.randomUUID(),
        `${p.slug}-draft`,
        p.slug,
        json({ t: LEAK }),
        json(p.project),
        p.publishedAt,
        p.firstPublishedAt,
      ],
    );
  }
  // What a visitor must never get: a draft-only project, an unlisted one and a deleted one.
  await db.query(
    `insert into pm.projects (id, slug, published_slug, visibility, draft, published, published_at, first_published_at, deleted_at) values
     ($1, 'draft-only', null, 'public', $4, null, null, null, null),
     ($2, 'unlisted', 'unlisted', 'unlisted', $4, $4, now(), now(), null),
     ($3, 'deleted', 'deleted', 'public', $4, $4, now(), now(), now())`,
    [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), json({ t: LEAK })],
  );
  await db.query(
    `insert into pm.posts (id, slug, published_slug, draft, published, published_at, scheduled_for) values
     ($1, 'scheduled', null, $2, null, null, now() + interval '1 day')`,
    [crypto.randomUUID(), json({ t: LEAK })],
  );
});

afterAll(async () => {
  await db.close();
});

describe("the supabase content source (06 · Build-time data)", () => {
  it("reads exactly what the local V0 source serves, as a visitor", async () => {
    const content = await supabaseSource(anonReader(db)).load();
    expect(content.profile).toEqual(v0.profile);
    expect(content.layout).toEqual(v0.layout);
    expect(content.projects.map((p) => p.slug).sort()).toEqual(v0.projects.map((p) => p.slug).sort());
    for (const p of content.projects) {
      expect(p).toEqual({ ...v0.projects.find((x) => x.slug === p.slug), id: p.id });
    }
    expect(content.posts).toEqual([]);
    // The later of the profile's and the layout's publish.
    expect(content.updatedAt).toBe(AT);
    expect(JSON.stringify(content)).not.toContain(LEAK);
  });

  it("reads the redirects as a visitor: renames and once-public pages, never drafts", async () => {
    const live = v0.projects[0]?.slug ?? "";
    await db.query(
      `insert into pm.slug_redirects (old_path, project_id)
       select '/work/old-name', id from pm.projects where published_slug = $1`,
      [live],
    );
    await db.query(
      `insert into pm.slug_redirects (old_path, project_id)
       select '/work/old-draft', id from pm.projects where slug = 'draft-only'`,
    );
    const rows = await readRedirects(anonReader(db));
    expect(rows).toContainEqual({ old_path: "/work/old-name", new_path: `/work/${live}` });
    expect(rows.map((r) => r.old_path)).not.toContain("/work/old-draft");
    expect(vercelRedirects(rows)).toContainEqual({
      source: "/work/old-name",
      destination: `/work/${live}`,
      permanent: true,
    });
    expect(JSON.stringify(rows)).not.toContain(LEAK);
  });

  it("can't read anything but the published columns", async () => {
    const { error } = await anonReader(db).select("projects", "*");
    expect(error?.message).toMatch(/permission denied/);
  });

  it("fails the build on a read error, with no fallback", async () => {
    const broken: PublicReader = {
      select: (table) =>
        Promise.resolve(
          table === "posts"
            ? { data: null, error: { message: "relation does not exist" } }
            : anonReader(db).select(table, "published, published_at"),
        ),
    };
    await expect(readPublicContent(broken)).rejects.toThrow(ContentReadError);
    await expect(readPublicContent(broken)).rejects.toThrow(/pm\.posts.*relation does not exist/);
  });

  it("fails when the profile or layout isn't published, or the layout is invalid", async () => {
    const reader = (rows: Record<string, unknown[]>): PublicReader => ({
      select: (table: string) => Promise.resolve({ data: rows[table] ?? [], error: null }),
    });
    const profile = [{ published: v0.profile, published_at: AT }];
    await expect(
      readPublicContent(reader({ profile, site_layout: [{ published: null, published_at: null }] })),
    ).rejects.toThrow(/pm\.site_layout.*expected one published row, found 0/);
    await expect(
      readPublicContent(
        reader({
          profile,
          site_layout: [{ published: { schemaVersion: 1, sections: [] }, published_at: AT }],
        }),
      ),
    ).rejects.toThrow(/pm\.site_layout/);
    await expect(
      readPublicContent({ select: () => Promise.resolve({ data: null, error: null }) }),
    ).rejects.toThrow(/no data/);
  });

  it("skips rows without an address or a document, and dates a project's first publish", async () => {
    const reader: PublicReader = {
      select: (table: string) => {
        const data: Record<string, unknown[]> = {
          profile: [{ published: v0.profile, published_at: AT }],
          site_layout: [{ published: v0.layout, published_at: AT }],
          projects: [
            {
              id: "a",
              published_slug: "a",
              published: v0.projects[0]?.project,
              published_at: AT,
              first_published_at: null,
            },
            {
              id: "b",
              published_slug: null,
              published: v0.projects[0]?.project,
              published_at: AT,
              first_published_at: AT,
            },
          ],
          posts: [{ id: "p", published_slug: "p", published: null, published_at: AT }],
        };
        return Promise.resolve({ data: data[table] ?? [], error: null });
      },
    };
    const content = await readPublicContent(reader);
    expect(content.projects.map((p) => [p.slug, p.firstPublishedAt])).toEqual([["a", AT]]);
    expect(content.posts).toEqual([]);
  });
});
