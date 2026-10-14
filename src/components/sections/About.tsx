import { SectionHeader } from "~/components/labels/SectionHeader";
import { RichText, hasRichText } from "~/components/rich/RichText";

import { cx } from "../cx";
import styles from "./Sections.module.css";
import { useSectionReveal } from "./reveal";
import type { SectionProps } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * About (03 · About): the header, the body paragraphs where the board puts its text (beside the
 * title on laptop, under it on iPad and phones), the numbered points and the photo. Empty parts
 * hide; with nothing in any of them the section hides.
 */
export function About({ section, profile }: SectionProps) {
  const ref = useSectionReveal<HTMLElement>(
    ":scope > div > div:first-child > *, :scope > div > ol > li, :scope > div > img",
  );
  const parts = new Set(section.items.map((i) => i.id));
  const body = parts.has("text") ? profile.about.body.filter((p) => hasRichText(p)) : [];
  const points = parts.has("points")
    ? (profile.about.points ?? []).filter((p) => p.title || hasRichText(p.text))
    : [];
  const photo = parts.has("photo") ? profile.about.photo : undefined;
  const header = section.header;
  const intro = hasRichText(header?.intro) ? header.intro : undefined;
  if (body.length === 0 && points.length === 0 && !photo && !header?.title) return null;

  const titleId = `${section.id}-t`;
  const text = [...(intro ? [intro] : []), ...body];
  return (
    <section ref={ref} id={section.id} aria-labelledby={titleId} className={styles.about}>
      <div className={cx(styles.wrap, styles.aboutWrap)}>
        <div className={styles.aboutHead}>
          <SectionHeader
            id={titleId}
            kicker={header?.kicker}
            title={header?.title ?? ""}
            titleMuted={header?.titleMuted}
          />
          {text.length > 0 ? (
            <div className={cx(styles.aboutBody, !header?.title && styles.aboutWide)}>
              {text.map((p, i) => (
                <p key={i}>
                  <RichText inline html={p} />
                </p>
              ))}
            </div>
          ) : null}
        </div>
        {points.length > 0 ? (
          <ol className={styles.points}>
            {points.map((p, i) => (
              <li key={p.id} className={styles.point}>
                <span className={styles.pointNum} aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <div className={styles.pointBody}>
                  {p.title ? <h3 className={styles.pointTitle}>{p.title}</h3> : null}
                  {hasRichText(p.text) ? (
                    <p className={styles.pointText}>
                      <RichText inline html={p.text} />
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        {photo ? (
          <img
            className={styles.photo}
            src={photo.src}
            srcSet={photo.srcset}
            sizes="(min-width: 768px) 480px, 100vw"
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            style={{ background: photo.dominant }}
          />
        ) : null}
      </div>
    </section>
  );
}
