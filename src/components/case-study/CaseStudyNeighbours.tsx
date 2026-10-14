import type { CaseStudyView, Neighbour } from "~/lib/case-study";

import { cx } from "../cx";
import { Icon } from "../icons";
import styles from "./CaseStudy.module.css";

function Row({ n, kind }: { n: Neighbour; kind: "Previous" | "Next" }) {
  return (
    <a className={styles.row} href={`/work/${n.slug}`}>
      <span className={styles.tile} style={{ background: n.ground }} aria-hidden="true">
        <span className={styles.tileNum} style={{ background: n.accent }}>
          {n.volume}
        </span>
        <Icon
          name={kind === "Previous" ? "arrow-left" : "arrow-right"}
          size={28}
          style={{ color: n.accent }}
        />
      </span>
      <span>
        <span className={cx(styles.mono, styles.rowKicker, styles.stack)}>
          {kind}
          <span className="sr-only"> · VOL.{n.volume}</span>
        </span>
        <span className={cx(styles.rowTitle, styles.stack)}>{n.title}</span>
      </span>
    </a>
  );
}

/**
 * Prev / next in volume order (03 · Case study). Laptop: "← Previous · VOL.04" and
 * "Next · VOL.06 →"; iPad: "← VOL.04" and "VOL.06 →"; phones: "More volumes" with "Previous",
 * "Next" and "All work · N volumes". Each hides at its end; unlisted projects show none.
 */
export function CaseStudyNeighbours({ view }: { view: CaseStudyView }) {
  const { prev, next, volumes } = view;
  return (
    <>
      {prev || next ? (
        <nav className={cx(styles.neighbours, styles.notPhone)} aria-label="More volumes">
          <div className={cx("wrap", styles.wrapped, styles.neighboursInner)}>
            {prev ? (
              <a className={styles.nb} href={`/work/${prev.slug}`}>
                <span className={cx(styles.mono, styles.stack)}>
                  <span className={styles.notIpad}>← Previous · VOL.{prev.volume}</span>
                  <span className={styles.notLaptop}>← VOL.{prev.volume}</span>
                </span>
                <span className={cx(styles.nbTitle, styles.stack)}>{prev.title}</span>
              </a>
            ) : null}
            {next ? (
              <a className={cx(styles.nb, styles.nbNext)} href={`/work/${next.slug}`}>
                <span className={cx(styles.mono, styles.stack)}>
                  <span className={styles.notIpad}>Next · VOL.{next.volume} →</span>
                  <span className={styles.notLaptop}>VOL.{next.volume} →</span>
                </span>
                <span className={cx(styles.nbTitle, styles.stack)}>{next.title}</span>
              </a>
            ) : null}
          </div>
        </nav>
      ) : null}
      {volumes > 0 ? (
        <nav className={cx(styles.more, styles.notLaptop, styles.notIpad)} aria-label="More volumes">
          {prev ? <Row n={prev} kind="Previous" /> : null}
          {next ? <Row n={next} kind="Next" /> : null}
          <a className={styles.allRow} href="/work">
            <span className={styles.allLabel}>
              All work · {volumes} {volumes === 1 ? "volume" : "volumes"}
            </span>
            <Icon name="arrow-right" />
          </a>
        </nav>
      ) : null}
    </>
  );
}
