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
const PILL: Section = { name: "nav", board: ".pill", page: 'nav[aria-label="Primary"]' };

/**
 * Home's boards draw "Work" highlighted at scroll 0, but M-NAV-PILL hides the highlight over the
 * hero (04), so on Home the board's pill is compared with its highlight removed, as the page shows
 * it at the top. Case studies keep it: "Work" is current there.
 */
const PILL_OVER_HERO: Section = {
  ...PILL,
  boardScript:
    "document.querySelectorAll('.pill .on').forEach((e) => { e.classList.remove('on'); e.removeAttribute('aria-current'); })",
  note: "highlight removed on the board: 04 · M-NAV-PILL hides it over the hero",
};

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
  /**
   * Scripts run before the shots, on the board and on the page: to put a component in the page's
   * state, or to mark one element for masking with `data-qa-mask` when CSS can't single it out.
   */
  boardScript?: string;
  pageScript?: string;
  /**
   * Parts hidden on both sides before the shot, for content conflicts recorded in 09 (cite the
   * decision in `note`). They compare as background, so the layout around them still counts.
   */
  mask?: { board: string[]; page: string[] };
  /**
   * Parts removed from the DOM before the shot, for 09 · D75 content that one side draws and the
   * other doesn't (a figure, a cover, a pager): masking can't help when the heights differ. Removed,
   * not hidden, so CSS that reacts to absence (`:has()`, `:empty`) lays out as it would without it.
   */
  collapse?: { board?: string[]; page?: string[] };
  /**
   * 09 · D75 copy that wraps to a different number of lines: the page element takes the board
   * element's height (overflow hidden) before the shot; mask its text too. Its margins and
   * everything around it keep their real values, unlike `collapse`.
   */
  matchHeight?: { board: string; page: string };
  /**
   * Crop each side at the bottom of this element (selector inside the section, per side), to
   * compare the top of a section whose lower part is D75 content.
   */
  until?: { board: string; page: string };
  /**
   * Compare type instead of pixels: for 09 · D75 copy whose height follows its text, so a box diff
   * can't pass, but its type (size, weight, line height, measure, colour, spacing above) must match.
   */
  type?: true;
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
  /** Compare the pill nav: as drawn, or "over-hero" (highlight hidden, M-NAV-PILL). */
  pill?: boolean | "over-hero";
  sections: Section[];
  /**
   * Runs before the page is opened, e.g. to sign in to Studio. Studio's data is dev-only, so its
   * cases use an absolute `path` on the dev server; `setup` may skip the test when it isn't up.
   */
  setup?: (page: Page) => Promise<void>;
};

/** The computed type of the first visible match, for `type` sections. */
async function typeOf(page: Page, selector: string) {
  const el = page.locator(selector).filter({ visible: true }).first();
  await expect(el, `${selector} is missing`).toBeAttached();
  return el.evaluate((e) => {
    const cs = getComputedStyle(e);
    return {
      fontFamily: (cs.fontFamily.split(",")[0] ?? "").replace(/["']/g, "").trim(),
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontStretch: cs.getPropertyValue("font-stretch"),
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      color: cs.color,
      marginTop: cs.marginTop,
      width: `${Math.round(e.getBoundingClientRect().width)}px`,
    };
  });
}

async function settle(page: Page) {
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 4000))]));
  await images(page);
  await page.waitForTimeout(250);
}

/** Waits for every image to load and decode, so a cover still arriving doesn't flip a diff. */
async function images(page: Page) {
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        Array.from(document.images).map((img) =>
          (img.complete
            ? Promise.resolve()
            : new Promise((r) => {
                img.addEventListener("load", r, { once: true });
              })
          ).then(() => img.decode().catch(() => undefined)),
        ),
      ),
      new Promise((r) => setTimeout(r, 8000)),
    ]),
  );
}

async function shoot(page: Page, selector: string, opts: { band?: boolean; until?: string } = {}) {
  const el = page.locator(selector).filter({ visible: true }).first();
  await expect(el, `${selector} is missing`).toBeAttached();
  await el.scrollIntoViewIfNeeded();
  const options = { animations: "disabled", caret: "hide", style: MASK_CSS } as const;
  // One clip for every shot, with each edge rounded on its own: a section at a fractional y (a
  // 16px × 1.65 dek above it) would otherwise come out 1px taller or shorter on one side.
  const box = await el.evaluate(
    (e, { band, until }) => {
      const r = e.getBoundingClientRect();
      const end = until ? e.querySelector(until)?.getBoundingClientRect().bottom : r.bottom;
      if (end === undefined) throw new Error(`${until ?? ""} is missing`);
      const top = Math.round(r.top + scrollY);
      const left = band ? 0 : Math.round(r.left + scrollX);
      const right = band ? document.documentElement.clientWidth : Math.round(r.right + scrollX);
      return { x: left, y: top, width: right - left, height: Math.round(end + scrollY) - top };
    },
    { band: Boolean(opts.band), until: opts.until },
  );
  return PNG.sync.read(await page.screenshot({ ...options, fullPage: true, clip: box }));
}

/**
 * Content above a section can differ in height by a fraction of a pixel (masked D75 copy), so the
 * same layout would start at y = .27 on the board and .61 on the page and rasterize half a pixel
 * apart. Nudge the page section (CSS `translate`, under 1px) so its fractional offset matches the
 * board's; the clip then rounds both edges the same way.
 */
async function alignSubpixel(boardPage: Page, boardSel: string, sitePage: Page, pageSel: string) {
  const frac = (p: Page, sel: string) =>
    p
      .locator(sel)
      .filter({ visible: true })
      .first()
      .evaluate((e) => {
        const t = e.getBoundingClientRect().top + scrollY;
        return t - Math.floor(t);
      });
  const delta = (await frac(boardPage, boardSel)) - (await frac(sitePage, pageSel));
  if (Math.abs(delta) < 0.01) return;
  await sitePage
    .locator(pageSel)
    .filter({ visible: true })
    .first()
    .evaluate((e, d) => {
      (e as HTMLElement).style.translate = `0 ${d}px`;
    }, delta);
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
  if (s.boardScript) await boardPage.evaluate(s.boardScript);
  if (s.pageScript) await sitePage.evaluate(s.pageScript);
  // Removals and masks go in before measuring, so crops see the final layout.
  const remove = (selectors: string[]) => {
    for (const el of Array.from(document.querySelectorAll(selectors.join(", ")))) el.remove();
  };
  if (s.collapse?.board?.length) await boardPage.evaluate(remove, s.collapse.board);
  if (s.collapse?.page?.length) await sitePage.evaluate(remove, s.collapse.page);
  const css = (mask: string[] | undefined, extra: string) =>
    `${extra}\n${[...(mask ?? []), "[data-qa-mask]"].join(", ")} { visibility: hidden !important; }`;
  await boardPage.addStyleTag({ content: css(s.mask?.board, hide.board) });
  await sitePage.addStyleTag({ content: css(s.mask?.page, hide.page) });
  await images(sitePage);
  if (s.matchHeight) {
    const { board, page } = s.matchHeight;
    const h = await boardPage
      .locator(board)
      .first()
      .evaluate((e) => e.getBoundingClientRect().height);
    await sitePage
      .locator(page)
      .first()
      .evaluate((e, height) => {
        Object.assign((e as HTMLElement).style, { height: `${height}px`, overflow: "hidden" });
      }, h);
  }
  await alignSubpixel(boardPage, s.board, sitePage, s.page);
  const a = await shoot(boardPage, s.board, { ...(s.until ? { until: s.until.board } : {}) });
  const b = await shoot(sitePage, s.page, {
    ...(s.band ? { band: true } : {}),
    ...(s.until ? { until: s.until.page } : {}),
  });
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

/**
 * 08 · Fonts: when a section's diff is only glyph antialiasing (outlines of letters, not shifted
 * blocks) and every box inside it matches the board, its allowance may rise to 1%, with a note.
 */
export function antialiasOnly(sections: Section[], names: string[], why: string): Section[] {
  return sections.map((x) =>
    names.includes(x.name)
      ? { ...x, allowed: 0.01, note: `${x.note ? `${x.note}; ` : ""}08 · Fonts 1%: ${why}` }
      : x,
  );
}

/** One test per section, each comparing the board's crop with the page's, at the case's width. */
export function defineParity(cases: ParityCase[]) {
  for (const c of cases) {
    test.describe(`${c.name} @${c.width}`, () => {
      test.beforeEach(({ page }) => {
        test.skip(page.viewportSize()?.width !== c.width, `${c.name} is compared at ${c.width}`);
      });
      const pill = c.pill === "over-hero" ? PILL_OVER_HERO : PILL;
      const sections = c.pill ? [pill, ...c.sections] : c.sections;
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
          if (c.setup) await c.setup(page);
          await page.goto(`${c.path}${c.path.includes("?") ? "&" : "?"}qa=1`);
          await settle(page);
          const isPill = s.name === "nav";
          const hide = {
            board: isPill ? "" : `${PILL.board} { visibility: hidden !important; }`,
            page: isPill ? "" : `${PILL.page} { visibility: hidden !important; }`,
          };
          if (s.type) {
            const [want, got] = [await typeOf(boardPage, s.board), await typeOf(page, s.page)];
            await ctx.close();
            expect(got, `${s.name}: page type vs board`).toEqual(want);
            return;
          }
          const r = await compareSection(boardPage, page, c, s, info, hide);
          await ctx.close();
          expect(r, `board ${r.board}, page ${r.page}, ${r.differing} differ`).toMatchObject({ pass: true });
        });
      }
    });
  }
}
