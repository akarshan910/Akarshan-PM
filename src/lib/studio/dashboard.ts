/**
 * The dashboard's model (05 · Dashboard; StudioDashboard): the stats, "Needs your input" in the
 * order the chapter gives, and "Recently edited". Pure, so it's tested without React.
 */
import type { Accent, Profile } from "../types";
import { projectRiceFlags, readiness } from "./checks";
import { countWord, plural } from "./format";
import { factLabel, factValue } from "./facts";
import type { DocRow, LinkStatus, PostRow, ProjectRow } from "./repo";

export type NeedItem =
  | {
      kind: "draft";
      id: string;
      title: string;
      accent: Accent;
      chips: string[];
      percent: number;
      href: string;
    }
  | { kind: "rice"; id: string; title: string; text: string; href: string }
  | { kind: "fact"; id: string; title: string; text: string; href: string }
  | { kind: "link"; id: string; title: string; text: string; href: string }
  | { kind: "schedule"; id: string; title: string; text: string; href: string };

export interface RecentItem {
  id: string;
  title: string;
  at: string;
  href: string;
}

export interface DashboardModel {
  empty: boolean;
  stats: { projects: number; published: number; drafts: number; sitePublishedAt: string | null };
  summary: string;
  needs: NeedItem[];
  recent: RecentItem[];
}

const TAB_OF: Record<string, [string, string]> = {
  Title: ["overview", "title"],
  Company: ["overview", "company"],
  Summary: ["overview", "summary"],
  Problem: ["overview", "problem"],
  Proposal: ["overview", "proposal"],
  "My role": ["overview", "role"],
  "Cover image": ["visuals", "cover"],
  Story: ["story", ""],
  Results: ["outcomes", ""],
};

/** A Studio editor link that opens the tab and focuses the field. */
export function fieldHref(projectId: string, missing: string | undefined): string {
  const [tab, field] = TAB_OF[missing ?? ""] ?? ["overview", ""];
  return `/studio/projects/${projectId}/${tab}${field ? `?field=${field}` : ""}`;
}

const STATUS_TEXT: Record<LinkStatus, string> = {
  ok: "",
  login: "It asks visitors to log in.",
  "no-frame": "Its site blocks embedding, so visitors get an Open button.",
  "not-shared": "It isn’t shared publicly.",
  gone: "It doesn’t load any more.",
  error: "It couldn’t be checked.",
};

export function buildDashboard(input: {
  projects: ProjectRow[];
  posts: PostRow[];
  profile: DocRow<Profile, unknown>;
  layout: DocRow<unknown>;
  linkChecks: { url: string; status: LinkStatus; detail: string | null; checkedAt: string }[];
}): DashboardModel {
  const { projects, posts, profile, layout } = input;
  const drafts = projects.filter((p) => !p.published);
  const needs: NeedItem[] = [];

  // 1. Drafts that can't go live yet, least complete last.
  const draftNeeds = drafts
    .map((p) => {
      const r = readiness(p.draft);
      return { p, r };
    })
    .filter(({ r }) => r.missing.length > 0)
    .sort((a, b) => b.r.percent - a.r.percent);
  for (const { p, r } of draftNeeds)
    needs.push({
      kind: "draft",
      id: p.id,
      title: p.draft.overview.title || "Untitled project",
      accent: p.draft.visuals.accent,
      chips: r.missing.slice(0, 3),
      percent: r.percent,
      href: fieldHref(p.id, r.missing[0]),
    });

  // 2. Flagged RICE rows.
  for (const p of projects)
    for (const { block, flag } of projectRiceFlags(p.draft)) {
      const effort = block.rows[flag.row]?.[5] ?? "";
      needs.push({
        kind: "rice",
        id: `${p.id}:${block.id}:${flag.row}`,
        title: `${p.draft.overview.title} · RICE table`,
        text: `“${flag.item}” scores ${flag.computed} from its inputs but shows ${flag.shown}. Effort may be ${flag.effortForShown} mo, not ${effort.replace(/\s*mo$/, "")}.`,
        href: `/studio/projects/${p.id}/story?block=${block.id}`,
      });
    }

  // 3. "Worth a check" facts.
  for (const key of profile.draft.unconfirmed) {
    const fact = profile.draft.facts[key];
    const live = factValue(profile.draft, key);
    needs.push({
      kind: "fact",
      id: key,
      title: `Worth a check · ${factLabel(key)}`,
      text: fact?.alternative
        ? `Your site says “${live ?? ""}”. Your résumé says “${fact.alternative.value}”.`
        : `Your site says “${live ?? ""}”. Confirm it’s still true.`,
      href: `/studio/website/profile?fact=${encodeURIComponent(key)}`,
    });
  }

  // 4. Failed link checks.
  for (const c of input.linkChecks) {
    if (c.status === "ok") continue;
    const p = projects.find((r) => JSON.stringify(r.draft).includes(JSON.stringify(c.url)));
    needs.push({
      kind: "link",
      id: c.url,
      title: p ? `${p.draft.overview.title} · link check` : "Link check",
      text: `${c.url} ${STATUS_TEXT[c.status]}`.trim(),
      href: p ? `/studio/projects/${p.id}/visuals` : "/studio/projects",
    });
  }

  // 5. Scheduled posts that couldn't publish.
  for (const post of posts)
    if (post.scheduleError)
      needs.push({
        kind: "schedule",
        id: post.id,
        title: `${post.draft.title || "Untitled post"} · Couldn’t publish`,
        text: post.scheduleError,
        href: `/studio/writing/${post.id}`,
      });

  const blocked = draftNeeds.length;
  const summary =
    blocked > 0
      ? `${countWord(blocked)} ${plural(blocked, "draft needs", "drafts need")} your input before ${blocked === 1 ? "it" : "they"} can go live.`
      : needs.length > 0
        ? `${countWord(needs.length)} ${plural(needs.length, "thing needs", "things need")} a look.`
        : "Nothing needs your input right now.";

  const recent: RecentItem[] = [
    ...projects.map((p) => ({
      id: `project:${p.id}`,
      title: p.draft.overview.title || "Untitled project",
      at: p.updatedAt,
      href: `/studio/projects/${p.id}/overview`,
    })),
    ...posts.map((p) => ({
      id: `post:${p.id}`,
      title: p.draft.title || "Untitled post",
      at: p.updatedAt,
      href: `/studio/writing/${p.id}`,
    })),
    { id: "profile", title: "Website · profile", at: profile.updatedAt, href: "/studio/website/profile" },
    { id: "layout", title: "Website · homepage", at: layout.updatedAt, href: "/studio/website" },
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);

  return {
    empty: projects.length === 0,
    stats: {
      projects: projects.length,
      published: projects.length - drafts.length,
      drafts: drafts.length,
      sitePublishedAt: layout.publishedAt,
    },
    summary,
    needs,
    recent,
  };
}
