/**
 * What differs between two versions of a document, in the owner's words: the editor tabs of a
 * project, for the conflict dialog and the tab dots, and the shelf orders of a layout, for the
 * Projects list's "Homepage layout changed" bar.
 */
import type { Project, SiteLayout } from "../types";
import { TAB_LABELS, type EditorTabSlug } from "./paths";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** The editor tabs whose fields differ between two drafts. */
export function changedTabs(a: Project, b: Project): EditorTabSlug[] {
  const out: EditorTabSlug[] = [];
  if (!same(a.overview, b.overview)) out.push("overview");
  if (!same(a.visuals, b.visuals)) out.push("visuals");
  if (!same(a.story, b.story)) out.push("story");
  if (!same(a.outcomes, b.outcomes) || a.headlineOutcomeId !== b.headlineOutcomeId) out.push("outcomes");
  if (!same(a.seo, b.seo) || !same(a.settings, b.settings)) out.push("settings");
  return out;
}

export function tabNames(tabs: EditorTabSlug[]): string {
  return tabs.length === 0 ? "nothing" : tabs.map((t) => TAB_LABELS[t]).join(", ");
}

/** Each shelf's item order, by shelf id. */
function shelfOrders(layout: SiteLayout): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const s of layout.sections) if (s.kind === "shelf") out[s.id] = s.items.map((i) => i.id);
  return out;
}

/** True when a shelf's order (or membership) differs from the published layout's. New projects don't count. */
export function shelfOrderChanged(draft: SiteLayout, published: SiteLayout | null): boolean {
  if (!published) return false;
  const a = shelfOrders(draft);
  const b = shelfOrders(published);
  const inA = new Set(Object.values(a).flat());
  const inB = new Set(Object.values(b).flat());
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].some(
    (id) =>
      !same(
        (a[id] ?? []).filter((x) => inB.has(x)),
        (b[id] ?? []).filter((x) => inA.has(x)),
      ),
  );
}

/** The draft layout with each shelf put back in its published order; new projects stay at the end. */
export function restoreShelfOrder(draft: SiteLayout, published: SiteLayout): SiteLayout {
  const b = shelfOrders(published);
  const placed = new Set(Object.values(b).flat());
  return {
    ...draft,
    sections: draft.sections.map((s) => {
      if (s.kind !== "shelf") return s;
      const all = new Map(
        draft.sections.flatMap((x) => (x.kind === "shelf" ? x.items : [])).map((i) => [i.id, i]),
      );
      const live = (b[s.id] ?? []).map((id) => all.get(id) ?? { id, visible: true });
      const extra = s.items.filter((i) => !placed.has(i.id));
      return { ...s, items: [...live, ...extra] };
    }),
  };
}
