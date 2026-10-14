/**
 * A draft post → its published shape (06 · Published shape; HANDOFF › Next, Writing): media become
 * images, `readingMinutes = ceil(words / 220)`, the excerpt is the post's own or its first 160
 * characters, and `modifiedAt` is this publish.
 *
 * TODO(M2 Writing): `publishPost` is coming to src/lib/published.ts. When it lands, the sync script
 * copies it here and this module becomes a re-export, so the site and the functions share one.
 */
import type { PostPublished, ResolveImg } from "./lib/published.ts";
import { richTextToPlain } from "./lib/rich-text.ts";
import type { Post } from "./lib/types.ts";

export const WORDS_PER_MINUTE = 220;

export function postText(post: Post): string {
  return post.blocks
    .map((b) => {
      switch (b.type) {
        case "text":
          return richTextToPlain(b.body);
        case "heading":
        case "quote":
        case "code":
          return b.body;
        case "fact":
          return `${b.value} ${b.label}`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function publishPostDoc(draft: Post, resolveImg: ResolveImg, now: Date): PostPublished {
  const text = postText(draft);
  const words = text ? text.split(" ").length : 0;
  const { cover, blocks, excerpt, ...rest } = draft;
  const coverImg = cover && cover.mediaId ? resolveImg(cover) : undefined;
  const ownExcerpt = excerpt?.trim();
  const cut = text.length > 160 ? `${text.slice(0, 159).replace(/\s+\S*$/, "")}…` : text;
  return {
    ...rest,
    ...(coverImg
      ? {
          cover: cover?.decorative
            ? { ...coverImg, alt: "" }
            : cover?.alt
              ? { ...coverImg, alt: cover.alt }
              : coverImg,
        }
      : {}),
    blocks: blocks.flatMap((b): PostPublished["blocks"] => {
      if (b.type !== "image") return [b];
      const img = b.mediaId ? resolveImg(b) : undefined;
      if (!img) return [];
      const alt = b.decorative ? "" : (b.alt ?? img.alt);
      return [
        { id: b.id, type: "image", media: { ...img, alt, ...(b.caption ? { caption: b.caption } : {}) } },
      ];
    }),
    readingMinutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
    excerpt: ownExcerpt || cut,
    modifiedAt: now.toISOString(),
  };
}
