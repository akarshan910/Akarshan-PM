/**
 * The `pm-` Edge Functions, end to end against the real migrations (06 · Edge Functions,
 * 08 · Drafts never leak steps 4 and 6, 10 · Security gates › Edge Functions).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as legacy from "../../src/legacy/content.ts";
import { buildV0Documents } from "../../src/lib/v0.ts";
import { loadMigrations } from "../../scripts/migrate.ts";
import { staleCopies } from "../../scripts/sync-functions-lib.ts";
import { blocksFraming, checkLink, isFetchable, isPrivateIp } from "../functions/_shared/check-link.ts";
import { riceMismatches } from "../functions/_shared/checks.ts";
import {
  checkLinkHandler,
  projectHandler,
  purgeHandler,
  schedulerHandler,
} from "../functions/_shared/jobs.ts";
import type { Project } from "../functions/_shared/lib/types.ts";
import { previewHandler, sha256Hex } from "../functions/_shared/preview.ts";
import { publishHandler } from "../functions/_shared/publish.ts";
import { sanitizeInline, sanitizeRich } from "../functions/_shared/sanitize.ts";
import { body, DEPLOY_HOOK, fakeWorld, request, SERVICE_KEY, SITE, type FakeWorld } from "./fakes.ts";
import { freshProject, type Db } from "./harness.ts";

const OWNER = "00000000-0000-4000-8000-000000000001";
const STRANGER = "00000000-0000-4000-8000-000000000002";
const OWNER_TOKEN = "owner-jwt";
const STRANGER_TOKEN = "stranger-jwt";
const LEAK = "LEAK-9c2e";

const uuid = (prefix: string, n: number) => `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`;

let db: Db;
let world: FakeWorld;
const projectIds = new Map<string, string>();
const coverIds = new Map<string, string>();

async function seed(): Promise<void> {
  const v0Slugs = buildV0Documents(legacy).projects.map((p) => p.slug);
  v0Slugs.forEach((s, i) => {
    projectIds.set(s, uuid("10000000", i + 1));
    coverIds.set(s, uuid("30000000", i + 1));
  });
  const v0 = buildV0Documents(legacy, {
    projectId: (s) => projectIds.get(s) ?? s,
    coverMediaId: (s) => coverIds.get(s) ?? s,
  });
  await db.query(
    "insert into auth.users (id, email) values ($1, 'owner@example.test'), ($2, 'stranger@example.test')",
    [OWNER, STRANGER],
  );
  await db.query("insert into pm.owners (user_id) values ($1)", [OWNER]);
  await db.query("insert into pm.profile (draft) values ($1)", [v0.profile]);
  await db.query("insert into pm.site_layout (draft) values ($1)", [v0.layout]);
  for (const c of v0.covers) {
    const id = coverIds.get(c.slug);
    if (!id) continue;
    await db.query(
      `insert into pm.media (id, rev, key, kind, mime, bytes, width, height, variants, alt, dominant, filename)
       values ($1, 1, $2, 'image', 'image/jpeg', 1000, 1600, 1000, '{480,960,1600}', $3, '#223344', 'cover.jpg')`,
      [id, `${id}/r1`, c.alt],
    );
    for (const f of ["orig.jpg", "480.webp", "960.webp", "1600.webp"])
      world.files["pm-media-draft"].add(`${id}/r1/${f}`);
  }
  for (const p of v0.projects) {
    await db.query("insert into pm.projects (id, slug, draft) values ($1, $2, $3)", [
      projectIds.get(p.slug),
      p.slug,
      p.document,
    ]);
  }
}

beforeAll(async () => {
  db = await freshProject(loadMigrations());
  world = fakeWorld(db);
  world.tokens.set(OWNER_TOKEN, OWNER);
  world.tokens.set(STRANGER_TOKEN, STRANGER);
  await seed();
});

afterAll(async () => {
  await db.close();
});

beforeEach(() => {
  world.calls.length = 0;
});

const publish = (b: Record<string, unknown>, token = OWNER_TOKEN) =>
  publishHandler(request("POST", "pm-publish", { token, body: b, origin: SITE }), world.deps);

async function draftOf(slug: string): Promise<Project> {
  const [row] = (await db.query<{ draft: Project }>("select draft from pm.projects where slug = $1", [slug]))
    .rows;
  if (!row) throw new Error(slug);
  return row.draft;
}

/** Marks every flagged RICE row as checked, as the owner does in Studio (V0 has one, 10 · Phase 0). */
function reviewed(p: Project): Project {
  return {
    ...p,
    story: p.story.map((c) => ({
      ...c,
      blocks: c.blocks.map((b) =>
        b.type === "table" ? { ...b, reviewed: riceMismatches({ ...b, reviewed: [] }).map(String) } : b,
      ),
    })),
  };
}

async function setDraft(slug: string, draft: Project): Promise<void> {
  await db.query("update pm.projects set draft = $2 where slug = $1", [slug, draft]);
}

describe("shared code", () => {
  it("keeps the functions' copies of src/lib in sync", () => {
    expect(staleCopies()).toEqual([]);
  });

  it.each([
    ['<img src=x onerror="alert(1)">Hi', "Hi"],
    ['<a href="javascript:alert(1)">x</a>', "x"],
    [
      '<a href="https://ok.test/?a=1&b=&quot;2">ok</a>',
      '<a href="https://ok.test/?a=1&amp;b=&quot;2">ok</a>',
    ],
    ["<strong onclick=x>bold</strong> <script>alert(1)</script>", "<strong>bold</strong>"],
    ["a &lt;b&gt; c", "a &lt;b&gt; c"],
  ])("sanitises inline %s", (html, want) => {
    expect(sanitizeInline(html)).toBe(want);
  });

  it("sanitises rich text to the block allowlist", () => {
    expect(
      sanitizeRich(
        '<h1>T</h1><p style="x">One<iframe src="https://evil.test"></iframe></p><ul><li>a</li></ul>',
      ),
    ).toBe("<p>T</p><p>One</p><ul><li>a</li></ul>");
  });

  it("flags RICE rows whose score doesn't match, unless reviewed", () => {
    const table = {
      id: "t",
      type: "table" as const,
      columns: [],
      rows: [
        ["1", "A", "1000", "2", "80%", "2", "800"],
        ["2", "B", "1000", "2", "80%", "2", "900"],
      ],
      formula: "rice" as const,
      checkFormula: true,
      sortByScore: false,
      highlightTop: 0 as const,
      phoneCards: false,
    };
    expect(riceMismatches(table)).toEqual([1]);
    expect(riceMismatches({ ...table, reviewed: ["B"] })).toEqual([]);
  });
});

describe("caller checks and CORS", () => {
  it("answers 401 without a session and 403 for a signed-in non-owner, with no detail", async () => {
    const none = await publishHandler(
      request("POST", "pm-publish", { body: { action: "publish", kind: "site" } }),
      world.deps,
    );
    expect(none.status).toBe(401);
    expect(await body(none)).toEqual({ error: "unauthorized" });
    const bad = await publish({ action: "publish", kind: "site" }, "forged");
    expect(bad.status).toBe(401);
    const stranger = await publish({ action: "publish", kind: "site" }, STRANGER_TOKEN);
    expect(stranger.status).toBe(403);
    expect(await body(stranger)).toEqual({ error: "forbidden" });
  });

  it("allows only PM_ALLOWED_ORIGINS", async () => {
    const ok = await publishHandler(request("OPTIONS", "pm-publish", { origin: SITE }), world.deps);
    expect(ok.status).toBe(204);
    expect(ok.headers.get("access-control-allow-origin")).toBe(SITE);
    const evil = await publishHandler(
      request("OPTIONS", "pm-publish", { origin: "https://evil.test" }),
      world.deps,
    );
    expect(evil.status).toBe(403);
    const res = await publishHandler(
      request("POST", "pm-publish", { origin: "https://evil.test", body: {}, token: OWNER_TOKEN }),
      world.deps,
    );
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("rejects bodies that aren't the documented shape", async () => {
    expect((await publish({ action: "publish", kind: "site", extra: 1 })).status).toBe(400);
    expect((await publish({ action: "drop", kind: "project", id: uuid("10000000", 1) })).status).toBe(400);
    expect((await publish({ action: "publish", kind: "project", id: "not-a-uuid" })).status).toBe(400);
  });

  it("lets only cron's service key run the scheduler and the purge", async () => {
    for (const h of [schedulerHandler, purgeHandler]) {
      expect((await h(request("POST", "x", { token: OWNER_TOKEN }), world.deps)).status).toBe(401);
      expect((await h(request("POST", "x", { token: `${SERVICE_KEY}x` }), world.deps)).status).toBe(401);
    }
  });
});

describe("pm-publish · projects", () => {
  const slug = "puja-engagement-platform";

  it("blocks with the board messages, and writes nothing", async () => {
    const draft = await draftOf(slug);
    const broken: Project = {
      ...draft,
      overview: { ...draft.overview, summary: "" },
      outcomes: draft.outcomes.map((o, i) =>
        i === 0 ? { ...o, type: "achieved" as const, evidence: "" } : o,
      ),
    };
    await setDraft(slug, broken);
    const res = await publish({ action: "publish", kind: "project", id: projectIds.get(slug) });
    expect(res.status).toBe(422);
    const b = await body<{ reason: string; issues: { message: string }[] }>(res);
    expect(b.reason).toBe("blocked");
    expect(b.issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([
        "Summary is required.",
        "Result 1 is marked achieved but has no evidence note.",
      ]),
    );
    const [row] = (
      await db.query<{ published: unknown }>("select published from pm.projects where slug = $1", [slug])
    ).rows;
    expect(row?.published).toBeNull();
    await setDraft(slug, draft);
  });

  it("publishes: sanitised, private fields gone, only used images made public, revision and deploy", async () => {
    const draft = await draftOf(slug);
    const hiddenImage = uuid("30000000", 99);
    await db.query(
      `insert into pm.media (id, rev, key, kind, mime, bytes, width, height, variants, alt, filename)
       values ($1, 1, $2, 'image', 'image/webp', 10, 10, 10, '{480}', 'Hidden', 'h.jpg')`,
      [hiddenImage, `${hiddenImage}/r1`],
    );
    world.files["pm-media-draft"].add(`${hiddenImage}/r1/480.webp`);
    const base = reviewed(draft);
    const withExtras: Project = {
      ...base,
      overview: {
        ...draft.overview,
        problem: `Fine <script>alert("${LEAK}")</script><a href="javascript:x">link</a>`,
      },
      outcomes: draft.outcomes.map((o) => ({ ...o, evidence: `${LEAK}-evidence` })),
      todo: [`${LEAK}-todo`],
      story: [
        ...base.story,
        {
          id: "secret",
          title: `${LEAK}-hidden-chapter`,
          hidden: true,
          prompts: [`${LEAK}-prompt`],
          blocks: [{ id: "i", type: "image", media: { mediaId: hiddenImage } }],
        },
      ],
    };
    await setDraft(slug, withExtras);
    const res = await publish({ action: "publish", kind: "project", id: projectIds.get(slug) });
    expect(res.status, JSON.stringify(await res.clone().json())).toBe(200);
    expect(await body(res)).toMatchObject({ ok: true, deployed: true });

    const [row] = (
      await db.query<{ published: Project; published_slug: string; first: string | null }>(
        "select published, published_slug, first_published_at::text as first from pm.projects where slug = $1",
        [slug],
      )
    ).rows;
    const text = JSON.stringify(row?.published);
    expect(text).not.toContain(LEAK);
    expect(text).not.toContain("javascript:");
    expect(row?.published.overview.problem).toBe("Fine link");
    expect(row?.published_slug).toBe(slug);
    expect(row?.first).not.toBeNull();
    const cover = coverIds.get(slug) ?? "";
    expect(text).toContain(`/media/${cover}/r1/1600.webp`);
    expect([...world.files["pm-media-public"]].filter((n) => n.startsWith(cover))).toHaveLength(4);
    expect([...world.files["pm-media-public"]].some((n) => n.startsWith(hiddenImage))).toBe(false);

    expect((await db.query("select 1 from pm.project_revisions")).rows).toHaveLength(1);
    expect(world.calls).toEqual([{ url: DEPLOY_HOOK, method: "POST" }]);
    expect((await db.query<{ reason: string }>("select reason from pm.deploys")).rows).toEqual([
      { reason: `project:${slug}` },
    ]);
  });

  it("redirects the old address when the slug changes, and never from the live one", async () => {
    await db.query("update pm.projects set slug = 'puja-platform' where slug = $1", [slug]);
    const draft = await draftOf("puja-platform");
    await setDraft("puja-platform", { ...reviewed(draft), settings: { redirectOldSlug: true } });
    const res = await publish({ action: "publish", kind: "project", id: projectIds.get(slug) });
    expect(res.status, JSON.stringify(await res.clone().json())).toBe(200);
    const r = await db.query<{ old_path: string; new_path: string }>("select * from pm.public_redirects()");
    expect(r.rows).toContainEqual({ old_path: `/work/${slug}`, new_path: "/work/puja-platform" });
  });

  it("unpublishes, deletes and restores, rebuilding only when something live changed", async () => {
    const id = projectIds.get(slug);
    expect(await body(await publish({ action: "unpublish", kind: "project", id }))).toMatchObject({
      ok: true,
      deployed: true,
    });
    expect(
      (await db.query("select 1 from pm.projects where id = $1 and published is null", [id])).rows,
    ).toHaveLength(1);
    expect(await body(await publish({ action: "delete", kind: "project", id }))).toMatchObject({
      ok: true,
      deployed: false,
    });
    expect(await body(await publish({ action: "restore", kind: "project", id }))).toMatchObject({ ok: true });
    expect(
      (await db.query("select 1 from pm.projects where id = $1 and deleted_at is null", [id])).rows,
    ).toHaveLength(1);
    // Undo of Unpublish: restore on a live-once, unpublished row puts its last live version back.
    const [rev] = (
      await db.query<{ published: unknown }>(
        "select published from pm.project_revisions where project_id = $1 order by id desc limit 1",
        [id],
      )
    ).rows;
    expect(await body(await publish({ action: "restore", kind: "project", id }))).toMatchObject({
      ok: true,
      deployed: true,
    });
    const [back] = (
      await db.query<{ published: unknown }>("select published from pm.projects where id = $1", [id])
    ).rows;
    expect(back?.published).toEqual(rev?.published);
    // A draft that was never live has nothing to restore.
    expect(
      await body(
        await publish({ action: "restore", kind: "project", id: projectIds.get("arcana-workspace") }),
      ),
    ).toMatchObject({
      ok: true,
      deployed: false,
    });
    expect((await publish({ action: "publish", kind: "project", id: uuid("10000000", 999) })).status).toBe(
      404,
    );
  });

  it("publishes with a flagged RICE row, returning it as a warning (the boards' rule)", async () => {
    const draft = await draftOf("puja-platform");
    await setDraft("puja-platform", {
      ...draft,
      story: draft.story.map((c) => ({
        ...c,
        blocks: c.blocks.map((b) => (b.type === "table" ? { ...b, reviewed: [] } : b)),
      })),
    });
    const res = await publish({ action: "publish", kind: "project", id: projectIds.get(slug) });
    const b = await body<{ ok: boolean; warnings?: { message: string }[] }>(res);
    expect(res.status, JSON.stringify(b)).toBe(200);
    expect(b.warnings?.map((w) => w.message)).toEqual(["1 row needs a look."]);
  });

  it("changes who can find it with settings", async () => {
    const id = projectIds.get(slug);
    expect(
      (
        await publish({
          action: "settings",
          kind: "project",
          id,
          visibility: "unlisted",
          indexAllowed: false,
        })
      ).status,
    ).toBe(200);
    const [row] = (
      await db.query<{ visibility: string; index_allowed: boolean }>(
        "select visibility, index_allowed from pm.projects where id = $1",
        [id],
      )
    ).rows;
    expect(row).toEqual({ visibility: "unlisted", index_allowed: false });
    await publish({ action: "settings", kind: "project", id, visibility: "public", indexAllowed: true });
  });
});

describe("pm-publish · site", () => {
  it("asks before publishing unconfirmed facts, then publishes with hidden parts left out", async () => {
    const [p] = (
      await db.query<{ draft: { testimonials: { id: string; quote: string }[]; unconfirmed: string[] } }>(
        "select draft from pm.profile",
      )
    ).rows;
    const [l] = (
      await db.query<{
        draft: {
          sections: {
            id: string;
            kind: string;
            visible: boolean;
            items: { id: string; visible: boolean }[];
          }[];
        };
      }>("select draft from pm.site_layout")
    ).rows;
    if (!p || !l) throw new Error("seed");
    const profile = {
      ...p.draft,
      testimonials: [
        ...p.draft.testimonials,
        { id: "t-hidden", quote: `${LEAK}-quote`, name: "N", initials: "N", role: "R", tone: "teal" },
      ],
    };
    const sections = l.draft.sections.map((s) =>
      s.kind === "testimonials"
        ? { ...s, items: [...s.items, { id: "t-hidden", visible: false }] }
        : s.kind === "offduty"
          ? { ...s, visible: false }
          : s,
    );
    await db.query("update pm.profile set draft = $1", [profile]);
    await db.query("update pm.site_layout set draft = $1", [{ ...l.draft, sections }]);

    const first = await publish({ action: "publish", kind: "site" });
    if (p.draft.unconfirmed.length > 0) {
      expect(first.status).toBe(409);
      expect(await body(first)).toMatchObject({ ok: false, reason: "needs-confirm" });
    }
    const res = await publish({ action: "publish", kind: "site", confirmUnconfirmed: true });
    expect(res.status, JSON.stringify(await res.clone().json())).toBe(200);
    expect(await body(res)).toMatchObject({ ok: true, changes: ["First publish of the website"] });

    const [row] = (
      await db.query<{ profile: unknown; layout: { sections: { kind: string }[] } }>(
        "select p.published as profile, l.published as layout from pm.profile p, pm.site_layout l",
      )
    ).rows;
    const text = JSON.stringify(row);
    expect(text).not.toContain(LEAK);
    expect(text).not.toMatch(/"(facts|unconfirmed|evidence|todo|prompts|reviewed)"/);
    expect(row?.layout.sections.some((s) => s.kind === "offduty")).toBe(false);
    expect((await db.query("select changes from pm.site_revisions")).rows).toHaveLength(1);
  });
});

describe("pm-preview", () => {
  const slug = "arcana-workspace";
  let token = "";
  let hash = "";

  it("creates a link for the owner, storing only the token's hash", async () => {
    const res = await previewHandler(
      request("POST", "pm-preview", {
        token: OWNER_TOKEN,
        body: { kind: "project", id: projectIds.get(slug) },
      }),
      world.deps,
    );
    expect(res.status).toBe(200);
    const b = await body<{ url: string; link: { tokenHash: string } }>(res);
    expect(b.url.startsWith(`${SITE}/preview/`)).toBe(true);
    token = b.url.slice(`${SITE}/preview/`.length);
    hash = b.link.tokenHash;
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hash).toBe(await sha256Hex(token));
    const stored = JSON.stringify((await db.query("select * from pm.preview_links")).rows);
    expect(stored).not.toContain(token);
    expect(
      (
        await previewHandler(
          request("POST", "pm-preview", { token: STRANGER_TOKEN, body: { kind: "site" } }),
          world.deps,
        )
      ).status,
    ).toBe(403);
  });

  it("serves the draft in its published shape, no-store and noindex, with signed draft images", async () => {
    const draft = await draftOf(slug);
    await setDraft(slug, {
      ...draft,
      outcomes: draft.outcomes.map((o) => ({ ...o, evidence: `${LEAK}-ev` })),
    });
    const res = await previewHandler(request("GET", `pm-preview?token=${token}`), world.deps);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    const text = await res.text();
    expect(text).not.toContain(LEAK);
    expect(text).toContain("https://ref.supabase.test/storage/v1/object/sign/pm-media-draft/");
  });

  it("answers 404 for unknown tokens and 410 once revoked or expired", async () => {
    expect((await previewHandler(request("GET", "pm-preview?token=nope"), world.deps)).status).toBe(404);
    expect(
      (await previewHandler(request("GET", `pm-preview?token=${"A".repeat(43)}`), world.deps)).status,
    ).toBe(404);
    const del = await previewHandler(
      request("DELETE", "pm-preview", { token: OWNER_TOKEN, body: { tokenHash: hash } }),
      world.deps,
    );
    expect(del.status).toBe(204);
    expect((await previewHandler(request("GET", `pm-preview?token=${token}`), world.deps)).status).toBe(410);

    const res = await previewHandler(
      request("POST", "pm-preview", { token: OWNER_TOKEN, body: { kind: "site" } }),
      world.deps,
    );
    const t = (await body<{ url: string }>(res)).url.split("/preview/")[1] ?? "";
    expect((await previewHandler(request("GET", `pm-preview?token=${t}`), world.deps)).status).toBe(200);
    await db.query(
      "update pm.preview_links set expires_at = now() - interval '1 second' where token_hash = $1",
      [await sha256Hex(t)],
    );
    expect((await previewHandler(request("GET", `pm-preview?token=${t}`), world.deps)).status).toBe(410);
  });
});

describe("pm-project", () => {
  it("returns a live project by its exact live address, and 404 for anything else", async () => {
    await setDraft("puja-platform", reviewed(await draftOf("puja-platform")));
    expect(
      (await publish({ action: "publish", kind: "project", id: projectIds.get("puja-engagement-platform") }))
        .status,
    ).toBe(200);
    const res = await projectHandler(request("GET", "pm-project?slug=puja-platform"), world.deps);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    expect(
      (await projectHandler(request("GET", "pm-project?slug=arcana-workspace"), world.deps)).status,
    ).toBe(404);
    expect((await projectHandler(request("GET", "pm-project?slug=../etc"), world.deps)).status).toBe(404);
    expect((await projectHandler(request("POST", "pm-project?slug=puja-platform"), world.deps)).status).toBe(
      405,
    );
  });
});

describe("pm-check-link", () => {
  it.each([
    ["127.0.0.1", true],
    ["10.1.2.3", true],
    ["172.20.0.1", true],
    ["192.168.1.1", true],
    ["100.100.0.1", true],
    ["169.254.169.254", true],
    ["0.0.0.0", true],
    ["::1", true],
    ["fd12::1", true],
    ["fe80::1", true],
    ["::ffff:10.0.0.1", true],
    ["::ffff:127.0.0.1", true],
    ["93.184.215.14", false],
    ["2606:4700::1111", false],
    ["172.32.0.1", false],
  ])("treats %s as private: %s", (ip, priv) => {
    expect(isPrivateIp(ip)).toBe(priv);
  });

  it.each([
    ["https://example.com/x", true],
    ["http://example.com", false],
    ["https://localhost/x", false],
    ["https://127.0.0.1/", false],
    ["https://2130706433/", false],
    ["https://[::1]/", false],
    ["https://169.254.169.254/latest", false],
    ["https://metadata.google.internal/", false],
    ["https://intranet/", false],
    ["https://user:pw@example.com/", false],
    ["https://example.com:8443/", false],
  ])("may fetch %s: %s", (url, ok) => {
    expect(isFetchable(url)).toBe(ok);
  });

  it("classifies redirects to sign-in, missing pages and framing rules", async () => {
    // Fresh responses per call: a cloned body can't be cancelled on its own.
    const opts = (
      map: Record<string, ResponseInit & { body?: string }>,
      dns: Record<string, string[]> = {},
    ) => ({
      siteOrigin: SITE,
      resolve: (host: string) => Promise.resolve(dns[host] ?? ["93.184.215.14"]),
      fetch: (input: RequestInfo | URL) => {
        const r = map[input instanceof Request ? input.url : input.toString()];
        return Promise.resolve(r ? new Response(r.body ?? null, r) : new Response("", { status: 200 }));
      },
    });
    const drive = "https://drive.google.com/file/d/abc_123/view";
    expect(
      await checkLink(
        drive,
        "video",
        opts({
          "https://drive.google.com/file/d/abc_123/preview": {
            status: 302,
            headers: { location: "https://accounts.google.com/signin" },
          },
        }),
      ),
    ).toMatchObject({ status: "not-shared" });
    expect(
      await checkLink(
        "https://proto.example.com/",
        "prototype",
        opts({
          "https://proto.example.com/": {
            status: 302,
            headers: { location: "https://vercel.com/login?next=/" },
          },
        }),
      ),
    ).toMatchObject({ status: "login" });
    expect(
      await checkLink(
        "https://proto.example.com/",
        "prototype",
        opts({
          "https://proto.example.com/": { status: 302, headers: { location: "https://127.0.0.1/admin" } },
        }),
      ),
    ).toMatchObject({ status: "error" });
    expect(
      await checkLink(
        "https://proto.example.com/",
        "prototype",
        opts({ "https://proto.example.com/": { headers: { "x-frame-options": "DENY" } } }),
      ),
    ).toMatchObject({ status: "no-frame" });
    expect(
      await checkLink(
        "https://doc.example.com/",
        "prd",
        opts({ "https://doc.example.com/": { status: 404 } }),
      ),
    ).toMatchObject({ status: "gone" });
    expect(await checkLink("https://doc.example.com/", "prd", opts({}))).toEqual({ status: "ok" });
    expect(
      blocksFraming(new Headers({ "content-security-policy": `frame-ancestors 'self' ${SITE}` }), SITE),
    ).toBe(false);
    // A public name that resolves to a private address, directly or after a redirect.
    expect(
      await checkLink("https://127.0.0.1.nip.io/", "prd", opts({}, { "127.0.0.1.nip.io": ["127.0.0.1"] })),
    ).toMatchObject({
      status: "error",
      detail: "Points at a private address.",
    });
    expect(
      await checkLink(
        "https://doc.example.com/",
        "prd",
        opts(
          { "https://doc.example.com/": { status: 302, headers: { location: "https://meta.example.org/" } } },
          {
            "meta.example.org": ["169.254.169.254"],
          },
        ),
      ),
    ).toMatchObject({ detail: "Points at a private address." });
    expect(
      await checkLink("https://nx.example.com/", "prd", opts({}, { "nx.example.com": [] })),
    ).toMatchObject({
      detail: "The address doesn't resolve.",
    });
    expect(blocksFraming(new Headers({ "content-security-policy": "frame-ancestors 'self'" }), SITE)).toBe(
      true,
    );
  });

  it("records the owner's check, and runs the nightly check for cron only", async () => {
    world.responses.set("https://doc.example.com/prd", () => new Response("", { status: 404 }));
    const res = await checkLinkHandler(
      request("POST", "pm-check-link", {
        token: OWNER_TOKEN,
        body: { url: "https://doc.example.com/prd", kind: "prd" },
      }),
      world.deps,
    );
    expect(await body(res)).toMatchObject({ status: "gone" });
    expect(
      (await db.query("select status from pm.link_checks where url = 'https://doc.example.com/prd'")).rows,
    ).toEqual([{ status: "gone" }]);
    const owner = await checkLinkHandler(
      request("POST", "pm-check-link", { token: OWNER_TOKEN, body: { nightly: true } }),
      world.deps,
    );
    expect(owner.status).toBe(403);
    const cron = await checkLinkHandler(
      request("POST", "pm-check-link", { token: SERVICE_KEY, body: { nightly: true } }),
      world.deps,
    );
    expect(cron.status).toBe(200);
  });
});

describe("posts, the scheduler and the purge", () => {
  const POST = uuid("20000000", 1);
  const post = (title: string) => ({
    schemaVersion: 1,
    title,
    blocks: [{ id: "b1", type: "text", body: `<p>${"word ".repeat(300)}</p>` }],
    topics: [],
    showOnHome: true,
    seo: {},
  });

  it("schedules after running the checks, then the scheduler publishes it", async () => {
    await db.query("insert into pm.posts (id, slug, draft) values ($1, 'first-post', $2)", [POST, post("")]);
    const later = new Date(world.clock.now.getTime() + 3600_000).toISOString();
    const blockedRes = await publish({ action: "publish", kind: "post", id: POST, scheduleFor: later });
    expect(blockedRes.status).toBe(422);
    await db.query("update pm.posts set draft = $2 where id = $1", [POST, post("First post")]);
    expect((await publish({ action: "publish", kind: "post", id: POST, scheduleFor: later })).status).toBe(
      200,
    );
    expect(
      (await db.query("select 1 from pm.posts where scheduled_for is not null and published is null")).rows,
    ).toHaveLength(1);

    await db.query("update pm.posts set scheduled_for = now() - interval '1 minute'");
    const res = await schedulerHandler(
      request("POST", "pm-post-scheduler", { token: SERVICE_KEY }),
      world.deps,
    );
    expect(await body(res)).toMatchObject({ due: 1, published: 1 });
    const [row] = (
      await db.query<{ published: { readingMinutes: number; excerpt: string } }>(
        "select published from pm.posts where id = $1",
        [POST],
      )
    ).rows;
    expect(row?.published.readingMinutes).toBe(2);
    expect(row?.published.excerpt.length).toBeLessThanOrEqual(160);
  });

  it("keeps a scheduler failure for Studio instead of retrying", async () => {
    const id = uuid("20000000", 2);
    await db.query(
      "insert into pm.posts (id, slug, draft, scheduled_for) values ($1, 'broken', $2, now() - interval '1 minute')",
      [id, post("")],
    );
    await schedulerHandler(request("POST", "pm-post-scheduler", { token: SERVICE_KEY }), world.deps);
    const [row] = (
      await db.query<{ scheduled_for: string | null; schedule_error: string }>(
        "select scheduled_for, schedule_error from pm.posts where id = $1",
        [id],
      )
    ).rows;
    expect(row).toEqual({ scheduled_for: null, schedule_error: "Add a title." });
  });

  it("purges old deleted rows and files nothing uses", async () => {
    const orphan = uuid("30000000", 77);
    world.files["pm-media-draft"].add(`${orphan}/r1/480.webp`);
    world.files["pm-media-public"].add(`${orphan}/r1/480.webp`);
    const inFlight = uuid("30000000", 78);
    world.files["pm-media-draft"].add(`${inFlight}/r1/480.webp`);
    world.created.set(`${inFlight}/r1/480.webp`, new Date(world.clock.now.getTime() - 3600_000));
    await db.query("update pm.posts set deleted_at = now() - interval '31 days' where slug = 'broken'");
    const res = await purgeHandler(request("POST", "pm-purge", { token: SERVICE_KEY }), world.deps);
    expect(await body(res)).toMatchObject({ posts: 1 });
    expect(world.files["pm-media-draft"].has(`${orphan}/r1/480.webp`)).toBe(false);
    expect(world.files["pm-media-public"].has(`${orphan}/r1/480.webp`)).toBe(false);
    // An hour-old upload without its media row yet stays.
    expect(world.files["pm-media-draft"].has(`${inFlight}/r1/480.webp`)).toBe(true);
    const cover = coverIds.get("puja-engagement-platform") ?? "";
    // Live again since the pm-project test: its files stay in both buckets.
    expect(world.files["pm-media-public"].has(`${cover}/r1/1600.webp`)).toBe(true);
    expect(world.files["pm-media-draft"].has(`${cover}/r1/1600.webp`)).toBe(true);
    expect((await db.query("select published from pm.media where id = $1", [cover])).rows).toEqual([
      { published: true },
    ]);

    // Unpublished: the next purge takes its public copies, and keeps the drafts.
    await publish({ action: "unpublish", kind: "project", id: projectIds.get("puja-engagement-platform") });
    await purgeHandler(request("POST", "pm-purge", { token: SERVICE_KEY }), world.deps);
    expect(world.files["pm-media-public"].has(`${cover}/r1/1600.webp`)).toBe(false);
    expect(world.files["pm-media-draft"].has(`${cover}/r1/1600.webp`)).toBe(true);
  });
});
