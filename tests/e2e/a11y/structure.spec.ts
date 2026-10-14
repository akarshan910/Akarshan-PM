import { expect, test } from "@playwright/test";

import { knownDefect } from "../devices/known-defects";
import { PAGES } from "./pages";

/** 03 · Accessibility, everywhere: landmarks, headings, the skip link and new-tab links. */
for (const width of [1440, 390]) {
  test.describe(`structure @${width}`, () => {
    test.use({ viewport: { width, height: 900 }, contextOptions: { reducedMotion: "reduce" } });
    for (const p of PAGES) {
      test(p.name, async ({ page }) => {
        test.fixme(Boolean(p.placeholder), p.placeholder);
        await page.goto(p.path);

        // One banner, one main, one contentinfo; the footer follows main.
        await expect(page.getByRole("banner")).toHaveCount(1);
        await expect(page.getByRole("main")).toHaveCount(1);
        await expect(page.getByRole("contentinfo")).toHaveCount(1);

        // Exactly one h1, and no heading level skipped on the way down.
        await expect(page.locator("h1")).toHaveCount(1);
        const levels = await page
          .locator("main :is(h1,h2,h3,h4,h5,h6)")
          .evaluateAll((hs) =>
            hs
              .filter((h) => (h as HTMLElement).offsetParent !== null || h.closest(".sr-only"))
              .map((h) => Number(h.tagName[1])),
          );
        const jumps = levels.slice(1).filter((level, i) => level - (levels[i] ?? 1) > 1);
        expect(jumps, `heading order ${levels.join(",")}`).toEqual([]);

        // Each section is labelled by its heading.
        const unlabelled = await page
          .locator("main section")
          .evaluateAll((ss): string[] =>
            ss
              .filter((s) => !s.getAttribute("aria-labelledby") && !s.getAttribute("aria-label"))
              .map((s) => s.id || (s.getAttribute("class") ?? "section")),
          );
        expect(unlabelled).toEqual([]);

        // The skip link is the first focusable element and lands on main.
        await page.keyboard.press("Tab");
        const skip = page.getByRole("link", { name: "Skip to work" });
        await expect(skip).toBeFocused();
        await expect(skip).toBeInViewport();
        const target = await skip.getAttribute("href");
        expect(target).toMatch(/^#/);
        await expect(page.locator(target ?? "#main")).toHaveCount(1);

        // Every image has alt text or is marked decorative.
        await expect(page.locator("img:not([alt])")).toHaveCount(0);
      });
    }
  });
}

/** 03 · Accessibility: links that open a new tab say so, visibly (↗) and to screen readers. */
for (const width of [1440, 390]) {
  test.describe(`new-tab links @${width}`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const p of PAGES.filter((p) => !p.placeholder)) {
      test(p.name, async ({ page }) => {
        const known = knownDefect(`${p.name} new-tab`, width);
        test.fail(Boolean(known), known ? `${known.id}: ${known.note}` : "");
        await page.goto(p.path);
        const silent = await page
          .locator("a[target=_blank]")
          .evaluateAll((as) =>
            as
              .filter((a) => !/new tab/i.test(`${a.textContent} ${a.getAttribute("aria-label") ?? ""}`))
              .map((a) => `${a.textContent.trim()} → ${a.getAttribute("href")}`),
          );
        expect(silent).toEqual([]);
      });
    }
  });
}
