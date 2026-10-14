import { expect, test } from "@playwright/test";

import { PAGES, WIDTHS, axe, heightFor, isTouchWidth } from "./pages";

/**
 * axe on every page at every QA width (08 · Accessibility › Automated). Reduced motion settles
 * entrances so contrast is measured on the final colours; a second pass at 1440 and 390 runs with
 * motion on, after the entrances finish.
 */
for (const width of WIDTHS) {
  test.describe(`axe @${width}`, () => {
    test.use({
      viewport: { width, height: heightFor(width) },
      hasTouch: isTouchWidth(width),
      contextOptions: { reducedMotion: "reduce" },
    });
    for (const p of PAGES) {
      test(p.name, async ({ page }) => {
        test.fixme(Boolean(p.placeholder), p.placeholder);
        await page.goto(p.path);
        await expect(page.locator("main")).toBeVisible();
        expect(await axe(page)).toEqual([]);
      });
    }
  });
}

for (const width of [1440, 390]) {
  test.describe(`axe with motion @${width}`, () => {
    test.use({ viewport: { width, height: heightFor(width) }, hasTouch: isTouchWidth(width) });
    for (const p of PAGES.filter((p) => !p.placeholder)) {
      test(p.name, async ({ page }) => {
        await page.goto(p.path);
        // The hero entrance is ~1.6s (04 · On load); let every finite animation finish.
        await page.evaluate(() =>
          Promise.all(
            document
              .getAnimations()
              .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
              .map((a) => a.finished.catch(() => undefined)),
          ),
        );
        expect(await axe(page)).toEqual([]);
      });
    }
  });
}
