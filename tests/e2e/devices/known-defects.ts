/**
 * Defects QA has filed and that aren't fixed yet. A check that hits one runs as `test.fail` with
 * the defect's ID, so the suite stays green while it's open and turns red ("expected to fail")
 * the moment it's fixed: then delete the entry. Details live in the owning agent's inbox and
 * .agents/qa/progress.md.
 */
export type Known = { id: string; note: string; pages: string[]; when: (width: number) => boolean };

export const KNOWN: Known[] = [
  {
    id: "QA-S13",
    note: "Editor Overview at 320: two side-by-side fields (`_fld_`) reach 332px once text is a little wider (Linux metrics), so the page scrolls sideways",
    pages: ["studio editor overview wider text"],
    when: (w) => w <= 320,
  },
  {
    id: "QA-P1",
    note: "zod 4's `allowsEval` probe (`new Function`) triggers a script-src 'eval' CSP violation on every page; links.ts → schemas.ts → zod. Fix: z.config({ jitless: true }) or keep zod off public pages",
    pages: ["csp"],
    when: () => true,
  },
];

export function knownDefect(page: string, width: number) {
  return KNOWN.find((k) => k.pages.includes(page) && k.when(width));
}
