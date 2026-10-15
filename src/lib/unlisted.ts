/**
 * Unlisted projects (01 · Rendering, D24): published but never in the build. A `/work/<slug>` address
 * with no prerendered page asks the `pm-project` Edge Function for that exact slug and shows the
 * project, or the 404 page. An unlisted project has no volume number and no prev/next (03).
 */
import { ACCENT_COLOURS } from "./accents";
import type { CaseStudyView } from "./case-study";
import type { ProjectPublished } from "./published";
import { ACCENTS } from "./vocab";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The function's address for a slug, or null when the slug can't be one (so nothing is fetched). */
export function unlistedUrl(supabaseUrl: string | undefined, slug: string): string | null {
  if (!supabaseUrl || !SLUG.test(slug) || slug.length > 80) return null;
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/pm-project?slug=${encodeURIComponent(slug)}`;
}

function isProject(value: unknown): value is ProjectPublished {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<ProjectPublished>;
  return (
    typeof p.overview?.title === "string" &&
    typeof p.visuals?.accent === "string" &&
    (ACCENTS as readonly string[]).includes(p.visuals.accent) &&
    Array.isArray(p.story) &&
    Array.isArray(p.outcomes)
  );
}

/** The function's answer → the page's view; null for anything that isn't this slug's project. */
export function unlistedView(
  body: unknown,
  slug: string,
  footer: { name: string; updatedAt: string },
): CaseStudyView | null {
  if (!body || typeof body !== "object") return null;
  const { slug: got, project } = body as { slug?: unknown; project?: unknown };
  if (got !== slug || !isProject(project)) return null;
  const colours = ACCENT_COLOURS[project.visuals.accent];
  return {
    slug,
    project,
    accent: colours.accent,
    ground: colours.ground,
    volumes: 0,
    name: footer.name,
    updatedAt: footer.updatedAt,
  };
}
