import { Link } from "react-router";

import { buttonClass } from "~/components/buttons/Button";
import { Image } from "~/components/media/Image";
import { RichText } from "~/components/rich/RichText";
import { useReveal } from "~/motion/reveal";
import { POSTS_PER_PAGE, type PostCard, type WritingIndexView } from "~/lib/writing";

import { cx } from "../cx";
import { minutes, postDate } from "./format";
import { RssLink } from "./RssLink";
import styles from "./Writing.module.css";

interface WritingIndexProps {
  view: WritingIndexView;
  /** The chosen topic; undefined is "All". */
  topic: string | undefined;
  /** 1-based. */
  page: number;
  onTopic: (topic: string | undefined) => void;
  /** The address of a list page, for "Older posts". */
  pageHref: (page: number) => string;
}

function Lead({ post }: { post: PostCard }) {
  const date = postDate(post.publishedAt);
  return (
    <Link to={post.href} className={cx(styles.lead, !post.cover && styles.noCover)}>
      {post.cover ? (
        <Image
          image={post.cover}
          className={styles.cover}
          ratio="16 / 9"
          lcp
          sizes="(max-width: 767px) 100vw, 640px"
        />
      ) : null}
      <div>
        <div className={cx(styles.mono, styles.latest)}>Latest</div>
        <div className={cx(styles.mono, styles.leadMetaPhone)}>
          {date} · {minutes(post.readingMinutes, false)}
        </div>
        <h2 className={styles.leadTitle}>{post.title}</h2>
        {post.excerpt ? <p className={styles.leadExcerpt}>{post.excerpt}</p> : null}
        <div className={cx(styles.mono, styles.leadMeta)}>
          {date} · {minutes(post.readingMinutes)}
          {post.topic ? ` · ${post.topic}` : ""}
        </div>
      </div>
    </Link>
  );
}

function Row({ post }: { post: PostCard }) {
  return (
    <Link to={post.href} className={styles.row}>
      <span className={styles.mono}>{postDate(post.publishedAt)}</span>
      <span>
        <span className={styles.rowTitle}>{post.title}</span>
        {post.excerpt ? <span className={styles.rowExcerpt}>{post.excerpt}</span> : null}
      </span>
      <span className={cx(styles.mono, styles.rowEnd)}>
        {post.topic ? `${post.topic} · ` : ""}
        {minutes(post.readingMinutes, false)}
      </span>
    </Link>
  );
}

/**
 * /writing (03 · Writing pages, WritingPublic.dc.html › /writing): the header with RSS, topic chips
 * that filter in place, the newest post as the lead, then the rest as rows, 20 to a page.
 */
export function WritingIndex({ view, topic, page, onTopic, pageHref }: WritingIndexProps) {
  const list = useReveal<HTMLUListElement>({ blocks: ":scope > li" });
  const posts = topic ? view.posts.filter((p) => p.topics.includes(topic)) : view.posts;
  const pages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const current = Math.min(page, pages);
  const shown = posts.slice((current - 1) * POSTS_PER_PAGE, current * POSTS_PER_PAGE);
  // The lead is the newest post of the first page; older pages are rows only.
  const lead = current === 1 ? shown[0] : undefined;
  const rows = lead ? shown.slice(1) : shown;

  return (
    <main id="main" className={cx("wrap", styles.index)}>
      <div className={styles.indexHead}>
        <div>
          <div className={styles.mono}>Writing</div>
          <h1 className={styles.indexTitle}>
            Writing<span className={styles.dot}>.</span>
          </h1>
          {view.intro ? (
            <p className={styles.intro}>
              <RichText inline html={view.intro} />
            </p>
          ) : null}
        </div>
        {view.rss ? <RssLink /> : null}
      </div>
      {view.topics.length > 0 ? (
        <div className={styles.chips} role="group" aria-label="Filter by topic">
          {[undefined, ...view.topics].map((t) => (
            <button
              key={t ?? ""}
              type="button"
              className={styles.chip}
              aria-pressed={t === topic}
              onClick={() => {
                onTopic(t);
              }}
            >
              {t ?? "All"}
            </button>
          ))}
        </div>
      ) : null}
      {lead ? <Lead post={lead} /> : null}
      {rows.length > 0 ? (
        <ul ref={list} className={styles.rows}>
          {rows.map((p) => (
            <li key={p.slug}>
              <Row post={p} />
            </li>
          ))}
        </ul>
      ) : null}
      {current < pages ? (
        <div className={styles.older}>
          <Link className={buttonClass("secondary")} to={pageHref(current + 1)}>
            Older posts
          </Link>
        </div>
      ) : null}
    </main>
  );
}
