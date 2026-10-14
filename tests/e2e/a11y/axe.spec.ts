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
        // `?qa=1` puts the floating previews in their rest slots (08 · Pixel parity › 2): they
        // otherwise fade in and out on timers forever, and axe would catch one mid-fade. At rest
        // they're at full opacity, so their contrast is still checked.
        await page.goto(`${p.path}?qa=1`);
        // Then wait until no finite animation or transition has run for two checks in a row: the
        // hero entrance (~1.6s, 04 · On load) and anything hydration starts after it.
        await expect
          .poll(
            async () =>
              page.evaluate(
                () =>
                  document
                    .getAnimations()
                    .filter((a) => a.playState === "running")
                    .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).length,
              ),
            { intervals: [250], timeout: 10_000 },
          )
          .toBe(0);
        await page.waitForTimeout(250);
        expect(
          await page.evaluate(
            () =>
              document
                .getAnimations()
                .filter((a) => a.playState === "running")
                .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).length,
          ),
        ).toBe(0);
        expect(await axe(page)).toEqual([]);
      });
    }
  });
}
