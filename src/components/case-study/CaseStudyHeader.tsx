import type { CSSProperties } from "react";

import { caseStudyFacts, type CaseStudyView, companyLine, lastCardSpan } from "~/lib/case-study";

import { cx } from "../cx";
import { Icon } from "../icons";
import styles from "./CaseStudy.module.css";

/**
 * The case study's header: "All work", the volume tag, the chip and the company line, the title,
 * the summary and the facts row. Each part hides on its own (03 · Case study).
 */
export function CaseStudyHeader({ view }: { view: CaseStudyView }) {
  const { overview } = view.project;
  const facts = caseStudyFacts(overview);
  const company = companyLine(overview);
  return (
    <header className={cx("wrap", styles.wrapped, styles.head)}>
      <a className={styles.back} href="/work">
        <Icon name="arrow-left" size={16} />
        All work
      </a>
      {view.volume || overview.cardLabel || company ? (
        <div className={styles.tags}>
          {view.volume ? <span className={styles.vol}>VOL.{view.volume}</span> : null}
          {overview.cardLabel ? <span className={styles.chip}>{overview.cardLabel}</span> : null}
          {company ? (
            <span className={cx(styles.mono, styles.company, styles.notIpad, styles.notPhone)}>
              {company}
            </span>
          ) : null}
        </div>
      ) : null}
      <h1 className={styles.title}>{overview.title}</h1>
      {overview.summary ? <p className={styles.summary}>{overview.summary}</p> : null}
      {facts.length > 0 ? (
        <dl className={styles.facts} style={{ "--last3": lastCardSpan(facts.length, 3) } as CSSProperties}>
          {facts.map((fact) => (
            <div key={fact.label} className={cx(styles.fact, fact.label === "Focus" && styles.factWide)}>
              <dt className={styles.mono}>{fact.label}</dt>
              <dd>
                {fact.href ? (
                  <a href={fact.href} target="_blank" rel="noopener noreferrer">
                    {fact.value}
                    <span aria-hidden="true"> ↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
