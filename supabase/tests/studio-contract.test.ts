/**
 * Studio's Supabase repo (src/lib/studio/supabase.ts on the studio branch) against the real grants
 * and RLS: every read and write it sends through PostgREST, run here as the SQL PostgREST would run,
 * as the owner. If Studio adds a column or a write, this list changes with it (D55).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadMigrations } from "../../scripts/migrate.ts";
import { as, failure, freshProject, type Db } from "./harness.ts";

const OWNER = "00000000-0000-4000-8000-000000000001";
const owner = { role: "authenticated", userId: OWNER } as const;
const MEDIA = "50000000-0000-4000-8000-000000000001";

// The column lists from supabase.ts, verbatim.
const PROJECT_COLS =
  "id, slug, published_slug, visibility, index_allowed, draft, published, published_at, first_published_at, version, updated_at, deleted_at";
const POST_COLS =
  "id, slug, published_slug, draft, published, published_at, scheduled_for, schedule_error, version, updated_at, deleted_at";
const DOC_COLS = "draft, published, published_at, version, updated_at";
const MEDIA_COLS =
  "id, rev, key, kind, mime, bytes, width, height, variants, has_og, focal, alt, decorative, dominant, filename, published, created_at";

let db: Db;

beforeAll(async () => {
  db = await freshProject(loadMigrations());
  await db.exec(`
    insert into auth.users (id, email) values ('${OWNER}', 'owner@example.test');
    insert into pm.owners (user_id) values ('${OWNER}');
    insert into pm.profile (draft) values ('{}');
    insert into pm.site_layout (draft) values ('{}');
  `);
});

afterAll(async () => {
  await db.close();
});

const run = (sql: string, params: unknown[] = []) => as(db, owner, () => db.query(sql, params));

describe("Studio's Supabase repo, as the owner", () => {
  it("reads every column list it names", async () => {
    for (const q of [
      `select ${PROJECT_COLS} from pm.projects where deleted_at is null order by updated_at desc`,
      `select ${POST_COLS} from pm.posts where deleted_at is null`,
      `select ${DOC_COLS} from pm.profile where id = 1`,
      `select ${DOC_COLS} from pm.site_layout where id = 1`,
      `select ${MEDIA_COLS} from pm.media order by created_at desc`,
      "select bytes from pm.media",
      "select id, slug, published_slug, draft from pm.projects where slug = 'x' or published_slug = 'x'",
      "select old_path, project_id, post_id from pm.slug_redirects where old_path = '/work/x'",
      "select token_hash, created_at, expires_at, revoked_at from pm.preview_links where kind = 'project' and revoked_at is null",
      "select url, status, detail, checked_at from pm.link_checks",
      "select * from pm.topic_counts('project')",
      "select pm.is_owner()",
    ]) {
      expect(await as(db, owner, () => failure(db, q)), q).toBeNull();
    }
  });

  it("creates and autosaves drafts, singletons included", async () => {
    const [p] = (
      await run(`insert into pm.projects (slug, draft) values ('new-one', '{}') returning ${PROJECT_COLS}`)
    ).rows as {
      id: string;
    }[];
    await run(`insert into pm.posts (slug, draft) values ('new-post', '{}') returning ${POST_COLS}`);
    expect(
      (
        await run(
          `update pm.projects set draft = '{"a":1}', version = 2 where id = $1 and version = 1 returning ${PROJECT_COLS}`,
          [p?.id],
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await run(
          `update pm.projects set slug = 'renamed', version = 3 where id = $1 and version = 2 returning ${PROJECT_COLS}`,
          [p?.id],
        )
      ).rows,
    ).toHaveLength(1);
    for (const t of ["profile", "site_layout"]) {
      expect(
        (
          await run(
            `update pm.${t} set draft = '{}', version = 2 where id = 1 and version = 1 returning ${DOC_COLS}`,
          )
        ).rows,
      ).toHaveLength(1);
    }
  });

  it("uploads, edits, replaces and deletes media rows with exactly the columns it sends", async () => {
    await run(
      `insert into pm.media (id, rev, key, kind, mime, bytes, width, height, variants, has_og, dominant, filename)
       values ($1, 1, $2, 'image', 'image/jpeg', 1000, 2000, 1000, '{480,960,1600}', false, '#112233', 'a.jpg')
       returning ${MEDIA_COLS}`,
      [MEDIA, `${MEDIA}/r1`],
    );
    await run(
      `update pm.media set alt = 'Alt', decorative = false, focal = '{"x":0.5,"y":0.5}', filename = 'b.jpg' where id = $1 returning ${MEDIA_COLS}`,
      [MEDIA],
    );
    await run(
      `update pm.media set rev = 2, key = $2, mime = 'image/png', bytes = 2000, width = 10, height = 10, variants = '{480}',
         has_og = false, dominant = '#000000', filename = 'c.png' where id = $1 returning ${MEDIA_COLS}`,
      [MEDIA, `${MEDIA}/r2`],
    );
    // The Open Graph crop, written after its upload.
    await run("update pm.media set has_og = true where id = $1", [MEDIA]);
    await run("insert into storage.objects (bucket_id, name) values ('pm-media-draft', $1)", [
      `${MEDIA}/r2/480.webp`,
    ]);
    expect((await run("delete from pm.media where id = $1 returning id", [MEDIA])).rows).toHaveLength(1);
  });

  it("can't take any of pm-publish's jobs, so those correctly go through the functions", async () => {
    for (const w of [
      "update pm.projects set published = '{}'",
      "update pm.projects set visibility = 'unlisted'",
      "update pm.projects set deleted_at = now()",
      "update pm.posts set scheduled_for = now()",
      "delete from pm.projects",
      "insert into pm.preview_links (token_hash, kind, expires_at) values (repeat('a', 64), 'site', now())",
      "update pm.preview_links set revoked_at = now()",
      "insert into storage.objects (bucket_id, name) values ('pm-media-public', 'x')",
    ]) {
      expect(await as(db, owner, () => failure(db, w)), w).toMatch(/permission denied|row-level security/);
    }
  });
});
