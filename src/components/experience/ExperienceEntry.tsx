import { Fragment, type ReactNode, useId, useState } from "react";

import { AccordionRow } from "~/components/accordion/AccordionRow";
import { Icon } from "~/components/icons";

import styles from "./Experience.module.css";

export type ExperienceKind = "featured" | "standard" | "compact" | "education";

export interface HighlightItem {
  id: string;
  /** Sanitised inline text; `<strong>` renders brighter. */
  text: ReactNode;
  /** Hidden items are left out of the HTML (03 · Experience). */
  hidden?: boolean;
}

export interface HighlightGroup {
  id: string;
  /** A group title makes the Featured entry show highlight cards (02 · C13). */
  title?: string;
  items: HighlightItem[];
}

export interface ExperienceEntryProps {
  kind: ExperienceKind;
  company: string;
  /** The role; for education, the degree. */
  jobTitle?: string;
  location?: string;
  dates?: string;
  /** The summary paragraph. Empty hides it. */
  summary?: ReactNode;
  highlights?: HighlightGroup[];
}

/** Phones show the first four bullets of a Featured entry, then "All {company} highlights". */
const PHONE_BULLETS = 4;

/** Which layouts show an element: l = laptop, i = iPad, p = phone. */
function show(where: string): string {
  return [
    where.includes("l") ? "" : styles.hideLaptop,
    where.includes("i") ? "" : styles.hideIpad,
    where.includes("p") ? "" : styles.hidePhone,
  ]
    .filter(Boolean)
    .join(" ");
}

function cx(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/**
 * C13 · One experience entry, in every device's layout (02 · C13, 03 · Experience):
 *
 * - Featured: two columns on laptop, stacked on iPad and phones; highlight cards when grouped,
 *   otherwise the bullet grid; phones show four bullets and expand the rest in place.
 * - Standard: summary and the bullet grid on laptop, one paragraph on iPad, an accordion on phones.
 * - Compact and Education: one paragraph on laptop, an accordion (C14) on iPad and phones.
 */
export function ExperienceEntry({
  kind,
  company,
  jobTitle,
  location,
  dates,
  summary,
  highlights = [],
}: ExperienceEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const bulletsId = useId();
  const groups = highlights
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.hidden) }))
    .filter((g) => g.items.length > 0);
  const items = groups.flatMap((g) => g.items);
  const grouped = kind === "featured" && groups.some((g) => g.title);
  const roleLine = [jobTitle, location].filter(Boolean).join(" · ");

  const meta = (
    <div className={styles.meta}>
      {dates ? <div className={styles.dates}>{dates}</div> : null}
      <div className={styles.company}>{company}</div>
      {roleLine && kind !== "education" ? <div className={styles.role}>{roleLine}</div> : null}
    </div>
  );

  // One paragraph: the summary, or the bullets joined with "·" (the iPad board's Standard entry).
  const paragraph =
    summary ??
    (items.length > 0
      ? items.map((item, i) => (
          <Fragment key={item.id}>
            {i > 0 ? " · " : null}
            {item.text}
          </Fragment>
        ))
      : null);

  let body: ReactNode;
  if (kind === "featured") {
    body = (
      <>
        {summary ? <p className={styles.summary}>{summary}</p> : null}
        {grouped ? (
          <div className={cx(styles.cards, show("li"))}>
            {groups.map((g) => (
              <div key={g.id} className={styles.card}>
                {g.title ? <div className={styles.cardTitle}>{g.title}</div> : null}
                <ul className={styles.cardList}>
                  {g.items.map((item) => (
                    <li key={item.id}>{item.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
        {items.length > 0 ? (
          <ul id={bulletsId} className={cx(styles.bullets, !grouped && styles.grid, grouped && show("p"))}>
            {items.map((item, i) => (
              <li key={item.id} className={i >= PHONE_BULLETS ? styles.extra : undefined}>
                {item.text}
              </li>
            ))}
          </ul>
        ) : null}
        {items.length > PHONE_BULLETS ? (
          <button
            type="button"
            className={styles.more}
            aria-expanded={expanded}
            aria-controls={bulletsId}
            onClick={() => {
              setExpanded((e) => !e);
            }}
          >
            All {company} highlights
            <Icon name="arrow-down" className={`ico ${styles.moreIcon ?? ""}`} />
          </button>
        ) : null}
      </>
    );
  } else if (kind === "education") {
    const degree = summary ?? jobTitle;
    body = degree ? <p className={styles.para}>{degree}</p> : null;
  } else {
    const standard = kind === "standard";
    body = (
      <>
        {summary ? <p className={cx(styles.summary, show(standard ? "lp" : "ip"))}>{summary}</p> : null}
        {paragraph ? <p className={cx(styles.para, show(standard ? "i" : "l"))}>{paragraph}</p> : null}
        {items.length > 0 ? (
          <ul className={cx(styles.bullets, standard && styles.grid, show(standard ? "lp" : "ip"))}>
            {items.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        ) : null}
      </>
    );
  }
  const main = <div className={styles.main}>{body}</div>;

  if (kind === "featured") {
    return (
      <article className={cx(styles.entry, styles.featured, expanded && styles.expanded)}>
        {meta}
        {main}
      </article>
    );
  }
  const subtitle = [jobTitle, dates].filter(Boolean).join(" · ");
  return (
    <article className={cx(styles.entry, styles[kind])}>
      <AccordionRow title={company} subtitle={subtitle} collapse={kind === "standard" ? "phone" : "touch"}>
        {meta}
        {main}
      </AccordionRow>
    </article>
  );
}
