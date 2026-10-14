import { describe, expect, it } from "vitest";

import { changedTabs, restoreShelfOrder, shelfOrderChanged, tabNames } from "./diff";
import { allPending, dropPending, getPending, putPending } from "./offline";
import { copySlug, counts, insertAfter, listGroups, moveOnShelf, removeFromShelves } from "./projects-list";
import { must, testRepo } from "./test-helpers";

async function seed() {
  const { repo } = testRepo();
  return { repo, rows: await repo.projects.list(), layout: (await repo.layout.get()).draft };
}

describe("listGroups", () => {
  it("groups by shelf in homepage order, with status, readiness and the lead", async () => {
    const { rows, layout } = await seed();
    const groups = listGroups(layout, rows, "all", "");
    expect(groups.map((g) => [g.name, g.total])).toEqual([
      ["Shipped", 4],
      ["Strategy & prototypes", 5],
    ]);
    const strategy = must(groups[1]);
    expect(strategy.rows.map((r) => r.position)).toEqual([1, 2, 3, 4, 5]);
    expect(strategy.rows.filter((r) => r.lead)).toHaveLength(1);
    expect(strategy.rows[0]?.lead).toBe(true);
    expect(strategy.rows[0]?.sub).toMatch(/ · \/work\//);
    const shipped = must(groups[0]);
    expect(shipped.rows.every((r) => r.status === "draft" && !r.lead)).toBe(true);
    expect(shipped.rows[0]?.sub).toBe("SugarFit · not on the live site");
    expect(shipped.rows[0]?.missing).toBe(1);
  });

  it("filters and searches by title or company", async () => {
    const { rows, layout } = await seed();
    expect(listGroups(layout, rows, "published", "").map((g) => g.rows.length)).toEqual([0, 5]);
    expect(listGroups(layout, rows, "drafts", "").map((g) => g.rows.length)).toEqual([4, 0]);
    const zynga = listGroups(layout, rows, "all", "ZYNGA").flatMap((g) => g.rows);
    expect(zynga.length).toBeGreaterThan(0);
    expect(zynga.every((r) => /zynga/i.test(r.row.draft.overview.company + r.title))).toBe(true);
    expect(listGroups(layout, rows, "all", "nothing-like-this").every((g) => g.rows.length === 0)).toBe(true);
    expect(counts(rows)).toEqual({ all: 9, published: 5, drafts: 4 });
  });
});

describe("layout moves", () => {
  it("moves, inserts and removes on shelves", async () => {
    const { layout } = await seed();
    const shelf = must(layout.sections.find((s) => s.id === "strategy"));
    const [a, b] = shelf.items.map((i) => i.id);
    const moved = moveOnShelf(layout, "strategy", must(b), 0);
    expect(
      must(moved.sections.find((s) => s.id === "strategy"))
        .items.slice(0, 2)
        .map((i) => i.id),
    ).toEqual([b, a]);
    expect(moveOnShelf(layout, "strategy", "nope", 0)).toEqual(layout);
    expect(moveOnShelf(layout, "strategy", must(a), 99)).toEqual(layout);
    const ins = insertAfter(layout, "strategy", must(a), "copy");
    expect(must(ins.sections.find((s) => s.id === "strategy")).items[1]?.id).toBe("copy");
    const end = insertAfter(layout, "strategy", null, "copy");
    expect(must(end.sections.find((s) => s.id === "strategy")).items.at(-1)?.id).toBe("copy");
    const gone = removeFromShelves(ins, "copy");
    expect(gone.sections.flatMap((s) => s.items.map((i) => i.id))).not.toContain("copy");
    expect(copySlug("puja", [])).toBe("puja-copy");
    expect(copySlug("puja", ["puja-copy", "puja-copy-2"])).toBe("puja-copy-3");
  });
});

describe("diff", () => {
  it("names changed tabs", async () => {
    const { rows } = await seed();
    const a = must(rows[0]).draft;
    const b = structuredClone(a);
    expect(changedTabs(a, b)).toEqual([]);
    b.overview.title = "x";
    b.visuals.gallery = [{ mediaId: "m" }];
    b.story = [];
    b.headlineOutcomeId = "z";
    b.seo.title = "t";
    expect(changedTabs(a, b)).toEqual(["overview", "visuals", "story", "outcomes", "settings"]);
    expect(tabNames(["story", "settings"])).toBe("Story, URL & SEO");
    expect(tabNames([])).toBe("nothing");
  });

  it("sees shelf order changes, ignores new projects, and restores the published order", async () => {
    const { layout } = await seed();
    const published = structuredClone(layout);
    expect(shelfOrderChanged(layout, null)).toBe(false);
    expect(shelfOrderChanged(layout, published)).toBe(false);
    const withNew = insertAfter(layout, "strategy", null, "new-one");
    expect(shelfOrderChanged(withNew, published)).toBe(false);
    const strategy = must(layout.sections.find((s) => s.id === "strategy"));
    const moved = moveOnShelf(withNew, "strategy", must(strategy.items[3]).id, 0);
    expect(shelfOrderChanged(moved, published)).toBe(true);
    const back = restoreShelfOrder(moved, published);
    expect(shelfOrderChanged(back, published)).toBe(false);
    expect(must(back.sections.find((s) => s.id === "strategy")).items.at(-1)?.id).toBe("new-one");
  });
});

describe("offline queue", () => {
  it("keeps the newest entry per document", async () => {
    await putPending({ key: "project:a", draft: 1, version: 1, at: 1 });
    await putPending({ key: "project:a", draft: 2, version: 1, at: 2 });
    await putPending({ key: "layout", draft: 3, version: 4, at: 3 });
    expect((await getPending("project:a"))?.draft).toBe(2);
    expect((await allPending()).map((p) => p.key).sort()).toEqual(["layout", "project:a"]);
    await dropPending("project:a");
    expect(await getPending("project:a")).toBeUndefined();
    await dropPending("layout");
  });
});
