/**
 * The publish checks (06 · pm-publish step 2), with the messages from the Editor boards' publish
 * dialogs. Each failure is `{ field, message }`; `field` names where Studio takes the owner.
 */
import { videoHost } from "./lib/links.ts";
import type { Block, MediaRef, Post, Project } from "./lib/types.ts";
import type { LinkKind, LinkResult } from "./check-link.ts";
import type { MediaRow } from "./media.ts";

export interface Issue {
  field: string;
  message: string;
  /** Set on the two checks the V0 seed may skip (07 · Extraction; 09, D51). */
  code?: "summary-long" | "rice-row";
}

export type LinkChecker = (url: string, kind: LinkKind) => Promise<LinkResult>;

const num = (cell: string | undefined): number => {
  const m = /-?\d+(?:\.\d+)?/.exec((cell ?? "").replace(/,/g, ""));
  return m ? Number(m[0]) : Number.NaN;
};

/** RICE rows whose shown score is off by more than 0.05 (06 · RICE tables). Returns row indexes. */
export function riceMismatches(block: Extract<Block, { type: "table" }>): number[] {
  if (block.formula !== "rice") return [];
  const out: number[] = [];
  block.rows.forEach((row, i) => {
    const [, , reach, impact, conf, effort, shown] = row;
    const score = Math.round(((num(reach) * num(impact) * (num(conf) / 100)) / num(effort)) * 10) / 10;
    const reviewed = (block.reviewed ?? []).some((r) => r === String(i) || r === row[0] || r === row[1]);
    if (!reviewed && (!Number.isFinite(score) || Math.abs(score - num(shown)) > 0.05)) out.push(i);
  });
  return out;
}

/** Every image reference in a project, with the field it lives in. */
function projectImages(p: Project): { field: string; ref: MediaRef; cover?: boolean }[] {
  const out: { field: string; ref: MediaRef; cover?: boolean }[] = [];
  if (p.visuals.cover) out.push({ field: "visuals.cover", ref: p.visuals.cover, cover: true });
  if (p.visuals.hero.type === "prototype" && p.visuals.hero.poster) {
    out.push({ field: "visuals.hero.poster", ref: p.visuals.hero.poster });
  }
  p.visuals.gallery.forEach((g, i) => out.push({ field: `visuals.gallery.${i}`, ref: g }));
  if (p.seo.ogImage && p.seo.ogImage !== "cover") out.push({ field: "seo.ogImage", ref: p.seo.ogImage });
  for (const c of p.story) {
    if (c.hidden) continue;
    for (const b of c.blocks) {
      if (b.type === "image") out.push({ field: `story.${c.id}.${b.id}`, ref: b.media });
      if (b.type === "gallery" || b.type === "beforeafter") {
        b.media.forEach((m) => out.push({ field: `story.${c.id}.${b.id}`, ref: m }));
      }
    }
  }
  return out;
}

function altMissing(ref: MediaRef, row: MediaRow | undefined): boolean {
  if (ref.decorative || row?.decorative) return false;
  return !(ref.alt ?? row?.alt ?? "").trim();
}

export async function projectChecks(
  p: Project,
  slug: string,
  media: Map<string, MediaRow>,
  check: LinkChecker,
): Promise<Issue[]> {
  const issues: Issue[] = [];
  const o = p.overview;
  if (!o.title.trim()) issues.push({ field: "overview.title", message: "Title is required." });
  if (!o.company.trim()) issues.push({ field: "overview.company", message: "Company is required." });
  if (!o.summary.trim()) issues.push({ field: "overview.summary", message: "Summary is required." });
  else if (o.summary.length > 140)
    issues.push({
      field: "overview.summary",
      message: "Summary is over 140 characters.",
      code: "summary-long",
    });
  if (!slug.trim()) issues.push({ field: "seo.slug", message: "Add an address for the page." });

  let missingAlt = 0;
  for (const img of projectImages(p)) {
    const row = img.ref.mediaId ? media.get(img.ref.mediaId) : undefined;
    if (!row) {
      issues.push({ field: img.field, message: "An image is missing. Choose one, or remove it." });
      continue;
    }
    if (altMissing(img.ref, row)) {
      if (img.cover) issues.push({ field: img.field, message: "The cover needs alt text." });
      else missingAlt++;
    }
  }
  if (missingAlt > 0) {
    issues.push({
      field: "visuals.alt",
      message: `${missingAlt} ${missingAlt === 1 ? "image needs" : "images need"} alt text.`,
    });
  }

  p.outcomes.forEach((m, i) => {
    if (m.type === "achieved" && !(m.evidence ?? "").trim()) {
      issues.push({
        field: `outcomes.${m.id}`,
        message: `Result ${i + 1} is marked achieved but has no evidence note.`,
      });
    }
  });

  const videos: { field: string; url: string }[] = [];
  if (p.visuals.hero.type === "video" && p.visuals.hero.url)
    videos.push({ field: "visuals.hero", url: p.visuals.hero.url });
  for (const c of p.story) {
    if (c.hidden) continue;
    for (const b of c.blocks) {
      if (b.type === "video") {
        if (b.url) videos.push({ field: `story.${c.id}.${b.id}`, url: b.url });
        else
          issues.push({
            field: `story.${c.id}.${b.id}`,
            message: "Paste a video link, or remove the block.",
          });
      }
      if (b.type === "table") {
        const n = riceMismatches(b).length;
        if (n > 0)
          issues.push({
            field: `story.${c.id}.${b.id}`,
            message: `${n} ${n === 1 ? "row needs" : "rows need"} a look.`,
            code: "rice-row",
          });
      }
    }
  }
  for (const v of videos) {
    const host = videoHost(v.url);
    if (!host) {
      issues.push({ field: v.field, message: "Use a YouTube, Vimeo, Loom or Google Drive link." });
    } else if (host === "drive") {
      const r = await check(v.url, "video");
      if (r.status === "not-shared" || r.status === "login") {
        issues.push({ field: v.field, message: "Set the Drive video's sharing to “Anyone with the link”." });
      }
    }
  }
  if (p.visuals.hero.type === "prototype" && p.visuals.hero.url) {
    const r = await check(p.visuals.hero.url, "prototype");
    if (r.status === "login")
      issues.push({ field: "visuals.hero", message: "The prototype asks visitors to sign in." });
  }
  return issues;
}

export function postChecks(p: Post, slug: string, media: Map<string, MediaRow>): Issue[] {
  const issues: Issue[] = [];
  if (!p.title.trim()) issues.push({ field: "title", message: "Add a title." });
  if (!slug.trim()) issues.push({ field: "seo.slug", message: "Add an address for the page." });
  if (p.cover) {
    const row = p.cover.mediaId ? media.get(p.cover.mediaId) : undefined;
    if (!row) issues.push({ field: "cover", message: "The cover image is missing." });
    else if (altMissing(p.cover, row)) issues.push({ field: "cover", message: "The cover needs alt text." });
  }
  let missingAlt = 0;
  for (const b of p.blocks) {
    if (b.type !== "image") continue;
    const row = b.mediaId ? media.get(b.mediaId) : undefined;
    if (!row)
      issues.push({ field: `blocks.${b.id}`, message: "An image is missing. Choose one, or remove it." });
    else if (altMissing(b, row)) missingAlt++;
  }
  if (missingAlt > 0) {
    issues.push({
      field: "blocks.alt",
      message: `${missingAlt} ${missingAlt === 1 ? "image needs" : "images need"} alt text.`,
    });
  }
  return issues;
}
