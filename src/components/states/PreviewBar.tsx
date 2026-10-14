import styles from "./PreviewBar.module.css";

interface PreviewBarProps {
  /** Whole days until the preview link expires (links last 7 days). */
  daysLeft: number;
}

function expiry(days: number): string {
  if (days <= 0) return "expires today";
  return days === 1 ? "expires in 1 day" : `expires in ${days} days`;
}

/**
 * C21 · Draft preview bar (PublicStates.dc.html › Pages › Draft preview link). It can't be
 * closed. On phones it wraps to two lines.
 */
export function PreviewBar({ daysLeft }: PreviewBarProps) {
  return (
    <div className={styles.bar} role="region" aria-label="Draft preview">
      <span>Draft preview · not public · {expiry(daysLeft)}</span>
      <span className={styles.who}>Only people with this link can see it</span>
    </div>
  );
}

/** "Changed since the live version": marks a block that differs from the published page. */
export function ChangedMark() {
  return <div className={styles.changed}>Changed since the live version</div>;
}
