/**
 * Where a media file is used (05 · Media › "Used in", 06 · Storage › Deleting): every reference
 * in the profile, project drafts and post drafts, with where in the document it sits ("Gallery",
 * "Story · The bet"). A file in use can't be deleted.
 */
import type { MediaRef, Post, Profile, Project } from "../types";
import type { MediaUse } from "./repo";

interface Docs {
  profile: Profile;
  projects: { id: string; draft: Project }[];
  posts: { id: string; draft: Post }[];
}

type Tab = "visuals" | "story" | "settings";

/** Every media reference in a project draft, with the tab that holds it and where on it. */
export function projectMediaRefs(p: Project): { ref: MediaRef; tab: Tab; where: string }[] {
  const out: { ref: MediaRef; tab: Tab; where: string }[] = [];
  if (p.visuals.cover) out.push({ ref: p.visuals.cover, tab: "visuals", where: "Cover" });
  if (p.visuals.hero.type === "prototype" && p.visuals.hero.poster)
    out.push({ ref: p.visuals.hero.poster, tab: "visuals", where: "Prototype poster" });
  for (const g of p.visuals.gallery) out.push({ ref: g, tab: "visuals", where: "Gallery" });
  for (const c of p.story)
    for (const b of c.blocks) {
      const where = `Story · ${c.title || "Untitled chapter"}`;
      if (b.type === "image") out.push({ ref: b.media, tab: "story", where });
      if (b.type === "gallery" || b.type === "beforeafter")
        for (const m of b.media) out.push({ ref: m, tab: "story", where });
    }
  if (p.seo.ogImage && p.seo.ogImage !== "cover")
    out.push({ ref: p.seo.ogImage, tab: "settings", where: "Link preview" });
  return out;
}

export function postMediaRefs(p: Post): { ref: MediaRef; where: string }[] {
  const out: { ref: MediaRef; where: string }[] = [];
  if (p.cover) out.push({ ref: p.cover, where: "Cover" });
  for (const b of p.blocks) if (b.type === "image") out.push({ ref: b, where: "Image" });
  return out;
}

export function mediaUses(mediaId: string, docs: Docs): MediaUse[] {
  const uses: MediaUse[] = [];
  const pr = docs.profile;
  if (pr.about.photo?.mediaId === mediaId)
    uses.push({
      kind: "profile",
      title: "Profile & facts",
      where: "About photo",
      href: "/studio/website/profile",
    });
  if (pr.contact.resume?.mediaId === mediaId)
    uses.push({ kind: "profile", title: "Website", where: "Résumé button", href: "/studio/website/profile" });
  for (const p of docs.projects)
    for (const r of projectMediaRefs(p.draft).filter((x) => x.ref.mediaId === mediaId)) {
      if (uses.some((u) => u.id === p.id && u.where === r.where)) continue;
      uses.push({
        kind: "project",
        id: p.id,
        title: p.draft.overview.title || "Untitled project",
        where: r.where,
        href: `/studio/projects/${p.id}/${r.tab}`,
      });
    }
  for (const p of docs.posts)
    for (const r of postMediaRefs(p.draft).filter((x) => x.ref.mediaId === mediaId)) {
      if (uses.some((u) => u.id === p.id && u.where === r.where)) continue;
      uses.push({
        kind: "post",
        id: p.id,
        title: p.draft.title || "Untitled post",
        where: r.where,
        href: `/studio/writing/${p.id}`,
      });
    }
  return uses;
}

/** Every media id the given documents refer to (drafts or published), for signing only those. */
export function usedMediaIds(docs: unknown[]): Set<string> {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v)) {
        if (k === "mediaId" && typeof x === "string" && x) out.add(x);
        else walk(x);
      }
  };
  docs.forEach(walk);
  return out;
}
