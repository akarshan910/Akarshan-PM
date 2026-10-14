/**
 * A draft post → its published shape, with the site's own `publishPost` (src/lib/published.ts,
 * copied by scripts/sync-functions-lib.ts): media become images, `readingMinutes = ceil(words / 220)`,
 * the excerpt is the post's own or its first 160 characters, and `modifiedAt` is this publish.
 */
import { publishPost, type PostPublished, type ResolveImg } from "./lib/published.ts";
import type { Post } from "./lib/types.ts";

export function publishPostDoc(draft: Post, resolveImg: ResolveImg, now: Date): PostPublished {
  return publishPost(draft, resolveImg, now.toISOString());
}
