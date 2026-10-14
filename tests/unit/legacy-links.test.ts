import { describe, expect, it } from "vitest";

import { legacyCaseRedirect } from "~/lib/legacy-links";

describe("legacyCaseRedirect (07 · Legacy links)", () => {
  it("maps ids 1–5 under every key to the V0 slugs", () => {
    const slugs = [
      "puja-engagement-platform",
      "word-games-monetisation-strategy",
      "arcana-workspace",
      "glp-1-digital-scaffold",
      "revenue-growth-strategy",
    ];
    slugs.forEach((slug, i) => {
      for (const key of ["open", "openCase", "open_case"]) {
        expect(legacyCaseRedirect(`?${key}=${String(i + 1)}`)).toBe(`/work/${slug}`);
      }
    });
  });

  it("ignores unknown ids, other values and other params", () => {
    for (const search of ["", "?open=0", "?open=6", "?open=abc", "?open=", "?open=1.5", "?q=1", "?open=-1"]) {
      expect(legacyCaseRedirect(search)).toBeNull();
    }
  });

  it("skips an unusable key for a usable one", () => {
    expect(legacyCaseRedirect("?open=x&openCase=3")).toBe("/work/arcana-workspace");
  });
});
