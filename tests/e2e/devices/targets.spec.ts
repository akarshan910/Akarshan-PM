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

/** Small targets QA has filed, by label. Each is re-checked below as an expected failure. */
const KNOWN_SMALL: { id: string; label: RegExp; note: string }[] = [
  {
    id: "QA-D2",
    label: /^(Open menu|Close menu|Let’s Talk →|Work|About|Exp|Skills|Testimonial)$/,
    note: "pill nav on touch layouts is 29–34px tall",
  },
  {
    id: "QA-D3",
    label: /^(All work|Back to all work|Show all nine|Read the PRD ↗ \(opens in a new tab\))$/,
    note: "case-study back links, the PRD link and 'Show all nine' are 17–19px tall",
  },
  { id: "QA-D3", label: /^(Product|Data|Design|Tools)$/, note: "skill group words are 43px tall on phones" },
];

async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const out: { label: string; w: number; h: number }[] = [];
    const sel =
      "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex='0']";
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
      const hr = hit.getBoundingClientRect();
      if (hr.width >= 44 && hr.height >= 44) continue;
      const label = (
        el.getAttribute("aria-label") ??
        (el as HTMLInputElement).labels?.[0]?.textContent ??
        el.textContent
      )
        .trim()
        .replace(/\s+/g, " ");
      out.push({ label, w: Math.round(hr.width), h: Math.round(hr.height) });
    }
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

/** The filed ones, still small. When a fix lands this turns red: delete its KNOWN_SMALL entry. */
test.describe("filed small targets", () => {
  test.use({ hasTouch: true, contextOptions: { reducedMotion: "reduce" } });
  const cases = [
    { id: "QA-D2", path: "/", width: 390, height: 844, labels: ["Open menu", "Let’s Talk →"] },
    { id: "QA-D2", path: "/", width: 834, height: 1194, labels: ["Work", "Let’s Talk →"] },
    { id: "QA-D3", path: "/work/arcana-workspace/", width: 390, height: 844, labels: ["All work"] },
    { id: "QA-D3", path: "/work/arcana-workspace/", width: 834, height: 1194, labels: ["Back to all work"] },
    { id: "QA-D3", path: "/", width: 390, height: 844, labels: ["Product", "Data", "Design", "Tools"] },
  ];
  for (const c of cases) {
    test(`${c.id} ${c.path} @${c.width}: ${c.labels.join(", ")} reach 44×44`, async ({ page }) => {
      test.fail(true, `${c.id} is open`);
      await page.setViewportSize({ width: c.width, height: c.height });
      await page.goto(c.path);
      const small = (await smallTargets(page)).filter((t) => c.labels.includes(t.label));
      expect(small).toEqual([]);
    });
  }
});
