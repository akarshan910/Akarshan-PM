/**
 * Project operations the Projects list, the dashboard and the editor share (05 · Projects).
 */
import { firstFreeAccent, newProject, nextUntitledSlug } from "../defaults";
import type { Project, Section, SiteLayout } from "../types";
import type { ProjectRow, StudioRepo } from "./repo";

/** The shelf a project sits on, by layout order. */
export function shelfOf(layout: SiteLayout, projectId: string): Section | undefined {
  return layout.sections.find((s) => s.kind === "shelf" && s.items.some((i) => i.id === projectId));
}

export function shelves(layout: SiteLayout): Section[] {
  return layout.sections.filter((s) => s.kind === "shelf");
}

/**
 * "New project": a draft with a generated id and slug `untitled-n`, in the shelf it was started
 * from (the first visible shelf otherwise), at the end of that shelf. The layout change is a
 * draft change like any other: nothing goes live until the site is published.
 */
export async function createProject(repo: StudioRepo, shelfId?: string): Promise<ProjectRow> {
  const [rows, layoutRow] = await Promise.all([repo.projects.list(), repo.layout.get()]);
  const layout = layoutRow.draft;
  const shelf =
    shelves(layout).find((s) => s.id === shelfId) ??
    shelves(layout).find((s) => s.visible) ??
    shelves(layout)[0];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const used = (shelf?.items ?? [])
    .map((i) => byId.get(i.id)?.draft.visuals.accent)
    .filter((a) => a !== undefined);
  const draft: Project = newProject({
    kind: shelf?.id === "shipped" ? "shipped" : "study",
    accent: firstFreeAccent(used),
  });
  const row = await repo.projects.create(draft, nextUntitledSlug(rows.map((r) => r.slug)));
  if (shelf) {
    const next: SiteLayout = {
      ...layout,
      sections: layout.sections.map((s) =>
        s.id === shelf.id ? { ...s, items: [...s.items, { id: row.id, visible: true }] } : s,
      ),
    };
    await repo.layout.save(next, layoutRow.version);
  }
  return row;
}

/** "Published", "Edits not live" or "Draft" (05 · Projects › Columns). */
export function projectStatus(row: ProjectRow): "published" | "edits" | "draft" {
  if (!row.published || !row.publishedAt) return "draft";
  return row.updatedAt > row.publishedAt ? "edits" : "published";
}
