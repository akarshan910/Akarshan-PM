import { SectionHeader } from "~/components/labels/SectionHeader";
import { OffDutyPage, type OffDutyItem } from "~/components/offduty/OffDutyPage";
import { RichText, hasRichText } from "~/components/rich/RichText";
import { ACCENT_COLOURS } from "~/lib/accents";

import { cx } from "../cx";
import styles from "./Sections.module.css";
import { useSectionReveal } from "./reveal";
import type { SectionProps } from "./types";

/** Off duty (03 · Off duty, C17): the visible items in order, the first one's picks as spines. */
export function OffDuty({ section, profile }: SectionProps) {
  const ref = useSectionReveal<HTMLElement>(
    ":scope > div > div:first-child, :scope > div > div > div > article",
  );
  const byId = new Map(profile.offDuty.map((o) => [o.id, o]));
  const items: OffDutyItem[] = section.items.flatMap(({ id }) => {
    const o = byId.get(id);
    if (!o?.title) return [];
    const colours = ACCENT_COLOURS[o.accent];
    return [
      {
        id: o.id,
        label: o.label,
        title: o.title,
        text: o.text,
        ...(o.tag ? { tag: o.tag } : {}),
        accent: colours.accent,
        ground: colours.ground,
        art: o.art,
        ...(o.picks?.length
          ? { picks: o.picks.map((p) => ({ id: p.id, title: p.title, ...(p.note ? { note: p.note } : {}) })) }
          : {}),
      },
    ];
  });
  if (items.length === 0) return null;
  const header = section.header;
  const titleId = `${section.id}-t`;
  return (
    <section ref={ref} id={section.id} aria-labelledby={titleId} className={styles.offduty}>
      <div className={cx(styles.wrap, styles.offWrap)}>
        <SectionHeader
          id={titleId}
          kicker={header?.kicker}
          title={header?.title ?? ""}
          titleMuted={header?.titleMuted}
          intro={hasRichText(header?.intro) ? <RichText inline html={header.intro} /> : undefined}
          className={cx(styles.head30, styles.keepIntro)}
        />
        <div className={styles.offPage}>
          <OffDutyPage items={items} />
        </div>
      </div>
    </section>
  );
}
