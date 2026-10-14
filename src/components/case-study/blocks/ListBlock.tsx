import { RichText } from "~/components/rich/RichText";
import type { BlockPublished } from "~/lib/published";

import styles from "./Blocks.module.css";

type Props = { block: Extract<BlockPublished, { type: "list" }> };

/** `list`: bullets in the accent (chapter 01's assumptions); rows on phones. */
export function ListBlock({ block }: Props) {
  return (
    <div className={styles.list}>
      <RichText html={block.body} />
    </div>
  );
}
