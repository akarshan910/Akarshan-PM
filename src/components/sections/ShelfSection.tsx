import { RichText, hasRichText } from "~/components/rich/RichText";
import { Shelf } from "~/components/shelf/Shelf";
import { ACCENT_COLOURS } from "~/lib/accents";

import { toCardData } from "./cards";
import { LegacyAnchor } from "./context";
import styles from "./Sections.module.css";
import { useSectionReveal } from "./reveal";
import type { SectionProps } from "./types";

/** Every numbered volume on the page, in volume order: the "All work" tile's count and spectrum. */
function volumesInOrder(projects: SectionProps["projects"]) {
  return Object.values(projects)
    .filter((p) => p.volume)
    .sort((a, b) => (a.volume ?? "").localeCompare(b.volume ?? ""));
}

/**
 * A shelf (03 · Shelf, C7–C9): its published, visible projects in layout order, the first as the
 * lead (D37), capped by its rows. Hidden when none is published.
 */
export function ShelfSection({ section, projects }: SectionProps) {
  const ref = useSectionReveal<HTMLDivElement>(
    ":scope > section > div:first-of-type, :scope > section > a, :scope > section > div:not(:first-of-type) > *",
  );
  const cards = section.items.flatMap(({ id }) => {
    const p = projects[id];
    return p ? [toCardData(p)] : [];
  });
  if (cards.length === 0) return null;
  const all = volumesInOrder(projects);
  const header = section.header;
  const kicker = header?.kicker ?? (section.shelf ? `Selected work · ${section.shelf.name}` : undefined);
  return (
    <div ref={ref} className={styles.shelfFrame}>
      <LegacyAnchor sectionId={section.id} />
      <Shelf
        id={section.id}
        kicker={kicker}
        title={header?.title ?? section.shelf?.name ?? ""}
        titleMuted={header?.titleMuted}
        intro={hasRichText(header?.intro) ? <RichText inline html={header.intro} /> : undefined}
        projects={cards}
        rows={section.shelf?.rows ?? 2}
        seeAllHref={`/work?shelf=${encodeURIComponent(section.id)}`}
        totalVolumes={all.length}
        spectrum={all.map((p) => ACCENT_COLOURS[p.project.visuals.accent].accent)}
        eagerCovers={false}
      />
    </div>
  );
}
