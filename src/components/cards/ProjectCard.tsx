/**
 * C7 · Project card (02 · C7, 03 · Shelf). The whole card is one link to `/work/:slug`.
 *
 * - `LeadCard`: first on each shelf, full width; up to two outcomes.
 * - `StandardCard`: laptop 3 up, iPad 2 up.
 * - `CompactRow`: phones, after the lead.
 *
 * Empty fields hide: no headline outcome hides the headline row, an empty summary hides the
 * summary, a missing volume number hides the tag.
 */
import type { CSSProperties } from "react";

import { safeHref } from "~/lib/links";

import { cx } from "../cx";
import { Icon } from "../icons";
import { ResultLabel, type ResultType } from "../labels/ResultLabel";
import { StatusBadge, VolumeTag } from "../labels/Tags";
import { Cover, type CoverImage } from "./Cover";
import styles from "./ProjectCard.module.css";

export interface CardOutcome {
  value: string;
  /** The outcome's line, e.g. "of all meal logs". */
  line?: string | undefined;
  type: ResultType;
}

export interface ProjectCardData {
  /** `/work/:slug`. */
  href: string;
  /** From `src/lib/volumes.ts`; unlisted projects have none. */
  volume?: string | undefined;
  /** `--pa` and `--pg` (src/lib/accents.ts). */
  accent: string;
  ground: string;
  /** None: the generated cover. */
  cover?: CoverImage | undefined;
  company?: string | undefined;
  cardLabel?: string | undefined;
  title: string;
  summary?: string | undefined;
  /** `headlineOutcomeId`'s outcome. */
  headline?: CardOutcome | undefined;
  /** The lead card's results list: up to two outcomes (phones show the first). */
  outcomes?: CardOutcome[] | undefined;
  /** Shows the "Prototype" badge. */
  prototype?: boolean | undefined;
  /** A dot-and-label badge, e.g. "Shipped · AI", when there's no prototype. */
  status?: string | undefined;
}

interface CardProps {
  project: ProjectCardData;
  /** Below the fold, covers load lazily (03 · Shelf). */
  lazy?: boolean;
  className?: string | undefined;
}

function metaLine(p: ProjectCardData): string {
  return [p.company, p.cardLabel].filter(Boolean).join(" · ");
}

function Badge({ project, lead }: { project: ProjectCardData; lead?: boolean }) {
  if (project.prototype)
    return <StatusBadge kind="prototype" lead={lead ?? false} className={styles.badge} />;
  // The dot-and-label status shows on the lead's cover only (Home, HomeTablet).
  if (!lead) return null;
  return (
    <StatusBadge kind="status" label={project.status} accent={project.accent} className={styles.badge} />
  );
}

export function LeadCard({ project, lazy = true, className }: CardProps) {
  const meta = metaLine(project);
  const outcomes = (project.outcomes ?? []).slice(0, 2);
  return (
    <a className={cx(styles.card, styles.lead, className)} href={safeHref(project.href)}>
      <div className={styles.leadMedia}>
        <Cover
          image={project.cover}
          accent={project.accent}
          ground={project.ground}
          lazy={lazy}
          className={styles.cv}
        >
          <VolumeTag number={project.volume} accent={project.accent} size="lead" className={styles.tag} />
          <Badge project={project} lead />
          {project.volume && (
            <span className={styles.bigNum} aria-hidden="true">
              {project.volume}
            </span>
          )}
        </Cover>
      </div>
      <div className={styles.leadBody}>
        {meta && <div className={styles.meta}>{meta}</div>}
        <h3 className={styles.leadTitle}>{project.title}</h3>
        {project.summary && <p className={styles.leadSummary}>{project.summary}</p>}
        {outcomes.length > 0 && (
          <>
            <div className={styles.results}>
              {outcomes.map((o, i) => (
                <div key={i} className={styles.result}>
                  <span className={styles.resultText}>
                    <span className={styles.value}>{o.value}</span>
                    {o.line && <span className={styles.dim}> {o.line}</span>}
                  </span>
                  <ResultLabel type={o.type} />
                </div>
              ))}
            </div>
            <div className={styles.resultsStacked} style={{ "--n": outcomes.length } as CSSProperties}>
              {outcomes.map((o, i) => (
                <div key={i} className={styles.stackCell}>
                  <div className={styles.stackTop}>
                    <span className={styles.stackValue}>{o.value}</span>
                    <ResultLabel type={o.type} />
                  </div>
                  {o.line && <div className={styles.stackLine}>{o.line}</div>}
                </div>
              ))}
            </div>
          </>
        )}
        <span className={styles.readMore}>
          Read the case study
          <Icon name="arrow-right" className={cx("ico", styles.go)} />
        </span>
      </div>
    </a>
  );
}

function Headline({ outcome }: { outcome: CardOutcome | undefined }) {
  if (!outcome) return null;
  return (
    <div className={styles.headline}>
      <span className={styles.num}>{outcome.value}</span>
      {outcome.line && <span className={styles.line}>{outcome.line}</span>}
      <ResultLabel type={outcome.type} />
    </div>
  );
}

export function StandardCard({ project, lazy = true, className }: CardProps) {
  const meta = metaLine(project);
  return (
    <a className={cx(styles.card, styles.std, className)} href={safeHref(project.href)}>
      <div className={styles.stdMedia}>
        <Cover
          image={project.cover}
          accent={project.accent}
          ground={project.ground}
          number={project.volume}
          lazy={lazy}
          className={styles.cv}
        >
          <VolumeTag number={project.volume} accent={project.accent} className={styles.tag} />
          <Badge project={project} />
        </Cover>
      </div>
      <div className={styles.stdBody}>
        {meta && <div className={styles.meta}>{meta}</div>}
        <h3 className={styles.stdTitle}>{project.title}</h3>
        {project.summary && <p className={styles.stdSummary}>{project.summary}</p>}
        <Headline outcome={project.headline} />
      </div>
    </a>
  );
}

export function CompactRow({ project, lazy = true, className }: CardProps) {
  const h = project.headline;
  return (
    <a className={cx(styles.row, className)} href={safeHref(project.href)}>
      <Cover
        image={project.cover}
        accent={project.accent}
        ground={project.ground}
        lazy={lazy}
        className={styles.thumb}
      >
        <VolumeTag number={project.volume} accent={project.accent} size="compact" className={styles.tag} />
      </Cover>
      <div>
        <h3 className={styles.rowTitle}>{project.title}</h3>
        {h && (
          <div className={styles.rowLine}>
            {[h.value, h.line].filter(Boolean).join(" ")} <ResultLabel type={h.type} />
          </div>
        )}
      </div>
    </a>
  );
}
