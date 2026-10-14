import { defineParity, type Section } from "./compare";

/**
 * The case study against CaseStudy, CaseStudyTablet and CaseStudyMobile: Puja engagement platform,
 * the boards' volume. Chapters 07 and 08 are Studio prompts on the boards, so the site shows six
 * (09 · D60); the chapter rail's list differs for the same reason and isn't compared.
 */
/**
 * 09 · D75: the boards draw the chapter numeral in different reds (CaseStudy's --pa #E8273A,
 * CaseStudyMobile's #FF5A67), so the numeral is masked; the chapter around it is compared.
 */
const chapters = (board: (i: number) => string): Section[] =>
  [1, 2, 3, 4, 5, 6].map((i) => ({
    name: `chapter-0${i}`,
    board: board(i),
    page: `[data-chapter="0${i}"]`,
    mask: { board: [".chn", ".cs-num"], page: ['[class*="_chn_"]'] },
    note: "09 · D75: chapter numeral colour differs between boards",
  }));

/**
 * The header from the top to the title's bottom: back link, tags and title, with their spacing.
 * 09 · D75: the tag chip and company line are illustrative copy two boards draw differently (masked),
 * and the dek below the title isn't compared. The facts row below it is D60.
 */
const header = (root: string): Section => ({
  name: "header",
  board: root,
  page: "main > header",
  until: { board: "h1", page: "h1" },
  mask: {
    board: [`${root} > div > span:not(:first-child)`],
    page: ["main > header > div > span:not(:first-child)"],
  },
  note: "09 · D75: tag chip and company masked; dek and facts (D60) not compared",
});

/**
 * The dek's copy differs between boards (D75), so its height does too; its type is compared instead
 * (size, weight, line height, measure, colour, spacing above), as review's D75 audit asked.
 */
const dek = (root: string): Section => ({
  name: "header-dek-type",
  board: `${root} > p`,
  page: "main > header > p",
  type: true,
  note: "09 · D75: dek copy differs; its type is compared",
});

/** 09 · D75: chapter 05's drawn phone figure stands in for media the fixture doesn't have. */
const withoutFigure = (sections: Section[], figure: string): Section[] =>
  sections.map((x) =>
    x.name === "chapter-05"
      ? { ...x, collapse: { board: [figure] }, note: "09 · D75: drawn figure removed, numeral masked" }
      : x,
  );

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
      header(".va > section:first-of-type"),
      dek(".va > section:first-of-type"),
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
      ...withoutFigure(
        chapters((i) => `section#c${i}`),
        "#c5 > figure",
      ),
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
      header(".va > section:first-of-type"),
      dek(".va > section:first-of-type"),
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
      header(".va > header"),
      dek(".va > header"),
      {
        name: "prototype",
        board: 'section[aria-label="Prototype"]',
        page: 'section[aria-label="Interactive prototype"]',
      },
      { name: "chapter-bar", board: "button.cbar", page: 'button[aria-label="Jump to chapter"]' },
      ...withoutFigure(
        chapters((i) => `section#ch-0${i}`),
        "#ch-05 > div:nth-last-of-type(-n+2)",
      ),
      {
        name: "more-volumes",
        board: 'section[aria-label="More volumes"]',
        page: 'nav[aria-label="More volumes"]',
      },
      { name: "footer", board: "footer", page: "body footer" },
    ],
  },
]);
