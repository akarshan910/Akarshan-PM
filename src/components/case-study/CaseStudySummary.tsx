import { ResultLabel } from "~/components/labels/ResultLabel";
import { hasRichText, RichText } from "~/components/rich/RichText";
import type { ProjectPublished } from "~/lib/published";

import { cx } from "../cx";
import styles from "./CaseStudy.module.css";

/**
 * The Summary: "The problem", "What I proposed" and "Success measures" (the outcomes in the strip).
 * Laptop: three cards. iPad: rows in one frame. Phones: stacked, with the measures as cards.
 * Each part hides on its own, and the section hides when all three are empty.
 */
export function CaseStudySummary({ project }: { project: ProjectPublished }) {
  const { problem, proposal } = project.overview;
  const measures = project.outcomes.filter((o) => o.inStrip);
  const texts = [
    { label: "The problem", body: problem },
    { label: "What I proposed", body: proposal },
  ].filter((t): t is { label: string; body: string } => hasRichText(t.body));
  if (texts.length === 0 && measures.length === 0) return null;
  return (
    <section className={cx("wrap", styles.wrapped, styles.summarySection)} aria-label="Summary">
      <div className={styles.summaryGrid}>
        {texts.map((t) => (
          <div key={t.label} className={styles.sumItem}>
            <h2 className={styles.mono}>{t.label}</h2>
            <p className={styles.sumText}>
              <RichText html={t.body} inline />
            </p>
          </div>
        ))}
        {measures.length > 0 ? (
          <div className={styles.sumItem}>
            <h2 className={styles.mono}>Success measures</h2>
            <ul className={styles.measures}>
              {measures.map((o) => (
                <li key={o.id} className={styles.measure}>
                  <span className={styles.measureText}>
                    <span className={styles.measureValue}>{o.value}</span>{" "}
                    <span className={styles.measureLabel}>{o.label}</span>
                  </span>
                  <ResultLabel type={o.type} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
