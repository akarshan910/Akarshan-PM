import type { BlockPublished } from "~/lib/published";

import styles from "./Blocks.module.css";

type Props = { block: Extract<BlockPublished, { type: "quote" }> };

/** `quote`: WritingPublic's pull quote, with an optional cite. */
export function QuoteBlock({ block }: Props) {
  return (
    <figure className={styles.figure}>
      <blockquote className={styles.quote}>
        <p>{block.body}</p>
        {block.cite ? <cite>{block.cite}</cite> : null}
      </blockquote>
    </figure>
  );
}
