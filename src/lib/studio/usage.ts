/**
 * Where a media file is used (05 · Media › "Used in", 06 · Storage › Deleting): every reference
 * in the profile, project drafts and post drafts. A file in use can't be deleted.
 */
import type { MediaRef, Post, Profile, Project } from "../types";
import type { MediaUse } from "./repo";

interface Docs {
  profile: Profile;
  projects: { id: string; draft: Project }[];
  posts: { id: string; draft: Post }[];
}

/** Every media reference in a project draft, with the tab that holds it. */
export function projectMediaRefs(p: Project): { ref: MediaRef; tab: "visuals" | "story" | "settings" }[] {
  const out: { ref: MediaRef; tab: "visuals" | "story" | "settings" }[] = [];
  if (p.visuals.cover) out.push({ ref: p.visuals.cover, tab: "visuals" });
  if (p.visuals.hero.type === "prototype" && p.visuals.hero.poster)
    out.push({ ref: p.visuals.hero.poster, tab: "visuals" });
  for (const g of p.visuals.gallery) out.push({ ref: g, tab: "visuals" });
  for (const c of p.story)
    for (const b of c.blocks) {
      if (b.type === "image") out.push({ ref: b.media, tab: "story" });
      if (b.type === "gallery" || b.type === "beforeafter")
        for (const m of b.media) out.push({ ref: m, tab: "story" });
    }
  if (p.seo.ogImage && p.seo.ogImage !== "cover") out.push({ ref: p.seo.ogImage, tab: "settings" });
  return out;
}

export function postMediaRefs(p: Post): MediaRef[] {
  const out: MediaRef[] = [];
  if (p.cover) out.push(p.cover);
  for (const b of p.blocks) if (b.type === "image") out.push(b);
  return out;
}

export function mediaUses(mediaId: string, docs: Docs): MediaUse[] {
  const uses: MediaUse[] = [];
  const pr = docs.profile;
  if (pr.about.photo?.mediaId === mediaId || pr.contact.resume?.mediaId === mediaId)
    uses.push({ kind: "profile", title: "Profile & facts", href: "/studio/website/profile" });
  for (const p of docs.projects) {
    const refs = projectMediaRefs(p.draft).filter((r) => r.ref.mediaId === mediaId);
    const first = refs[0];
    if (first)
      uses.push({
        kind: "project",
        id: p.id,
        title: p.draft.overview.title || "Untitled project",
        href: `/studio/projects/${p.id}/${first.tab}`,
      });
  }
  for (const p of docs.posts)
    if (postMediaRefs(p.draft).some((r) => r.mediaId === mediaId))
      uses.push({
        kind: "post",
        id: p.id,
        title: p.draft.title || "Untitled post",
        href: `/studio/writing/${p.id}`,
      });
  return uses;
}
