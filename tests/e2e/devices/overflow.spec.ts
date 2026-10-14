import { expect, test } from "@playwright/test";

import { PAGES, overflowing } from "../a11y/pages";
import { knownDefect } from "./known-defects";
import { VIEWPORTS } from "./viewports";

/**
 * No horizontal scroll at any device size, portrait or landscape (08 · Check by eye: "nothing
 * overflows, nothing overlaps"). Runs in Chromium, WebKit and Firefox.
 */
for (const vp of VIEWPORTS) {
  test.describe(`no horizontal scroll @${vp.name}`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.touch,
      contextOptions: { reducedMotion: "reduce" },
    });
    for (const p of PAGES) {
      test(p.name, async ({ page }) => {
        test.fixme(Boolean(p.placeholder), p.placeholder);
        const known = knownDefect(p.name, vp.width);
        test.fail(Boolean(known), known ? `${known.id}: ${known.note}` : "");
        await page.goto(p.path);
        await expect(page.locator("main")).toBeVisible();
        const o = await overflowing(page);
        expect(o.offenders, `scrollWidth ${o.scrollWidth} > ${o.clientWidth}`).toEqual([]);
        expect(o.scrollWidth).toBeLessThanOrEqual(o.clientWidth);
      });
    }
  });
}

/**
 * 1.4.12 Text spacing: with line height 1.5, letter spacing .12em, word spacing .16em and
 * paragraph spacing 2em, nothing is cut off and the page still doesn't scroll sideways.
 */
for (const width of [1440, 834, 390]) {
  test.describe(`text spacing @${width}`, () => {
    test.use({ viewport: { width, height: 900 }, contextOptions: { reducedMotion: "reduce" } });
    for (const p of PAGES.filter((p) => !p.placeholder)) {
      test(p.name, async ({ page }) => {
        const known = knownDefect(p.name, width);
        test.fail(Boolean(known), known ? `${known.id}: ${known.note}` : "");
        await page.goto(p.path);
        await page.addStyleTag({
          content:
            "*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}",
        });
        const clipped = await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>("main *, header *"))
            .filter((el) => !el.closest(".sr-only") && el.clientHeight > 1)
            .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()))
            .filter((el) => {
              const cs = getComputedStyle(el);
              return (
                /hidden|clip/.test(cs.overflow) &&
                cs.textOverflow !== "ellipsis" &&
                (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)
              );
            })
            .map((el) => el.textContent.trim().slice(0, 40)),
        );
        expect(clipped).toEqual([]);
        const o = await overflowing(page);
        expect(o.scrollWidth).toBeLessThanOrEqual(o.clientWidth);
      });
    }
  });
}

/**
 * 08 · Zoom: 200% on a 1280 window is 640 CSS px; 400% is 320 (covered above). Nothing is cut
 * off and nothing needs two-way scrolling.
 */
test.describe("200% zoom on a 1280 window", () => {
  test.use({
    viewport: { width: 640, height: 400 },
    deviceScaleFactor: 2,
    contextOptions: { reducedMotion: "reduce" },
  });
  for (const p of PAGES.filter((p) => !p.placeholder)) {
    test(p.name, async ({ page }) => {
      await page.goto(p.path);
      const o = await overflowing(page);
      expect(o.offenders).toEqual([]);
      expect(o.scrollWidth).toBeLessThanOrEqual(o.clientWidth);
    });
  }
});
