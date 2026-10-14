/**
 * C7 · The shelf's closing tile (02 · C7, 03 · Shelf).
 *
 * - "See all N" when the shelf is over its cap, to `/work?shelf=<key>`.
 * - "All work · N volumes" filling the empty cells of the last row, to `/work`.
 *
 * `tile` is the laptop and iPad cell, with the spectrum bar; `row` is the phone's closing row.
 */
import { cx } from "../cx";
import { Icon } from "../icons";
import styles from "./ClosingTile.module.css";

/** The spectrum bar's heights, cycled in project order (Home.dc.html). */
const BAR_HEIGHTS = [100, 74, 88, 80, 94, 70, 84, 76, 90];

export interface ClosingTileProps {
  kind: "see-all" | "all-work";
  href: string;
  /** See all: the shelf's project count. All work: the number of published volumes. */
  count: number;
  /** See all: how many more are on the work page. */
  more?: number;
  /** The accents of the published volumes, in project order. */
  spectrum?: readonly string[];
  layout?: "tile" | "row";
  /** Grid columns the tile spans. */
  span?: number;
  className?: string | undefined;
}

const volumes = (n: number) => `${n} ${n === 1 ? "volume" : "volumes"}`;

export function ClosingTile({
  kind,
  href,
  count,
  more = 0,
  spectrum = [],
  layout = "tile",
  span = 1,
  className,
}: ClosingTileProps) {
  const title = kind === "see-all" ? `See all ${count}` : `All work · ${volumes(count)}`;

  if (layout === "row") {
    return (
      <a className={cx(styles.row, className)} href={href}>
        <span>
          <span className={styles.rowTitle}>{title}</span>
          {kind === "all-work" && (
            <span className={styles.rowSub}>Every project in one list, with filters</span>
          )}
        </span>
        <Icon name="arrow-right" />
      </a>
    );
  }

  return (
    <a
      className={cx(styles.tile, className)}
      href={href}
      style={span > 1 ? { gridColumn: `span ${span}` } : undefined}
    >
      {spectrum.length > 0 && (
        <div className={styles.spectrum} aria-hidden="true">
          {spectrum.map((accent, i) => (
            <span
              key={i}
              className={styles.bar}
              style={{ height: `${BAR_HEIGHTS[i % BAR_HEIGHTS.length] ?? 100}%`, background: accent }}
            />
          ))}
        </div>
      )}
      <div>
        <div className={styles.title}>
          {title} <span className={styles.arrow}>→</span>
        </div>
        <div className={styles.sub}>
          {kind === "see-all" ? (
            `${more} more on the work page, with filters, search and sort.`
          ) : (
            <>
              <span className={styles.subLaptop}>
                Every project in one list, with filters by shelf, company, topic and label.
              </span>
              <span className={styles.subTouch}>Every project in one list, with filters.</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}
