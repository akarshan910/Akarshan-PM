/**
 * Drafts never leak (08 · Drafts never leak, 10 · Security gates › Drafts), at the data level: the
 * V0 seed plus a marker in every place a visitor must never see, published through pm-publish, then
 * read the way the build reads (portfolio's `supabase` source, as `anon`) and turned into every
 * public view. No marker may appear in any of them, nor in anything `anon` can query.
 *
 * The build-level half (markers absent from build/, sitemap, RSS and vercel.json) needs the full local
 * stack and runs as tests/e2e/no-leaks.spec.ts in CI.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { readPublicContent, type PublicReader } from "../../src/lib/sources/supabase";
import { caseStudyView } from "../../src/lib/case-study";
import { buildChrome, buildHomeView, listedProjects } from "../../src/lib/site";
import { workRows } from "../../src/lib/work-list";
import { postView, writingIndex } from "../../src/lib/writing";
import { loadMigrations } from "../../scripts/migrate.ts";
import { addLeakMarkers, LEAK, type LeakManifest } from "../../scripts/leak-markers.ts";
import { seedV0 } from "../../scripts/seed-v0-core.ts";
import type { Deps, Sql } from "../functions/_shared/deps.ts";
import { fakeWorld } from "./fakes.ts";
import { as, freshProject, type Db } from "./harness.ts";

const OWNER = "00000000-0000-4000-8000-000000000001";
const TOKEN = "owner-jwt";

let db: Db;
let world: ReturnType<typeof fakeWorld>;
let manifest: LeakManifest;
let n = 0;

const anonReader: PublicReader = {
  async select(table, columns) {
    try {
      const r = await as(db, { role: "anon" }, () => db.query(`select ${columns} from pm.${table}`));
      return { data: r.rows, error: null };
    } catch (e) {
      return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
    }
  },
};

beforeAll(async () => {
  db = await freshProject(loadMigrations());
  world = fakeWorld(db);
  world.tokens.set(TOKEN, OWNER);
  await db.query("insert into auth.users (id, email) values ($1, 'owner@example.test')", [OWNER]);
  await db.query("insert into pm.owners (user_id) values ($1)", [OWNER]);

  // The V0 seed, as the owner runs it, then the shared markers (scripts/leak-markers.ts).
  await db.transaction(async (tx) => {
    const sql: Sql = {
      query: async <T>(text: string, params: unknown[] = []) => (await tx.query<T>(text, params)).rows,
      transaction: (fn) => fn(sql),
    };
    const deps: Deps = { ...world.deps, sql };
    await seedV0(deps, {
      readCover: () => new Uint8Array(100),
      upload: (name) => {
        world.files["pm-media-draft"].add(name);
        return Promise.resolve();
      },
      prototypes: {},
      uuid: () => `40000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
    });
  });
  manifest = await addLeakMarkers(world.deps, { token: TOKEN });
});

afterAll(async () => {
  await db.close();
});

describe("no marker reaches a visitor", () => {
  it("in any view the build makes from the supabase source", async () => {
    const content = await readPublicContent(anonReader);
    const views: unknown[] = [
      buildHomeView(content),
      buildChrome(content),
      workRows(content),
      writingIndex(content),
    ];
    for (const p of listedProjects(content)) views.push(caseStudyView(content, p.slug));
    for (const p of content.posts) views.push(postView(content, p.slug));
    const text = JSON.stringify(views);
    for (const marker of manifest.markers) expect(text).not.toContain(marker);
    expect(text).not.toMatch(/"(evidence|todo|facts|unconfirmed|prompts|reviewed)"/);
    for (const id of manifest.privateIds) expect(text).not.toContain(id);
    expect(content.posts.map((p) => p.slug)).toEqual(["live-post"]);
    // The raw rows carry no marker either. (The published layout may still name a draft's id, so it
    // floats once published; the views above drop it.)
    expect(JSON.stringify(content)).not.toContain(LEAK);
  });

  it("at the draft, scheduled and unlisted addresses", async () => {
    const content = await readPublicContent(anonReader);
    for (const path of manifest.notFound) {
      const slug = path.split("/").pop() ?? "";
      expect(
        path.startsWith("/work/") ? caseStudyView(content, slug) : postView(content, slug),
        path,
      ).toBeNull();
    }
    expect(caseStudyView(content, manifest.unlisted.slug)).toBeNull();
    expect(postView(content, manifest.livePost.split("/").pop() ?? "")).not.toBeNull();
  });

  it("in anything anon can query", async () => {
    await as(db, { role: "anon" }, async () => {
      for (const q of [
        "select id, published_slug, published, published_at, first_published_at, index_allowed from pm.projects",
        "select id, published_slug, published, published_at from pm.posts",
        "select published, published_at from pm.profile",
        "select published, published_at from pm.site_layout",
        "select * from pm.public_redirects()",
        "select name from storage.objects",
      ]) {
        expect(JSON.stringify((await db.query(q)).rows), q).not.toContain(LEAK);
      }
    });
  });

  it("in pm-media-public, which holds only files published pages use", () => {
    expect([...world.files["pm-media-public"]].every((f) => /^[0-9a-f-]{36}\/r\d+\//.test(f))).toBe(true);
  });
});
