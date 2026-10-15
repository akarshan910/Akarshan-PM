/**
 * The image files a build must copy to the site (06 · Storage): every `/media/<id>/r<rev>/<file>` path
 * that published content refers to, from `src`, `srcset` and `og`. Visitors never load images from
 * Supabase; `scripts/fetch-media.ts` downloads these from `pm-media-public`.
 */
import type { PublicContent } from "./content-source";

/** A published image path: `/media/<uuid>/r<rev>/<variant>.<ext>`, nothing else. */
export const MEDIA_PATH =
  /^\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/r\d{1,6}\/[a-z0-9]{1,16}\.(?:webp|jpg|jpeg|png|gif|pdf)$/;

function collect(value: unknown, out: Set<string>) {
  if (Array.isArray(value)) {
    for (const v of value) collect(v, out);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === "string") {
      const candidates =
        key === "srcset" ? v.split(",").map((part) => part.trim().split(/\s+/)[0] ?? "") : [v];
      for (const c of candidates) if (MEDIA_PATH.test(c)) out.add(c);
    } else {
      collect(v, out);
    }
  }
}

/** Every published media path, sorted, without duplicates. */
export function publishedMediaPaths(content: PublicContent): string[] {
  const out = new Set<string>();
  collect(content.profile, out);
  collect(content.layout, out);
  for (const p of content.projects) collect(p.project, out);
  for (const p of content.posts) collect(p.post, out);
  return [...out].sort();
}

/** The public bucket URL of a media path (06 · Storage). */
export function publicBucketUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/pm-media-public/${path.replace(/^\/media\//, "")}`;
}
