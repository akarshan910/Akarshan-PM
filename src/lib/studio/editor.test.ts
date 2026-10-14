import { describe, expect, it } from "vitest";

import { newProject } from "../defaults";
import { changeLines, changedTabs, overviewChanges, placement, publishButton, tabLabel } from "./editor";
import { must, testRepo } from "./test-helpers";

async function live() {
  const { repo } = testRepo();
  const rows = await repo.projects.list();
  const row = must(rows.find((r) => r.published));
  const layout = (await repo.layout.get()).draft;
  const media = new Map((await repo.media.list()).map((m) => [m.id, m]));
  const resolve = (ref: { mediaId: string }) => {
    const m = media.get(ref.mediaId);
    return m ? repo.img(m) : undefined;
  };
  return { repo, rows, row, layout, resolve };
}

describe("editor model", () => {
  it("sees no changes on a freshly published project", async () => {
    const { row, resolve } = await live();
    expect([...changedTabs(row.draft, row.published, resolve)]).toEqual([]);
    expect(changeLines(row.draft, row, resolve)).toEqual([]);
    expect(changedTabs(row.draft, null).size).toBe(0);
  });

  it("names the changed fields and tabs", async () => {
    const { row, resolve } = await live();
    const d = structuredClone(row.draft);
    d.overview.title = "New";
    d.overview.role = "Lead";
    d.visuals.accent = d.visuals.accent === "teal" ? "amber" : "teal";
    d.story = d.story.slice(1);
    d.outcomes = [];
    d.seo.title = "SEO";
    expect(overviewChanges(d, row.published)).toEqual(["title", "my role"]);
    expect(overviewChanges(d, null)).toEqual([]);
    expect([...changedTabs(d, row.published, resolve)]).toEqual([
      "overview",
      "visuals",
      "story",
      "outcomes",
      "settings",
    ]);
    expect(changeLines(d, { ...row, slug: "moved" }, resolve)).toEqual([
      "Overview · title, my role",
      "Visuals · hero, cover and gallery",
      "Story · chapters and blocks",
      "Outcomes · results and labels",
      "URL & SEO · address, search text and visibility",
    ]);
    expect(changeLines(newProject(), { published: null, slug: "x", publishedSlug: null })).toEqual([
      "Everything: this is the first publish.",
    ]);
    // Without a resolver, images compare by id.
    expect(changedTabs(row.draft, row.published).has("visuals")).toBe(true);
  });

  it("labels the publish button", () => {
    const at = "2026-10-13T14:02:00.000Z";
    expect(publishButton({ published: null, publishedAt: null, updatedAt: at }, false).label).toBe("Publish");
    expect(publishButton({ published: {} as never, publishedAt: at, updatedAt: at }, false)).toEqual({
      label: "Published",
      disabled: true,
    });
    expect(
      publishButton({ published: {} as never, publishedAt: at, updatedAt: "2026-10-14" }, false).label,
    ).toBe("Publish changes");
    expect(publishButton({ published: null, publishedAt: null, updatedAt: at }, true)).toEqual({
      label: "Reconnect to publish",
      disabled: true,
    });
    expect(tabLabel("settings")).toBe("URL & SEO");
  });

  it("places a project on its shelf with its volume number", async () => {
    const { rows, row, layout } = await live();
    const p = placement(layout, rows, row.id);
    expect(p).toMatchObject({
      shelfId: "strategy",
      shelfName: "Strategy & prototypes",
      position: 1,
      volume: "01",
    });
    const draft = must(rows.find((r) => !r.published));
    expect(placement(layout, rows, draft.id)).toMatchObject({ shelfId: "shipped", volume: undefined });
    expect(placement(layout, rows, "nowhere")).toMatchObject({
      shelfId: undefined,
      shelfName: "Not on a shelf",
      position: 0,
    });
  });
});
