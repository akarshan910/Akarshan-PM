import { expect, test } from "@playwright/test";

import { PAGES } from "./pages";

/**
 * 04 · Ground rules 1: under `prefers-reduced-motion: reduce`, `<html>` gets `still` and nothing
 * moves. Allowed: colour and border changes, the reading-progress bar.
 */
for (const width of [1440, 834, 390]) {
  test.describe(`reduced motion @${width}`, () => {
    test.use({
      viewport: { width, height: 900 },
      contextOptions: { reducedMotion: "reduce" },
      hasTouch: width < 1280,
    });
    for (const p of PAGES.filter((p) => !p.placeholder)) {
      test(`${p.name}: html.still and no running animation`, async ({ page }) => {
        await page.goto(p.path);
        await expect(page.locator("html")).toHaveClass(/\bstill\b/);
        // Scroll through so reveals and scroll-driven effects get their chance to fire.
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < height; y += 700) {
          await page.evaluate((top) => {
            scrollTo({ top, behavior: "instant" });
          }, y);
          await page.waitForTimeout(60);
        }
        // Keyframe animations may not run at all; transitions only on what doesn't move (colour,
        // border, shadow, weight: "colour and border changes stay").
        const moving = await page.evaluate(() =>
          document
            .getAnimations()
            .filter((a) => a.playState === "running")
            .map((a) => {
              const name =
                a instanceof CSSAnimation
                  ? `@${a.animationName}`
                  : a instanceof CSSTransition
                    ? a.transitionProperty
                    : "js";
              const el = (a.effect as KeyframeEffect | null)?.target as HTMLElement | null;
              return { name, el: el ? `${el.tagName}.${(el.getAttribute("class") ?? "").slice(0, 30)}` : "" };
            })
            .filter(({ name }) =>
              /^@|^js$|transform|translate|rotate|scale|left|top|right|bottom|width|height|inset|margin/.test(
                name,
              ),
            ),
        );
        expect(moving).toEqual([]);
        // Nothing waits to be revealed.
        await expect(page.locator(".rv-wait")).toHaveCount(0);
      });
    }
  });
}
