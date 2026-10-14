import { defineParity, type Section } from "./compare";

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

const sections = (testimonials: string, strategy: Partial<Section> = {}): Section[] => [
  { name: "hero", board: 'section[aria-label="Introduction"]', page: "#hero" },
  { name: "proof", board: 'section[aria-label="Highlights"]', page: "#proof" },
  { name: "shipped", board: "section#work", page: "#shipped" },
  { name: "strategy", board: "section#strategy", page: "#strategy", ...strategy },
  { name: "about", board: "section#about", page: "#about" },
  { name: "experience", board: "section#experience", page: "#experience" },
  { name: "skills", board: "section#skills", page: "#skills" },
  { name: "testimonials", board: testimonials, page: "#testimonials" },
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
    sections: sections('section:has(h2:has-text("What teammates say"))'),
  },
  {
    name: "home-390",
    board: "HomeMobile",
    props: { nav: "menu closed" },
    boardWidth: 390,
    width: 390,
    path: "/",
    pill: "over-hero",
    sections: sections("section#testimonials"),
  },
]);
