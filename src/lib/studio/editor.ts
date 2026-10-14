/**
 * The project editor's model (05 · Project editor): what differs from the live page, per tab
 * (the tab dots and "What's changing"), the publish button's state, and where the project sits
 * on the homepage.
 */
import { publishProject, type ProjectPublished, type ResolveImg } from "../published";
import type { Project, SiteLayout } from "../types";
import { numberVolumes } from "../volumes";
import type { ProjectRow } from "./repo";
import { EDITOR_TABS, TAB_LABELS, type EditorTabSlug } from "./paths";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Images compared by what they are, not by where Studio happens to load them from. */
function plain(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (k, v: unknown) =>
      k === "src" || k === "srcset" || k === "og" || k === "dominant" ? undefined : v,
    ),
  ) as unknown;
}

/** Without a media resolver, images compare by id and alt override only. */
const byRef: ResolveImg = (ref) => ({
  src: "",
  srcset: "",
  width: 0,
  height: 0,
  alt: ref.alt ?? ref.mediaId,
  dominant: "",
});

const OVERVIEW_NAMES: [keyof Project["overview"], string][] = [
  ["title", "title"],
  ["company", "company"],
  ["cardLabel", "card label"],
  ["summary", "summary"],
  ["problem", "the problem"],
  ["proposal", "what I proposed"],
  ["kind", "kind of work"],
  ["topics", "topics"],
  ["role", "my role"],
  ["timeline", "timeline"],
  ["team", "team"],
  ["prdUrl", "PRD link"],
];

/** The Overview fields that differ from the live page, as the board lists them. */
export function overviewChanges(draft: Project, live: ProjectPublished | null): string[] {
  if (!live) return [];
  return OVERVIEW_NAMES.filter(([k]) => !same(draft.overview[k] ?? "", live.overview[k] ?? "")).map(
    ([, n]) => n,
  );
}

/** Tabs whose content differs from the live page: each shows a dot. A draft never published has none. */
export function changedTabs(
  draft: Project,
  live: ProjectPublished | null,
  resolve: ResolveImg = byRef,
): Set<EditorTabSlug> {
  const out = new Set<EditorTabSlug>();
  if (!live) return out;
  const next = publishProject(draft, resolve);
  const liveP = plain(live) as ProjectPublished;
  const nextP = plain(next) as ProjectPublished;
  if (overviewChanges(draft, live).length > 0) out.add("overview");
  if (
    !same(nextP.visuals.accent, liveP.visuals.accent) ||
    !same(nextP.visuals.hero, liveP.visuals.hero) ||
    nextP.visuals.gallery.length !== liveP.visuals.gallery.length ||
    Boolean(nextP.visuals.cover) !== Boolean(liveP.visuals.cover) ||
    nextP.visuals.cover?.alt !== liveP.visuals.cover?.alt
  )
    out.add("visuals");
  if (!same(nextP.story, liveP.story)) out.add("story");
  if (!same(nextP.outcomes, liveP.outcomes) || nextP.headlineOutcomeId !== liveP.headlineOutcomeId)
    out.add("outcomes");
  if (!same(nextP.seo.title, liveP.seo.title) || !same(nextP.seo.description, liveP.seo.description))
    out.add("settings");
  return out;
}

const TAB_LINES: Record<EditorTabSlug, string> = {
  overview: "",
  visuals: "Visuals · hero, cover and gallery",
  story: "Story · chapters and blocks",
  outcomes: "Outcomes · results and labels",
  settings: "URL & SEO · address, search text and visibility",
};

/** "What's changing" in the publish dialog, one line per tab. */
export function changeLines(
  draft: Project,
  row: Pick<ProjectRow, "published" | "slug" | "publishedSlug">,
  resolve: ResolveImg = byRef,
): string[] {
  if (!row.published) return ["Everything: this is the first publish."];
  const tabs = changedTabs(draft, row.published, resolve);
  if (row.publishedSlug && row.slug !== row.publishedSlug) tabs.add("settings");
  const lines: string[] = [];
  for (const t of EDITOR_TABS) {
    if (!tabs.has(t)) continue;
    lines.push(
      t === "overview" ? `Overview · ${overviewChanges(draft, row.published).join(", ")}` : TAB_LINES[t],
    );
  }
  return lines;
}

export type PublishButton =
  | { label: "Publish"; disabled: false }
  | { label: "Publish changes"; disabled: false }
  | { label: "Published"; disabled: true }
  | { label: "Reconnect to publish"; disabled: true };

/** The angled button's label (05 · Project editor › The header). */
export function publishButton(
  row: Pick<ProjectRow, "published" | "publishedAt" | "updatedAt">,
  offline: boolean,
): PublishButton {
  if (offline) return { label: "Reconnect to publish", disabled: true };
  if (!row.published) return { label: "Publish", disabled: false };
  if (row.publishedAt && row.updatedAt > row.publishedAt)
    return { label: "Publish changes", disabled: false };
  return { label: "Published", disabled: true };
}

/** "Projects · {shelf} · {volume}" and the shelf the project sits on. */
export function placement(
  layout: SiteLayout,
  rows: Pick<ProjectRow, "id" | "published" | "visibility">[],
  projectId: string,
): { shelfId: string | undefined; shelfName: string; position: number; volume: string | undefined } {
  const shelf = layout.sections.find((s) => s.kind === "shelf" && s.items.some((i) => i.id === projectId));
  const volumes = numberVolumes(
    layout.sections,
    new Map(rows.map((r) => [r.id, { published: r.published !== null, listed: r.visibility === "public" }])),
  );
  return {
    shelfId: shelf?.id,
    shelfName: shelf?.shelf?.name ?? "Not on a shelf",
    position: (shelf?.items.findIndex((i) => i.id === projectId) ?? -1) + 1,
    volume: volumes.get(projectId),
  };
}

export function tabLabel(tab: EditorTabSlug): string {
  return TAB_LABELS[tab];
}
