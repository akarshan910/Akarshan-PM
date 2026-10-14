import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ipadPlacement, ipadRows, laptopPlacement, laptopRows, SLOT_LINES, slotLines } from "./layout";

/** The boards' baked Off duty speed-line paths, by panel size. */
function boardPaths(name: string): Map<string, string> {
  const html = readFileSync(`design/boards/${name}.dc.html`, "utf8");
  const out = new Map<string, string>();
  for (const m of html.matchAll(/<svg class="op-sl" viewBox="(0 0 \d+ \d+)"[^>]*><path d="([^"]+)"/g))
    out.set(m[1] ?? "", m[2] ?? "");
  return out;
}

describe("slotLines", () => {
  it("matches every speed-line path on the laptop, iPad and phone boards", () => {
    const cases = [
      ["Home", Object.values(SLOT_LINES.laptop)],
      ["HomeTablet", Object.values(SLOT_LINES.ipad)],
      ["HomeMobile", [SLOT_LINES.phone]],
    ] as const;
    for (const [board, slots] of cases) {
      const paths = boardPaths(board);
      for (const g of slots) {
        const lines = slotLines(g);
        expect(paths.get(lines.viewBox), `${board} ${lines.viewBox}`).toBe(lines.d);
        expect(slotLines(g)).toBe(lines);
      }
    }
  });
});

const lap = (n: number) => Array.from({ length: n }, (_, i) => laptopPlacement(i, n));
const pad = (n: number) => Array.from({ length: n }, (_, i) => ipadPlacement(i, n));

describe("laptopPlacement", () => {
  it("lays six items as on Home.dc.html", () => {
    expect(lap(6)).toEqual([
      { slot: "big", column: "1 / 8", row: "1 / 3" },
      { slot: "side", column: "8 / 13", row: "1" },
      { slot: "side", column: "8 / 13", row: "2" },
      { slot: "bottom", column: "1 / 5", row: "3" },
      { slot: "bottom", column: "5 / 9", row: "3" },
      { slot: "bottom", column: "9 / 13", row: "3" },
    ]);
    expect(laptopRows(6)).toBe("278px 278px 340px");
  });

  it("handles fewer than six: one alone, two side by side, and stretched bottom rows", () => {
    expect(lap(1)).toEqual([{ slot: "big", column: "1 / 13", row: "1 / 3" }]);
    expect(lap(2)[1]).toEqual({ slot: "side", column: "8 / 13", row: "1 / 3" });
    expect(lap(4)[3]?.column).toBe("1 / 13");
    expect(
      lap(5)
        .slice(3)
        .map((p) => p.column),
    ).toEqual(["1 / 7", "7 / 13"]);
    expect(laptopRows(1)).toBe("278px 278px");
  });

  it("continues in rows of three after the sixth", () => {
    const p = lap(8);
    expect(p.slice(6)).toEqual([
      { slot: "bottom", column: "1 / 7", row: "4" },
      { slot: "bottom", column: "7 / 13", row: "4" },
    ]);
    expect(laptopRows(8)).toBe("278px 278px 340px 340px");
  });
});

describe("ipadPlacement", () => {
  it("lays six items as on HomeTablet.dc.html", () => {
    expect(pad(6)).toEqual([
      { slot: "big", column: "1 / 7", row: "1" },
      { slot: "half", column: "1 / 4", row: "2" },
      { slot: "half", column: "4 / 7", row: "2" },
      { slot: "third", column: "1 / 3", row: "3" },
      { slot: "third", column: "3 / 5", row: "3" },
      { slot: "third", column: "5 / 7", row: "3" },
    ]);
    expect(ipadRows(6)).toBe("560px 300px 450px");
  });

  it("stretches short rows and continues in rows of two", () => {
    expect(ipadRows(1)).toBe("560px");
    expect(pad(2)[1]?.column).toBe("1 / 7");
    expect(ipadRows(3)).toBe("560px 300px");
    expect(pad(4)[3]?.column).toBe("1 / 7");
    expect(
      pad(5)
        .slice(3)
        .map((p) => p.column),
    ).toEqual(["1 / 4", "4 / 7"]);
    expect(pad(9).slice(6)).toEqual([
      { slot: "third", column: "1 / 4", row: "4" },
      { slot: "third", column: "4 / 7", row: "4" },
      { slot: "third", column: "1 / 7", row: "5" },
    ]);
    expect(ipadRows(9)).toBe("560px 300px 450px 450px 450px");
  });
});
