/**
 * C8 · Shelf (02 · C8, 03 · Shelf): the section header, the lead card, a grid of standard cards
 * (compact rows on phones) and the closing tile, capped by `src/lib/shelf.ts`. Every device shows
 * the same projects. With nothing published, the shelf hides completely, header included.
 */
import type { ReactNode } from "react";

import { planShelf, type ClosingTile as Closing, type ShelfRows } from "~/lib/shelf";

import { ClosingTile } from "../cards/ClosingTile";
import { CompactRow, LeadCard, StandardCard, type ProjectCardData } from "../cards/ProjectCard";
import { cx } from "../cx";
import { SectionHeader } from "../labels/SectionHeader";
import styles from "./Shelf.module.css";

export interface ShelfProps {
  /** The section's DOM id, e.g. "strategy". */
  id: string;
  /** `Selected work · {shelf name}`. */
  kicker?: string | undefined;
  title: string;
  titleMuted?: string | undefined;
  /** Plain text, or the sanitised inline rendering of `header.intro`. */
  intro?: ReactNode;
  /** The shelf's published, visible projects in order; the first is the lead (D37). */
  projects: readonly ProjectCardData[];
  /** Rows of three under the lead, set per shelf in Studio. */
  rows: ShelfRows;
  /** "See all N": `/work?shelf=<key>`. */
  seeAllHref: string;
  /** "All work": `/work`. */
  allWorkHref?: string;
  /** Published volumes across the site, for "All work · N volumes". */
  totalVolumes: number;
  /** Their accents in project order, for the spectrum bar. */
  spectrum: readonly string[];
  /** The first shelf on the page loads its covers eagerly. */
  eagerCovers?: boolean;
  className?: string | undefined;
}

export function Shelf({
  id,
  kicker,
  title,
  titleMuted,
  intro,
  projects,
  rows,
  seeAllHref,
  allWorkHref = "/work",
  totalVolumes,
  spectrum,
  eagerCovers,
  className,
}: ShelfProps) {
  const plan = planShelf(projects.length, rows);
  const [lead, ...rest] = projects.slice(0, plan.shown);
  if (!lead) return null;
  const lazy = !eagerCovers;

  const tile = (t: Closing, layout: "tile" | "row", cls: string | undefined) =>
    t && (
      <ClosingTile
        kind={t.kind}
        href={t.kind === "see-all" ? seeAllHref : allWorkHref}
        count={t.kind === "see-all" ? projects.length : totalVolumes}
        more={plan.more}
        spectrum={spectrum}
        layout={layout}
        span={t.kind === "all-work" ? t.span : 1}
        className={cls}
      />
    );

  return (
    <section id={id} aria-labelledby={`${id}-t`} className={cx(styles.shelf, className)}>
      <SectionHeader id={`${id}-t`} kicker={kicker} title={title} titleMuted={titleMuted} intro={intro} />
      <LeadCard project={lead} lazy={lazy} />
      {(rest.length > 0 || plan.laptop || plan.ipad) && (
        <div className={styles.grid}>
          {rest.map((p) => (
            <StandardCard key={p.href} project={p} lazy={lazy} />
          ))}
          {tile(plan.laptop, "tile", styles.onlyLaptop)}
          {tile(plan.ipad, "tile", styles.onlyIpad)}
        </div>
      )}
      {(rest.length > 0 || plan.phone) && (
        <div className={styles.rows}>
          {rest.map((p) => (
            <CompactRow key={p.href} project={p} lazy={lazy} />
          ))}
          {tile(plan.phone, "row", styles.onlyPhone)}
        </div>
      )}
    </section>
  );
}
