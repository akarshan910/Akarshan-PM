/**
 * The Website builder's model (05 · Website builder; StudioSite): the outline's rows and their
 * names, counts and notes; what each eye switches; moves that keep the hero first and the footer
 * last; "Add section"; and the publish dialog's list of changes, worded as the board's `changes()`.
 *
 * Everything is a pure function of the draft layout, the draft profile, the projects and posts.
 */
import type { ProfilePublished } from "../published";
import type { Profile, SiteLayout } from "../types";
import { proofText } from "./profile";
import type { ProjectRow } from "./repo";

export type Section = SiteLayout["sections"][number];

export interface Ctx {
  profile: Profile;
  projects: Map<string, ProjectRow>;
  /** Published posts: Writing stays off the live site until there's one. */
  postCount: number;
}

const KIND_NAME: Partial<Record<Section["kind"], string>> = {
  hero: "Hero",
  proof: "Proof strip",
  writing: "Writing",
  about: "About",
  experience: "Experience",
  skills: "Skills",
  testimonials: "Testimonials",
  offduty: "Off duty",
  contact: "Contact",
  footer: "Footer",
};

export function sectionName(s: Section): string {
  if (s.kind === "shelf") return s.shelf?.name ?? (s.header?.title || "Shelf");
  if (s.kind === "text") return s.header?.title || "Text section";
  return KIND_NAME[s.kind] ?? s.kind;
}

/** Hero and footer are pinned. */
export const pinned = (s: Section) => s.kind === "hero" || s.kind === "footer";

/** Every section except Hero, Proof strip and Footer can be linked in the nav. */
export const canNav = (s: Section) => !["hero", "proof", "footer"].includes(s.kind);

const FIXED_ITEMS: Partial<Record<Section["kind"], Record<string, string>>> = {
  hero: {
    availability: "Availability chip",
    location: "Location",
    name: "Name",
    brush: "Brush underline",
    positioning: "Positioning line",
    intro: "Intro",
    buttons: "Buttons",
  },
  about: { text: "Text", points: "Points", photo: "Photo" },
  contact: {
    closing: "Closing line",
    email: "Email",
    linkedin: "LinkedIn",
    github: "GitHub",
    resume: "Résumé",
  },
  footer: { credit: "Credit line", updated: "Last updated" },
};

export function itemName(s: Section, id: string, ctx: Ctx): string {
  const fixed = FIXED_ITEMS[s.kind]?.[id];
  if (fixed) return fixed;
  const p = ctx.profile;
  switch (s.kind) {
    case "proof": {
      if (id === "spaces") return p.spaces?.label || "Problem spaces";
      const stat = p.proof.find((x) => x.id === id);
      return stat ? `${proofText(stat)} ${stat.label}` : id;
    }
    case "shelf":
      return ctx.projects.get(id)?.draft.overview.title || "Untitled project";
    case "experience":
      return p.experience.find((x) => x.id === id)?.company || "New role";
    case "skills":
      return p.skills.find((x) => x.id === id)?.title || "Skill group";
    case "testimonials":
      return p.testimonials.find((x) => x.id === id)?.name || "Testimonial";
    case "offduty":
      return p.offDuty.find((x) => x.id === id)?.title || "Off duty item";
    default:
      return id;
  }
}

/** A project that isn't published can't be switched on: its eye is locked. */
export function isDraftItem(s: Section, id: string, ctx: Ctx): boolean {
  if (s.kind !== "shelf") return false;
  return !ctx.projects.get(id)?.published;
}

export interface OutlineKid {
  /** A layout item, or a setting shown as an item: hero motion, floaters, latest posts, RSS. */
  id: string;
  name: string;
  /** null: no eye (floaters and Latest posts have no switch of their own). */
  visible: boolean | null;
  draft: boolean;
  chip?: string;
  /** Layout items can be reordered; the pseudo-items can't. */
  movable: boolean;
}

export const MOTION = "@motion";
export const FLOATERS = "@floaters";
export const LATEST = "@latest";
export const RSS = "@rss";

export function outlineKids(s: Section, ctx: Ctx): OutlineKid[] {
  const kids: OutlineKid[] = s.items.map((i) => {
    const draft = isDraftItem(s, i.id, ctx);
    return {
      id: i.id,
      name: itemName(s, i.id, ctx),
      visible: draft ? false : i.visible,
      draft,
      movable: true,
      ...(draft ? { chip: "Draft" } : s.kind === "testimonials" && i.visible ? { chip: "Homepage" } : {}),
    };
  });
  if (s.kind === "hero") {
    kids.push({
      id: MOTION,
      name: "Speed lines + tilt",
      visible: s.hero?.motion ?? true,
      draft: false,
      movable: false,
    });
    kids.push({ id: FLOATERS, name: "Floating previews", visible: null, draft: false, movable: false });
  }
  if (s.kind === "writing") {
    kids.push({ id: LATEST, name: "Latest posts", visible: null, draft: false, movable: false });
    kids.push({ id: RSS, name: "RSS link", visible: s.writing?.rss ?? true, draft: false, movable: false });
  }
  return kids;
}

/** "live/total" beside a section: the items that will show, of all of them. */
export function sectionCount(s: Section, ctx: Ctx): string {
  const items = s.items;
  if (!items.length) return "";
  const live = items.filter((i) => i.visible && !isDraftItem(s, i.id, ctx)).length;
  return `${String(live)}/${String(items.length)}`;
}

/** The amber note: "No posts yet" on Writing, "Nothing live yet" on an empty shelf. */
export function sectionNote(s: Section, ctx: Ctx): string | null {
  if (s.kind === "writing" && ctx.postCount === 0) return "No posts yet";
  if (s.kind === "shelf" && !s.items.some((i) => i.visible && !isDraftItem(s, i.id, ctx)))
    return "Nothing live yet";
  return null;
}

// ---- edits

export function patchSection(layout: SiteLayout, id: string, fn: (s: Section) => Section): SiteLayout {
  return { ...layout, sections: layout.sections.map((s) => (s.id === id ? fn(s) : s)) };
}

/** Moves a section by one; the hero stays first and the footer last. Returns null when it can't. */
export function moveSection(layout: SiteLayout, id: string, by: -1 | 1): SiteLayout | null {
  const list = [...layout.sections];
  const i = list.findIndex((s) => s.id === id);
  const j = i + by;
  const s = list[i];
  if (!s || pinned(s) || j < 1 || j > list.length - 2) return null;
  list.splice(i, 1);
  list.splice(j, 0, s);
  return { ...layout, sections: list };
}

/** Puts a section at `index` (a drag), clamped inside the pinned ends. */
export function placeSection(layout: SiteLayout, id: string, index: number): SiteLayout {
  const list = [...layout.sections];
  const i = list.findIndex((s) => s.id === id);
  const s = list[i];
  if (!s || pinned(s)) return layout;
  list.splice(i, 1);
  list.splice(Math.min(Math.max(index, 1), list.length - 1), 0, s);
  return { ...layout, sections: list };
}

export function moveKid(
  layout: SiteLayout,
  sectionId: string,
  itemId: string,
  by: -1 | 1,
): SiteLayout | null {
  const s = layout.sections.find((x) => x.id === sectionId);
  if (!s) return null;
  const i = s.items.findIndex((x) => x.id === itemId);
  const j = i + by;
  if (i < 0 || j < 0 || j >= s.items.length) return null;
  const items = [...s.items];
  const [it] = items.splice(i, 1);
  if (it) items.splice(j, 0, it);
  return patchSection(layout, sectionId, (x) => ({ ...x, items }));
}

export function placeKid(layout: SiteLayout, sectionId: string, itemId: string, index: number): SiteLayout {
  return patchSection(layout, sectionId, (s) => {
    const items = [...s.items];
    const i = items.findIndex((x) => x.id === itemId);
    if (i < 0) return s;
    const [it] = items.splice(i, 1);
    if (!it) return s;
    items.splice(Math.min(Math.max(index, 0), items.length), 0, it);
    return { ...s, items };
  });
}

export function setSectionVisible(layout: SiteLayout, id: string, visible: boolean): SiteLayout {
  return patchSection(layout, id, (s) => (s.kind === "hero" ? s : { ...s, visible }));
}

/** The eye on an item, including the pseudo-items (motion, RSS). */
export function setKidVisible(
  layout: SiteLayout,
  sectionId: string,
  kidId: string,
  visible: boolean,
): SiteLayout {
  return patchSection(layout, sectionId, (s) => {
    if (kidId === MOTION && s.hero) return { ...s, hero: { ...s.hero, motion: visible } };
    if (kidId === RSS && s.writing) return { ...s, writing: { ...s.writing, rss: visible } };
    return { ...s, items: s.items.map((i) => (i.id === kidId ? { ...i, visible } : i)) };
  });
}

export function setNav(layout: SiteLayout, id: string, label: string | null): SiteLayout {
  return patchSection(layout, id, (s) => {
    const { nav: _drop, ...rest } = s;
    return label === null ? rest : { ...rest, nav: { label } };
  });
}

/** A default nav label: the section's name, cut to the 14-character limit. */
export function navDefault(s: Section): string {
  return sectionName(s).slice(0, 14);
}

/** Moves a project to the other shelf, at the end, keeping its eye. */
export function moveToShelf(layout: SiteLayout, from: string, to: string, itemId: string): SiteLayout {
  const src = layout.sections.find((s) => s.id === from);
  const item = src?.items.find((i) => i.id === itemId);
  if (!item) return layout;
  let next = patchSection(layout, from, (s) => ({ ...s, items: s.items.filter((i) => i.id !== itemId) }));
  next = patchSection(next, to, (s) => ({ ...s, items: [...s.items.filter((i) => i.id !== itemId), item] }));
  return next;
}

/** "Add section": "Text section {n}" before Contact (or before the footer). */
export function addTextSection(layout: SiteLayout): { layout: SiteLayout; id: string; name: string } {
  const taken = new Set(layout.sections.map((s) => s.id));
  let n = layout.sections.filter((s) => s.kind === "text").length + 1;
  while (taken.has(`text-${String(n)}`)) n++;
  const id = `text-${String(n)}`;
  const name = `Text section ${String(n)}`;
  const section: Section = {
    id,
    kind: "text",
    visible: true,
    header: { title: name },
    items: [],
    text: { body: "" },
  };
  const list = [...layout.sections];
  const at = list.findIndex((s) => s.kind === "contact");
  list.splice(at < 0 ? list.length - 1 : at, 0, section);
  return { layout: { ...layout, sections: list }, id, name };
}

export function removeSection(layout: SiteLayout, id: string): SiteLayout {
  return { ...layout, sections: layout.sections.filter((s) => s.id !== id || pinned(s)) };
}

/** The nav, in page order: the sections linked in it, visible ones only. */
export function navLinks(layout: SiteLayout): { id: string; label: string }[] {
  return layout.sections
    .filter((s) => s.nav && s.visible)
    .map((s) => ({ id: s.id, label: s.nav?.label ?? "" }));
}

// ---- the changes list

/** Ids that moved: everything outside the longest run still in the old order (the board's `moved`). */
export function movedIds(order: string[], base: string[]): string[] {
  const ids = order.filter((x) => base.includes(x));
  const idx = ids.map((x) => base.indexOf(x));
  const n = idx.length;
  if (!n) return [];
  const len = idx.map(() => 1);
  const prev = idx.map(() => -1);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < i; j++)
      if ((idx[j] ?? 0) < (idx[i] ?? 0) && (len[j] ?? 0) + 1 > (len[i] ?? 0)) {
        len[i] = (len[j] ?? 0) + 1;
        prev[i] = j;
      }
  let best = 0;
  for (let i = 1; i < n; i++) if ((len[i] ?? 0) > (len[best] ?? 0)) best = i;
  const keep = new Set<string>();
  for (let i = best; i >= 0; i = prev[i] ?? -1) keep.add(ids[i] ?? "");
  return ids.filter((x) => !keep.has(x));
}

const plain = (html: string | undefined) => (html ?? "").replace(/<[^>]*>/g, "").trim();

/** What the publish dialog lists, and the header counts ("{n} changes not live"). */
export function siteChanges(
  draft: SiteLayout,
  live: SiteLayout | null,
  ctx: Ctx,
  /** The draft profile as it would publish (publishProfile), and the live one. */
  profile?: { draft: ProfilePublished; live: ProfilePublished | null },
): string[] {
  const out: string[] = [];
  if (!live) return ["First publish of the homepage"];
  const name = (id: string) => {
    const s = draft.sections.find((x) => x.id === id) ?? live.sections.find((x) => x.id === id);
    return s ? sectionName(s) : id;
  };
  const order = draft.sections.map((s) => s.id);
  const base = live.sections.map((s) => s.id);
  for (const id of order) if (!base.includes(id)) out.push(`Added ${name(id)}`);
  for (const id of base) if (!order.includes(id)) out.push(`Removed ${name(id)}`);
  for (const id of movedIds(order, base)) {
    const nx = order[order.indexOf(id) + 1];
    out.push(`Moved ${name(id)}${nx ? ` above ${name(nx)}` : " to the end"}`);
  }
  for (const s of draft.sections) {
    const b = live.sections.find((x) => x.id === s.id);
    if (!b) continue;
    const n = sectionName(s);
    if (b.visible !== s.visible) out.push(`${s.visible ? "Showed" : "Hid"} ${n}`);
    // items: shown / hidden, moved in, moved within
    for (const i of s.items) {
      const bi = b.items.find((x) => x.id === i.id);
      if (bi && bi.visible !== i.visible)
        out.push(`${n}: ${i.visible ? "showed" : "hid"} ${itemName(s, i.id, ctx)}`);
    }
    const ids = s.items.map((i) => i.id);
    const bids = b.items.map((i) => i.id);
    for (const x of ids)
      if (!bids.includes(x))
        out.push(
          s.kind === "shelf" ? `Moved ${itemName(s, x, ctx)} to ${n}` : `${n}: added ${itemName(s, x, ctx)}`,
        );
    const kept = ids.filter((x) => bids.includes(x));
    for (const x of movedIds(kept, bids)) {
      const nx = kept[kept.indexOf(x) + 1];
      out.push(`${n}: moved ${itemName(s, x, ctx)}${nx ? ` above ${itemName(s, nx, ctx)}` : " to the end"}`);
    }
    // nav
    if (Boolean(b.nav) !== Boolean(s.nav)) out.push(`Navigation: ${s.nav ? "added" : "removed"} ${n}`);
    else if (b.nav && s.nav && b.nav.label !== s.nav.label)
      out.push(`Navigation: renamed ${b.nav.label} to ${s.nav.label}`);
    // settings
    if (s.header?.title !== b.header?.title || s.header?.titleMuted !== b.header?.titleMuted)
      out.push(`Edited ${n} title`);
    if (s.header?.kicker !== b.header?.kicker) out.push(`Edited ${n} label`);
    if (plain(s.header?.intro) !== plain(b.header?.intro)) out.push(`Edited ${n} intro`);
    if (s.shelf && b.shelf && s.shelf.rows !== b.shelf.rows)
      out.push(`${n}: ${String(s.shelf.rows)} ${s.shelf.rows === 1 ? "row" : "rows"} on the homepage`);
    if (s.shelf && b.shelf && s.shelf.name !== b.shelf.name)
      out.push(`Renamed ${b.shelf.name} to ${s.shelf.name}`);
    if (s.writing && b.writing && s.writing.latest !== b.writing.latest)
      out.push(`Writing: latest ${String(s.writing.latest)} posts`);
    if (s.writing && b.writing && s.writing.rss !== b.writing.rss)
      out.push(`Writing: ${s.writing.rss ? "showed" : "hid"} RSS link`);
    if (s.text && b.text && s.text.body !== b.text.body) out.push(`Edited ${n}`);
    if (
      s.contact &&
      b.contact &&
      (s.contact.closing !== b.contact.closing || s.contact.closingAccent !== b.contact.closingAccent)
    )
      out.push("Edited closing line");
    if (s.hero && b.hero) {
      if (s.hero.motion !== b.hero.motion)
        out.push(`Hero: ${s.hero.motion ? "showed" : "hid"} speed lines + tilt`);
      const title = (id: string) => ctx.projects.get(id)?.draft.overview.title ?? id;
      for (const x of s.hero.floaters.items)
        if (!b.hero.floaters.items.includes(x)) out.push(`Floating previews: added ${title(x)}`);
      for (const x of b.hero.floaters.items)
        if (!s.hero.floaters.items.includes(x)) out.push(`Floating previews: removed ${title(x)}`);
      if (s.hero.floaters.atOnce !== b.hero.floaters.atOnce)
        out.push(`Floating previews: ${String(s.hero.floaters.atOnce)} at once`);
    }
  }
  if (profile?.live) {
    const d = profile.draft;
    const l = profile.live;
    const before = out.length;
    if ((d.availability ?? "") !== (l.availability ?? "")) out.push("Edited hero availability");
    if (plain(d.positioning) !== plain(l.positioning)) out.push("Edited hero positioning line");
    if (plain(d.intro) !== plain(l.intro)) out.push("Edited hero intro");
    if (d.about.body.map(plain).join("\n") !== l.about.body.map(plain).join("\n"))
      out.push("Edited About text");
    if (out.length === before && profileDiffers(d, l)) out.push("Edited Profile & facts");
  }
  return out;
}

/** Any other profile difference a site publish would send live. Image addresses are signed, so only alt counts. */
function profileDiffers(d: ProfilePublished, l: ProfilePublished): boolean {
  const norm = (p: ProfilePublished) =>
    JSON.stringify({ ...p, about: { ...p.about, photo: p.about.photo?.alt ?? null } });
  return norm(d) !== norm(l);
}
