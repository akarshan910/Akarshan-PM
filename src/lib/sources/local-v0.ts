/**
 * The `local-v0` source: the V0 documents built from the live site's content (07), published the
 * same way Studio publishes, with covers served from /media/v0 (copied from design/covers by the
 * Vite plugin). Used in development until the Supabase source exists (M3).
 */
import * as legacy from "../../legacy/content";
import { ACCENT_COLOURS } from "../accents";
import type { ContentSource, PublicContent } from "../content-source";
import { publishProfile, publishProject, type Img } from "../published";
import { buildV0Documents } from "../v0";

/** The covers are rendered at 1600×1000 (07 · Covers). */
const COVER = { width: 1600, height: 1000 };

export function loadLocalV0(now: Date = new Date()): PublicContent {
  const v0 = buildV0Documents(legacy);
  const alt = new Map(v0.covers.map((c) => [`cover-${c.slug}`, c.alt]));
  const published = v0.projects.filter((p) => p.publish);
  const at = now.toISOString();

  const projects = published.map((p) => {
    const resolveImg = (ref: { mediaId: string }): Img | undefined => {
      const text = alt.get(ref.mediaId);
      if (text === undefined) return undefined;
      const src = `/media/v0/${p.slug}.webp`;
      return {
        src,
        srcset: `${src} ${COVER.width}w`,
        ...COVER,
        alt: text,
        dominant: ACCENT_COLOURS[p.document.visuals.accent].ground,
        focal: { x: 0.5, y: 0.5 },
      };
    };
    return {
      id: p.slug,
      slug: p.slug,
      listed: true,
      publishedAt: at,
      firstPublishedAt: at,
      project: publishProject(p.document, resolveImg),
    };
  });

  return {
    profile: publishProfile(v0.profile, () => undefined),
    layout: v0.layout,
    projects,
    posts: [],
    updatedAt: at,
  };
}

export const localV0: ContentSource = {
  name: "local-v0",
  load: () => Promise.resolve(loadLocalV0()),
};
