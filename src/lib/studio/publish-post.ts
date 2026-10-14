/**
 * A post's published shape, for the in-memory repo and Studio's previews. The portfolio agent's
 * `publishPost` in `src/lib/published.ts` (HANDOFF › Next, item 2) replaces this once it lands;
 * the rules are the same: reading time is words ÷ 220, the excerpt is the post's own or its
 * first 160 characters, plus `modifiedAt`.
 */
import type { PostPublished, ResolveImg } from "../published";
import type { Post } from "../types";
import { postWords, readingMinutes } from "./checks";

const text = (html: string): string =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function publishPost(draft: Post, resolveImg: ResolveImg, modifiedAt: string): PostPublished {
  const { cover, blocks, ...rest } = draft;
  const coverImg = cover && cover.mediaId ? resolveImg(cover) : undefined;
  const first = blocks
    .filter((b) => b.type === "text")
    .map((b) => text(b.body))
    .join(" ");
  const out: PostPublished["blocks"] = [];
  for (const b of blocks) {
    if (b.type !== "image") {
      out.push(b);
      continue;
    }
    const img = b.mediaId ? resolveImg(b) : undefined;
    if (img)
      out.push({
        id: b.id,
        type: "image",
        media: {
          ...img,
          ...(b.decorative ? { alt: "" } : b.alt ? { alt: b.alt } : {}),
          ...(b.caption ? { caption: b.caption } : {}),
        },
      });
  }
  return {
    ...rest,
    ...(coverImg ? { cover: cover?.alt ? { ...coverImg, alt: cover.alt } : coverImg } : {}),
    blocks: out,
    readingMinutes: readingMinutes(postWords(draft)),
    excerpt: draft.excerpt?.trim() || first.slice(0, 160),
    modifiedAt,
  };
}
