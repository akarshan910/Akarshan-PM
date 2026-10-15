import { antialiasOnly, defineParity, type Section } from "./compare";

/** Home against Home, HomeTablet and HomeMobile (08 · What's compared), with the boards fixture. */

/** 09 · D60 masks for the strategy shelf, checked against Home.dc.html's markup (1440 only). */
const STRATEGY_D60: Partial<Section> = {
  // Generated covers stand in for board artwork, and the lead card shows two results where the
  // boards differ. Covers and the lead's results are masked on both sides.
  mask: { board: ["#strategy .cv > svg", "#strategy .cv > div"], page: ['#strategy [class*="_cv_"] > img'] },
  boardScript:
    "document.querySelector('#strategy .tag-t')?.closest('div')?.parentElement?.setAttribute('data-qa-mask', '')",
  pageScript: "document.querySelector('#strategy [class*=\"_results_\"]')?.setAttribute('data-qa-mask', '')",
  note: "09 · D60: covers and the lead card's results masked",
};

/**
 * 09 · D75, iPad and phone: the boards draw 2 short testimonial cards; the rail stretches every card to
 * the tallest of all 7 (full quotes). Compared to the heading's bottom, plus the first card's type.
 */
const TESTIMONIALS_D75: Partial<Section> = {
  until: { board: "h2", page: "h2" },
  note: "09 · D75: card heights follow quotes the boards don't draw; compared to the heading",
};
const firstCardType = (board: string): Section => ({
  name: "testimonials-card-type",
  board: `${board} figure`,
  page: "#testimonials figure",
  type: true,
  note: "09 · D75: card copy differs; its type is compared",
});

/**
 * 09 · D60 at iPad and phone: generated covers stand in for the boards' drawn cover art. The
 * boards draw each cover as the card's first block; the page's is `_cv_`. Covers only: the
 * cards around them are compared.
 */
const COVERS_D60 = {
  board: ["#strategy a > div:first-child"],
  page: ['#strategy [class*="_cv_"]'],
};

/**
 * 09 · D75, phone: HomeMobile's strategy lead draws no summary (CaseStudyMobile uses it as the dek)
 * and words the result "orders per user" where the fixture says "monthly orders per user".
 */
const markResult =
  "[...document.querySelectorAll('#strategy *')].find((e) => !e.children.length && /orders per user/.test(e.textContent))?.setAttribute('data-qa-mask', '')";
const STRATEGY_PHONE_D75: Partial<Section> = {
  mask: COVERS_D60,
  collapse: { page: ['#strategy [class*="_leadSummary_"]'] },
  boardScript: markResult,
  pageScript: markResult,
  note: "09 · D75: lead summary removed (page), result label masked; D60: covers masked",
};

const sections = (
  testimonials: string,
  strategy: Partial<Section> = {},
  testimonialsExtra: Partial<Section> = {},
): Section[] => [
  { name: "hero", board: 'section[aria-label="Introduction"]', page: "#hero" },
  { name: "proof", board: 'section[aria-label="Highlights"]', page: "#proof" },
  { name: "shipped", board: "section#work", page: "#shipped" },
  { name: "strategy", board: "section#strategy", page: "#strategy", ...strategy },
  { name: "about", board: "section#about", page: "#about" },
  { name: "experience", board: "section#experience", page: "#experience" },
  { name: "skills", board: "section#skills", page: "#skills" },
  { name: "testimonials", board: testimonials, page: "#testimonials", ...testimonialsExtra },
  ...(testimonialsExtra.until ? [firstCardType(testimonials)] : []),
  { name: "offduty", board: "section#offduty", page: "#offduty" },
  { name: "contact", board: "section#contact", page: "#contact" },
  { name: "footer", board: "footer", page: "body footer" },
];

defineParity([
  {
    name: "home-1440",
    board: "Home",
    boardWidth: 1440,
    width: 1440,
    path: "/",
    pill: "over-hero",
    sections: sections("section#testimonials", STRATEGY_D60),
  },
  {
    name: "home-834",
    board: "HomeTablet",
    boardWidth: 834,
    width: 834,
    path: "/",
    pill: "over-hero",
    // HomeTablet's testimonials section has no id.
    sections: antialiasOnly(
      sections(
        'section:has(h2:has-text("What teammates say"))',
        { mask: COVERS_D60, note: "09 · D60: covers masked" },
        TESTIMONIALS_D75,
      ),
      ["offduty"],
      "every box matches the board to 0.01px (portfolio's round 4 measurement); the diff is glyph outlines",
    ),
  },
  {
    name: "home-390",
    board: "HomeMobile",
    props: { nav: "menu closed" },
    boardWidth: 390,
    width: 390,
    path: "/",
    pill: "over-hero",
    sections: antialiasOnly(
      sections("section#testimonials", STRATEGY_PHONE_D75, TESTIMONIALS_D75),
      ["experience"],
      "every box matches the board to 0.01px (portfolio's round 4 measurement); the diff is glyph outlines",
    ),
  },
]);
