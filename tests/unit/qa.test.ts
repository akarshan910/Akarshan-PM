import { describe, expect, it } from "vitest";

import { isQa, now, QA_NOW } from "~/lib/qa";

describe("qa mode", () => {
  it("is on only with qa=1", () => {
    expect(isQa("?qa=1")).toBe(true);
    expect(isQa("?qa=0")).toBe(false);
    expect(isQa("")).toBe(false);
    expect(isQa()).toBe(false);
  });

  it("freezes the clock at the boards' date", () => {
    expect(now("?qa=1").toISOString()).toBe(QA_NOW.toISOString());
    expect(Math.abs(now("").getTime() - Date.now())).toBeLessThan(1000);
  });
});
