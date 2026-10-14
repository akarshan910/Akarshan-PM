import { defineParity, type Section } from "./compare";

/** Home against Home, HomeTablet and HomeMobile (08 · What's compared), with the boards fixture. */
const sections = (testimonials: string): Section[] => [
  { name: "hero", board: 'section[aria-label="Introduction"]', page: "#hero" },
  { name: "proof", board: 'section[aria-label="Highlights"]', page: "#proof" },
  { name: "shipped", board: "section#work", page: "#shipped" },
  { name: "strategy", board: "section#strategy", page: "#strategy" },
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
    pill: true,
    sections: sections("section#testimonials"),
  },
  {
    name: "home-834",
    board: "HomeTablet",
    boardWidth: 834,
    width: 834,
    path: "/",
    pill: true,
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
    pill: true,
    sections: sections("section#testimonials"),
  },
]);
