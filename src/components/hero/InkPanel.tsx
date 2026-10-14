import type { ReactNode, Ref } from "react";

import { HERO_SPEED, speed } from "~/motion/speed-lines";

import styles from "./InkPanel.module.css";

/** Computed once: the three static paths are the same for every render. */
const PATHS = {
  laptop: speed(...HERO_SPEED.laptop.args),
  ipad: speed(...HERO_SPEED.ipad.args),
  phone: speed(...HERO_SPEED.phone.args),
};

interface InkPanelProps {
  /** The ghost numeral, e.g. "01—09". Empty hides it (03 · Hero: no published projects). */
  volumeRange?: string;
  /** The fixed kicker. */
  kicker?: string;
  /** Studio › Website › Hero › motion. Off keeps the panel flat for every visitor. */
  motion?: boolean;
  /** The text column: chips, name, brush, positioning, intro, buttons. */
  children?: ReactNode;
  /** Floating preview cards (C11), positioned in % of the panel. */
  floaters?: ReactNode;
  /** The laptop speed-line path, for M2 to re-aim with `setAttribute('d', …)`. */
  linesRef?: Ref<SVGPathElement>;
}

/**
 * C10 · The hero's ink panel: the tilt wrapper and its four depth layers (screentone, outlined
 * numerals, speed lines, red halftone disc), the VOL.00 kicker and the text column. Static: M2 adds
 * the pointer tilt and the floater scheduler through the CSS custom properties `--mx` and `--my`.
 */
export function InkPanel({
  volumeRange,
  kicker = "VOL.00 · Prologue",
  motion = true,
  children,
  floaters,
  linesRef,
}: InkPanelProps) {
  return (
    <div className={motion ? styles.stage : `${styles.stage} ${styles.flat}`}>
      <div className={styles.ink} data-ink="">
        <div className={styles.panel}>
          <div className={`${styles.tone} ${styles.px}`} aria-hidden="true" />
          {volumeRange ? (
            <div className={`${styles.numerals} ${styles.px}`} aria-hidden="true">
              {volumeRange}
            </div>
          ) : null}
          <svg
            className={`${styles.lines} ${styles.linesLaptop} ${styles.px}`}
            viewBox={HERO_SPEED.laptop.viewBox}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
          >
            <path ref={linesRef} d={PATHS.laptop} fill="#D61F33" fillOpacity=".16" />
          </svg>
          <svg
            className={`${styles.lines} ${styles.linesIpad} ${styles.px}`}
            viewBox={HERO_SPEED.ipad.viewBox}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
          >
            <path d={PATHS.ipad} fill="#D61F33" fillOpacity=".16" />
          </svg>
          <svg
            className={`${styles.lines} ${styles.linesPhone} ${styles.px}`}
            viewBox={HERO_SPEED.phone.viewBox}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
          >
            <path d={PATHS.phone} fill="#D61F33" fillOpacity=".16" />
          </svg>
          <div className={`${styles.disc} ${styles.px}`} aria-hidden="true" />
          {kicker ? <div className={styles.kicker}>{kicker}</div> : null}
          <div className={styles.body}>{children}</div>
        </div>
        {floaters}
      </div>
    </div>
  );
}
