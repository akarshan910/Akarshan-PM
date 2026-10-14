/**
 * Draft preview (05 · Draft preview; StudioPreview): the draft and the live version of a project,
 * post or the homepage as the public components take them, which parts changed ("Highlight
 * changes": "Changed" or "Draft only"), and the Studio-only notes about what the live page skips.
 */
import { chapterAnchors } from "../case-study";
import type { PublicContent } from "../content-source";
import {
  publishPost,
  publishProfile,
  publishProject,
  type ProfilePublished,
  type ProjectPublished,
  type ResolveImg,
} from "../published";
import type { SiteLayout } from "../types";
import { chapterHasContent } from "./checks";
import type { DocRow, PostRow, ProjectRow } from "./repo";
import type { Profile } from "../types";
import { sectionName } from "./website";

export type PreviewKind = "project" | "post" | "site";

export interface PreviewSource {
  profile: DocRow<Profile, ProfilePublished>;
  layout: DocRow<SiteLayout>;
  projects: ProjectRow[];
  posts: PostRow[];
  resolve: ResolveImg;
  now: string;
}

function liveProjects(src: PreviewSource, except?: string): PublicContent["projects"] {
  return src.projects
    .filter((r) => r.id !== except && r.published && r.publishedSlug)
    .map((r) => ({
      id: r.id,
      slug: r.publishedSlug ?? r.slug,
      listed: r.visibility === "public",
      publishedAt: r.publishedAt ?? r.updatedAt,
      firstPublishedAt: r.firstPublishedAt ?? r.publishedAt ?? r.updatedAt,
      project: r.published as ProjectPublished,
    }));
}

function livePosts(src: PreviewSource, except?: string): PublicContent["posts"] {
  const out: PublicContent["posts"] = [];
  for (const p of src.posts)
    if (p.id !== except && p.published && p.publishedSlug)
      out.push({
        id: p.id,
        slug: p.publishedSlug,
        publishedAt: p.publishedAt ?? p.updatedAt,
        post: p.published,
      });
  return out;
}

const liveProfile = (src: PreviewSource) =>
  src.profile.published ?? publishProfile(src.profile.draft, src.resolve);

/**
 * The content a visitor would get, with the previewed document as a draft (`which: "draft"`) or as
 * it's live now (`"live"`). Returns null for "live" when it has never been published, and the
 * address the page renders at.
 */
export function previewSite(
  src: PreviewSource,
  kind: PreviewKind,
  id: string,
  which: "draft" | "live",
): { content: PublicContent; slug: string } | null {
  const updatedAt = src.layout.publishedAt ?? src.now;
  if (kind === "site") {
    if (which === "live" && !src.layout.published) return null;
    return {
      content: {
        profile: which === "draft" ? publishProfile(src.profile.draft, src.resolve) : liveProfile(src),
        layout: which === "draft" ? src.layout.draft : (src.layout.published ?? src.layout.draft),
        projects: liveProjects(src),
        posts: livePosts(src),
        updatedAt,
      },
      slug: "",
    };
  }
  const base = {
    profile: liveProfile(src),
    layout: src.layout.published ?? src.layout.draft,
    updatedAt,
  };
  if (kind === "project") {
    const row = src.projects.find((r) => r.id === id);
    if (!row) return null;
    if (which === "live" && (!row.published || !row.publishedSlug)) return null;
    const slug = which === "draft" ? row.slug : (row.publishedSlug ?? row.slug);
    const project =
      which === "draft" ? publishProject(row.draft, src.resolve) : (row.published as ProjectPublished);
    const firstAt = row.firstPublishedAt ?? row.updatedAt;
    return {
      content: {
        ...base,
        projects: [
          ...liveProjects(src, row.id),
          {
            id: row.id,
            slug,
            listed: true,
            publishedAt: row.publishedAt ?? row.updatedAt,
            firstPublishedAt: firstAt,
            project,
          },
        ],
        posts: livePosts(src),
      },
      slug,
    };
  }
  const row = src.posts.find((p) => p.id === id);
  if (!row) return null;
  if (which === "live" && (!row.published || !row.publishedSlug)) return null;
  const slug = which === "draft" ? row.slug : (row.publishedSlug ?? row.slug);
  const post = which === "draft" ? publishPost(row.draft, src.resolve, src.now) : row.published;
  if (!post) return null;
  return {
    content: {
      ...base,
      projects: liveProjects(src),
      posts: [...livePosts(src, row.id), { id: row.id, slug, publishedAt: row.publishedAt ?? src.now, post }],
    },
    slug,
  };
}

export interface Highlight {
  /** A DOM id on the public page, or a selector for whole pages. */
  selector: string;
  label: "Changed" | "Draft only";
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const noImgSrc = (x: unknown) =>
  JSON.parse(
    JSON.stringify(x, (k, v: unknown) => (k === "src" || k === "srcset" ? undefined : v)),
  ) as unknown;

/** What "Highlight changes" outlines: chapters for a project, sections for the homepage, the post. */
export function highlights(src: PreviewSource, kind: PreviewKind, id: string): Highlight[] {
  if (kind === "project") {
    const row = src.projects.find((r) => r.id === id);
    if (!row) return [];
    const draft = publishProject(row.draft, src.resolve);
    const live = row.published;
    const anchors = chapterAnchors(draft.story.map((c) => c.title));
    const out: Highlight[] = [];
    if (!live) return [{ selector: "main", label: "Draft only" }];
    if (
      !same(noImgSrc(draft.overview), noImgSrc(live.overview)) ||
      !same(noImgSrc(draft.outcomes), noImgSrc(live.outcomes))
    )
      out.push({ selector: "#summary", label: "Changed" });
    draft.story.forEach((c, i) => {
      const anchor = anchors[i];
      if (!anchor) return;
      const was = live.story.find((x) => x.id === c.id);
      if (!was) out.push({ selector: `#${anchor}`, label: "Draft only" });
      else if (!same(noImgSrc(was), noImgSrc(c))) out.push({ selector: `#${anchor}`, label: "Changed" });
    });
    return out;
  }
  if (kind === "post") {
    const row = src.posts.find((p) => p.id === id);
    if (!row) return [];
    if (!row.published) return [{ selector: "main", label: "Draft only" }];
    const { modifiedAt: _a, ...draft } = publishPost(row.draft, src.resolve, src.now);
    const { modifiedAt: _b, ...live } = row.published;
    return same(noImgSrc(draft), noImgSrc(live)) ? [] : [{ selector: "main article", label: "Changed" }];
  }
  const live = src.layout.published;
  if (!live) return [{ selector: "main", label: "Draft only" }];
  const out: Highlight[] = [];
  for (const s of src.layout.draft.sections) {
    const was = live.sections.find((x) => x.id === s.id);
    if (!was) out.push({ selector: `#${s.id}`, label: "Draft only" });
    else if (!same(was, s)) out.push({ selector: `#${s.id}`, label: "Changed" });
  }
  const dp = publishProfile(src.profile.draft, src.resolve);
  const lp = src.profile.published;
  if (lp && !out.some((h) => h.selector === "#hero")) {
    const heroOf = (p: ProfilePublished) => [
      p.name,
      p.title,
      p.availability,
      p.location,
      p.positioning,
      p.intro,
      p.heroButtons,
    ];
    if (!same(heroOf(dp), heroOf(lp))) out.push({ selector: "#hero", label: "Changed" });
  }
  return out;
}

/** CSS for the highlights, drawn inside the preview frame (StudioPreview `.chg`). */
export function highlightCss(list: Highlight[]): string {
  return list
    .filter((h) => /^[#a-z][\w\s#-]*$/i.test(h.selector))
    .map(
      (h) =>
        `${h.selector}{position:relative;outline:2px solid #F5A524;outline-offset:6px;border-radius:2px}${h.selector}::before{content:"${h.label}";position:absolute;right:0;top:-30px;z-index:20;padding:3px 8px;border-radius:4px;background:#F5A524;color:#141416;font:600 11px/1.4 'Geist Mono',monospace;letter-spacing:.06em;text-transform:uppercase}`,
    )
    .join("");
}

const list = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;

/** "Studio only: …" notes at the end of the page: what the live page skips, and why. */
export function studioNotes(src: PreviewSource, kind: PreviewKind, id: string): string[] {
  const notes: string[] = [];
  if (kind === "project") {
    const row = src.projects.find((r) => r.id === id);
    if (!row) return [];
    const empty = row.draft.story
      .filter((c) => !c.hidden && !chapterHasContent(c))
      .map((c) => `“${c.title || "Untitled chapter"}”`);
    const hidden = row.draft.story.filter((c) => c.hidden).map((c) => `“${c.title || "Untitled chapter"}”`);
    if (empty.length)
      notes.push(
        `Studio only: ${list(empty)} ${empty.length === 1 ? "is" : "are"} empty, so the live page skips ${empty.length === 1 ? "it" : "them"}.`,
      );
    if (hidden.length)
      notes.push(
        `Studio only: ${list(hidden)} ${hidden.length === 1 ? "is" : "are"} hidden, so the live page skips ${hidden.length === 1 ? "it" : "them"}.`,
      );
    return notes;
  }
  if (kind === "site") {
    const hidden = src.layout.draft.sections.filter((s) => !s.visible).map(sectionName);
    if (hidden.length)
      notes.push(
        `Studio only: ${list(hidden)} ${hidden.length === 1 ? "is" : "are"} hidden, so the live homepage skips ${hidden.length === 1 ? "it" : "them"}.`,
      );
  }
  return notes;
}

/** Where "Back to editor" and "Publish changes" go. */
export function previewLinks(kind: PreviewKind, id: string): { back: string; publish: string } {
  if (kind === "project")
    return { back: `/studio/projects/${id}/overview`, publish: `/studio/projects/${id}/overview?publish=1` };
  if (kind === "post") return { back: `/studio/writing/${id}`, publish: `/studio/writing/${id}` };
  return { back: "/studio/website", publish: "/studio/website" };
}
