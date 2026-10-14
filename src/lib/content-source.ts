/**
 * Where the public pages' content comes from (10 · Phase 2, WP2.1). Every loader goes through
 * `loadPublicContent()`, so the same pages render the V0 content locally, the boards' content for
 * parity checks, and (from M3) the published rows in Supabase.
 */
import type { ProfilePublished, ProjectPublished, PostPublished } from "./published";
import type { SiteLayout } from "./types";

export interface PublicProject {
  id: string;
  /** The live address (`published_slug`). */
  slug: string;
  /** `visibility = 'public'`: listed on shelves and /work. Unlisted projects never reach the build. */
  listed: boolean;
  /** `index_allowed`: false keeps the page out of search (noindex) and the sitemap. Unset is true. */
  indexAllowed?: boolean;
  publishedAt: string;
  firstPublishedAt: string;
  project: ProjectPublished;
}

export interface PublicPost {
  id: string;
  slug: string;
  publishedAt: string;
  post: PostPublished;
}

/** Published content only. The layout may still name drafts and hidden parts: views filter them. */
export interface PublicContent {
  profile: ProfilePublished;
  layout: SiteLayout;
  projects: PublicProject[];
  posts: PublicPost[];
  /** When the content was last published: the footer's "Updated" date. */
  updatedAt: string;
}

export type ContentSourceName = "local-v0" | "fixture:boards" | "supabase";

export interface ContentSource {
  name: ContentSourceName;
  load(): Promise<PublicContent>;
}

/** `CONTENT_SOURCE`, defaulting to the V0 content until M3 switches the default to Supabase. */
export function contentSourceName(env: Record<string, string | undefined>): ContentSourceName {
  const value = env.CONTENT_SOURCE ?? "local-v0";
  if (value === "local-v0" || value === "fixture:boards" || value === "supabase") return value;
  throw new Error(`Unknown CONTENT_SOURCE "${value}". Use local-v0, fixture:boards or supabase.`);
}
