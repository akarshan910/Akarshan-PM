/**
 * C4 · Section header: kicker, the title with its grey second half, and the intro (02 · C4).
 * The two-tone split is stored data (`title`, `titleMuted`); strings are never split here. An empty
 * kicker or intro is left out entirely (03 · Headers).
 */
import type { ReactNode } from "react";

import { cx } from "../cx";
import styles from "./SectionHeader.module.css";

export interface SectionHeaderProps {
  /** The `h2`'s id, for the section's `aria-labelledby`. */
  id?: string;
  kicker?: string | undefined;
  title: string;
  /** The second half, in `--tx3`. A space separates it from `title`. */
  titleMuted?: string | undefined;
  /** Plain text, or the sanitised inline rendering of `header.intro` (06 · Rich text). */
  intro?: ReactNode;
  /**
   * `shelf` (default): a 420px intro at 15px in `--tx3`, hidden on iPad and phones.
   * `wide`: About's 480px intro at 17px in `--tx2`, kept on every device.
   */
  variant?: "shelf" | "wide";
  className?: string;
}

export function SectionHeader({
  id,
  kicker,
  title,
  titleMuted,
  intro,
  variant = "shelf",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cx(styles.head, variant === "wide" ? styles.wide : styles.shelf, className)}>
      <div>
        {kicker && <div className={styles.kicker}>{kicker}</div>}
        <h2 id={id} className={styles.title}>
          {title}
          {titleMuted && (
            <>
              {" "}
              <span className={styles.muted}>{titleMuted}</span>
            </>
          )}
        </h2>
      </div>
      {intro && <p className={styles.intro}>{intro}</p>}
    </div>
  );
}
