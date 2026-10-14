import type { CSSProperties } from "react";

import type { BlockPublished } from "~/lib/published";

import styles from "./Blocks.module.css";

type Props = { block: Extract<BlockPublished, { type: "journey" }> };

/** `journey`: numbered stages in a row (chapter 05); a vertical list on phones. */
export function JourneyBlock({ block }: Props) {
  if (block.stages.length === 0) return null;
  return (
    <ol className={styles.journey} style={{ "--stages": block.stages.length } as CSSProperties}>
      {block.stages.map((stage, i) => (
        <li key={i} className={styles.stage}>
          <i className={styles.stageNum}>{i + 1}</i>
          <span className={styles.stageTitle}>{stage.title}</span>
          {stage.note ? <span className={styles.stageNote}>{stage.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}
