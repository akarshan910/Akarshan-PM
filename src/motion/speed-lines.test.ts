import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { HERO_SPEED, offDutySpeed, speed } from "./speed-lines";

const board = (name: string) => readFileSync(`design/boards/${name}.dc.html`, "utf8");

/** The hero ink panel's baked speed-line path on a touch board (the `svg.px` with this viewBox). */
function heroPath(name: string, viewBox: string): string | undefined {
  const re = new RegExp(`viewBox="${viewBox}"[^>]*><path d="([^"]+)"`);
  return re.exec(board(name))?.[1];
}

describe("speed", () => {
  it("draws the laptop rest pose (snapshot of the board's function)", () => {
    const d = speed(...HERO_SPEED.laptop.args);
    expect(d.split("Z")).toHaveLength(131);
    expect(d).toMatchSnapshot();
  });

  it("matches the iPad and phone boards' static hero paths exactly", () => {
    expect(speed(...HERO_SPEED.ipad.args)).toBe(heroPath("HomeTablet", HERO_SPEED.ipad.viewBox));
    expect(speed(...HERO_SPEED.phone.args)).toBe(heroPath("HomeMobile", HERO_SPEED.phone.viewBox));
  });

  it("is empty for no lines", () => {
    expect(speed(0, 0, 0, 1, 2, 3)).toBe("");
  });
});

describe("offDutySpeed", () => {
  it("matches the laptop board's big panel", () => {
    const m = /<svg class="op-sl" viewBox="0 0 695 568"[^>]*><path d="([^"]+)"/.exec(board("Home"));
    expect(offDutySpeed(695, 568, 540, 120)).toBe(m?.[1]);
  });
});
