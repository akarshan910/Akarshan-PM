/**
 * The `supabase` source (10 · WP3.5, 06 · Build-time data): what the prerender reads from the `pm`
 * schema as a visitor (`anon`). RLS returns live, public rows only, and `anon` holds column grants on
 * the published columns alone, so every select names its columns (`select *` fails by design).
 *
 * Any failed read, or a missing profile or layout, throws: the build fails rather than shipping
 * stale or local content (06). There is no fallback.
 */
import type { ContentSource, PublicContent, PublicPost, PublicProject } from "../content-source";
import type { PostPublished, ProfilePublished, ProjectPublished } from "../published";
import { SiteLayout } from "../schemas";

/** One PostgREST answer, as supabase-js gives it. */
export interface ReadResult {
  data: unknown[] | null;
  error: { message: string } | null;
}

/**
 * The few reads the build makes. supabase-js's client fits it (`src/lib/supabase.ts`), and the tests
 * pass one that runs the same selects on a local Postgres as `anon`.
 */
export interface PublicReader {
  select(table: "profile" | "site_layout" | "projects" | "posts", columns: string): Promise<ReadResult>;
}

interface SingletonRow<T> {
  published: T | null;
  published_at: string | null;
}

interface ProjectRow {
  id: string;
  published_slug: string | null;
  published: ProjectPublished | null;
  published_at: string | null;
  first_published_at: string | null;
}

interface PostRow {
  id: string;
  published_slug: string | null;
  published: PostPublished | null;
  published_at: string | null;
}

export class ContentReadError extends Error {
  constructor(what: string, detail: string) {
    super(`Couldn't read ${what} from Supabase: ${detail}. The build stops rather than use stale content.`);
    this.name = "ContentReadError";
  }
}

async function rows<T>(reader: PublicReader, table: Parameters<PublicReader["select"]>[0], columns: string) {
  const { data, error } = await reader.select(table, columns);
  if (error) throw new ContentReadError(`pm.${table}`, error.message);
  if (!data) throw new ContentReadError(`pm.${table}`, "no data");
  return data as T[];
}

/** The one published row of a singleton table (profile, site_layout). */
async function singleton<T>(reader: PublicReader, table: "profile" | "site_layout") {
  const list = await rows<SingletonRow<T>>(reader, table, "published, published_at");
  const live = list.filter((r) => r.published !== null);
  const row = live[0];
  if (!row?.published || live.length > 1)
    throw new ContentReadError(`pm.${table}`, `expected one published row, found ${String(live.length)}`);
  return { published: row.published, publishedAt: row.published_at ?? "" };
}

/** Reads and shapes everything a public page can show. */
export async function readPublicContent(reader: PublicReader): Promise<PublicContent> {
  const [profile, layout, projectRows, postRows] = await Promise.all([
    singleton<ProfilePublished>(reader, "profile"),
    singleton<unknown>(reader, "site_layout"),
    rows<ProjectRow>(reader, "projects", "id, published_slug, published, published_at, first_published_at"),
    rows<PostRow>(reader, "posts", "id, published_slug, published, published_at"),
  ]);

  const parsed = SiteLayout.safeParse(layout.published);
  if (!parsed.success)
    throw new ContentReadError("pm.site_layout", parsed.error.issues[0]?.message ?? "invalid");

  // RLS already limits these to live public rows; anything without an address or a published
  // document is skipped, never guessed at.
  const projects: PublicProject[] = projectRows.flatMap((r) =>
    r.published && r.published_slug && r.published_at
      ? [
          {
            id: r.id,
            slug: r.published_slug,
            listed: true,
            publishedAt: r.published_at,
            firstPublishedAt: r.first_published_at ?? r.published_at,
            project: r.published,
          },
        ]
      : [],
  );
  const posts: PublicPost[] = postRows.flatMap((r) =>
    r.published && r.published_slug && r.published_at
      ? [{ id: r.id, slug: r.published_slug, publishedAt: r.published_at, post: r.published }]
      : [],
  );

  // "Last updated" is the last site publish: the later of the profile and the layout.
  const updatedAt = [profile.publishedAt, layout.publishedAt].sort().at(-1) ?? "";
  return { profile: profile.published, layout: parsed.data, projects, posts, updatedAt };
}

/** The source for a reader; `content.server.ts` builds the reader from the environment. */
export function supabaseSource(reader: PublicReader): ContentSource {
  return { name: "supabase", load: () => readPublicContent(reader) };
}
