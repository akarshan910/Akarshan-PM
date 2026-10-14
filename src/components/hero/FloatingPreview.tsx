import type { CSSProperties, MouseEventHandler, Ref } from "react";

import type { ResultType } from "~/lib/types";

import { ResultLabel } from "../labels/ResultLabel";
import styles from "./FloatingPreview.module.css";
import { safeHref } from "~/lib/links";

export interface FloatingPreviewProps {
  /** The volume number, e.g. "01". */
  volume: string;
  /** The project accent's hex, from `ACCENT_COLOURS` in `~/lib/accents`. */
  accent: string;
  /** The card label, or the company. Empty hides it. */
  kicker?: string;
  title: string;
  /** The headline outcome's value and result label. Each hides when empty. */
  value?: string;
  result?: ResultType;
  /** `/work/:slug`. */
  href: string;
  /** Position in % of the ink panel, depth in px and rotation in degrees (M-HERO-FLOATERS). */
  x: number;
  y: number;
  z: number;
  r: number;
  /** The card element, for the scheduler to drive `--tx`, `--ty`, `opacity` and `transition`. */
  cardRef?: Ref<HTMLAnchorElement>;
  /** Inline card styles from the scheduler's current phase. */
  cardStyle?: CSSProperties;
  onMouseEnter?: MouseEventHandler<HTMLAnchorElement>;
  onMouseLeave?: MouseEventHandler<HTMLAnchorElement>;
}

/**
 * C11 · A project preview drifting beside the ink panel. Decorative: it repeats links the shelves
 * already give, so it's hidden from assistive tech and never takes focus (03 · Hero).
 */
export function FloatingPreview({
  volume,
  accent,
  kicker,
  title,
  value,
  result,
  href,
  x,
  y,
  z,
  r,
  cardRef,
  cardStyle,
  onMouseEnter,
  onMouseLeave,
}: FloatingPreviewProps) {
  return (
    <div
      className={styles.fl}
      aria-hidden="true"
      style={{ left: `${x}%`, top: `${y}%`, transform: `translateZ(${z}px) rotate(${r}deg)` }}
    >
      <a
        ref={cardRef}
        className={styles.tz}
        href={safeHref(href)}
        tabIndex={-1}
        style={{ pointerEvents: "auto", ...cardStyle }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <span className={styles.top}>
          <span className={styles.vol} style={{ background: accent }}>
            VOL.{volume}
          </span>
          {kicker ? <span className={styles.kicker}>{kicker}</span> : null}
        </span>
        <span className={styles.title}>{title}</span>
        {value || result ? (
          <span className={styles.headline}>
            {value ? <span className={styles.value}>{value}</span> : null}
            {result ? <ResultLabel type={result} /> : null}
          </span>
        ) : null}
      </a>
    </div>
  );
}
