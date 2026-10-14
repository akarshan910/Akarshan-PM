import { describe, expect, it } from "vitest";

import { newPost } from "../defaults";
import {
  highlightCss,
  highlights,
  previewLinks,
  previewSite,
  studioNotes,
  type PreviewSource,
} from "./preview";
import { must, testRepo } from "./test-helpers";

async function source(
  edit?: (repo: ReturnType<typeof testRepo>["repo"]) => Promise<void>,
): Promise<PreviewSource> {
  const { repo } = testRepo();
  await edit?.(repo);
  const [profile, layout, projects, posts] = await Promise.all([
    repo.profile.get(),
    repo.layout.get(),
    repo.projects.list(),
    repo.posts.list(),
  ]);
  return { profile, layout, projects, posts, resolve: () => undefined, now: "2026-10-15T09:00:00.000Z" };
}

describe("draft preview", () => {
  it("builds the draft and live content for a project, a post and the homepage", async () => {
    const src = await source(async (repo) => {
      const row = must(await repo.projects.get("puja-engagement-platform"));
      const draft = structuredClone(row.draft);
      draft.overview.title = "Puja, redone";
      must(draft.story[0]).title = "A new first chapter";
      await repo.projects.save(row.id, draft, row.version);
      await repo.posts.create(newPost(), "a-post");
    });
    const draft = must(previewSite(src, "project", "puja-engagement-platform", "draft"));
    expect(draft.slug).toBe("puja-engagement-platform");
    expect(
      draft.content.projects.find((p) => p.id === "puja-engagement-platform")?.project.overview.title,
    ).toBe("Puja, redone");
    const live = must(previewSite(src, "project", "puja-engagement-platform", "live"));
    expect(
      live.content.projects.find((p) => p.id === "puja-engagement-platform")?.project.overview.title,
    ).toBe("Puja engagement platform");
    expect(previewSite(src, "project", "3d-body-scan-for-glp-1-users", "live")).toBeNull();
    expect(
      must(previewSite(src, "project", "3d-body-scan-for-glp-1-users", "draft")).content.projects,
    ).toHaveLength(6);
    expect(previewSite(src, "project", "nope", "draft")).toBeNull();

    const post = must(src.posts[0]);
    expect(must(previewSite(src, "post", post.id, "draft")).content.posts.map((p) => p.slug)).toEqual([
      "a-post",
    ]);
    expect(previewSite(src, "post", post.id, "live")).toBeNull();
    expect(previewSite(src, "post", "nope", "draft")).toBeNull();

    expect(must(previewSite(src, "site", "home", "draft")).content.layout).toBe(src.layout.draft);
    expect(must(previewSite(src, "site", "home", "live")).content.layout).toEqual(src.layout.published);
    expect(
      previewSite({ ...src, layout: { ...src.layout, published: null } }, "site", "home", "live"),
    ).toBeNull();
    expect(
      previewSite({ ...src, profile: { ...src.profile, published: null } }, "site", "home", "live")?.content
        .profile.name,
    ).toBe(src.profile.draft.name);
  });

  it("highlights what changed and what's only in the draft", async () => {
    const src = await source(async (repo) => {
      const row = must(await repo.projects.get("puja-engagement-platform"));
      const draft = structuredClone(row.draft);
      draft.overview.summary = "New summary.";
      const ch = must(draft.story[1]);
      ch.title = `${ch.title} again`;
      draft.story.push({
        id: "c-new",
        title: "Brand new",
        hidden: false,
        blocks: [{ id: "b1", type: "text", style: "body", body: "<p>Hi</p>" }],
      });
      await repo.projects.save(row.id, draft, row.version);
      const l = await repo.layout.get();
      const layout = structuredClone(l.draft);
      must(layout.sections.find((s) => s.id === "skills")).visible = false;
      await repo.layout.save(layout, l.version);
      const p = await repo.profile.get();
      await repo.profile.save({ ...p.draft, positioning: "Changed line" }, p.version);
    });
    const h = highlights(src, "project", "puja-engagement-platform");
    expect(h[0]).toEqual({ selector: "#summary", label: "Changed" });
    expect(h.some((x) => x.label === "Changed" && x.selector.endsWith("-again"))).toBe(true);
    expect(h.at(-1)).toEqual({ selector: "#brand-new", label: "Draft only" });
    expect(highlights(src, "project", "3d-body-scan-for-glp-1-users")).toEqual([
      { selector: "main", label: "Draft only" },
    ]);
    expect(highlights(src, "project", "nope")).toEqual([]);
    expect(highlights(src, "site", "home")).toEqual([
      { selector: "#skills", label: "Changed" },
      { selector: "#hero", label: "Changed" },
    ]);
    expect(highlights({ ...src, layout: { ...src.layout, published: null } }, "site", "home")).toEqual([
      { selector: "main", label: "Draft only" },
    ]);
    const css = highlightCss([...h, { selector: "x{}", label: "Changed" }]);
    expect(css).toContain('#summary::before{content:"Changed"');
    expect(css).not.toContain("x{}");
  });

  it("highlights a post that differs from its live version", async () => {
    const { repo } = testRepo();
    const created = await repo.posts.create(
      { ...newPost(), title: "Hello", blocks: [{ id: "b", type: "text", body: "<p>Words</p>" }] },
      "hello",
    );
    const id = created.id;
    await repo.publish({ action: "publish", kind: "post", id });
    const base = await source();
    const rows = await repo.posts.list();
    const src = { ...base, posts: rows };
    expect(highlights(src, "post", id)).toEqual([]);
    const row = must(rows[0]);
    const edited = { ...src, posts: [{ ...row, draft: { ...row.draft, title: "Hello again" } }] };
    expect(highlights(edited, "post", id)).toEqual([{ selector: "main article", label: "Changed" }]);
    expect(highlights({ ...src, posts: [{ ...row, published: null }] }, "post", id)).toEqual([
      { selector: "main", label: "Draft only" },
    ]);
    expect(highlights(src, "post", "nope")).toEqual([]);
    expect(must(previewSite(src, "post", id, "live")).slug).toBe("hello");
  });

  it("notes what the live page skips, and links back", async () => {
    const src = await source(async (repo) => {
      const row = must(await repo.projects.get("arcana-workspace"));
      const draft = structuredClone(row.draft);
      draft.story.push({ id: "e1", title: "My role and decisions", hidden: false, blocks: [] });
      draft.story.push({ id: "e2", title: "Learnings and next steps", hidden: false, blocks: [] });
      draft.story.push({ id: "h1", title: "", hidden: true, blocks: [] });
      await repo.projects.save(row.id, draft, row.version);
    });
    expect(studioNotes(src, "project", "arcana-workspace")).toEqual([
      "Studio only: “My role and decisions” and “Learnings and next steps” are empty, so the live page skips them.",
      "Studio only: “Untitled chapter” is hidden, so the live page skips it.",
    ]);
    expect(studioNotes(src, "site", "home")).toEqual([
      "Studio only: Shipped is hidden, so the live homepage skips it.",
    ]);
    expect(studioNotes(src, "post", "x")).toEqual([]);
    expect(studioNotes(src, "project", "nope")).toEqual([]);
    expect(previewLinks("project", "p")).toEqual({
      back: "/studio/projects/p/overview",
      publish: "/studio/projects/p/overview?publish=1",
    });
    expect(previewLinks("post", "x").back).toBe("/studio/writing/x");
    expect(previewLinks("site", "home").back).toBe("/studio/website");
  });
});
