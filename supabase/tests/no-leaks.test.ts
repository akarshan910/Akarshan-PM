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
import type { Post, Profile, Project, SiteLayout } from "../../src/lib/types";
import { workRows } from "../../src/lib/work-list";
import { postView, writingIndex } from "../../src/lib/writing";
import { loadMigrations } from "../../scripts/migrate.ts";
import { seedV0 } from "../../scripts/seed-v0.ts";
import type { Deps, Sql } from "../functions/_shared/deps.ts";
import { previewHandler } from "../functions/_shared/preview.ts";
import { publishHandler } from "../functions/_shared/publish.ts";
import { fakeWorld, request, SITE } from "./fakes.ts";
import { as, freshProject, type Db } from "./harness.ts";

const LEAK = "LEAK-7f3a";
const OWNER = "00000000-0000-4000-8000-000000000001";
const TOKEN = "owner-jwt";
const DRAFT = "60000000-0000-4000-8000-000000000001";
const UNLISTED = "60000000-0000-4000-8000-000000000002";
const SCHEDULED = "60000000-0000-4000-8000-000000000003";
const LIVE_POST = "60000000-0000-4000-8000-000000000004";

let db: Db;
let world: ReturnType<typeof fakeWorld>;
let n = 0;

const publish = async (b: Record<string, unknown>) => {
  const res = await publishHandler(
    request("POST", "pm-publish", { token: TOKEN, body: b, origin: SITE }),
    world.deps,
  );
  expect(res.status, JSON.stringify(await res.clone().json())).toBe(200);
};

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

async function draft<T>(table: string, where = "id = 1"): Promise<T> {
  const [r] = (await db.query<{ draft: T }>(`select draft from pm.${table} where ${where}`)).rows;
  if (!r) throw new Error(table);
  return r.draft;
}

/** Every flagged RICE row marked checked, so V0 projects publish again as the owner would. */
function reviewed(p: Project): Project {
  return {
    ...p,
    story: p.story.map((c) => ({
      ...c,
      blocks: c.blocks.map((b) =>
        b.type === "table" ? { ...b, reviewed: b.rows.map((r) => r[1] ?? "") } : b,
      ),
    })),
  };
}

beforeAll(async () => {
  db = await freshProject(loadMigrations());
  world = fakeWorld(db);
  world.tokens.set(TOKEN, OWNER);
  await db.query("insert into auth.users (id, email) values ($1, 'owner@example.test')", [OWNER]);
  await db.query("insert into pm.owners (user_id) values ($1)", [OWNER]);

  // 1. The V0 seed, as the owner runs it.
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

  // 2. Markers everywhere a visitor must not reach.
  const [live] = (
    await db.query<{ id: string; draft: Project }>(
      "select id::text, draft from pm.projects where published is not null limit 1",
    )
  ).rows;
  if (!live) throw new Error("no live project");
  const secret: Project = reviewed({
    ...live.draft,
    outcomes: live.draft.outcomes.map((o) => ({ ...o, evidence: `${LEAK}-evidence` })),
    todo: [`${LEAK}-todo`],
    story: [
      ...live.draft.story,
      {
        id: "hidden-ch",
        title: `${LEAK}-hidden-chapter`,
        hidden: true,
        prompts: [`${LEAK}-prompt`],
        blocks: [{ id: "t", type: "text", body: `<p>${LEAK}-hidden-text</p>`, style: "body" }],
      },
    ],
  });
  await db.query("update pm.projects set draft = $2 where id = $1", [live.id, secret]);

  const plain = {
    ...live.draft,
    overview: { ...live.draft.overview, title: `${LEAK}-draft-title`, summary: `${LEAK}-draft` },
  };
  await db.query("insert into pm.projects (id, slug, draft) values ($1, 'secret-draft', $2)", [DRAFT, plain]);
  await db.query("insert into pm.projects (id, slug, draft) values ($1, 'unlisted-one', $2)", [
    UNLISTED,
    reviewed({ ...live.draft, overview: { ...live.draft.overview, title: `${LEAK}-unlisted` } }),
  ]);

  const post = (title: string): Post => ({
    schemaVersion: 1,
    title,
    blocks: [{ id: "b", type: "text", body: `<p>${title} body</p>` }],
    topics: [],
    showOnHome: true,
    seo: {},
  });
  await db.query(
    "insert into pm.posts (id, slug, draft) values ($1, 'scheduled', $2), ($3, 'live-post', $4)",
    [SCHEDULED, post(`${LEAK}-scheduled`), LIVE_POST, post("A live post")],
  );

  const profile = await draft<Profile>("profile");
  const [firstFact] = Object.keys(profile.facts);
  await db.query("update pm.profile set draft = $1", [
    {
      ...profile,
      testimonials: [
        ...profile.testimonials,
        { id: "t-hidden", quote: `${LEAK}-quote`, name: "N", initials: "N", role: "R", tone: "teal" },
      ],
      facts: firstFact
        ? {
            ...profile.facts,
            [firstFact]: {
              ...profile.facts[firstFact],
              source: "owner",
              alternative: { value: `${LEAK}-fact`, source: "resume" },
            },
          }
        : profile.facts,
    },
  ]);
  const layout = await draft<SiteLayout>("site_layout");
  await db.query("update pm.site_layout set draft = $1", [
    {
      ...layout,
      // The hidden text section goes before the footer, which is always last.
      sections: [
        ...layout.sections.slice(0, -1).map((s) =>
          s.kind === "testimonials"
            ? { ...s, items: [...s.items, { id: "t-hidden", visible: false }] }
            : s.kind === "shelf"
              ? { ...s, items: [...s.items, { id: DRAFT, visible: true }, { id: UNLISTED, visible: true }] }
              : s.kind === "hero" && s.hero
                ? {
                    ...s,
                    hero: {
                      ...s.hero,
                      floaters: { ...s.hero.floaters, items: [...s.hero.floaters.items, DRAFT, UNLISTED] },
                    },
                  }
                : s,
        ),
        {
          id: "secret-text",
          kind: "text",
          visible: false,
          items: [],
          header: { title: `${LEAK}-hidden-section` },
          text: { body: `<p>${LEAK}-hidden-body</p>` },
        },
        ...layout.sections.slice(-1),
      ],
    },
  ]);
  await db.query(
    "insert into pm.link_checks (url, status, detail) values ('https://example.com/x', 'error', $1)",
    [`${LEAK}-link`],
  );

  // 3. Publish as Studio would.
  await publish({ action: "publish", kind: "project", id: live.id });
  await publish({ action: "publish", kind: "project", id: UNLISTED });
  await publish({ action: "settings", kind: "project", id: UNLISTED, visibility: "unlisted" });
  await publish({ action: "publish", kind: "post", id: LIVE_POST });
  await publish({
    action: "publish",
    kind: "post",
    id: SCHEDULED,
    scheduleFor: new Date(Date.now() + 86_400_000).toISOString(),
  });
  await publish({ action: "publish", kind: "site", confirmUnconfirmed: true });
  const res = await previewHandler(
    request("POST", "pm-preview", { token: TOKEN, body: { kind: "project", id: DRAFT } }),
    world.deps,
  );
  await res.body?.cancel();
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
    expect(text).not.toContain(LEAK);
    expect(text).not.toMatch(/"(evidence|todo|facts|unconfirmed|prompts|reviewed)"/);
    expect(text).not.toContain(DRAFT);
    expect(text).not.toContain(UNLISTED);
    expect(content.posts.map((p) => p.slug)).toEqual(["live-post"]);
    // The raw rows carry no marker either. (The published layout may still name a draft's id, so it
    // floats once published; the views above drop it.)
    expect(JSON.stringify(content)).not.toContain(LEAK);
  });

  it("at the draft, scheduled and unlisted addresses", async () => {
    const content = await readPublicContent(anonReader);
    expect(caseStudyView(content, "secret-draft")).toBeNull();
    expect(caseStudyView(content, "unlisted-one")).toBeNull();
    expect(postView(content, "scheduled")).toBeNull();
  });

  it("in anything anon can query", async () => {
    await as(db, { role: "anon" }, async () => {
      for (const q of [
        "select id, published_slug, published, published_at, first_published_at from pm.projects",
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
