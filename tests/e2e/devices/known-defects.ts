/**
 * Defects QA has filed and that aren't fixed yet. A check that hits one runs as `test.fail` with
 * the defect's ID, so the suite stays green while it's open and turns red ("expected to fail")
 * the moment it's fixed: then delete the entry. Details live in the owning agent's inbox and
 * .agents/qa/progress.md.
 */
export type Known = { id: string; note: string; pages: string[]; when: (width: number) => boolean };

export const KNOWN: Known[] = [
  {
    id: "QA-D1",
    note: "Case-study lists overflow on phones: `.list li { display: flex }` (Blocks.module.css, phone block)",
    pages: ["case arcana", "case glp-1", "case revenue"],
    when: (w) => w < 768,
  },
  {
    id: "QA-D1",
    note: "Same cause; word-games' boxed lists only overflow at 320",
    pages: ["case word-games"],
    when: (w) => w <= 320,
  },
  {
    id: "QA-D4",
    note: "Contact's LinkedIn and GitHub links open a new tab without '(opens in a new tab)' (ContactBlock.tsx:156, :162)",
    pages: ["home new-tab"],
    when: () => true,
  },
];

export function knownDefect(page: string, width: number) {
  return KNOWN.find((k) => k.pages.includes(page) && k.when(width));
}
