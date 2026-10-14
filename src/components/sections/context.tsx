import { createContext, useContext } from "react";

import styles from "./Sections.module.css";

/** Page-level values the homepage sections share beyond their props. */
export interface HomeContextValue {
  /**
   * Legacy anchors (07 · Legacy links): the live site's `#exp`, `#testi` and `#work`, by the id of
   * the section that holds each.
   */
  anchors: ReadonlyMap<string, string>;
  /** The last site publish, for the footer's "Last updated". */
  updatedAt?: string;
}

export const HomeContext = createContext<HomeContextValue>({ anchors: new Map() });

export function useHomeContext(): HomeContextValue {
  return useContext(HomeContext);
}

/** The empty legacy anchor at the start of a section, when it has one. */
export function LegacyAnchor({ sectionId }: { sectionId: string }) {
  const id = useHomeContext().anchors.get(sectionId);
  return id ? <span id={id} className={styles.anchor} aria-hidden="true" /> : null;
}
