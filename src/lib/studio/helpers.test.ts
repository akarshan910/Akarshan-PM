import { describe, expect, it } from "vitest";

import { newPost, newProject } from "../defaults";
import { loadRepo, RepoUnavailable } from "./client";
import { buildDashboard, fieldHref } from "./dashboard";
import { confirmFact, factLabel, factValue, setFact } from "./facts";
import {
  countWord,
  dayAndTime,
  firstName,
  greeting,
  longDate,
  plural,
  relative,
  thumbBackground,
} from "./format";
import { loginPath, pageName, safeNext } from "./paths";
import { createProject, projectStatus, shelfOf, shelves } from "./projects";
import { publishPost } from "./publish-post";
import {
  LOCK_MS,
  clearLock,
  clearSent,
  clock,
  countWrong,
  lockLeft,
  looksLikeEmail,
  maskEmail,
  normaliseEmail,
  recordSent,
  rememberEmail,
  rememberedEmail,
  sentRecord,
} from "./signin";
import { must, T0, testRepo } from "./test-helpers";
import { mediaUses, postMediaRefs, projectMediaRefs } from "./usage";

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

describe("signin", () => {
  it("masks the address as the board does", () => {
    expect(maskEmail("owner@example.test")).toBe("o•••r@example.test");
    expect(maskEmail("averyverylongname@example.test")).toBe("a••••••••e@example.test");
    expect(maskEmail("nope")).toBe("that address");
    expect(looksLikeEmail(" a@b.co ")).toBe(true);
    expect(looksLikeEmail("a@b")).toBe(false);
    expect(normaliseEmail(" A@B.co ")).toBe("a@b.co");
    expect(clock(52)).toBe("0:52");
    expect(clock(872)).toBe("14:32");
    expect(clock(-3)).toBe("0:00");
  });

  it("remembers the address and the sent record, and survives broken storage", () => {
    const s = new MemoryStorage();
    expect(rememberedEmail(s)).toBe("");
    rememberEmail(s, "owner@example.test");
    expect(rememberedEmail(s)).toBe("owner@example.test");
    rememberEmail(s, null);
    expect(rememberedEmail(s)).toBe("");
    expect(sentRecord(s)).toBeNull();
    recordSent(s, "owner@example.test", 5);
    expect(sentRecord(s)).toEqual({ email: "owner@example.test", at: 5 });
    s.setItem("studio.sent", "{bad");
    expect(sentRecord(s)).toBeNull();
    s.setItem("studio.sent", JSON.stringify({ email: 1 }));
    expect(sentRecord(s)).toBeNull();
    clearSent(s);
    expect(sentRecord(s)).toBeNull();
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    expect(rememberedEmail(broken)).toBe("");
    expect(sentRecord(undefined)).toBeNull();
  });

  it("locks the device for 15 minutes after five wrong codes", () => {
    const s = new MemoryStorage();
    const e = "owner@example.test";
    for (let i = 0; i < 4; i++) expect(countWrong(s, e, 1000)).toBe(0);
    expect(countWrong(s, e, 1000)).toBe(LOCK_MS);
    expect(lockLeft(s, e, 1000 + 60_000)).toBe(LOCK_MS - 60_000);
    expect(lockLeft(s, e, 1000 + LOCK_MS)).toBe(0);
    // After the lock runs out, counting starts again.
    expect(countWrong(s, e, 1000 + LOCK_MS + 1)).toBe(0);
    clearLock(s, e);
    expect(lockLeft(s, e, 0)).toBe(0);
    s.setItem(`studio.lock.${e}`, "{bad");
    expect(lockLeft(s, e, 0)).toBe(0);
  });
});

describe("format", () => {
  const now = new Date(2026, 9, 13, 19, 30);
  it("writes dates the boards' way", () => {
    expect(longDate(now)).toBe("Tuesday, 13 Oct");
    expect(greeting(new Date(2026, 9, 13, 9))).toBe("Good morning");
    expect(greeting(new Date(2026, 9, 13, 13))).toBe("Good afternoon");
    expect(greeting(now)).toBe("Good evening");
    expect(dayAndTime(new Date(2026, 9, 13, 14, 2).toISOString(), now)).toBe("Today, 14:02");
    expect(dayAndTime(new Date(2026, 9, 12, 9, 5).toISOString(), now)).toBe("Yesterday, 09:05");
    expect(dayAndTime(new Date(2026, 9, 1, 9, 5).toISOString(), now)).toBe("1 Oct, 09:05");
    const ago = (ms: number) => relative(new Date(now.getTime() - ms).toISOString(), now);
    expect(ago(10_000)).toBe("Just now");
    expect(ago(12 * 60_000)).toBe("12 min ago");
    expect(ago(60 * 60_000)).toBe("1 h ago");
    expect(ago(24 * 3600_000)).toBe("Yesterday");
    expect(ago(2 * 24 * 3600_000)).toBe("2 days ago");
    expect(ago(12 * 24 * 3600_000)).toBe("1 Oct");
  });
  it("writes counts and names", () => {
    expect(countWord(4)).toBe("Four");
    expect(countWord(20)).toBe("20");
    expect(plural(1, "draft")).toBe("draft");
    expect(plural(2, "draft")).toBe("drafts");
    expect(firstName("  Akarshan Kumar ")).toBe("Akarshan");
    expect(firstName("")).toBe("");
    expect(thumbBackground("teal")).toBe("linear-gradient(135deg, #2DD4BF, #0D6B60)");
  });
});

describe("paths", () => {
  it("follows next only inside Studio", () => {
    expect(safeNext("/studio/projects/abc")).toBe("/studio/projects/abc");
    expect(safeNext("/studio")).toBe("/studio");
    expect(safeNext("https://evil.test")).toBe("/studio");
    expect(safeNext("/studio?x=1")).toBe("/studio");
    expect(safeNext("//evil.test/studio")).toBe("/studio");
    expect(safeNext(null)).toBe("/studio");
    expect(loginPath("/studio")).toBe("/studio/login");
    expect(loginPath("/studio/media", "signed-out")).toBe(
      "/studio/login?next=%2Fstudio%2Fmedia&reason=signed-out",
    );
  });
  it("names pages", () => {
    const title = (kind: string, id: string) =>
      kind === "project" && id === "p1" ? "Puja engagement platform" : undefined;
    expect(pageName("/studio")).toBe("the dashboard");
    expect(pageName("/studio/website")).toBe("Website");
    expect(pageName("/studio/website/profile")).toBe("Profile & facts");
    expect(pageName("/studio/projects")).toBe("Projects");
    expect(pageName("/studio/projects/p1", title)).toBe("Puja engagement platform");
    expect(pageName("/studio/projects/p1/story", title)).toBe("Puja engagement platform · Story");
    expect(pageName("/studio/projects/p2")).toBe("a project");
    expect(pageName("/studio/writing")).toBe("Writing");
    expect(pageName("/studio/writing/x")).toBe("a post");
    expect(pageName("/studio/media")).toBe("Media");
    expect(pageName("/studio/preview/project/x")).toBe("the draft preview");
    expect(pageName("/studio/nope")).toBe("Studio");
  });
});

describe("facts", () => {
  it("reads, writes and confirms keyed facts", async () => {
    const { repo } = testRepo();
    const profile = (await repo.profile.get()).draft;
    expect(factValue(profile, "title")).toBe(profile.title);
    expect(factValue(profile, "proof.p-users.value")).toBe(
      profile.proof.find((p) => p.id === "p-users")?.value,
    );
    expect(factValue(profile, "experience.e-sugarfit.highlights.h1.items.i4.text")).toBeTruthy();
    expect(factValue(profile, "nope.x")).toBeUndefined();
    const set = setFact(profile, "proof.p-users.value", "230M+");
    expect(factValue(set, "proof.p-users.value")).toBe("230M+");
    expect(factValue(profile, "proof.p-users.value")).not.toBe("230M+");
    expect(setFact(profile, "nope.x", "y")).toEqual(profile);
    const confirmed = confirmFact(profile, "title", "resume");
    expect(confirmed.unconfirmed).not.toContain("title");
    expect(confirmed.facts.title?.source).toBe("resume");
    expect(confirmFact(profile, "missing").unconfirmed).toEqual(profile.unconfirmed);
    expect(["title", "availability", "proof.x", "experience.y", "other"].map(factLabel)).toEqual([
      "Job title",
      "Availability",
      "Proof strip",
      "Experience",
      "other",
    ]);
  });
});

describe("dashboard", () => {
  it("orders what needs input and summarises it", async () => {
    const { repo, clock: c } = testRepo();
    const post = await repo.posts.create({ ...newPost(), title: "Scheduled" }, "scheduled");
    must(
      (repo as unknown as { postRows: Map<string, { scheduleError: string }> }).postRows.get(post.id),
    ).scheduleError = "The cover needs alt text.";
    const live = must((await repo.projects.list()).find((r) => r.published));
    const url = "https://gone.test/x";
    const d = live.draft;
    d.overview.prdUrl = url;
    c.now += 60_000;
    await repo.projects.save(live.id, d, live.version);
    repo.setLinkCheck(url, "gone");
    repo.setLinkCheck("https://ok.test", "ok");
    repo.setLinkCheck("https://orphan.test", "login");
    const m = buildDashboard({
      projects: await repo.projects.list(),
      posts: await repo.posts.list(),
      profile: await repo.profile.get(),
      layout: await repo.layout.get(),
      linkChecks: await repo.linkChecks(),
    });
    expect(m.stats).toEqual({
      projects: 9,
      published: 5,
      drafts: 4,
      sitePublishedAt: new Date(T0).toISOString(),
    });
    expect(m.summary).toBe("Four drafts need your input before they can go live.");
    const kinds = m.needs.map((n) => n.kind);
    expect(kinds.indexOf("draft")).toBeLessThan(kinds.indexOf("rice"));
    expect(kinds.indexOf("rice")).toBeLessThan(kinds.indexOf("fact"));
    expect(kinds.indexOf("fact")).toBeLessThan(kinds.indexOf("link"));
    expect(kinds.at(-1)).toBe("schedule");
    const rice = m.needs.find((n) => n.kind === "rice");
    expect(rice && "text" in rice ? rice.text : "").toMatch(
      /scores 11\.3 from its inputs but shows 5\.7\. Effort may be 3 mo, not 1\.5\./,
    );
    expect(m.needs.filter((n) => n.kind === "link").map((n) => n.href)).toEqual([
      `/studio/projects/${live.id}/visuals`,
      "/studio/projects",
    ]);
    expect(m.recent).toHaveLength(5);
    expect(m.recent[0]?.title).toBe(live.draft.overview.title);
    expect(m.empty).toBe(false);
  });

  it("has other summaries for no drafts and nothing at all", () => {
    const base = {
      posts: [],
      profile: {
        draft: { unconfirmed: [], facts: {} },
        published: null,
        publishedAt: null,
        version: 1,
        updatedAt: "2026-01-01",
      },
      layout: { draft: {}, published: null, publishedAt: null, version: 1, updatedAt: "2026-01-02" },
      linkChecks: [],
    } as never;
    const empty = buildDashboard({ ...(base as object), projects: [] } as never);
    expect(empty.empty).toBe(true);
    expect(empty.summary).toBe("Nothing needs your input right now.");
    const one = buildDashboard({
      ...(base as object),
      projects: [],
      linkChecks: [{ url: "https://x.test", status: "error", detail: null, checkedAt: "" }],
    } as never);
    expect(one.summary).toBe("One thing needs a look.");
    expect(fieldHref("p", "Cover image")).toBe("/studio/projects/p/visuals?field=cover");
    expect(fieldHref("p", "Story")).toBe("/studio/projects/p/story");
    expect(fieldHref("p", undefined)).toBe("/studio/projects/p/overview");
  });
});

describe("usage", () => {
  it("finds every reference to a file", async () => {
    const { repo } = testRepo();
    const p = newProject();
    p.visuals.hero = { type: "prototype", url: "", frame: "phone", start: "click", poster: { mediaId: "m" } };
    p.visuals.gallery = [{ mediaId: "m" }];
    p.story = [
      {
        id: "c",
        title: "",
        hidden: false,
        blocks: [
          { id: "b", type: "image", media: { mediaId: "m" } },
          { id: "g", type: "gallery", media: [{ mediaId: "m" }] },
        ],
      },
    ];
    p.seo.ogImage = { mediaId: "m" };
    expect(projectMediaRefs(p).map((r) => r.tab)).toEqual([
      "visuals",
      "visuals",
      "story",
      "story",
      "settings",
    ]);
    const post = newPost();
    post.cover = { mediaId: "m" };
    post.blocks = [{ id: "i", type: "image", mediaId: "m" }];
    expect(postMediaRefs(post)).toHaveLength(2);
    const profile = (await repo.profile.get()).draft;
    profile.about.photo = { mediaId: "m" };
    const uses = mediaUses("m", {
      profile,
      projects: [{ id: "p1", draft: p }],
      posts: [{ id: "x", draft: post }],
    });
    expect(uses.map((u) => u.href)).toEqual([
      "/studio/website/profile",
      "/studio/projects/p1/visuals",
      "/studio/writing/x",
    ]);
    expect(uses.map((u) => u.title)).toEqual(["Profile & facts", "Untitled project", "Untitled post"]);
  });
});

describe("projects", () => {
  it("creates a new project on the first visible shelf with a free accent and the next untitled slug", async () => {
    const { repo } = testRepo();
    const row = await createProject(repo);
    expect(row.slug).toBe("untitled-1");
    const layout = (await repo.layout.get()).draft;
    expect(shelfOf(layout, row.id)?.id).toBe("strategy");
    expect(shelves(layout).map((s) => s.id)).toEqual(["shipped", "strategy"]);
    const strategyAccents = await Promise.all(
      must(shelfOf(layout, row.id))
        .items.slice(0, -1)
        .map(async (i) => (await repo.projects.get(i.id))?.draft.visuals.accent),
    );
    expect(strategyAccents).not.toContain(row.draft.visuals.accent);
    const shipped = await createProject(repo, "shipped");
    expect(shipped.slug).toBe("untitled-2");
    expect(shipped.draft.overview.kind).toBe("shipped");
    expect(projectStatus(row)).toBe("draft");
  });

  it("reads status from publish times", () => {
    const base = { published: {}, publishedAt: "2026-01-02", updatedAt: "2026-01-02" } as never;
    expect(projectStatus(base)).toBe("published");
    expect(projectStatus({ ...(base as object), updatedAt: "2026-01-03" } as never)).toBe("edits");
  });
});

describe("publishPost", () => {
  it("resolves images and fills the excerpt and reading time", () => {
    const post = newPost();
    post.title = "T";
    post.cover = { mediaId: "c", alt: "Override" };
    post.blocks = [
      { id: "a", type: "text", body: "<p>Hello <strong>world</strong></p>" },
      { id: "i", type: "image", mediaId: "c", caption: "Cap" },
      { id: "j", type: "image", mediaId: "c", decorative: true },
      { id: "k", type: "image", mediaId: "missing" },
      { id: "l", type: "image", mediaId: "c", alt: "Own" },
    ];
    const img = { src: "/x", srcset: "/x 1w", width: 1, height: 1, alt: "Row", dominant: "#000" };
    const out = publishPost(post, (r) => (r.mediaId === "c" ? img : undefined), "2026-10-15T00:00:00Z");
    expect(out.cover?.alt).toBe("Override");
    expect(out.excerpt).toBe("Hello world");
    expect(out.readingMinutes).toBe(1);
    expect(out.blocks.map((b) => (b.type === "image" ? [b.media.alt, b.media.caption] : b.type))).toEqual([
      "text",
      ["Row", "Cap"],
      ["", undefined],
      ["Own", undefined],
    ]);
    post.excerpt = "Mine";
    post.cover = { mediaId: "c" };
    const again = publishPost(post, () => img, "x");
    expect(again.excerpt).toBe("Mine");
    expect(again.cover?.alt).toBe("Row");
  });
});

describe("client", () => {
  it("uses the in-memory repo in development, once", async () => {
    const a = await loadRepo();
    expect(await loadRepo()).toBe(a);
    expect(new RepoUnavailable().message).toMatch(/isn’t connected/);
  });
});
