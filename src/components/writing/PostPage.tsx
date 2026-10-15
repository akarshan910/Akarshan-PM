import { useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router";

import { Image } from "~/components/media/Image";
import type { PostView } from "~/lib/writing";

import { cx } from "../cx";
import { postDate, minutes } from "./format";
import { PostBody } from "./PostBody";
import { useReadingProgress } from "./useReadingProgress";
import styles from "./Writing.module.css";

interface PostPageProps {
  view: PostView;
  /** The post's absolute address, for the share links. Without it, the page's own address is used. */
  url?: string | undefined;
}

const noSubscribe = () => () => undefined;

/** "Share": LinkedIn, X and Copy link (03 · /writing/:slug). */
function Share({ url, title }: { url: string | undefined; title: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = url ? encodeURIComponent(url) : undefined;
  return (
    <div className={styles.share}>
      <span className={styles.mono}>Share</span>
      {encoded ? (
        <>
          <a
            className={styles.chip}
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a
            className={styles.chip}
            href={`https://x.com/intent/post?url=${encoded}&text=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            X<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      ) : null}
      <button
        type="button"
        className={styles.chip}
        onClick={() => {
          void navigator.clipboard.writeText(url ?? window.location.href).then(() => {
            setCopied(true);
          });
        }}
      >
        Copy link
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}

/** /writing/:slug (03 · Writing pages, WritingPublic.dc.html › a post). */
export function PostPage({ view, url }: PostPageProps) {
  const { post, byline, next } = view;
  const root = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useReadingProgress(root, body);
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const address = url ?? (hydrated ? window.location.origin + window.location.pathname : undefined);

  const topic = post.topics[0];
  const role = [byline.title, byline.company].filter(Boolean).join(" · ");
  return (
    <main id="main" ref={root} className={styles.post}>
      <div className={styles.progress} aria-hidden="true">
        <span />
      </div>
      <article className={styles.article}>
        <Link to="/writing" className={cx(styles.mono, styles.back)}>
          ← Writing
        </Link>
        <div className={cx(styles.mono, styles.postMeta)}>
          <time dateTime={view.publishedAt}>{postDate(view.publishedAt)}</time> ·{" "}
          {minutes(post.readingMinutes)}
          {topic ? <span className={styles.topic}> · {topic}</span> : null}
        </div>
        <h1 className={styles.postTitle}>{post.title}</h1>
        {post.subtitle ? <p className={styles.subtitle}>{post.subtitle}</p> : null}
        <div className={styles.byline}>
          <strong>{byline.name}</strong>
          {role ? <span>{role}</span> : null}
        </div>
        {post.cover ? (
          <div className={styles.postCover}>
            <Image
              image={post.cover}
              className={styles.cover}
              ratio="16 / 9"
              lcp
              sizes="(max-width: 767px) 100vw, 720px"
            />
          </div>
        ) : null}
        <div ref={body}>
          <PostBody blocks={post.blocks} />
        </div>
        <Share url={address} title={post.title} />
        {next ? (
          <Link to={next.href} className={styles.next}>
            <span>
              <span className={cx(styles.mono, styles.nextLabel)}>Next post</span>
              <span className={styles.nextTitle}>{next.title}</span>
            </span>
            <span className={styles.nextArrow} aria-hidden="true">
              →
            </span>
          </Link>
        ) : null}
      </article>
    </main>
  );
}
