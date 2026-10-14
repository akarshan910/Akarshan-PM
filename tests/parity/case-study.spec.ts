import { defineParity, type Section } from "./compare";

/**
 * The case study against CaseStudy, CaseStudyTablet and CaseStudyMobile: Puja engagement platform,
 * the boards' volume. Chapters 07 and 08 are Studio prompts on the boards, so the site shows six
 * (09 · D60); the chapter rail's list differs for the same reason and isn't compared.
 */
const chapters = (board: (i: number) => string): Section[] =>
  [1, 2, 3, 4, 5, 6].map((i) => ({
    name: `chapter-0${i}`,
    board: board(i),
    page: `#ch-0${i}`,
  }));

const tail: Section[] = [
  { name: "more-volumes", board: ".va > section:last-of-type", page: 'nav[aria-label="More volumes"]' },
  { name: "footer", board: "footer", page: "body footer" },
];

defineParity([
  {
    name: "case-1440",
    board: "CaseStudy",
    boardWidth: 1440,
    width: 1440,
    path: "/work/puja-engagement-platform/",
    pill: true,
    sections: [
      {
        name: "header",
        board: ".va > section:first-of-type",
        page: "main > header",
        // 09 · D60: the facts' "Add in Studio" cells hide on the site, so the facts row is masked.
        mask: { board: [".va > section:first-of-type dl"], page: ["main > header dl"] },
        note: "09 · D60: facts row masked",
      },
      {
        name: "prototype",
        board: 'section[aria-label="Interactive prototype"]',
        page: 'section[aria-label="Interactive prototype"]',
        // 09 · D60: generated art stands in for the board's drawn poster.
        mask: {
          board: ['section[aria-label="Interactive prototype"] .fadein'],
          page: ['section[aria-label="Interactive prototype"] [class*="_screen_"]'],
        },
        note: "09 · D60: poster art masked",
      },
      { name: "summary", board: 'section[aria-label="Summary"]', page: 'section[aria-label="Summary"]' },
      ...chapters((i) => `section#c${i}`),
      ...tail,
    ],
  },
  {
    name: "case-834",
    board: "CaseStudyTablet",
    boardWidth: 834,
    width: 834,
    path: "/work/puja-engagement-platform/",
    pill: true,
    sections: [
      {
        name: "header",
        board: ".va > section:first-of-type",
        page: "main > header",
        // 09 · D60: the facts' "Add in Studio" cells hide on the site, so the facts row is masked.
        mask: { board: [".va > section:first-of-type dl"], page: ["main > header dl"] },
        note: "09 · D60: facts row masked",
      },
      {
        name: "prototype",
        board: 'section[aria-label="Interactive prototype"]',
        page: 'section[aria-label="Interactive prototype"]',
      },
      { name: "summary", board: 'section[aria-label="Summary"]', page: 'section[aria-label="Summary"]' },
      {
        name: "chapter-bar",
        board: 'button[aria-label="Jump to chapter"]',
        page: 'button[aria-label="Jump to chapter"]',
      },
      ...chapters((i) => `article > section:nth-of-type(${i})`),
      // CaseStudyTablet ends at More volumes; it draws no footer.
      { name: "more-volumes", board: ".va > section:last-of-type", page: 'nav[aria-label="More volumes"]' },
    ],
  },
  {
    name: "case-390",
    board: "CaseStudyMobile",
    props: { state: "reading" },
    boardWidth: 390,
    width: 390,
    path: "/work/puja-engagement-platform/",
    pill: true,
    // The phone Summary also shows the problem and the proposal (HANDOFF › Decisions), so it
    // isn't compared with the board's measures-only block.
    sections: [
      { name: "header", board: ".va > header", page: "main > header" },
      {
        name: "prototype",
        board: 'section[aria-label="Prototype"]',
        page: 'section[aria-label="Interactive prototype"]',
      },
      { name: "chapter-bar", board: "button.cbar", page: 'button[aria-label="Jump to chapter"]' },
      ...chapters((i) => `section#ch-0${i}`),
      {
        name: "more-volumes",
        board: 'section[aria-label="More volumes"]',
        page: 'nav[aria-label="More volumes"]',
      },
      { name: "footer", board: "footer", page: "body footer" },
    ],
  },
]);
