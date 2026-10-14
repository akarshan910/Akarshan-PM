import type { BlockPublished } from "~/lib/published";

import styles from "./Blocks.module.css";

type Props = { block: Extract<BlockPublished, { type: "heading" }> };

/** `heading`: an `h3`, drawn as the board's mono card heading. */
export function HeadingBlock({ block }: Props) {
  return <h3 className={styles.heading}>{block.body}</h3>;
}
