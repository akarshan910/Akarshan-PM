import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/**
 * Every public page that exists, for the QA sweeps (08 · Accessibility, Browsers and devices).
 * `placeholder` marks a route whose page isn't built yet (HANDOFF › Next); its checks run as
 * `test.fixme` until it lands, so the sweep starts covering it the day it does.
 */
export const PAGES: { path: string; name: string; placeholder?: string }[] = [
  { path: "/", name: "home" },
  { path: "/work/", name: "work" },
  { path: "/work/puja-engagement-platform/", name: "case puja" },
  { path: "/work/word-games-monetisation-strategy/", name: "case word-games" },
  { path: "/work/arcana-workspace/", name: "case arcana" },
  { path: "/work/glp-1-digital-scaffold/", name: "case glp-1" },
  { path: "/work/revenue-growth-strategy/", name: "case revenue" },
  { path: "/404/", name: "404" },
  { path: "/writing/", name: "writing" },
];

/** The widths QA checks (08 · Check by eye, plus 320 for 400% zoom on a 1280 window). */
export const WIDTHS = [320, 375, 390, 414, 768, 834, 1024, 1280, 1440, 1920] as const;

/** A height that matches each width's usual device, portrait. */
export const heightFor = (w: number) =>
  w < 768 ? (w <= 320 ? 640 : 844) : w < 1024 ? 1194 : w === 1024 ? 768 : 900;

/** Phones and iPads are touch layouts (02 · Layout): 44px targets, no hover-only detail. */
export const isTouchWidth = (w: number) => w < 1280;

export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  return results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

/**
 * Elements that stick out past the right or left edge of the viewport without a scrolling or
 * clipping ancestor: the cause of horizontal page scroll. Fixed and visually hidden elements
 * (the skip link, sr-only text) are left out.
 */
export async function overflowing(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    const all = Array.from(document.querySelectorAll<HTMLElement>("body *"));
    const bad = all.filter((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || (r.right <= vw + 1 && r.left >= -1)) return false;
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" || cs.visibility === "hidden" || r.right < 0 || r.left > vw * 4)
        return false;
      if (el.classList.contains("sr-only") || r.width <= 1) return false;
      for (let a = el.parentElement; a; a = a.parentElement) {
        if (/(hidden|auto|scroll|clip)/.test(getComputedStyle(a).overflowX)) return false;
      }
      return true;
    });
    // Report only the outermost offenders.
    for (const el of bad) {
      if (bad.includes(el.parentElement as HTMLElement)) continue;
      const r = el.getBoundingClientRect();
      const cls = el.getAttribute("class")?.split(" ")[0] ?? "";
      out.push(
        `${el.tagName.toLowerCase()}${cls ? "." + cls : ""} [${Math.round(r.left)}–${Math.round(r.right)}]`,
      );
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: vw,
      offenders: out.slice(0, 10),
    };
  });
}
