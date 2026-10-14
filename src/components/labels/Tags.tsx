/** C6 · Volume tag, status badge, chip, availability chip and filter chip (02 · C6). */
import type { CSSProperties, ReactNode } from "react";

import { cx } from "../cx";
import { Icon } from "../icons";
import styles from "./Tags.module.css";

export interface VolumeTagProps {
  /** The two-digit volume number from `src/lib/volumes.ts`, e.g. "05". Empty: the tag hides. */
  number?: string | undefined;
  /** The project accent, e.g. "#FF5A67". */
  accent: string;
  /** `lead` 6px 10px, `standard` 5px 9px, `compact` the phone row's `NN` at 11px. */
  size?: "lead" | "standard" | "compact";
  className?: string | undefined;
}

export function VolumeTag({ number, accent, size = "standard", className }: VolumeTagProps) {
  if (!number) return null;
  const sizeClass =
    size === "lead" ? styles.volLead : size === "compact" ? styles.volCompact : styles.volStandard;
  return (
    <span className={cx(styles.vol, sizeClass, className)} style={{ background: accent }}>
      {size === "compact" ? (
        <>
          <span className="sr-only">Volume </span>
          {number}
        </>
      ) : (
        `VOL.${number}`
      )}
    </span>
  );
}

export type StatusBadgeProps = {
  /** The lead cover's larger badge. */
  lead?: boolean;
  className?: string | undefined;
} & (
  | { kind: "prototype" }
  | {
      kind: "status";
      /** e.g. "Shipped · AI". Empty: the badge hides. */
      label: string | undefined;
      /** The 7px dot, in the project accent. */
      accent: string;
    }
);

/** The cover's top-right badge: "Prototype" with the filled play icon, or a dot plus a label. */
export function StatusBadge(props: StatusBadgeProps) {
  if (props.kind === "prototype") {
    return (
      <span className={cx(styles.badge, props.lead && styles.badgeLead, props.className)}>
        <Icon name="play" className="" />
        Prototype
      </span>
    );
  }
  if (!props.label) return null;
  return (
    <span className={cx(styles.badge, styles.badgeStatus, props.className)}>
      <span className={styles.dot} style={{ background: props.accent }} aria-hidden="true" />
      {props.label}
    </span>
  );
}

/** A static chip: Problem spaces, segments. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  if (children === undefined || children === null || children === "") return null;
  return <span className={cx(styles.chip, className)}>{children}</span>;
}

/** The hero's availability chip with the pulsing dot (M-AVAIL-PULSE). Empty text hides it. */
export function AvailabilityChip({ children, className }: { children?: ReactNode; className?: string }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <span className={cx(styles.avail, className)}>
      <span className={styles.live} aria-hidden="true" />
      {children}
    </span>
  );
}

export interface FilterChipProps {
  children: ReactNode;
  pressed: boolean;
  onClick?: () => void;
  className?: string | undefined;
  style?: CSSProperties;
}

/** A toggle chip: a button with `aria-pressed`. Selected is `--tx` fill with `--bg` text. */
export function FilterChip({ children, pressed, onClick, className, style }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cx(styles.filter, className)}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}
