import type { ReactNode } from "react";

import styles from "./Chip.module.css";
import { cx } from "../cx";

export type ChipTone = "neutral" | "ok" | "warn" | "err" | "outline";

interface ChipProps {
  tone?: ChipTone;
  /** 24px by default; "sm" is the 20px, 11px chip in list rows. */
  size?: "md" | "sm";
  /** The 6px dot before the label, as on "Live". */
  dot?: boolean | undefined;
  children: ReactNode;
}

/** Studio's status chip, `.chip`. */
export function Chip({ tone = "neutral", size = "md", dot, children }: ChipProps) {
  return (
    <span className={cx(styles.chip, styles[tone], size === "sm" ? styles.sm : "")}>
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/** `.mono`: the 12px uppercase label, `letter-spacing: .06em` in Studio. */
export function Mono({ children, as: Tag = "span" }: { children: ReactNode; as?: "span" | "div" | "p" }) {
  return <Tag className={styles.mono}>{children}</Tag>;
}
