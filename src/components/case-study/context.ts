import { createContext, useContext } from "react";

import type { ProjectPublished } from "~/lib/published";

/** What a block needs from its page: the outcomes a metrics block names, the prototype it opens. */
export interface CaseStudyContextValue {
  project: ProjectPublished;
}

export const CaseStudyContext = createContext<CaseStudyContextValue | null>(null);

export function useCaseStudy(): CaseStudyContextValue {
  const value = useContext(CaseStudyContext);
  if (!value) throw new Error("Case-study blocks render inside <CaseStudyContext>.");
  return value;
}
