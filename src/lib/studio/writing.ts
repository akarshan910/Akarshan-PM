/**
 * Writing (05 · Writing; StudioWriting): the list's tabs, the résumé ideas, the facts a post can
 * cite, the address that follows the title, and the schedule's wording.
 */
import type { Post, PostBlock, Profile } from "../types";
import { slugify } from "../v0";
import { newId } from "../defaults";
import type { PostRow } from "./repo";

export type PostTab = "draft" | "scheduled" | "published";

export function postStatus(row: PostRow): PostTab {
  if (row.published) return "published";
  if (row.scheduledFor) return "scheduled";
  return "draft";
}

export const EMPTY_TABS: Record<PostTab, [string, string]> = {
  draft: ["No drafts", "Start one from an idea below, or with New post."],
  scheduled: ["Nothing scheduled", "Choose Schedule in a draft’s settings."],
  published: ["Nothing published yet", "Your first post appears on /writing and in RSS."],
};
export const FIRST_POST: [string, string] = [
  "Write your first post",
  "It goes to /writing, your RSS feed and, if you want, your homepage. No Medium or Substack needed.",
];

const plain = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** "Ideas from your résumé": each visible experience highlight, as a working title (nothing invented). */
export function resumeIdeas(
  profile: Profile,
  used: Iterable<string>,
): { key: string; title: string; from: string }[] {
  const taken = new Set([...used].map((t) => t.trim().toLowerCase()));
  const out: { key: string; title: string; from: string }[] = [];
  for (const e of profile.experience)
    for (const h of e.highlights)
      for (const i of h.items) {
        if (i.hidden) continue;
        const title = plain(i.text);
        if (!title || taken.has(title.toLowerCase())) continue;
        out.push({ key: `${e.id}.${i.id}`, title, from: e.company });
      }
  return out;
}

/** "Facts you can cite": confirmed profile numbers that carry a result label. */
export function citableFacts(profile: Profile): {
  id: string;
  text: string;
  value: string;
  label: string;
  type: NonNullable<Profile["proof"][number]["type"]>;
}[] {
  return profile.proof
    .filter((p) => p.type && !profile.unconfirmed.includes(`proof.${p.id}.value`))
    .map((p) => {
      const value = `${p.value}${p.unit ?? ""}`;
      return {
        id: p.id,
        text: `${value} ${p.label}`,
        value,
        label: p.label,
        type: p.type as NonNullable<typeof p.type>,
      };
    });
}

export function factBlock(f: ReturnType<typeof citableFacts>[number]): PostBlock {
  return { id: newId("b"), type: "fact", value: f.value, label: f.label, resultType: f.type };
}

/** The address follows the title until the owner edits it (05 · Post settings › Address). */
export function followsTitle(slug: string, title: string): boolean {
  return /^untitled-\d+$/.test(slug) || slug === slugify(title);
}

export function postSlugFor(title: string, fallback: string): string {
  return slugify(title).slice(0, 80) || fallback;
}

/** "Mon 19 Oct" for the list, and "Monday 19 October, 09:00" for the dialog title. */
export function scheduleLabel(iso: string): { short: string; long: string } {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-GB", { weekday: "short" });
  const dayLong = d.toLocaleDateString("en-GB", { weekday: "long" });
  const mon = d.toLocaleDateString("en-GB", { month: "short" });
  const monLong = d.toLocaleDateString("en-GB", { month: "long" });
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { short: `${day} ${d.getDate()} ${mon}`, long: `${dayLong} ${d.getDate()} ${monLong}, ${time}` };
}

/** A `datetime-local` value in the owner's time zone, and back. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function fromLocalInput(value: string): string | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function excerptOrFirstLines(post: Post): string {
  if (post.excerpt?.trim()) return post.excerpt.trim();
  const first = post.blocks
    .filter((b) => b.type === "text")
    .map((b) => plain(b.body))
    .join(" ");
  return first.slice(0, 160) || post.subtitle || "";
}
