import { hasRichText, RichText } from "~/components/rich/RichText";
import type { BlockPublished } from "~/lib/published";

import { cx } from "../../cx";
import styles from "./Blocks.module.css";

type Props = { block: Extract<BlockPublished, { type: "ownership" }> };

/** `ownership`: chapter 07's columns, each hiding when empty, and the key decision below. */
export function OwnershipBlock({ block }: Props) {
  const columns = [
    { label: "I owned", body: block.mine },
    { label: "I partnered on", body: block.team },
    { label: "Team or business", body: block.business },
  ].filter((c): c is { label: string; body: string } => hasRichText(c.body));
  const decision = hasRichText(block.decision) ? block.decision : undefined;
  if (columns.length === 0 && !decision) return null;
  return (
    <div>
      {columns.length > 0 ? (
        <div className={styles.ownership}>
          {columns.map((c) => (
            <div key={c.label} className={styles.own}>
              <h3 className={styles.heading}>{c.label}</h3>
              <div className={styles.ownBody}>
                <RichText html={c.body} inline />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {decision ? (
        <div className={cx(styles.own, columns.length > 0 && styles.decision)}>
          <h3 className={styles.heading}>Key decision and trade-off</h3>
          <div className={styles.ownBody}>
            <RichText html={decision} inline />
          </div>
        </div>
      ) : null}
    </div>
  );
}
