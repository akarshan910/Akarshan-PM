import { Link } from "react-router";

import { Image } from "~/components/media/Image";
import { RssLink } from "~/components/writing/RssLink";
import { minutes, postDate } from "~/components/writing/format";
import styles from "~/components/writing/Writing.module.css";
import { postCard } from "~/lib/writing";

import { cx } from "../cx";
import { useSectionReveal } from "./reveal";
import type { SectionProps } from "./types";

/**
 * The homepage Writing section (03 · Writing, WritingPublic.dc.html › "Laptop · homepage Writing
 * section"): the latest `writing.latest` posts marked "Show on my homepage", newest first, with
 * "All posts →" and, when `writing.rss` is on, the RSS link. Hidden until there's a post.
 */
export function WritingSection({ section, posts }: SectionProps) {
  const ref = useSectionReveal<HTMLElement>(":scope > div:first-child, :scope > ul > li");
  if (posts.length === 0) return null;
  const cards = posts.map(postCard);
  const titleId = `${section.id}-t`;
  return (
    <section ref={ref} id={section.id} aria-labelledby={titleId} className={cx("wrap", styles.section)}>
      <div className={styles.sectionHead}>
        <div>
          <div className={styles.mono}>{section.header?.kicker ?? "Latest posts"}</div>
          <h2 id={titleId} className={styles.sectionTitle}>
            {section.header?.title ?? "Writing"}
          </h2>
        </div>
        <div className={styles.sectionLinks}>
          {section.writing?.rss ? <RssLink /> : null}
          <Link to="/writing" className={styles.allPosts}>
            All posts →
          </Link>
        </div>
      </div>
      <ul className={styles.cards} data-count={cards.length}>
        {cards.map((p) => (
          <li key={p.slug}>
            <Link to={p.href} className={styles.card}>
              {p.cover ? (
                <Image
                  image={p.cover}
                  className={styles.cover}
                  ratio="16 / 9"
                  sizes="(max-width: 767px) 100vw, 400px"
                />
              ) : null}
              <span className={cx(styles.mono, styles.cardMeta)}>
                {postDate(p.publishedAt)} · {minutes(p.readingMinutes)}
              </span>
              <h3 className={styles.cardTitle}>{p.title}</h3>
              {p.excerpt ? <p className={styles.cardExcerpt}>{p.excerpt}</p> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
