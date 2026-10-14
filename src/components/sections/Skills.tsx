import { useState } from "react";

import { SectionHeader } from "~/components/labels/SectionHeader";
import { RichText, hasRichText } from "~/components/rich/RichText";
import { SkillsCloud, type SkillGroup } from "~/components/skills/SkillsCloud";

import { cx } from "../cx";
import styles from "./Sections.module.css";
import { useSectionReveal } from "./reveal";
import type { SectionProps } from "./types";

/**
 * Skills (03 · Skills, C15): the visible groups in layout order, every skill at its Studio size.
 * The cloud's own entrance (M-SKILLS-REVEAL) rides on the section's reveal.
 */
export function Skills({ section, profile }: SectionProps) {
  const [reveal, setReveal] = useState<"pending" | "go" | undefined>(undefined);
  const ref = useSectionReveal<HTMLElement>(":scope > div:first-child", {
    onWait: () => {
      setReveal("pending");
    },
    onReveal: () => {
      setReveal((r) => (r === "pending" ? "go" : r));
    },
  });
  const byId = new Map(profile.skills.map((g) => [g.id, g]));
  const groups: SkillGroup[] = section.items.flatMap(({ id }) => {
    const g = byId.get(id);
    if (!g || g.items.length === 0) return [];
    return [{ id: g.id, title: g.title, ...(g.subtitle ? { subtitle: g.subtitle } : {}), items: g.items }];
  });
  if (groups.length === 0) return null;
  const header = section.header;
  const titleId = `${section.id}-t`;
  return (
    <section ref={ref} id={section.id} aria-labelledby={titleId} className={cx(styles.wrap, styles.skills)}>
      <SectionHeader
        id={titleId}
        kicker={header?.kicker}
        title={header?.title ?? ""}
        titleMuted={header?.titleMuted}
        intro={hasRichText(header?.intro) ? <RichText inline html={header.intro} /> : undefined}
        className={cx(styles.head30, styles.keepIntro)}
      />
      <SkillsCloud groups={groups} {...(reveal ? { reveal } : {})} />
    </section>
  );
}
