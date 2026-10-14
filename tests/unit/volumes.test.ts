import { describe, expect, it } from "vitest";

import { ACCENT_COLOURS, ON_ACCENT } from "~/lib/accents";
import { ACCENTS } from "~/lib/schemas";
import { planShelf } from "~/lib/shelf";
import { formatVolume, numberVolumes } from "~/lib/volumes";

const shelf = (ids: string[], visible = true) => ({
  kind: "shelf" as const,
  visible,
  items: ids.map((id) => ({ id, visible: true })),
});

describe("numberVolumes (C9)", () => {
  const live = { published: true, listed: true };

  it("numbers published, listed projects in shelf order, then project order", () => {
    const sections = [{ kind: "hero" as const, visible: true, items: [] }, shelf(["a", "b"]), shelf(["c"])];
    const out = numberVolumes(sections, new Map(Object.entries({ a: live, b: live, c: live })));
    expect([...out.entries()]).toEqual([
      ["a", "01"],
      ["b", "02"],
      ["c", "03"],
    ]);
  });

  it("skips drafts, unlisted projects, unknown ids and hidden shelves", () => {
    const projects = new Map([
      ["draft", { published: false, listed: true }],
      ["unlisted", { published: true, listed: false }],
      ["x", live],
      ["y", live],
      ["z", live],
    ]);
    const out = numberVolumes(
      [shelf(["draft", "unlisted", "missing", "x"]), shelf(["z"], false), shelf(["y", "x"])],
      projects,
    );
    expect(Object.fromEntries(out)).toEqual({ x: "01", y: "02" });
  });

  it("keeps the number of a project hidden on its shelf, which is still on /work", () => {
    const s = {
      kind: "shelf" as const,
      visible: true,
      items: [
        { id: "a", visible: false },
        { id: "b", visible: true },
      ],
    };
    expect(Object.fromEntries(numberVolumes([s], new Map(Object.entries({ a: live, b: live }))))).toEqual({
      a: "01",
      b: "02",
    });
  });

  it("pads to two digits", () => {
    expect(formatVolume(1)).toBe("01");
    expect(formatVolume(12)).toBe("12");
    expect(formatVolume(104)).toBe("104");
  });
});

describe("planShelf (C8, WorkScale renderVals)", () => {
  it("hides an empty shelf", () => {
    expect(planShelf(0, 1)).toEqual({
      shown: 0,
      overflow: false,
      more: 0,
      laptop: null,
      ipad: null,
      phone: null,
    });
  });

  it("shows the lead alone with no closing tile", () => {
    expect(planShelf(1, 1)).toMatchObject({ shown: 1, laptop: null, ipad: null, phone: null });
  });

  it("fills a laptop gap with All work and recomputes it for iPad", () => {
    // Home board, Strategy: five projects, lead + four → two empty cells.
    expect(planShelf(5, 2)).toEqual({
      shown: 5,
      overflow: false,
      more: 0,
      laptop: { kind: "all-work", span: 2 },
      ipad: null,
      phone: { kind: "all-work", span: 1 },
    });
    // HomeTablet, Shipped: four projects, three cards two up → one empty cell on iPad.
    expect(planShelf(4, 2)).toEqual({
      shown: 4,
      overflow: false,
      more: 0,
      laptop: null,
      ipad: { kind: "all-work", span: 1 },
      phone: null,
    });
  });

  it("turns the last cell into See all past the cap", () => {
    const plan = planShelf(12, 2);
    expect(plan.shown).toBe(6);
    expect(plan.more).toBe(6);
    expect(plan.overflow).toBe(true);
    expect(plan.laptop).toEqual({ kind: "see-all" });
    expect(plan.ipad).toEqual({ kind: "see-all" });
    expect(plan.phone).toEqual({ kind: "see-all" });
    expect(planShelf(5, 1)).toMatchObject({ shown: 3, more: 2, overflow: true });
    expect(planShelf(4, 1)).toMatchObject({ shown: 4, overflow: false, laptop: null });
    expect(planShelf(10, 3)).toMatchObject({ shown: 10, overflow: false, laptop: null });
  });
});

describe("accents", () => {
  it("has a colour pair for every accent", () => {
    for (const a of ACCENTS) expect(ACCENT_COLOURS[a].accent).toMatch(/^#[0-9A-F]{6}$/);
    expect(ON_ACCENT).toBe("#0B0B0E");
  });
});
