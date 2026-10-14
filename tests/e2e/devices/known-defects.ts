/**
 * Defects QA has filed and that aren't fixed yet. A check that hits one runs as `test.fail` with
 * the defect's ID, so the suite stays green while it's open and turns red ("expected to fail")
 * the moment it's fixed: then delete the entry. Details live in the owning agent's inbox and
 * .agents/qa/progress.md.
 */
export type Known = { id: string; note: string; pages: string[]; when: (width: number) => boolean };

export const KNOWN: Known[] = [
  {
    id: "QA-S1",
    note: "Studio phone: the fixed bottom tab bar fully covers focused dashboard cards (2.4.11); add scroll-padding for the bars",
    pages: ["studio dashboard focus"],
    when: (w) => w < 768,
  },
  {
    id: "QA-S2",
    note: "Studio screens after sign-in are all titled just 'Studio' (2.4.2)",
    pages: ["studio titles"],
    when: () => true,
  },
  {
    id: "QA-S3",
    note: "Studio sign-in on phones has no h1: the side panel holding it is hidden, the form title is h2",
    pages: ["studio sign-in h1"],
    when: (w) => w < 768,
  },
];

export function knownDefect(page: string, width: number) {
  return KNOWN.find((k) => k.pages.includes(page) && k.when(width));
}
