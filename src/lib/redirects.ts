/**
 * The site's redirects (01 · Routes › Old links, 03 · Page states): renamed projects and posts (a
 * silent 308 to the new address), pages that were public once (to /work?moved=1 or /writing?moved=1,
 * which shows the note), and the live site's `?open=<id>` links. `scripts/write-vercel-config.ts`
 * writes these into vercel.json. Every row is checked: only site paths of the expected shape pass.
 */
import { LEGACY_CASE_SLUGS } from "./v0";
import { ContentReadError, type PublicReader } from "./sources/supabase";

export interface RedirectRow {
  old_path: string;
  new_path: string;
}

export interface VercelRedirect {
  source: string;
  destination: string;
  permanent: boolean;
  has?: { type: "query"; key: string; value: string }[];
}

const OLD = /^\/(work|writing)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NEW = /^(?:\/(work|writing)\/[a-z0-9]+(?:-[a-z0-9]+)*|\/(work|writing)\?moved=1)$/;

/** The live site's three query keys for its case-study links (07 · Legacy links). */
export const LEGACY_KEYS = ["open", "openCase", "open_case"] as const;

/** `pm.public_redirects()`, read as a visitor. A failed read fails the build (06). */
export async function readRedirects(reader: PublicReader): Promise<RedirectRow[]> {
  if (!reader.redirects) return [];
  const { data, error } = await reader.redirects();
  if (error) throw new ContentReadError("pm.public_redirects()", error.message);
  return (data ?? []) as RedirectRow[];
}

/** Rows → Vercel redirects, legacy links first. Malformed or self-referencing rows are dropped. */
export function vercelRedirects(rows: readonly RedirectRow[]): VercelRedirect[] {
  const legacy = Object.entries(LEGACY_CASE_SLUGS).flatMap(([id, slug]) =>
    LEGACY_KEYS.map((key): VercelRedirect => ({
      source: "/",
      has: [{ type: "query", key, value: id }],
      destination: `/work/${slug}`,
      permanent: true,
    })),
  );
  const seen = new Set<string>();
  const fromRows = rows.flatMap((r): VercelRedirect[] => {
    if (!OLD.test(r.old_path) || !NEW.test(r.new_path) || r.old_path === r.new_path || seen.has(r.old_path))
      return [];
    seen.add(r.old_path);
    // A rename is permanent; "moved" can come back if the owner publishes the page again.
    return [{ source: r.old_path, destination: r.new_path, permanent: !r.new_path.includes("?moved=1") }];
  });
  return [...legacy, ...fromRows];
}
