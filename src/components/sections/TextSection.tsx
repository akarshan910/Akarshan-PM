import { SectionHeader } from "~/components/labels/SectionHeader";
import { RichText, hasRichText } from "~/components/rich/RichText";

import { cx } from "../cx";
import styles from "./Sections.module.css";
import { useSectionReveal } from "./reveal";
import type { SectionProps } from "./types";

/**
 * A text section added in Studio (03 · Text section): the header, then `text.body` as rich text in
 * the post body's 68-character column. Hidden while the body is empty.
 */
export function TextSection({ section }: SectionProps) {
  const ref = useSectionReveal<HTMLElement>(":scope > div:first-child, :scope > div:last-child > *");
  const body = section.text?.body;
  if (!hasRichText(body, false)) return null;
  const header = section.header;
  const titleId = `${section.id}-t`;
  return (
    <section
      ref={ref}
      id={section.id}
      {...(header?.title ? { "aria-labelledby": titleId } : { "aria-label": section.id })}
      className={cx(styles.wrap, styles.text)}
    >
      {header?.title ? (
        <SectionHeader
          id={titleId}
          kicker={header.kicker}
          title={header.title}
          titleMuted={header.titleMuted}
          intro={hasRichText(header.intro) ? <RichText inline html={header.intro} /> : undefined}
          className={styles.keepIntro}
        />
      ) : null}
      <div className={styles.prose}>
        <RichText html={body} />
      </div>
    </section>
  );
}
