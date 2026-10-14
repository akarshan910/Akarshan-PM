import { RichText } from "~/components/rich/RichText";
import type { BlockPublished } from "~/lib/published";

import styles from "./Blocks.module.css";

type Props = { block: Extract<BlockPublished, { type: "callout" }> };

/** `callout`: a note in a box, neutral or tinted with the accent. */
export function CalloutBlock({ block }: Props) {
  return (
    <div className={styles.callout} data-tone={block.tone}>
      <RichText html={block.body} />
    </div>
  );
}
