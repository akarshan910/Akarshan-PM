import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import * as content from "~/legacy/content";

import { normaliseSource, strings } from "./trace";

const source = normaliseSource(readFileSync("tests/fixtures/legacy-app.tsx.txt", "utf8"));

describe("src/legacy/content.ts", () => {
  it("is unchanged (edits must be deliberate: update the snapshot on purpose)", () => {
    expect(content).toMatchSnapshot();
  });

  it("only holds text that is on the live site", () => {
    const missing = strings(content).filter((s) => s !== "" && !source.includes(s));
    expect(missing).toEqual([]);
  });

  it("has every export 07 · Extraction lists", () => {
    expect(Object.keys(content).sort()).toEqual(
      [
        "ABOUT",
        "ANIME_PICKS",
        "CASES",
        "CONTACT",
        "EXPERIENCE",
        "FOOTER",
        "HERO",
        "HOBBIES",
        "NAV",
        "NAV_CONTACT",
        "SKILLS",
        "TESTIMONIALS",
        "TESTIMONIALS_HEADER",
        "WORK",
      ].sort(),
    );
  });
});
