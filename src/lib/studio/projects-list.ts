/**
 * The Projects list's model (05 · Projects; StudioProjects): projects grouped by shelf in homepage
 * order, the filters and search, and the moves (reorder, star to the top) as layout edits.
 */
import type { SiteLayout } from "../types";
import { projectIssues, readiness } from "./checks";
import { projectStatus } from "./projects";
import type { ProjectRow } from "./repo";

export type ListFilter = "all" | "published" | "drafts";

export interface ListRow {
  row: ProjectRow;
  title: string;
  sub: string;
  status: "published" | "edits" | "draft";
  percent: number;
  /** Required fields still missing: the draft's Publish item is disabled until it's 0. */
  missing: number;
  /** First visible project on its shelf: the lead card. */
  lead: boolean;
  /** 1-based position on the shelf (all projects, not just the filtered ones). */
  position: number;
}

export interface ListGroup {
  id: string;
  name: string;
  /** Everything on the shelf, before filtering. */
  total: number;
  rows: ListRow[];
}

const REQUIRED_TABS = new Set(["overview", "settings"]);

export function listGroups(
  layout: SiteLayout,
  rows: ProjectRow[],
  filter: ListFilter,
  query: string,
): ListGroup[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const q = query.trim().toLowerCase();
  return layout.sections
    .filter((s) => s.kind === "shelf")
    .map((s) => {
      const onShelf = s.items.map((i) => byId.get(i.id)).filter((r): r is ProjectRow => r !== undefined);
      const lead = onShelf.find((r) => r.published)?.id;
      const all: ListRow[] = onShelf.map((r, i) => {
        const status = projectStatus(r);
        const o = r.draft.overview;
        return {
          row: r,
          title: o.title || "Untitled project",
          sub: r.published
            ? `${o.company} · /work/${r.publishedSlug ?? r.slug}`
            : `${o.company || "No company yet"} · not on the live site`,
          status,
          percent: readiness(r.draft).percent,
          missing: projectIssues(r.draft, { slug: r.slug, media: () => undefined }).filter((x) =>
            REQUIRED_TABS.has(x.tab),
          ).length,
          lead: r.id === lead,
          position: i + 1,
        };
      });
      const shown = all.filter((r) => {
        if (filter === "published" && r.status === "draft") return false;
        if (filter === "drafts" && r.status !== "draft") return false;
        if (!q) return true;
        return r.title.toLowerCase().includes(q) || r.row.draft.overview.company.toLowerCase().includes(q);
      });
      return { id: s.id, name: s.shelf?.name ?? s.header?.title ?? s.id, total: all.length, rows: shown };
    });
}

export function counts(rows: ProjectRow[]): { all: number; published: number; drafts: number } {
  const drafts = rows.filter((r) => !r.published).length;
  return { all: rows.length, published: rows.length - drafts, drafts };
}

/** Moves a project within its shelf to `to` (0-based), or returns the layout unchanged. */
export function moveOnShelf(layout: SiteLayout, shelfId: string, projectId: string, to: number): SiteLayout {
  return {
    ...layout,
    sections: layout.sections.map((s) => {
      if (s.id !== shelfId) return s;
      const from = s.items.findIndex((i) => i.id === projectId);
      if (from < 0 || to < 0 || to >= s.items.length || from === to) return s;
      const items = s.items.slice();
      const [item] = items.splice(from, 1);
      if (item) items.splice(to, 0, item);
      return { ...s, items };
    }),
  };
}

/** Inserts a project into a shelf right after another (a duplicate), or at the end. */
export function insertAfter(
  layout: SiteLayout,
  shelfId: string,
  afterId: string | null,
  projectId: string,
): SiteLayout {
  return {
    ...layout,
    sections: layout.sections.map((s) => {
      if (s.id !== shelfId) return s;
      const items = s.items.filter((i) => i.id !== projectId);
      const at = afterId ? items.findIndex((i) => i.id === afterId) + 1 : items.length;
      items.splice(at > 0 ? at : items.length, 0, { id: projectId, visible: true });
      return { ...s, items };
    }),
  };
}

export function removeFromShelves(layout: SiteLayout, projectId: string): SiteLayout {
  return {
    ...layout,
    sections: layout.sections.map((s) =>
      s.kind === "shelf" ? { ...s, items: s.items.filter((i) => i.id !== projectId) } : s,
    ),
  };
}

/** A free address for a copy: `<slug>-copy`, then `-copy-2`, … */
export function copySlug(slug: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = `${slug}-copy`.slice(0, 74);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
