import type { BlockGroup } from "~/lib/case-study";

import styles from "./Blocks.module.css";
import { ListBlock } from "./ListBlock";

type Props = { group: Extract<BlockGroup, { kind: "boxes" }> };

/**
 * The boxed list: a heading followed by a list, as one `--bg2` box with the heading as its mono
 * label ("Assumptions"). Neighbouring boxes share a grid (chapter 06's two cards).
 */
export function BoxesBlock({ group }: Props) {
  return (
    <div className={styles.boxes}>
      {group.boxes.map(({ heading, list }) => (
        <div key={heading.id} className={styles.box}>
          <h3 className={styles.heading}>{heading.body}</h3>
          <ListBlock block={list} />
        </div>
      ))}
    </div>
  );
}
