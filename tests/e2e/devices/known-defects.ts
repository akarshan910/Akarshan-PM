/**
 * Defects QA has filed and that aren't fixed yet. A check that hits one runs as `test.fail` with
 * the defect's ID, so the suite stays green while it's open and turns red ("expected to fail")
 * the moment it's fixed: then delete the entry. Details live in the owning agent's inbox and
 * .agents/qa/progress.md.
 */
export type Known = { id: string; note: string; pages: string[]; when: (width: number) => boolean };

export const KNOWN: Known[] = [
  {
    id: "QA-S5",
    note: "Website builder: pin, count and 'off' labels fail colour contrast (1.4.3)",
    pages: ["studio website axe"],
    when: () => true,
  },
  {
    id: "QA-S6",
    note: "Preview: the scrolling main isn't keyboard-focusable on iPad and phones (2.1.1, axe scrollable-region-focusable)",
    pages: ["studio preview axe"],
    when: (w) => w <= 834,
  },
  {
    id: "QA-S7",
    note: "Studio pages scroll sideways (1.4.10): editor cards at 320, URL & SEO at ≤390",
    pages: ["studio editor overview overflow", "studio editor visuals overflow"],
    when: (w) => w <= 320,
  },
  {
    id: "QA-S7",
    note: "Studio pages scroll sideways (1.4.10): URL & SEO cards 426px wide at 390",
    pages: ["studio editor url-seo overflow"],
    when: (w) => w <= 390,
  },
  {
    id: "QA-S7",
    note: "Studio pages scroll sideways (1.4.10): Media's buttons run to 537px on phones",
    pages: ["studio media overflow"],
    when: (w) => w < 768,
  },
  {
    id: "QA-S7",
    note: "Studio pages scroll sideways (1.4.10): Preview's device view is 1152px wide at iPad landscape",
    pages: ["studio preview overflow"],
    when: (w) => w >= 1024 && w < 1280,
  },
  {
    id: "QA-S8",
    note: "Phone upload sheet: Esc drops focus to <body> instead of the Upload button (2.4.3)",
    pages: ["studio media upload sheet"],
    when: (w) => w < 768,
  },
  {
    id: "QA-S9",
    note: "Studio targets under 44px on touch layouts (08): iPad landscape misses .t44; swatches, toggles, chips, builder rows",
    pages: [
      "studio dashboard targets",
      "studio editor visuals targets",
      "studio writing targets",
      "studio media targets",
      "studio website targets",
      "studio editor url-seo targets",
      "studio profile targets",
      "studio preview targets",
    ],
    when: (w) => w < 1280,
  },
  {
    id: "QA-S9",
    note: "Studio targets under 44px at iPad landscape: .t44 stops at 1023px",
    pages: [
      "studio projects targets",
      "studio editor overview targets",
      "studio editor story targets",
      "studio editor outcomes targets",
    ],
    when: (w) => w >= 1024 && w < 1280,
  },
  {
    id: "QA-S10",
    note: "No focus indicator on the website builder's and preview's iframes (2.4.7)",
    pages: ["studio website focus", "studio preview focus"],
    when: () => true,
  },
];

export function knownDefect(page: string, width: number) {
  return KNOWN.find((k) => k.pages.includes(page) && k.when(width));
}
