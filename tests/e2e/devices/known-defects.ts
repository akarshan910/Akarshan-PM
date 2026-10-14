/**
 * Defects QA has filed and that aren't fixed yet. A check that hits one runs as `test.fail` with
 * the defect's ID, so the suite stays green while it's open and turns red ("expected to fail")
 * the moment it's fixed: then delete the entry. Details live in the owning agent's inbox and
 * .agents/qa/progress.md.
 */
export type Known = { id: string; note: string; pages: string[]; when: (width: number) => boolean };

export const KNOWN: Known[] = [
  {
    id: "QA-D5",
    note: "Choosing a chapter in the sheet leaves focus on <body>: the link's own fragment navigation runs after onClick focuses the h2 (ChapterNav.tsx:143)",
    pages: ["chapter sheet focus"],
    when: () => true,
  },
];

export function knownDefect(page: string, width: number) {
  return KNOWN.find((k) => k.pages.includes(page) && k.when(width));
}
