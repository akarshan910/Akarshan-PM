/**
 * The live site's case-study links (07 · Legacy links): `?open=<id>`, also `openCase` and
 * `open_case`. The host redirects them permanently (M5); this is the same rule for a visitor who
 * lands on the prerendered homepage first.
 */
import { LEGACY_CASE_SLUGS } from "./v0";

const KEYS = ["open", "openCase", "open_case"] as const;

/** The case study a legacy query asks for, or null. Unknown ids are ignored. */
export function legacyCaseRedirect(search: string): string | null {
  const params = new URLSearchParams(search);
  for (const key of KEYS) {
    const value = params.get(key)?.trim();
    if (!value || !/^\d+$/.test(value)) continue;
    const slug = LEGACY_CASE_SLUGS[Number(value)];
    if (slug) return `/work/${slug}`;
  }
  return null;
}
