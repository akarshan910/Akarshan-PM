import type { CSSProperties } from "react";

import { chapterNumber, lastCardSpan } from "~/lib/case-study";
import type { BlockPublished } from "~/lib/published";

import styles from "./Blocks.module.css";

type Props = { block: Extract<BlockPublished, { type: "cards" }> };

/**
 * `cards`: chapter 02's priority cards when the items have kickers, chapter 03's hairline grid
 * when they don't, and the segment pills with `style: 'chips'`. 2, 3 or 4 columns on laptop, 2 on
 * iPad, 1 on phones (a numbered list for the hairline grid).
 */
export function CardsBlock({ block }: Props) {
  const { items, columns } = block;
  if (items.length === 0) return null;

  if (block.style === "chips") {
    return (
      <ul className={styles.chips}>
        {items.map((item, i) => (
          <li key={i} className={styles.chip}>
            {item.title}
          </li>
        ))}
      </ul>
    );
  }

  if (items.some((item) => item.kicker)) {
    return (
      <div className={styles.cards} style={{ "--cols": columns } as CSSProperties}>
        {items.map((item, i) => (
          <div key={i} className={styles.card}>
            {item.kicker ? <div className={styles.cardKicker}>{item.kicker}</div> : null}
            <div className={styles.cardTitle}>{item.title}</div>
            {item.note ? <p className={styles.cardNote}>{item.note}</p> : null}
          </div>
        ))}
      </div>
    );
  }

  const style = {
    "--cols": columns,
    "--last": lastCardSpan(items.length, columns),
    "--last2": lastCardSpan(items.length, 2),
  } as CSSProperties;
  return (
    <div className={styles.hairline} style={style}>
      {items.map((item, i) => (
        <div key={i} className={styles.cell}>
          <span className={styles.cellNum} aria-hidden="true">
            {chapterNumber(i)}
          </span>
          <span>
            <span className={styles.cellTitle}>{item.title}</span>
            {item.note ? (
              <>
                {" "}
                <span className={styles.cellNote}>{item.note}</span>
              </>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}
