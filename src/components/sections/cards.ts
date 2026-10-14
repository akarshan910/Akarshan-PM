/**
 * Published projects → the props the cards and floaters draw (02 · C7, C11). Plain data, shared by
 * the Home shelves and the hero's floating previews.
 */
import { ACCENT_COLOURS } from "~/lib/accents";
import type { ProjectEntry } from "~/lib/site";

import type { CardOutcome, ProjectCardData } from "../cards/ProjectCard";

type Outcome = ProjectEntry["project"]["outcomes"][number];

const toOutcome = (o: Outcome): CardOutcome => ({ value: o.value, line: o.label, type: o.type });

/** The headline outcome, when the project names one that exists. */
export function headlineOutcome(entry: ProjectEntry): Outcome | undefined {
  const { outcomes, headlineOutcomeId } = entry.project;
  return headlineOutcomeId ? outcomes.find((o) => o.id === headlineOutcomeId) : undefined;
}

/** The cover `sizes` for each card layout: lead full width, standard a third, rows a thumbnail. */
const COVER_SIZES = "(min-width: 1280px) 760px, (min-width: 768px) 770px, 100vw";

export function toCardData(entry: ProjectEntry): ProjectCardData {
  const { overview, visuals } = entry.project;
  const colours = ACCENT_COLOURS[visuals.accent];
  const headline = headlineOutcome(entry);
  // The lead's results: the headline first, then the outcomes chosen for the strip, up to two.
  const results = [
    ...(headline ? [headline] : []),
    ...entry.project.outcomes.filter((o) => o.inStrip && o !== headline),
  ].slice(0, 2);
  const cover = visuals.cover;
  return {
    href: `/work/${entry.slug}`,
    volume: entry.volume,
    accent: colours.accent,
    ground: colours.ground,
    cover: cover
      ? {
          src: cover.src,
          srcSet: cover.srcset,
          sizes: COVER_SIZES,
          alt: cover.alt,
          width: cover.width,
          height: cover.height,
          focal: cover.focal,
        }
      : undefined,
    company: overview.company,
    cardLabel: overview.cardLabel,
    title: overview.title,
    summary: overview.summary,
    headline: headline ? toOutcome(headline) : undefined,
    outcomes: results.map(toOutcome),
    prototype: visuals.hero.type === "prototype",
  };
}
