import { describe, expect, it } from "vitest";

import { altFaces, skillsOrder } from "./skills-order";

/** Home.dc.html › this.SK: the V0 groups with the board's example sizes. */
const SK: [string, string][][] = [
  [
    ["User & Market Research", "l"],
    ["Feature Prioritisation", "m"],
    ["Road-mapping", "m"],
    ["Stakeholder Management", "s"],
    ["A/B Testing", "xl"],
    ["Experimentation", "m"],
    ["Data-driven Development", "s"],
  ],
  [
    ["SQL", "xl"],
    ["Web (Clickstream) Analytics", "m"],
    ["Product & Data Analytics", "l"],
    ["Visualization & Story Telling", "s"],
    ["ETL", "m"],
  ],
  [
    ["FigmaMake", "l"],
    ["Prototyping", "m"],
    ["Wireframing", "s"],
    ["Napkin.ai", "s"],
  ],
  [
    ["Excel", "s"],
    ["Lovable", "m"],
    ["Mixpanel", "l"],
    ["Metabase", "m"],
    ["Tableau", "s"],
    ["Optimizely", "s"],
    ["Redash", "s"],
    ["Superset", "m"],
    ["Figma", "m"],
    ["JIRA", "s"],
    ["Amplitude", "l"],
    ["Airflow", "m"],
  ],
];

/** Home.dc.html › this.SKO, verbatim. */
const SKO: Record<string, number> = {
  "g:0:": 0,
  "w:3:0": 1,
  "w:0:0": 2,
  "w:1:0": 3,
  "w:2:0": 4,
  "w:3:1": 5,
  "w:3:2": 6,
  "w:0:1": 7,
  "g:1:": 8,
  "w:3:3": 9,
  "w:1:1": 10,
  "w:0:2": 11,
  "w:2:1": 12,
  "w:3:4": 13,
  "w:3:5": 14,
  "w:0:3": 15,
  "g:2:": 16,
  "w:1:2": 17,
  "w:3:6": 18,
  "w:2:2": 19,
  "w:3:7": 20,
  "w:0:4": 21,
  "w:1:3": 22,
  "w:3:8": 23,
  "g:3:": 24,
  "w:0:5": 25,
  "w:3:9": 26,
  "w:2:3": 27,
  "w:3:10": 28,
  "w:1:4": 29,
  "w:0:6": 30,
  "w:3:11": 31,
};

/** The board's skVals() alt pass, run on visual order, as a reference implementation. */
function boardAlt(order: Record<string, number>, regular: boolean): Set<string> {
  const flat = SK.flatMap((g, gi) =>
    g.map((w, ii) => ({
      key: `w:${gi}:${ii}`,
      size: regular ? "m" : w[1],
      order: order[`w:${gi}:${ii}`] ?? 0,
    })),
  ).sort((a, b) => a.order - b.order);
  let k = 0;
  const alt = new Set<string>();
  for (const w of flat) if (w.size === "m" && k++ % 2) alt.add(w.key);
  return alt;
}

describe("skillsOrder", () => {
  it("matches Home.dc.html's SKO for the V0 groups", () => {
    const order = skillsOrder(SK.map((g) => g.length));
    const got: Record<string, number> = {};
    order.groups.forEach((pos, g) => (got[`g:${g}:`] = pos));
    order.items.forEach((items, g) => {
      items.forEach((pos, i) => (got[`w:${g}:${i}`] = pos));
    });
    expect(got).toEqual(SKO);
    expect(order.total).toBe(32);
  });

  it("gives every word a unique position", () => {
    const order = skillsOrder([3, 0, 9, 1, 4]);
    const all = [...order.groups, ...order.items.flat()].sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: order.total }, (_, i) => i));
    expect(order.groups[0]).toBe(0);
  });

  it("handles no groups and a single group", () => {
    expect(skillsOrder([])).toEqual({ groups: [], items: [], total: 0 });
    expect(skillsOrder([2])).toEqual({ groups: [0], items: [[1, 2]], total: 3 });
  });

  it("keeps group words at the end when every group is empty", () => {
    expect(skillsOrder([0, 0])).toEqual({ groups: [0, 1], items: [[], []], total: 2 });
  });
});

describe("altFaces", () => {
  const order = skillsOrder(SK.map((g) => g.length));
  const toSet = (alt: boolean[][]) =>
    new Set(alt.flatMap((g, gi) => g.flatMap((on, ii) => (on ? [`w:${gi}:${ii}`] : []))));

  it("alternates M words in visual order, as the board does (sizes set in Studio)", () => {
    const alt = altFaces(
      SK.map((g) => g.map((w) => w[1])),
      order,
    );
    expect(toSet(alt)).toEqual(boardAlt(SKO, false));
  });

  it("alternates every word when all are M (V0)", () => {
    const alt = altFaces(
      SK.map((g) => g.map(() => "m")),
      order,
    );
    expect(toSet(alt)).toEqual(boardAlt(SKO, true));
    expect(toSet(alt).size).toBe(14);
  });
});
