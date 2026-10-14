import { expect, test, type Page } from "@playwright/test";

import { PAGES } from "../a11y/pages";
import { VIEWPORTS } from "./viewports";

/**
 * Target sizes (08 · Accessibility › Targets): 44×44 on touch layouts, 24×24 everywhere (axe's
 * `target-size` covers the 24px rule with its spacing exception, so this spec checks touch only).
 *
 * Exempt: links inside running text (2.5.8 inline exception), the skip link (shown only on focus),
 * and the testimonial dots, decided at 24px (HANDOFF › Decisions made during the build).
 */
const EXEMPT = [/^Skip to work$/, /^Show testimonial \d+ of \d+$/];

/**
 * Small targets QA has filed and that aren't fixed, by label: `{ id, label, note }`. Empty: QA-D2
 * and QA-D3 were fixed with `hit44` (an ::after hit area, src/styles/base.css) and re-verified.
 */
const KNOWN_SMALL: { id: string; label: RegExp; note: string }[] = [];

/**
 * Every visible control whose hit area is under 44px in either direction. The hit area is found by
 * hit-testing outwards from the centre, so a transparent `::after` that grows the target (the
 * `hit44` class) counts, as it does for a finger, while the drawing stays as on the boards.
 */
async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const out: { label: string; w: number; h: number }[] = [];
    const sel =
      "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex='0']";
    const restore = { x: scrollX, y: scrollY };
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === "hidden" || el.closest("[hidden], [inert], .sr-only"))
        continue;
      // Inline links in running text are exempt; links that are the whole line aren't.
      if (
        el.tagName === "A" &&
        cs.display === "inline" &&
        el.parentElement &&
        el.parentElement.textContent.trim() !== el.textContent.trim()
      )
        continue;
      // A label wrapping a small checkbox makes the whole row the target.
      const hit = el.closest("label") ?? el;
      let hr = hit.getBoundingClientRect();
      if (hr.width >= 44 && hr.height >= 44) continue;
      hit.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
      hr = hit.getBoundingClientRect();
      const cx = hr.left + hr.width / 2;
      const cy = hr.top + hr.height / 2;
      const ours = (x: number, y: number) => {
        const at = document.elementFromPoint(x, y);
        return Boolean(at && (hit === at || hit.contains(at)));
      };
      // Walk out from the centre, 1px at a time, while the point still lands on the target.
      const reach = (dx: number, dy: number) => {
        let d = 0;
        while (d < 40 && ours(cx + dx * (d + 1), cy + dy * (d + 1))) d++;
        return d;
      };
      const w = Math.max(hr.width, reach(-1, 0) + reach(1, 0) + 1);
      const h = Math.max(hr.height, reach(0, -1) + reach(0, 1) + 1);
      if (w >= 44 && h >= 44) continue;
      const label = (
        el.getAttribute("aria-label") ??
        (el as HTMLInputElement).labels?.[0]?.textContent ??
        el.textContent
      )
        .trim()
        .replace(/\s+/g, " ");
      out.push({ label, w: Math.round(w), h: Math.round(h) });
    }
    scrollTo({ left: restore.x, top: restore.y, behavior: "instant" });
    return out;
  });
}

for (const vp of VIEWPORTS.filter((v) => v.touch)) {
  test.describe(`touch targets @${vp.name}`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: true,
      contextOptions: { reducedMotion: "reduce" },
    });
    for (const p of PAGES.filter((p) => !p.placeholder)) {
      test(`${p.name}: 44×44 or filed`, async ({ page }) => {
        await page.goto(p.path);
        await expect(page.locator("main")).toBeVisible();
        const unfiled = (await smallTargets(page))
          .filter((t) => !EXEMPT.some((r) => r.test(t.label)))
          .filter((t) => !KNOWN_SMALL.some((k) => k.label.test(t.label)))
          .map((t) => `"${t.label.slice(0, 40)}" ${t.w}×${t.h}`);
        expect(unfiled).toEqual([]);
      });
    }
  });
}

/** QA-D2 and QA-D3, re-verified by hit-testing (fixed by portfolio in ffb88c7). */
test.describe("fixed small targets stay 44×44", () => {
  test.use({ hasTouch: true, contextOptions: { reducedMotion: "reduce" } });
  const cases = [
    { id: "QA-D2", path: "/", width: 390, height: 844, labels: ["Open menu", "Let’s Talk →"] },
    { id: "QA-D2", path: "/", width: 834, height: 1194, labels: ["Work", "Let’s Talk →"] },
    { id: "QA-D3", path: "/work/arcana-workspace/", width: 390, height: 844, labels: ["All work"] },
    { id: "QA-D3", path: "/work/arcana-workspace/", width: 834, height: 1194, labels: ["Back to all work"] },
    { id: "QA-D3", path: "/", width: 390, height: 844, labels: ["Product", "Data", "Design", "Tools"] },
  ];
  for (const c of cases) {
    test(`${c.id} ${c.path} @${c.width}: ${c.labels.join(", ")}`, async ({ page }) => {
      await page.setViewportSize({ width: c.width, height: c.height });
      await page.goto(c.path);
      const small = (await smallTargets(page)).filter((t) => c.labels.includes(t.label));
      expect(small).toEqual([]);
    });
  }
});
