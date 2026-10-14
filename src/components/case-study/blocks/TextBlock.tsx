import { RichText } from "~/components/rich/RichText";
import type { BlockPublished } from "~/lib/published";

import { cx } from "../../cx";
import styles from "./Blocks.module.css";

type Props = { block: Extract<BlockPublished, { type: "text" }> };

/** `text`: body copy in `--tx2`, or the larger lead in `--tx` (chapter 01 "Objective"). */
export function TextBlock({ block }: Props) {
  return (
    <div className={cx(styles.text, block.style === "lead" && styles.lead)}>
      <RichText html={block.body} />
    </div>
  );
}
