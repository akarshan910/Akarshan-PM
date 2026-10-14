/**
 * C9 · Volume numbering (02 · C9, 03 · Shelf).
 *
 * Published, listed projects on visible shelves are numbered 01, 02, … in shelf order (page
 * order), then in each shelf's project order. Drafts, unlisted and unpublished projects get no
 * number. The number is computed at build time and never stored; links use the slug, so
 * renumbering never breaks a link. A project hidden on its shelf (`items[].visible: false`) is
 * still on /work and at its own address (05 · Website builder), so it keeps its number.
 */
import type { Section } from "./types";

/** What numbering needs to know about a project row. */
export interface VolumeCandidate {
  /** Published, and not deleted. */
  published: boolean;
  /** `visibility = 'public'`. Unlisted projects get no number. */
  listed: boolean;
}

type ShelfLike = Pick<Section, "kind" | "visible" | "items">;

/** Zero-pads a volume number to two digits: 1 → "01", 12 → "12", 104 → "104". */
export function formatVolume(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Numbers the volumes. Returns a map from project id to its two-digit number, in numbering order.
 * A project that appears on two shelves keeps its first number.
 */
export function numberVolumes(
  sections: readonly ShelfLike[],
  projects: ReadonlyMap<string, VolumeCandidate>,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const section of sections) {
    if (section.kind !== "shelf" || !section.visible) continue;
    for (const item of section.items) {
      const project = projects.get(item.id);
      if (!project?.published || !project.listed || out.has(item.id)) continue;
      out.set(item.id, formatVolume(out.size + 1));
    }
  }
  return out;
}
