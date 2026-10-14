/**
 * Publishing the website: the profile and the layout together (06 · pm-publish, kind 'site';
 * redesign/03 · Website builder).
 *
 * - Stale ids are dropped: items that no longer exist (a deleted testimonial or project).
 * - Hidden sections and hidden items never reach the published columns, and the published profile
 *   keeps only what a visible section shows. The anon key can read `published`, so anything hidden
 *   stays in the draft (10 · Security gates › Drafts).
 * - Shelves and floaters keep draft projects' ids: a draft floats once it's published.
 * - The change list reads one drag as one move (longest increasing subsequence).
 */
import type { ProfilePublished } from "./lib/published.ts";
import type { Profile, Section, SiteLayout } from "./lib/types.ts";

const KIND_LABELS: Record<Section["kind"], string> = {
  hero: "Hero",
  proof: "Proof",
  shelf: "Shelf",
  writing: "Writing",
  about: "About",
  experience: "Experience",
  skills: "Skills",
  testimonials: "Testimonials",
  offduty: "Off duty",
  contact: "Contact",
  text: "Text section",
  footer: "Footer",
};

export function sectionName(s: Section): string {
  return s.shelf?.name || s.header?.title || s.nav?.label || KIND_LABELS[s.kind];
}

/** The ids each profile-backed section may list. Null: the section has no item ids to check. */
function profileIds(kind: Section["kind"], profile: Profile): Set<string> | null {
  switch (kind) {
    case "proof":
      return new Set([...profile.proof.map((p) => p.id), "spaces"]);
    case "experience":
      return new Set(profile.experience.map((e) => e.id));
    case "skills":
      return new Set(profile.skills.map((s) => s.id));
    case "testimonials":
      return new Set(profile.testimonials.map((t) => t.id));
    case "offduty":
      return new Set(profile.offDuty.map((o) => o.id));
    default:
      return null;
  }
}

/** The layout to publish: visible sections and items only, with stale ids dropped. */
export function publishableLayout(draft: SiteLayout, profile: Profile, projectIds: Set<string>): SiteLayout {
  return {
    ...draft,
    sections: draft.sections
      .filter((s) => s.visible || s.kind === "hero" || s.kind === "footer")
      .map((s): Section => {
        const known = s.kind === "shelf" ? projectIds : profileIds(s.kind, profile);
        const items = s.items.filter((i) => i.visible && (known === null || known.has(i.id)));
        const out: Section = { ...s, visible: true, items };
        if (s.hero) {
          out.hero = {
            ...s.hero,
            floaters: { ...s.hero.floaters, items: s.hero.floaters.items.filter((id) => projectIds.has(id)) },
          };
        }
        return out;
      }),
  };
}

/** Keeps only the profile items that a published, visible section lists (10 · Security gates). */
export function pruneProfile(profile: ProfilePublished, layout: SiteLayout): ProfilePublished {
  const listed = (kind: Section["kind"]) =>
    new Set(layout.sections.filter((s) => s.kind === kind).flatMap((s) => s.items.map((i) => i.id)));
  const has = (kind: Section["kind"]) => layout.sections.some((s) => s.kind === kind);
  const proof = listed("proof");
  const experience = listed("experience");
  const skills = listed("skills");
  const testimonials = listed("testimonials");
  const offDuty = listed("offduty");
  const { spaces, ...rest } = profile;
  return {
    ...rest,
    ...(spaces && proof.has("spaces") ? { spaces } : {}),
    proof: profile.proof.filter((p) => proof.has(p.id)),
    experience: profile.experience.filter((e) => experience.has(e.id)),
    skills: profile.skills.filter((g) => skills.has(g.id)),
    testimonials: profile.testimonials.filter((t) => testimonials.has(t.id)),
    offDuty: profile.offDuty.filter((o) => offDuty.has(o.id)),
    about: has("about") ? profile.about : { body: [] },
  };
}

/** Which section kind a fact key (`proof.p-users.value`, `experience.e1…`) appears in. */
function factSection(key: string): { kind: Section["kind"]; item?: string } | null {
  const [root, item] = key.split(".");
  switch (root) {
    case "name":
    case "title":
    case "availability":
    case "location":
    case "positioning":
    case "intro":
      return { kind: "hero" };
    case "proof":
    case "spaces":
      return root === "spaces"
        ? { kind: "proof", item: "spaces" }
        : { kind: "proof", ...(item ? { item } : {}) };
    case "experience":
    case "skills":
    case "testimonials":
      return { kind: root, ...(item ? { item } : {}) };
    case "offDuty":
      return { kind: "offduty", ...(item ? { item } : {}) };
    case "about":
    case "contact":
      return { kind: root };
    default:
      return null;
  }
}

/** "Worth a check" facts that visitors would see once this layout is live. */
export function visibleUnconfirmed(profile: Profile, layout: SiteLayout): string[] {
  return profile.unconfirmed.filter((key) => {
    const at = factSection(key);
    if (!at) return true; // unknown place: ask rather than guess
    return layout.sections.some(
      (s) => s.kind === at.kind && (at.item === undefined || s.items.some((i) => i.id === at.item)),
    );
  });
}

/** Indexes (into `seq`) of one longest strictly increasing subsequence. */
function lis(seq: number[]): Set<number> {
  const tails: number[] = [];
  const prev: number[] = new Array<number>(seq.length).fill(-1);
  seq.forEach((v, i) => {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((seq[tails[mid] ?? 0] ?? 0) < v) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[i] = tails[lo - 1] ?? -1;
    tails[lo] = i;
  });
  const keep = new Set<number>();
  let k = tails[tails.length - 1] ?? -1;
  while (k !== -1) {
    keep.add(k);
    k = prev[k] ?? -1;
  }
  return keep;
}

/** The human-readable change list for the publish dialog and `site_revisions.changes`. */
export function layoutChanges(before: SiteLayout | null, after: SiteLayout): string[] {
  if (!before) return ["First publish of the website"];
  const out: string[] = [];
  const old = new Map(before.sections.map((s, i) => [s.id, { s, i }]));
  const now = new Map(after.sections.map((s) => [s.id, s]));
  for (const s of after.sections) if (!old.has(s.id)) out.push(`Showed ${sectionName(s)}`);
  for (const s of before.sections) if (!now.has(s.id)) out.push(`Hid ${sectionName(s)}`);

  const common = after.sections.filter((s) => old.has(s.id));
  const keep = lis(common.map((s) => old.get(s.id)?.i ?? 0));
  common.forEach((s, i) => {
    if (keep.has(i)) return;
    const next = common[i + 1];
    out.push(
      next ? `Moved ${sectionName(s)} above ${sectionName(next)}` : `Moved ${sectionName(s)} to the end`,
    );
  });

  for (const s of common) {
    const was = new Set(old.get(s.id)?.s.items.map((i) => i.id));
    const is = new Set(s.items.map((i) => i.id));
    const added = [...is].filter((id) => !was.has(id)).length;
    const removed = [...was].filter((id) => !is.has(id)).length;
    if (added) out.push(`${sectionName(s)}: ${added} ${added === 1 ? "item" : "items"} shown`);
    if (removed) out.push(`${sectionName(s)}: ${removed} ${removed === 1 ? "item" : "items"} hidden`);
  }
  return out;
}

/**
 * A project's first publish places it in the published layout, in every shelf the draft layout
 * puts it on, right after the nearest project before it there that is already in the published
 * shelf (06 · pm-publish step 4). Returns null when nothing changes.
 */
export function placeProject(published: SiteLayout, draft: SiteLayout, projectId: string): SiteLayout | null {
  let changed = false;
  const sections = published.sections.map((pub) => {
    const d = draft.sections.find((s) => s.id === pub.id && s.kind === "shelf");
    if (!d || pub.kind !== "shelf") return pub;
    const at = d.items.findIndex((i) => i.id === projectId && i.visible);
    if (at === -1 || pub.items.some((i) => i.id === projectId)) return pub;
    const before = d.items
      .slice(0, at)
      .reverse()
      .find((i) => pub.items.some((p) => p.id === i.id));
    const index = before ? pub.items.findIndex((p) => p.id === before.id) + 1 : 0;
    changed = true;
    return {
      ...pub,
      items: [...pub.items.slice(0, index), { id: projectId, visible: true }, ...pub.items.slice(index)],
    };
  });
  return changed ? { ...published, sections } : null;
}
