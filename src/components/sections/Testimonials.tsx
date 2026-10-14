import { RichText, hasRichText } from "~/components/rich/RichText";
import type { Testimonial } from "~/components/testimonials/TestimonialCard";
import { Testimonials as Carousel } from "~/components/testimonials/Testimonials";
import { ACCENT_COLOURS } from "~/lib/accents";
import type { Accent } from "~/lib/types";

import { cx } from "../cx";
import { LegacyAnchor } from "./context";
import styles from "./Sections.module.css";
import { useSectionReveal } from "./reveal";
import type { SectionProps } from "./types";

/** Mixes a hex colour with another: `t` of `a`, the rest `b`. */
function mix(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(ch(a, i) * t + ch(b, i) * (1 - t))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/**
 * The initials avatar in the testimonial's `tone` (03 · Testimonials): a dark ground and a light
 * ink mixed from the accent, matching the boards' pairs (#2A2033 on #D9C2F7 for violet).
 */
export function avatarColours(tone: Accent): { background: string; color: string } {
  const accent = ACCENT_COLOURS[tone].accent;
  return { background: mix(accent, "#0B0B0E", 0.18), color: mix(accent, "#FFFFFF", 0.55) };
}

/**
 * Testimonials (03 · Testimonials, C16): every visible testimonial in the carousel. A region
 * labelled by its title; the kicker adds the count on touch layouts.
 */
export function Testimonials({ section, profile }: SectionProps) {
  const ref = useSectionReveal<HTMLElement>(":scope > div > div:first-of-type, :scope > div figure");
  const byId = new Map(profile.testimonials.map((t) => [t.id, t]));
  const items: Testimonial[] = section.items.flatMap(({ id }) => {
    const t = byId.get(id);
    if (!t?.quote) return [];
    return [
      {
        id: t.id,
        quote: t.quote,
        name: t.name,
        // The tag isn't shown: no board has it (HANDOFF › Decisions made during the build).
        role: t.role,
        initials: t.initials,
        avatar: avatarColours(t.tone),
        ...(t.linkedin ? { linkedin: t.linkedin } : {}),
      },
    ];
  });
  if (items.length === 0) return null;
  const header = section.header;
  const titleId = `${section.id}-t`;
  const heading = (
    <>
      {header?.kicker ? (
        <div className={styles.kicker}>
          {header.kicker}
          <span className={styles.count}> · {items.length}</span>
        </div>
      ) : null}
      <h2 id={titleId} className={styles.testiTitle}>
        {header?.title}
        {header?.titleMuted ? (
          <>
            {" "}
            <span className={styles.muted}>{header.titleMuted}</span>
          </>
        ) : null}
      </h2>
      {hasRichText(header?.intro) ? (
        <p className={styles.testiIntro}>
          <RichText inline html={header.intro} />
        </p>
      ) : null}
    </>
  );
  return (
    <section ref={ref} id={section.id} aria-labelledby={titleId} className={styles.testimonials}>
      <LegacyAnchor sectionId={section.id} />
      <div className={cx(styles.wrap, styles.testiWrap)}>
        <Carousel heading={heading} items={items} />
      </div>
    </section>
  );
}
