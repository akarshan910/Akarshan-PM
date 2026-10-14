import { describe, expect, it } from "vitest";

import { newPost, newProject } from "../defaults";
import { MEMORY_CODE, MEMORY_OWNER } from "./memory";
import { must, T0, testRepo } from "./test-helpers";

describe("MemoryRepo · seed", () => {
  it("holds the five live projects as published and the SugarFit drafts as drafts", async () => {
    const { repo } = testRepo();
    const rows = await repo.projects.list();
    expect(rows).toHaveLength(9);
    expect(rows.filter((r) => r.published)).toHaveLength(5);
    expect(rows.filter((r) => !r.published).map((r) => r.draft.overview.company)).toEqual(
      Array(4).fill("SugarFit"),
    );
    const layout = await repo.layout.get();
    expect(layout.publishedAt).toBe(new Date(T0).toISOString());
    expect((await repo.profile.get()).draft.unconfirmed.length).toBeGreaterThan(0);
  });

  it("serves the V0 covers as published media with their alt text", async () => {
    const { repo } = testRepo();
    const media = await repo.media.list();
    expect(media).toHaveLength(5);
    const first = media[0];
    expect(first?.alt).toBeTruthy();
    expect(await repo.media.url(must(first))).toMatch(/^\/media\/v0\/.+\.webp$/);
    expect((await repo.media.storageUsed()).quota).toBe(1024 ** 3);
  });
});

describe("MemoryRepo · auth", () => {
  it("signs the owner in with the memory code, and refuses anyone else after the code", async () => {
    const { repo, clock } = testRepo({ signedIn: false });
    expect(await repo.auth.session()).toBeNull();
    expect(await repo.auth.sendCode(MEMORY_OWNER)).toBe("sent");
    expect(await repo.auth.checkCode(MEMORY_OWNER, "00000000", clock.now)).toBe("wrong");
    expect(await repo.auth.checkCode("someone@example.test", MEMORY_CODE, clock.now)).toBe("not-owner");
    const seen: (string | null)[] = [];
    const off = repo.auth.onChange((s) => seen.push(s?.email ?? null));
    expect(await repo.auth.checkCode(MEMORY_OWNER, MEMORY_CODE, clock.now)).toBe("signed-in");
    expect((await repo.auth.session())?.email).toBe(MEMORY_OWNER);
    await repo.auth.signOut("local");
    off();
    expect(seen).toEqual([MEMORY_OWNER, null]);
  });

  it("calls a code expired more than ten minutes after it was sent", async () => {
    const { repo, clock } = testRepo({ signedIn: false });
    const sentAt = clock.now;
    clock.now += 11 * 60_000;
    expect(await repo.auth.checkCode(MEMORY_OWNER, MEMORY_CODE, sentAt)).toBe("expired");
    expect(await repo.auth.checkCode(MEMORY_OWNER, "999999", sentAt)).toBe("expired");
  });

  it("reports offline", async () => {
    const { repo } = testRepo();
    repo.offline = true;
    expect(await repo.auth.sendCode(MEMORY_OWNER)).toBe("offline");
    expect(await repo.auth.checkCode(MEMORY_OWNER, MEMORY_CODE, 0)).toBe("offline");
  });
});

describe("MemoryRepo · autosave", () => {
  it("bumps the version on save and reports a conflict for a stale version", async () => {
    const { repo, clock } = testRepo();
    const row = must((await repo.projects.list())[0]);
    clock.now += 60_000;
    const saved = await repo.projects.save(
      row.id,
      { ...row.draft, overview: { ...row.draft.overview, title: "New" } },
      row.version,
    );
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.row.version).toBe(row.version + 1);
    expect(saved.row.updatedAt > row.updatedAt).toBe(true);
    const stale = await repo.projects.save(row.id, row.draft, row.version);
    expect(stale).toMatchObject({ ok: false, reason: "conflict" });
    if (!stale.ok && stale.reason === "conflict") expect(stale.latest.draft.overview.title).toBe("New");
  });

  it("fails offline, once on demand, and for a missing row", async () => {
    const { repo } = testRepo();
    const p = await repo.profile.get();
    repo.failNextSave = true;
    expect(await repo.profile.save(p.draft, p.version)).toMatchObject({ ok: false, reason: "error" });
    expect(await repo.profile.save(p.draft, p.version)).toMatchObject({ ok: true });
    repo.offline = true;
    const l = await repo.layout.get();
    expect(await repo.layout.save(l.draft, l.version)).toMatchObject({ ok: false, reason: "offline" });
    repo.offline = false;
    expect(await repo.projects.save("nope", newProject(), 1)).toMatchObject({ ok: false, reason: "error" });
  });

  it("validates with the schemas", async () => {
    const { repo } = testRepo();
    const l = await repo.layout.get();
    const bad = { ...l.draft, sections: l.draft.sections.slice(1) };
    await expect(repo.layout.save(bad, l.version)).rejects.toThrow();
  });
});

describe("MemoryRepo · projects", () => {
  it("creates drafts, refuses taken addresses and finds who uses one", async () => {
    const { repo } = testRepo();
    const row = await repo.projects.create(newProject(), "untitled-1");
    expect(row.published).toBeNull();
    expect(await repo.projects.get(row.id)).not.toBeNull();
    const live = must((await repo.projects.list()).find((r) => r.published));
    expect(await repo.projects.setSlug(row.id, live.slug, row.version)).toMatchObject({
      ok: false,
      reason: "taken",
    });
    expect(await repo.projects.slugOwner(live.slug)).toMatchObject({ id: live.id });
    expect(await repo.projects.slugOwner(live.slug, live.id)).toBeNull();
    const moved = await repo.projects.setSlug(row.id, "fresh-address", row.version);
    expect(moved).toMatchObject({ ok: true });
    expect(await repo.projects.setSlug(row.id, "other", row.version)).toMatchObject({ reason: "conflict" });
    expect(await repo.projects.setSlug("nope", "x", 1)).toMatchObject({ reason: "error" });
    repo.offline = true;
    expect(await repo.projects.setSlug(row.id, "x", 1)).toMatchObject({ reason: "offline" });
  });

  it("publishes a draft only when its checks pass, then redirects a renamed address", async () => {
    const { repo } = testRepo();
    const draft = newProject();
    const row = await repo.projects.create(draft, "untitled-1");
    const blocked = await repo.publish({ action: "publish", kind: "project", id: row.id });
    expect(blocked).toMatchObject({ ok: false, reason: "blocked" });
    if (!blocked.ok && blocked.reason === "blocked")
      expect(blocked.issues.map((i) => i.message)).toContain("Title is required.");

    draft.overview = { ...draft.overview, title: "A title", company: "Co", summary: "Short." };
    const saved = await repo.projects.save(row.id, draft, row.version);
    expect(await repo.publish({ action: "publish", kind: "project", id: row.id })).toMatchObject({
      ok: true,
    });
    let now = must(await repo.projects.get(row.id));
    expect(now.publishedSlug).toBe("untitled-1");
    expect(now.draft.settings.redirectOldSlug).toBe(true);

    if (!saved.ok) throw new Error("save failed");
    await repo.projects.setSlug(row.id, "a-title", now.version);
    await repo.publish({ action: "publish", kind: "project", id: row.id });
    now = must(await repo.projects.get(row.id));
    expect(now.publishedSlug).toBe("a-title");
    // The old address is now a redirect, so nothing else may take it.
    expect(await repo.projects.slugOwner("untitled-1")).toMatchObject({ id: row.id });
  });

  it("unpublishes, soft-deletes, restores and changes visibility", async () => {
    const { repo } = testRepo();
    const live = must((await repo.projects.list()).find((r) => r.published));
    const req = (action: "unpublish" | "delete" | "restore" | "settings") =>
      repo.publish({ action, kind: "project", id: live.id, visibility: "unlisted", indexAllowed: false });
    await req("unpublish");
    expect((await repo.projects.get(live.id))?.published).toBeNull();
    await req("delete");
    expect(await repo.projects.get(live.id)).toBeNull();
    expect((await repo.projects.list()).some((r) => r.id === live.id)).toBe(false);
    await req("restore");
    await req("settings");
    expect(await repo.projects.get(live.id)).toMatchObject({ visibility: "unlisted", indexAllowed: false });
    expect(await repo.publish({ action: "publish", kind: "project", id: "nope" })).toMatchObject({
      reason: "error",
    });
    repo.purgeProject(live.id);
    expect(await repo.projects.get(live.id)).toBeNull();
  });
});

describe("MemoryRepo · site publish", () => {
  it("asks to confirm unconfirmed facts first", async () => {
    const { repo } = testRepo();
    expect(await repo.publish({ action: "publish", kind: "site" })).toMatchObject({
      ok: false,
      reason: "needs-confirm",
    });
    expect(await repo.publish({ action: "publish", kind: "site", confirmUnconfirmed: true })).toMatchObject({
      ok: true,
    });
    repo.offline = true;
    expect(await repo.publish({ action: "publish", kind: "site" })).toMatchObject({ reason: "offline" });
  });
});

describe("MemoryRepo · posts", () => {
  it("creates, saves, schedules, publishes and redirects posts", async () => {
    const { repo } = testRepo();
    const draft = newPost();
    const row = await repo.posts.create(draft, "untitled-1");
    expect(await repo.publish({ action: "publish", kind: "post", id: row.id })).toMatchObject({
      reason: "blocked",
    });
    draft.title = "Hello";
    draft.blocks = [{ id: "b1", type: "text", body: "<p>Some words here.</p>" }];
    const saved = await repo.posts.save(row.id, draft, row.version);
    expect(saved.ok).toBe(true);
    const at = "2026-10-19T09:00:00.000Z";
    expect(
      await repo.publish({ action: "publish", kind: "post", id: row.id, scheduleFor: at }),
    ).toMatchObject({ ok: true, deployed: false });
    expect((await repo.posts.get(row.id))?.scheduledFor).toBe(at);
    await repo.publish({ action: "publish", kind: "post", id: row.id });
    let now = must(await repo.posts.get(row.id));
    expect(now.published?.excerpt).toBe("Some words here.");
    expect(now.scheduledFor).toBeNull();
    await repo.posts.setSlug(row.id, "hello", now.version);
    await repo.publish({ action: "publish", kind: "post", id: row.id });
    expect(await repo.posts.slugOwner("untitled-1")).toMatchObject({ id: row.id });
    const other = await repo.posts.create(newPost(), "other");
    expect(await repo.posts.setSlug(other.id, "untitled-1", other.version)).toMatchObject({
      reason: "taken",
    });
    now = must(await repo.posts.get(row.id));
    expect(await repo.posts.setSlug(row.id, "x", now.version - 1)).toMatchObject({ reason: "conflict" });
    expect(await repo.posts.setSlug("nope", "x", 1)).toMatchObject({ reason: "error" });

    await repo.publish({ action: "unpublish", kind: "post", id: row.id });
    expect((await repo.posts.get(row.id))?.published).toBeNull();
    await repo.publish({ action: "delete", kind: "post", id: row.id });
    expect(await repo.posts.list()).toHaveLength(1);
    await repo.publish({ action: "restore", kind: "post", id: row.id });
    expect(await repo.posts.list()).toHaveLength(2);
    expect(await repo.publish({ action: "settings", kind: "post", id: row.id })).toMatchObject({
      reason: "error",
    });
    expect(await repo.publish({ action: "publish", kind: "post", id: "nope" })).toMatchObject({
      reason: "error",
    });
    repo.offline = true;
    expect(await repo.posts.setSlug(row.id, "x", 1)).toMatchObject({ reason: "offline" });
  });
});

describe("MemoryRepo · media, previews, topics, links", () => {
  it("uploads, edits, replaces and deletes media, refusing a file in use", async () => {
    const { repo } = testRepo();
    const file = new Blob(["x"], { type: "image/png" });
    const row = await repo.media.upload({
      file,
      filename: "a.png",
      kind: "image",
      mime: "image/png",
      width: 10,
      height: 5,
    });
    expect(row).toMatchObject({ bytes: 1, alt: null, published: false });
    expect((await repo.media.update(row.id, { alt: "Alt" })).alt).toBe("Alt");
    const replaced = await repo.media.replace(row.id, {
      file,
      filename: "b.png",
      kind: "image",
      mime: "image/png",
    });
    expect(replaced).toMatchObject({ rev: 2, key: `${row.id}/r2`, filename: "b.png", width: 10 });
    expect(await repo.media.remove(row.id)).toEqual({ ok: true });
    const cover = must((await repo.media.list()).find((m) => m.id.startsWith("cover-")));
    const blocked = await repo.media.remove(cover.id);
    expect(blocked.ok).toBe(false);
    expect((await repo.media.uses(cover.id))[0]?.href).toMatch(/\/visuals$/);
    await expect(repo.media.update("nope", {})).rejects.toThrow();
    await expect(
      repo.media.replace("nope", { file, filename: "", kind: "image", mime: "" }),
    ).rejects.toThrow();
    repo.offline = true;
    await expect(repo.media.upload({ file, filename: "c", kind: "image", mime: "" })).rejects.toThrow();
  });

  it("creates preview links that list by hash only, and revokes them", async () => {
    const { repo, clock } = testRepo();
    const id = must((await repo.projects.list())[0]).id;
    const { url, link } = await repo.previews.create("project", id);
    expect(url).toMatch(/\/preview\/[A-Za-z0-9_-]{43}$/);
    expect(link.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(url).not.toContain(link.tokenHash);
    expect(await repo.previews.list("project", id)).toHaveLength(1);
    await repo.previews.revoke(link.tokenHash);
    expect(await repo.previews.list("project", id)).toHaveLength(0);
    await repo.previews.create("project", id);
    clock.now += 8 * 86_400_000;
    expect(await repo.previews.list("project", id)).toHaveLength(0);
    repo.offline = true;
    await expect(repo.previews.create("site")).rejects.toThrow();
  });

  it("counts topics case-insensitively", async () => {
    const { repo } = testRepo();
    const topics = await repo.topics("project");
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.every((t) => t.uses >= 1)).toBe(true);
    const post = newPost();
    post.topics = ["AI", "ai"];
    await repo.posts.create(post, "p");
    expect(await repo.topics("post")).toEqual([{ topic: "AI", uses: 2 }]);
  });

  it("checks links like pm-check-link", async () => {
    const { repo } = testRepo();
    expect(await repo.checkLink("http://x.test", "prd")).toEqual({ status: "error" });
    expect(await repo.checkLink("https://app-git-main-me.vercel.app", "prototype")).toEqual({
      status: "login",
    });
    expect(await repo.checkLink("https://www.figma.com/proto/abc", "prototype")).toEqual({
      status: "ok",
      detail: "figma",
    });
    repo.setLinkCheck("https://gone.test", "gone");
    expect((await repo.linkChecks()).find((c) => c.url === "https://gone.test")?.status).toBe("gone");
  });
});
