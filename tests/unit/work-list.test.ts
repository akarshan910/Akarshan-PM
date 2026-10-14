import { describe, expect, it } from "vitest";

import type { PublicContent } from "~/lib/content-source";
import { loadLocalV0 } from "~/lib/sources/local-v0";
import {
  activeFilterCount,
  activeFilters,
  noResultsMessage,
  EMPTY_QUERY,
  facets,
  filterRows,
  fold,
  nextPageCount,
  parseWorkQuery,
  shelfCounts,
  workQueryString,
  workRows,
  type WorkQuery,
  type WorkRow,
} from "~/lib/work-list";

const content = loadLocalV0(new Date("2026-10-13T18:00:00Z"));
const { rows, shelves } = workRows(content);

const q = (over: Partial<WorkQuery>): WorkQuery => ({ ...EMPTY_QUERY, ...over });

describe("workRows", () => {
  it("lists the five V0 projects in shelf order with their volumes and headlines", () => {
    expect(rows.map((r) => [r.volume, r.slug])).toEqual([
      ["01", "puja-engagement-platform"],
      ["02", "word-games-monetisation-strategy"],
      ["03", "arcana-workspace"],
      ["04", "glp-1-digital-scaffold"],
      ["05", "revenue-growth-strategy"],
    ]);
    expect(rows[0]?.headline).toEqual({ value: "+30%", type: "target" });
    expect(rows[2]?.labels).toEqual(["output"]);
    expect(rows[4]?.labels).toEqual(["target", "projected", "output"]);
    expect(shelves).toEqual([{ id: "strategy", name: "Strategy & prototypes", count: 5 }]);
  });

  it("carries card data only: no story, outcomes' evidence or drafts", () => {
    const json = JSON.stringify(rows);
    expect(json).not.toContain("blocks");
    expect(json).not.toContain("evidence");
    expect(json).not.toContain("3D body scan");
  });

  it("keeps listed projects on no visible shelf, after the shelved ones, and drops unlisted ones", () => {
    const first = content.projects[0];
    if (!first) throw new Error("no projects");
    const extra: PublicContent = {
      ...content,
      projects: [
        ...content.projects,
        { ...first, id: "loose", slug: "loose" },
        { ...first, id: "hidden", slug: "hidden", listed: false },
      ],
    };
    const out = workRows(extra).rows;
    expect(out.at(-1)?.slug).toBe("loose");
    expect(out.at(-1)?.volume).toBeUndefined();
    expect(out.at(-1)?.shelf).toBeUndefined();
    expect(out.map((r) => r.slug)).not.toContain("hidden");
  });

  it("names a shelf by its title when it has no shelf name, and counts shelves", () => {
    const layout = {
      ...content.layout,
      sections: content.layout.sections.map((s) => {
        if (s.id !== "strategy") return s;
        const { shelf: _shelf, ...rest } = s;
        return rest;
      }),
    };
    const out = workRows({ ...content, layout });
    expect(out.shelves[0]?.name).toBe("Decisions,");
  });
});

describe("filterRows", () => {
  it("returns everything for the empty query, in Your order", () => {
    expect(filterRows(rows, EMPTY_QUERY)).toEqual(rows);
  });

  it("searches title, company, summary and topics, case- and accent-insensitively", () => {
    expect(filterRows(rows, q({ q: "ARCANA" })).map((r) => r.slug)).toEqual(["arcana-workspace"]);
    expect(filterRows(rows, q({ q: "zynga" })).map((r) => r.slug)).toEqual(["revenue-growth-strategy"]);
    expect(filterRows(rows, q({ q: "fintech" })).map((r) => r.slug)).toEqual(["arcana-workspace"]);
    expect(filterRows(rows, q({ q: "whatsápp puja" })).map((r) => r.slug)).toEqual([
      "puja-engagement-platform",
    ]);
    expect(filterRows(rows, q({ q: "   " }))).toHaveLength(5);
    expect(filterRows(rows, q({ q: "nothing-like-this" }))).toEqual([]);
  });

  it("filters by shelf, company, topic and label, with lists meaning any of", () => {
    expect(filterRows(rows, q({ shelf: "strategy" }))).toHaveLength(5);
    expect(filterRows(rows, q({ shelf: "shipped" }))).toHaveLength(0);
    expect(filterRows(rows, q({ company: ["GLP Health", "Sri Mandir"] })).map((r) => r.volume)).toEqual([
      "01",
      "04",
    ]);
    expect(filterRows(rows, q({ topic: ["Games"] })).map((r) => r.volume)).toEqual(["02", "05"]);
    expect(filterRows(rows, q({ label: ["baseline"] })).map((r) => r.volume)).toEqual(["04"]);
    expect(filterRows(rows, q({ topic: ["Games"], label: ["projected"] })).map((r) => r.volume)).toEqual([
      "05",
    ]);
  });

  it("sorts A–Z and Newest, keeping Your order for ties", () => {
    expect(filterRows(rows, q({ sort: "az" })).map((r) => r.title)).toEqual([
      "Arcana Workspace",
      "GLP-1 digital scaffold",
      "Puja engagement platform",
      "Revenue growth strategy",
      "Word games monetisation strategy",
    ]);
    const dated: WorkRow[] = rows.map((r, i) => ({
      ...r,
      firstPublishedAt: i === 3 ? "2026-10-20T00:00:00Z" : "2026-10-13T00:00:00Z",
    }));
    expect(filterRows(dated, q({ sort: "newest" })).map((r) => r.volume)).toEqual([
      "04",
      "01",
      "02",
      "03",
      "05",
    ]);
  });
});

describe("chips, facets and paging", () => {
  it("counts each shelf under the other filters", () => {
    expect(shelfCounts(rows, shelves, q({ shelf: "strategy", topic: ["Games"] }))).toEqual({
      all: 2,
      shelves: [{ id: "strategy", name: "Strategy & prototypes", count: 2 }],
    });
  });

  it("lists companies, topics and labels once each", () => {
    const f = facets(rows);
    expect(f.companies).toHaveLength(5);
    expect(f.topics).toContain("0→1");
    expect(new Set(f.topics).size).toBe(f.topics.length);
    expect(f.labels).toEqual(["target", "projected", "baseline", "output"]);
  });

  it("loads 24 at a time, fewer on the last page", () => {
    expect(nextPageCount(24, 100)).toBe(24);
    expect(nextPageCount(96, 100)).toBe(4);
    expect(nextPageCount(5, 5)).toBe(0);
  });

  it("counts the filters for Filters (n), not the search or sort", () => {
    expect(activeFilterCount(q({ q: "x", sort: "az" }))).toBe(0);
    expect(activeFilterCount(q({ shelf: "s", topic: ["a", "b"], label: ["target"], company: ["c"] }))).toBe(
      5,
    );
  });

  it("folds case and accents", () => {
    expect(fold("Café Ünïcode")).toBe("cafe unicode");
  });
});

describe("the URL holds the state", () => {
  it("parses and writes the query, leaving defaults out", () => {
    const parsed = parseWorkQuery(
      "?shelf=strategy&topic=Games&topic=Mobile&label=target&label=bogus&q=rice&sort=az",
    );
    expect(parsed).toEqual({
      shelf: "strategy",
      company: [],
      topic: ["Games", "Mobile"],
      label: ["target"],
      q: "rice",
      sort: "az",
    });
    expect(workQueryString(parsed)).toBe(
      "?shelf=strategy&topic=Games&topic=Mobile&label=target&q=rice&sort=az",
    );
    expect(workQueryString(EMPTY_QUERY)).toBe("");
    expect(parseWorkQuery("?sort=weird")).toEqual(EMPTY_QUERY);
    expect(parseWorkQuery(new URLSearchParams("company=Arcana%20%C2%B7%20Workspace&sort=newest"))).toEqual(
      q({ company: ["Arcana · Workspace"], sort: "newest" }),
    );
  });

  it("keeps parameters it doesn't own", () => {
    expect(workQueryString(q({ q: "x" }), new URLSearchParams("moved=1&q=old&qa=1"))).toBe(
      "?moved=1&qa=1&q=x",
    );
  });
});

describe("no results", () => {
  it("names what was asked for", () => {
    expect(noResultsMessage(q({ shelf: "strategy", label: ["achieved"], q: "roadmap" }), shelves)).toBe(
      "Nothing in Strategy & prototypes is labelled Achieved and mentions “roadmap”.",
    );
    expect(noResultsMessage(q({ company: ["A", "B", "C"], topic: ["Games"] }), shelves)).toBe(
      "Nothing is from A, B or C and is about Games.",
    );
    expect(noResultsMessage(q({ shelf: "gone" }), shelves)).toBe("Nothing in gone matches.");
    expect(noResultsMessage(EMPTY_QUERY, shelves)).toBe("Nothing matches.");
  });

  it("turns each filter into a removable chip", () => {
    const query = q({
      shelf: "strategy",
      company: ["Sri Mandir"],
      topic: ["Games"],
      label: ["achieved"],
      q: " roadmap ",
    });
    const chips = activeFilters(query, shelves);
    expect(chips.map((c) => [c.label, c.kind])).toEqual([
      ["Strategy & prototypes", "shelf"],
      ["Company: Sri Mandir", "filter"],
      ["Topic: Games", "filter"],
      ["Label: Achieved", "filter"],
      ["“roadmap”", "search"],
    ]);
    expect(chips[0]?.without.shelf).toBeUndefined();
    expect(chips[1]?.without.company).toEqual([]);
    expect(chips[3]?.without.label).toEqual([]);
    expect(chips[4]?.without.q).toBe("");
    expect(activeFilters(q({ shelf: "gone" }), shelves)[0]?.label).toBe("gone");
  });
});
