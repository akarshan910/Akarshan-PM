import { Image } from "~/components/media/Image";
import { ResultLabel } from "~/components/labels/ResultLabel";
import { RichText } from "~/components/rich/RichText";
import { safeHref } from "~/lib/links";
import type { PostPublished } from "~/lib/published";

import styles from "./Writing.module.css";

/**
 * A post's body (WritingPublic.dc.html › a post): text, headings, quotes, images with captions,
 * cited facts with their result label, code, and embeds as plain links (the CSP frames only the
 * video hosts).
 */
export function PostBody({ blocks }: { blocks: PostPublished["blocks"] }) {
  return (
    <div className={styles.body}>
      {blocks.map((block) => {
        switch (block.type) {
          case "text":
            return <RichText key={block.id} html={block.body} />;
          case "heading":
            return <h2 key={block.id}>{block.body}</h2>;
          case "quote":
            return <blockquote key={block.id}>{block.body}</blockquote>;
          case "image":
            return (
              <figure key={block.id}>
                <Image image={block.media} className={styles.cover} sizes="(max-width: 767px) 100vw, 720px" />
                {block.media.caption ? <figcaption>{block.media.caption}</figcaption> : null}
              </figure>
            );
          case "fact":
            return (
              <div key={block.id} className={styles.factRow}>
                <span className={styles.fact}>
                  <span className={styles.factValue}>{block.value}</span>
                  <span className={styles.factLabel}>{block.label}</span>
                  <ResultLabel type={block.resultType} />
                </span>
              </div>
            );
          case "code":
            return (
              <pre key={block.id} {...(block.language ? { "data-language": block.language } : {})}>
                <code>{block.body}</code>
              </pre>
            );
          case "embed": {
            const href = safeHref(block.url);
            return href ? (
              <p key={block.id}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {new URL(href).hostname}
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
            ) : null;
          }
        }
      })}
    </div>
  );
}
