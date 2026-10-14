import { expect, test } from "@playwright/test";

import { PAGES } from "./pages";

/** 04 · Ground rules 7: content is readable with JavaScript off, at laptop and phone width. */
for (const width of [1440, 390]) {
  test.describe(`no JavaScript @${width}`, () => {
    test.use({ viewport: { width, height: 900 }, javaScriptEnabled: false });
    for (const p of PAGES.filter((p) => !p.placeholder)) {
      test(p.name, async ({ page }) => {
        await page.goto(p.path);
        await expect(page.locator("html")).not.toHaveClass(/\bjs\b/);
        await expect(page.locator("h1")).toBeVisible();
        // CSS entrances still play without JS; wait for the longest one (~1.6s), then nothing
        // laid out in main may be invisible.
        await page.waitForTimeout(2500);
        const hidden = await page.locator("main :is(h1,h2,h3,p,li,dd,td)").evaluateAll((els) =>
          els
            .filter((el) => el.getBoundingClientRect().height > 0)
            .filter((el) => {
              for (let a: Element | null = el; a; a = a.parentElement) {
                const cs = getComputedStyle(a);
                if (parseFloat(cs.opacity) < 0.1 || cs.visibility === "hidden") return true;
              }
              return false;
            })
            .map((el) => el.textContent.trim().slice(0, 40)),
        );
        expect(hidden).toEqual([]);
      });
    }
  });
}
