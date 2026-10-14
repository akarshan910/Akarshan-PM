import { Button } from "~/components/buttons/Button";
import { ExperienceList, type ExperienceItem } from "~/components/experience/ExperienceList";
import { SectionHeader } from "~/components/labels/SectionHeader";
import { RichText, hasRichText } from "~/components/rich/RichText";

import { cx } from "../cx";
import { LegacyAnchor } from "./context";
import styles from "./Sections.module.css";
import { useSectionReveal } from "./reveal";
import type { SectionProps } from "./types";

/**
 * Experience (03 · Experience, C13, C14): the visible entries in layout order (Featured, Standard,
 * then Compact), then any education. "Full résumé" sits in the header on laptop and full width
 * under the entries on phones; it hides without a résumé.
 */
export function Experience({ section, profile }: SectionProps) {
  const ref = useSectionReveal<HTMLElement>(
    ":scope > div:first-of-type, :scope > div:nth-of-type(2) > article",
  );
  const byId = new Map(profile.experience.map((e) => [e.id, e]));
  const entries: ExperienceItem[] = section.items.flatMap(({ id }) => {
    const e = byId.get(id);
    if (!e) return [];
    return [
      {
        id: e.id,
        company: e.company,
        jobTitle: e.role,
        dates: e.dates,
        ...(e.location ? { location: e.location } : {}),
        ...(hasRichText(e.summary) ? { summary: <RichText inline html={e.summary} /> } : {}),
        highlights: e.highlights.map((h) => ({
          id: h.id,
          ...(h.group ? { title: h.group } : {}),
          items: h.items
            .filter((item) => !item.hidden && hasRichText(item.text))
            .map((item) => ({ id: item.id, text: <RichText inline html={item.text} /> })),
        })),
      },
    ];
  });
  const education: ExperienceItem[] = (profile.education ?? []).map((ed) => ({
    id: ed.id,
    company: ed.school,
    jobTitle: ed.degree,
    ...(ed.dates ? { dates: ed.dates } : {}),
  }));
  if (entries.length === 0 && education.length === 0) return null;

  const header = section.header;
  const titleId = `${section.id}-t`;
  const resume = profile.contact.resume;
  return (
    <section
      ref={ref}
      id={section.id}
      aria-labelledby={titleId}
      className={cx(styles.wrap, styles.experience)}
    >
      <LegacyAnchor sectionId={section.id} />
      <div className={styles.expHead}>
        <SectionHeader
          id={titleId}
          kicker={header?.kicker}
          title={header?.title ?? ""}
          titleMuted={header?.titleMuted}
          intro={hasRichText(header?.intro) ? <RichText inline html={header.intro} /> : undefined}
        />
        {resume ? (
          <Button variant="secondary" size="compact" href={resume} icon="download">
            Full résumé
          </Button>
        ) : null}
      </div>
      <ExperienceList entries={entries} education={education} />
      {resume ? (
        <Button variant="secondary" href={resume} icon="download" className={styles.resumePhone}>
          Full résumé (PDF)
        </Button>
      ) : null}
    </section>
  );
}
