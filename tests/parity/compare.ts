import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { expect, test, type Page, type TestInfo } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { renderBoard } from "./render-board";

/** 08 · Pixel parity › 3. Compare: the per-pixel colour distance and the share allowed to differ. */
export const THRESHOLD = 0.1;
export const ALLOWED = 0.005;

/**
 * Masks (08): live time strings and anything inside a prototype iframe. Hidden in both renders, so
 * they compare as background. The pill nav is fixed, so it would sit over whichever section is
 * scrolled to; it's hidden in section shots and compared once on its own.
 */
const MASK_CSS = "iframe, time, [data-live] { visibility: hidden !important; }";
const PILL = { board: ".pill", page: 'nav[aria-label="Primary"]' };

export type Section = {
  name: string;
  /** Playwright selector in the rendered board. */
  board: string;
  /** Playwright selector on the page. */
  page: string;
  /**
   * Shoot the page as a full-width band from the element's top to its bottom, for board frames
   * that include the page margins (WorkScale, WritingPublic) while the page element is `.wrap`.
   */
  band?: boolean;
  /** Raise to 0.01 only for glyph-antialiasing-only diffs, with a note (08 · Fonts). */
  allowed?: number;
  note?: string;
};

export type ParityCase = {
  /** Unique, used for file names. */
  name: string;
  board: string;
  /** The board's Tweaks. */
  props?: Record<string, unknown>;
  /** State the board keeps outside Tweaks (WorkScale's project count). */
  state?: Record<string, unknown>;
  /** The board's canvas width: the page width, or 1536 for multi-frame boards. */
  boardWidth: number;
  /** The page width this case compares at; runs only in the parity project with that width. */
  width: number;
  path: string;
  /** Compare the pill nav (pages that show it at the top of the board). */
  pill?: boolean;
  sections: Section[];
};

async function settle(page: Page) {
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 4000))]));
  await page.waitForTimeout(250);
}

async function shoot(page: Page, selector: string, hide: string, band = false) {
  const el = page.locator(selector).filter({ visible: true }).first();
  await expect(el, `${selector} is missing`).toBeAttached();
  await el.scrollIntoViewIfNeeded();
  const options = { animations: "disabled", caret: "hide", style: `${MASK_CSS} ${hide}` } as const;
  if (!band) return PNG.sync.read(await el.screenshot(options));
  const box = await el.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { y: r.top + scrollY, height: r.height, width: document.documentElement.clientWidth };
  });
  return PNG.sync.read(
    await page.screenshot({
      ...options,
      fullPage: true,
      clip: { x: 0, y: box.y, width: box.width, height: box.height },
    }),
  );
}

/** Copies the top-left w×h of a PNG, so differently sized crops can still be diffed. */
function crop(png: PNG, w: number, h: number) {
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(png, out, 0, 0, w, h, 0, 0);
  return out;
}

async function compareSection(
  boardPage: Page,
  sitePage: Page,
  c: ParityCase,
  s: Section,
  info: TestInfo,
  hide: { board: string; page: string },
) {
  const a = await shoot(boardPage, s.board, hide.board);
  const b = await shoot(sitePage, s.page, hide.page, s.band);
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const diff = new PNG({ width: w, height: h });
  const differing = pixelmatch(crop(a, w, h).data, crop(b, w, h).data, diff.data, w, h, {
    threshold: THRESHOLD,
  });
  // Rows one side has and the other doesn't count as differing too.
  const extra = Math.max(a.width, b.width) * Math.max(a.height, b.height) - w * h;
  const ratio = (differing + extra) / (Math.max(a.width, b.width) * Math.max(a.height, b.height));
  const allowed = s.allowed ?? ALLOWED;
  const pass = ratio <= allowed && a.width === b.width && a.height === b.height;
  if (!pass) {
    const dir = "test-results/parity";
    mkdirSync(dir, { recursive: true });
    const base = `${dir}/${c.name}-${s.name}`;
    writeFileSync(`${base}-board.png`, PNG.sync.write(a));
    writeFileSync(`${base}-page.png`, PNG.sync.write(b));
    writeFileSync(`${base}-diff.png`, PNG.sync.write(diff));
    await info.attach(`${s.name}-diff`, { path: `${base}-diff.png`, contentType: "image/png" });
  }
  return {
    section: s.name,
    board: `${a.width}×${a.height}`,
    page: `${b.width}×${b.height}`,
    differing: `${(ratio * 100).toFixed(2)}%`,
    pass,
  };
}

/** One test per section, each comparing the board's crop with the page's, at the case's width. */
export function defineParity(cases: ParityCase[]) {
  for (const c of cases) {
    test.describe(`${c.name} @${c.width}`, () => {
      test.beforeEach(({ page }) => {
        test.skip(page.viewportSize()?.width !== c.width, `${c.name} is compared at ${c.width}`);
      });
      const sections = c.pill ? [{ name: "nav", ...PILL }, ...c.sections] : c.sections;
      for (const s of sections) {
        test(s.name, async ({ page, browser }, info) => {
          if (s.note) info.annotations.push({ type: "note", description: s.note });
          const file = renderBoard(c.board, c.name, { motion: "reduced", ...c.props }, c.state);
          const ctx = await browser.newContext({
            viewport: { width: c.boardWidth, height: 1000 },
            reducedMotion: "reduce",
          });
          const boardPage = await ctx.newPage();
          await boardPage.goto(pathToFileURL(file).href);
          await settle(boardPage);
          await page.goto(`${c.path}${c.path.includes("?") ? "&" : "?"}qa=1`);
          await settle(page);
          const isPill = s.name === "nav";
          const hide = {
            board: isPill ? "" : `${PILL.board} { visibility: hidden !important; }`,
            page: isPill ? "" : `${PILL.page} { visibility: hidden !important; }`,
          };
          const r = await compareSection(boardPage, page, c, s, info, hide);
          await ctx.close();
          expect(r, `board ${r.board}, page ${r.page}, ${r.differing} differ`).toMatchObject({ pass: true });
        });
      }
    });
  }
}
