/**
 * The publish checks (06 · pm-publish, step 2), run in the browser first for instant feedback
 * and again on the server. Messages are the `Editor*` boards' `boardIssues()` copy, each with
 * the tab and field it links to, so the dialog can say "{problem} Fix this to publish." and move
 * focus there. Warnings and passed checks (`boardChecks()`) never block.
 */
import { SOFT_LIMITS } from "../schemas";
import type { Block, Post, Profile, Project, SiteLayout } from "../types";
import type { MediaRow, PublishIssue } from "./repo";

export type EditorTab = "overview" | "visuals" | "story" | "outcomes" | "settings";

export interface ProjectIssue extends PublishIssue {
  tab: EditorTab;
}

export interface Check {
  ok: boolean;
  text: string;
  tab?: EditorTab;
}

export interface CheckContext {
  slug: string;
  /** Looks up a media row, for alt text that lives on the row rather than the reference. */
  media: (id: string) => MediaRow | undefined;
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The address problem, or "" (EditorSettings › `slugProblem`). "Taken" is checked by the repo. */
export function slugProblem(slug: string): string {
  if (!slug) return "Add an address.";
  if (!SLUG_PATTERN.test(slug) || slug.length > 80)
    return "Use only lowercase letters, numbers and single hyphens.";
  return "";
}

/** The video host, or "" when it isn't one Studio supports (EditorVisuals › `host`). */
export function videoHost(url: string): "YouTube" | "Vimeo" | "Loom" | "Google Drive" | "" {
  if (/^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url)) return "YouTube";
  if (/^https:\/\/(www\.)?vimeo\.com\/[\w/-]+/.test(url)) return "Vimeo";
  if (/^https:\/\/(www\.)?loom\.com\/share\/[\w-]+/.test(url)) return "Loom";
  if (/^https:\/\/drive\.google\.com\/file\/d\/[\w[\]-]+/.test(url)) return "Google Drive";
  return "";
}

/** A Vercel preview deployment, which asks visitors to log in. */
export function isVercelPreview(url: string): boolean {
  return /\.vercel\.app/.test(url) && /-git-|-[a-z0-9]{9}-/.test(url);
}

/** The prototype link's problem, or "" (EditorVisuals › `protoErr`). */
export function prototypeProblem(url: string, strict: boolean): string {
  const v = url.trim();
  if (!v) return strict ? "Paste the prototype’s address." : "";
  if (!/^https:\/\//.test(v)) return "Use an https:// address.";
  if (isVercelPreview(v))
    return "This is a Vercel preview link, which asks visitors to log in. Paste the production address instead.";
  return "";
}

// ---------------------------------------------------------------------------------------------
// RICE (EditorCaseStudy)
// ---------------------------------------------------------------------------------------------

type TableBlock = Extract<Block, { type: "table" }>;

const num = (cell: string | undefined): number => Number.parseFloat((cell ?? "").replace(/[^0-9.-]/g, ""));

/** Reach × impact × confidence ÷ effort, from a row laid out `#, item, R, I, C%, E mo, score`. */
export function riceScore(row: readonly string[]): number {
  const [, , r, i, c, e] = row;
  const effort = num(e);
  if (!effort) return Number.NaN;
  return (num(r) * num(i) * (num(c) / 100)) / effort;
}

export const round1 = (n: number): number => Math.round(n * 10) / 10;

export interface RiceFlag {
  row: number;
  item: string;
  /** The score its inputs give, to one decimal. */
  computed: number;
  /** The score as entered. */
  shown: number;
  /** The effort that would make the shown score match, to one decimal. */
  effortForShown: number;
}

/** Rows whose score doesn't match their inputs, skipping rows the owner marked reviewed. */
export function riceFlags(block: TableBlock): RiceFlag[] {
  if (block.formula !== "rice" || !block.checkFormula) return [];
  const reviewed = new Set(block.reviewed ?? []);
  const flags: RiceFlag[] = [];
  block.rows.forEach((row, i) => {
    const item = row[1] ?? "";
    if (reviewed.has(item)) return;
    const computed = round1(riceScore(row));
    const shown = num(row[row.length - 1]);
    if (Number.isNaN(computed) || Number.isNaN(shown)) return;
    if (Math.abs(computed - shown) >= 0.15) {
      const [, , r, imp, c] = row;
      const effortForShown = round1((num(r) * num(imp) * (num(c) / 100)) / shown);
      flags.push({ row: i, item, computed, shown, effortForShown });
    }
  });
  return flags;
}

/** Every flagged RICE row in a project, with its chapter. */
export function projectRiceFlags(draft: Project): { chapterId: string; block: TableBlock; flag: RiceFlag }[] {
  const out: { chapterId: string; block: TableBlock; flag: RiceFlag }[] = [];
  for (const c of draft.story)
    for (const b of c.blocks)
      if (b.type === "table") for (const flag of riceFlags(b)) out.push({ chapterId: c.id, block: b, flag });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Blocks with content
// ---------------------------------------------------------------------------------------------

const stripTags = (html: string): string => html.replace(/<[^>]*>/g, "").trim();

/** A block the live page would render: empty blocks are skipped (05 · Story). */
export function blockHasContent(b: Block): boolean {
  switch (b.type) {
    case "text":
    case "list":
    case "callout":
      return stripTags(b.body) !== "";
    case "heading":
    case "quote":
      return b.body.trim() !== "";
    case "metrics":
    case "divider":
    case "prototype":
      return true;
    case "table":
      return b.rows.length > 0;
    case "image":
      return b.media.mediaId !== "";
    case "gallery":
    case "beforeafter":
      return b.media.length > 0;
    case "video":
      return b.url !== "";
    case "journey":
      return b.stages.length > 0;
    case "ownership":
      return stripTags(b.mine) !== "";
    case "cards":
      return b.items.length > 0;
  }
}

export function chapterHasContent(c: Project["story"][number]): boolean {
  return c.blocks.some(blockHasContent);
}

// ---------------------------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------------------------

function altMissing(
  ref: { mediaId: string; alt?: string | undefined; decorative?: boolean | undefined },
  ctx: CheckContext,
): boolean {
  if (ref.mediaId === "" || ref.decorative) return false;
  if (ref.alt?.trim()) return false;
  const row = ctx.media(ref.mediaId);
  return !(row?.decorative || row?.alt?.trim());
}

/** What stops a project publishing, in tab order. */
export function projectIssues(draft: Project, ctx: CheckContext): ProjectIssue[] {
  const out: ProjectIssue[] = [];
  const o = draft.overview;
  const push = (tab: EditorTab, field: string, message: string) => out.push({ tab, field, message });

  // Overview
  if (!o.title.trim()) push("overview", "title", "Title is required.");
  if (!o.company.trim()) push("overview", "company", "Company or client is required.");
  if (!o.summary.trim()) push("overview", "summary", "Summary is required.");
  else if (o.summary.length > SOFT_LIMITS.summary)
    push("overview", "summary", "Summary is over 140 characters.");
  if (o.prdUrl && !/^https:\/\//.test(o.prdUrl))
    push("overview", "prdUrl", "PRD link must start with https://");

  // Visuals
  const v = draft.visuals;
  const missing = v.gallery.filter((g) => altMissing(g, ctx)).length;
  if (missing)
    push("visuals", "gallery", `${missing}${missing === 1 ? " image needs" : " images need"} alt text.`);
  if (v.cover && altMissing(v.cover, ctx)) push("visuals", "cover", "The cover needs alt text.");
  if (v.hero.type === "video" && !videoHost(v.hero.url))
    push("visuals", "hero", "The video link isn’t from YouTube, Vimeo, Loom or Google Drive.");
  if (v.hero.type === "prototype") {
    const p = prototypeProblem(v.hero.url, true);
    if (p) push("visuals", "hero", `Prototype: ${p}`);
  }

  // Story
  draft.story.forEach((c, i) => {
    if (!c.title.trim() && chapterHasContent(c))
      push("story", `chapter.${c.id}`, `Chapter ${i + 1} needs a title.`);
    for (const b of c.blocks) {
      if (b.type === "image" && altMissing(b.media, ctx))
        push("story", `block.${b.id}`, "An image in the story needs alt text.");
      if ((b.type === "gallery" || b.type === "beforeafter") && b.media.some((m) => altMissing(m, ctx)))
        push("story", `block.${b.id}`, "An image in the story needs alt text.");
    }
  });
  // A flagged RICE row is a warning, not a blocker: EditorCaseStudy's boardIssues() leaves it out
  // and its boardChecks() lists it (the boards win over 06 · pm-publish here).

  // Outcomes
  draft.outcomes.forEach((m, i) => {
    const n = i + 1;
    if (!m.value.trim() || !m.label.trim())
      push("outcomes", `outcome.${m.id}`, `Fill in or delete result ${n}.`);
    else if (m.type === "achieved" && !m.evidence?.trim())
      push("outcomes", `outcome.${m.id}`, `Result ${n} is marked achieved but has no evidence note.`);
  });

  // URL & SEO
  const s = slugProblem(ctx.slug);
  if (s) push("settings", "slug", `Page address: ${s}`);
  return out;
}

/** What stays hidden or deserves a look before publishing; never blocks (each board's `boardChecks`). */
export function projectChecks(draft: Project): Check[] {
  const out: Check[] = [];
  if (!draft.overview.role?.trim())
    out.push({
      ok: false,
      tab: "overview",
      text: "My role is empty, so that chapter stays hidden. You can publish anyway.",
    });
  const flags = projectRiceFlags(draft);
  if (flags.length > 0)
    out.push({
      ok: false,
      tab: "story",
      text: "RICE table: one row’s score doesn’t match its inputs. Review",
    });
  const hidden = draft.story.filter((c) => c.hidden || !chapterHasContent(c));
  if (hidden.length > 0)
    out.push({
      ok: false,
      tab: "story",
      text: `${hidden.length}${hidden.length === 1 ? " chapter stays" : " chapters stay"} hidden: ${hidden.map((c) => c.title || "Untitled").join(", ")}.`,
    });
  out.push(
    ...honesty(draft)
      .filter((h) => h.level !== "err")
      .map((h) => ({ ok: h.level === "ok", tab: "outcomes" as const, text: h.text })),
  );
  return out;
}

export interface Honesty {
  level: "err" | "warn" | "ok";
  text: string;
}

const KIND_WORDS: Record<Project["overview"]["kind"], string> = {
  shipped: "shipped project",
  study: "strategy study",
  prototype: "prototype",
};

/** The Outcomes honesty check (EditorOutcomes › `honesty()`, 05 · Outcomes). */
export function honesty(draft: Project): Honesty[] {
  const out: Honesty[] = [];
  const kind = draft.overview.kind;
  draft.outcomes.forEach((m, i) => {
    const n = `Result ${i + 1}`;
    if (m.type === "achieved" && !m.evidence?.trim())
      out.push({ level: "err", text: `${n} is marked achieved with no evidence note.` });
    if (m.type === "achieved" && kind !== "shipped")
      out.push({
        level: "warn",
        text: `This project is a ${KIND_WORDS[kind]} (see Overview). Achieved results usually come from shipped work. Is ${m.value || "this"} measured?`,
      });
    if (m.type === "projected" && !m.evidence?.trim())
      out.push({ level: "warn", text: `${n} is projected. Note the method, so you can explain it.` });
    if (m.value.trim() && !m.credit)
      out.push({ level: "warn", text: `${n} doesn’t say whose result it is.` });
  });
  const head = draft.outcomes.find((m) => m.id === draft.headlineOutcomeId);
  if (head?.type === "target")
    out.push({
      level: "ok",
      text: "The card headline is labelled Target, and the summary doesn’t claim it as achieved.",
    });
  if (draft.outcomes.length > 0) out.push({ level: "ok", text: "Every result has a label." });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Readiness (the dashboard and the Projects list)
// ---------------------------------------------------------------------------------------------

/** The fields a finished case study has, with the chip label the dashboard shows when one is empty. */
export function readiness(draft: Project): { percent: number; missing: string[] } {
  const o = draft.overview;
  const fields: [string, boolean][] = [
    ["Title", o.title.trim() !== ""],
    ["Company", o.company.trim() !== ""],
    ["Summary", o.summary.trim() !== ""],
    ["Problem", Boolean(o.problem?.trim())],
    ["Proposal", Boolean(o.proposal?.trim())],
    ["My role", Boolean(o.role?.trim())],
    ["Cover image", Boolean(draft.visuals.cover?.mediaId)],
    ["Story", draft.story.some(chapterHasContent)],
    ["Results", draft.outcomes.length > 0],
  ];
  const filled = fields.filter(([, ok]) => ok).length;
  return {
    percent: Math.round((filled / fields.length) * 100),
    missing: fields.filter(([, ok]) => !ok).map(([label]) => label),
  };
}

// ---------------------------------------------------------------------------------------------
// Posts (05 · Writing › Publishing)
// ---------------------------------------------------------------------------------------------

/** The post body's words: its text, heading, quote and code blocks (05 · Writing). */
export function postWords(post: Post): number {
  let text = "";
  for (const b of post.blocks) if ("body" in b) text += ` ${stripTags(b.body)}`;
  return text.split(/\s+/).filter(Boolean).length;
}

/** "{n} words · {m} min read": words ÷ 220, at least 1. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 220));
}

export function postIssues(post: Post, ctx: Pick<CheckContext, "media">): PublishIssue[] {
  const out: PublishIssue[] = [];
  if (!post.title.trim()) out.push({ field: "title", message: "Add a title." });
  if (post.cover && altMissing(post.cover, { ...ctx, slug: "" }))
    out.push({ field: "cover", message: "The cover needs alt text." });
  return out;
}

export function postChecks(post: Post): Check[] {
  const out: Check[] = [];
  const words = postWords(post);
  if (words < 300) out.push({ ok: false, text: `Short so far (${words} words). Publishing is still fine.` });
  if (!post.excerpt?.trim()) out.push({ ok: false, text: "No excerpt: the first lines will be used." });
  out.push({
    ok: true,
    text: post.showOnHome ? "Will show on your homepage's Writing section." : "Only on /writing and in RSS.",
  });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Site
// ---------------------------------------------------------------------------------------------

/** Unconfirmed facts that would be visible on the site (05 · Profile & facts › Publishing). */
export function siteNeedsConfirm(profile: Profile, layout: SiteLayout): string[] {
  const visible = (kind: string) => layout.sections.some((s) => s.kind === kind && s.visible);
  return profile.unconfirmed.filter((key) => {
    if (key.startsWith("proof.")) return visible("proof");
    if (key.startsWith("experience.")) return visible("experience");
    if (key === "availability") return Boolean(profile.availability);
    return true;
  });
}
