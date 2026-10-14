/**
 * Profile & facts (05 · Profile & facts; StudioProfile): the "Worth a check" rows, the job-title
 * choice, the Wipro-style placeholder, the "Before you publish" list, and the layout items the form
 * switches (experience on the timeline, testimonials in the carousel).
 *
 * Per D5/D30/D42 an unconfirmed fact publishes with its live value; nothing here hides it.
 */
import type { Profile, SiteLayout } from "../types";
import { factValue, setFact } from "./facts";

type SectionKind = SiteLayout["sections"][number]["kind"];

export const POSITIONING_SOFT = 100;
export const POSITIONING_HARD = 220;
export const HERO_BUTTON_MAX = 24;

/** Characters a reader sees: inline HTML without its tags and entities. */
export function plainLength(html: string): number {
  return html.replace(/<[^>]*>/g, "").replace(/&(amp|lt|gt|quot|#39);/g, "_").length;
}

/** "300M+": a proof stat as the site shows it. */
export function proofText(p: Profile["proof"][number]): string {
  return `${p.value}${p.unit ?? ""}`;
}

/** "since May 2025" from "May 2025 — Present". */
export function sinceLabel(dates: string): string {
  const start = dates.split(/\s*[—–-]\s*/)[0]?.trim();
  return start ? `since ${start}` : "";
}

export interface TitleOption {
  value: string;
  source: "resume" | "current-site" | "owner";
  label: string;
  /** "live" is the value the profile holds now; "alternative" the other one. */
  which: "live" | "alternative";
}

const SOURCE_LABEL = {
  resume: "As on your résumé",
  "current-site": "As on your current site",
  owner: "Your own",
};

/** The two job-title cards, résumé first, each labelled with its source. */
export function titleOptions(profile: Profile): TitleOption[] | null {
  const fact = profile.facts.title;
  const alt = fact?.alternative;
  if (!fact || !alt) return null;
  const first = profile.experience[0];
  const detail = first ? ` (${[first.company, sinceLabel(first.dates)].filter(Boolean).join(", ")})` : "";
  const label = (src: TitleOption["source"]) => `${SOURCE_LABEL[src]}${src === "resume" ? detail : ""}`;
  const options: TitleOption[] = [
    { value: profile.title, source: fact.source, label: label(fact.source), which: "live" },
    { value: alt.value, source: alt.source, label: label(alt.source), which: "alternative" },
  ];
  return options.sort((a, b) => Number(b.source === "resume") - Number(a.source === "resume"));
}

/**
 * Confirms a fact. Picking the alternative swaps it in and keeps the old value as the new
 * alternative, so the choice can be changed later.
 */
export function pickFact(profile: Profile, key: string, which: "live" | "alternative"): Profile {
  const next = structuredClone(profile);
  next.unconfirmed = next.unconfirmed.filter((k) => k !== key);
  const fact = next.facts[key];
  if (which === "alternative" && fact?.alternative) {
    const old = { value: factValue(profile, key) ?? "", source: fact.source };
    const picked = fact.alternative;
    next.facts[key] = { source: picked.source, alternative: old };
    return setFact(next, key, picked.value);
  }
  return next;
}

export interface OpenFact {
  key: string;
  /** Where it shows in the form. */
  where: "title" | "availability" | "proof" | "experience";
  live: string;
  alternative?: string;
  /** For proof and experience keys, the item's id. */
  itemId?: string;
  experienceId?: string;
}

/** Every unconfirmed fact, with its live value and the résumé's, if there is one. */
export function openFacts(profile: Profile): OpenFact[] {
  return profile.unconfirmed.map((key) => {
    const fact = profile.facts[key];
    const alt = fact?.alternative?.value;
    const base = { key, ...(alt ? { alternative: alt } : {}) };
    if (key === "title") return { ...base, where: "title" as const, live: profile.title };
    if (key === "availability")
      return { ...base, where: "availability" as const, live: profile.availability ?? "" };
    const segs = key.split(".");
    if (segs[0] === "proof") {
      const p = profile.proof.find((x) => x.id === segs[1]);
      return { ...base, where: "proof" as const, live: p ? proofText(p) : "", itemId: segs[1] ?? "" };
    }
    return {
      ...base,
      where: "experience" as const,
      live: factValue(profile, key) ?? "",
      experienceId: segs[1] ?? "",
      itemId: segs.at(-2) ?? "",
    };
  });
}

const plain = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

/** The flag's note, in the board's voice. */
export function factNote(f: OpenFact): string {
  if (f.alternative)
    return `Your current site says “${plain(f.live)}”. Your résumé says “${plain(f.alternative)}”.`;
  return "On your current site, but not in your résumé. Keep it only if you can back it up.";
}

/** Highlight bullets that still hold a placeholder figure such as "$XXXK". */
export function placeholderItems(profile: Profile): { experienceId: string; itemId: string; text: string }[] {
  const out: { experienceId: string; itemId: string; text: string }[] = [];
  for (const e of profile.experience)
    for (const h of e.highlights)
      for (const i of h.items)
        if (/X{3}/.test(i.text)) out.push({ experienceId: e.id, itemId: i.id, text: i.text });
  return out;
}

export function removeItem(profile: Profile, experienceId: string, itemId: string): Profile {
  return {
    ...profile,
    experience: profile.experience.map((e) =>
      e.id !== experienceId
        ? e
        : {
            ...e,
            highlights: e.highlights.map((h) => ({ ...h, items: h.items.filter((i) => i.id !== itemId) })),
          },
    ),
  };
}

/** The open items the publish dialog counts: unconfirmed facts plus placeholders. */
export function openCount(profile: Profile): number {
  return profile.unconfirmed.length + placeholderItems(profile).length;
}

export interface ProfileCheck {
  ok: boolean;
  text: string;
}

/** "Before you publish" (board `checks`), with the D5 summary. */
export function profileChecks(profile: Profile): { checks: ProfileCheck[]; summary: string } {
  const open = new Set(profile.unconfirmed);
  const checks: ProfileCheck[] = [];
  checks.push(
    open.has("title")
      ? { ok: false, text: "Job title: résumé and site disagree" }
      : { ok: true, text: `Job title: ${profile.title}` },
  );
  for (const f of openFacts(profile)) {
    if (f.where === "proof")
      checks.push({
        ok: false,
        text: f.alternative ? `${f.live} or the résumé figure?` : `${f.live}: still true?`,
      });
    if (f.where === "experience") checks.push({ ok: false, text: `Experience: “${short(f.live)}”` });
  }
  for (const p of profile.proof) {
    const key = `proof.${p.id}.value`;
    if (profile.facts[key] && !open.has(key)) checks.push({ ok: true, text: `${proofText(p)} confirmed` });
  }
  const ph = placeholderItems(profile);
  checks.push(
    ph.length
      ? { ok: false, text: "Experience shows a “$XXXK” placeholder" }
      : { ok: true, text: "No placeholders left" },
  );
  if (!profile.availability) checks.push({ ok: true, text: "Availability hidden" });
  else
    checks.push(
      open.has("availability")
        ? { ok: false, text: "Availability: still true?" }
        : { ok: true, text: "Availability confirmed" },
    );
  checks.push({
    ok: true,
    text: profile.contact.showPhone ? "Phone number shown on the site" : "Phone number hidden on the site",
  });
  const n = openCount(profile);
  return {
    checks,
    summary: n
      ? `${n} to confirm. The live value stays until you pick one.`
      : "All confirmed. Ready to publish.",
  };
}

const short = (html: string) => {
  const t = plain(html);
  return t.length > 48 ? `${t.slice(0, 47)}…` : t;
};

// ---- About: paragraphs of inline HTML <-> one rich field

export function aboutToRich(body: string[]): string {
  return body.map((p) => `<p>${p}</p>`).join("");
}

export function richToAbout(html: string): string[] {
  const out: string[] = [];
  const re = /<(p|li)>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const inner = (m[2] ?? "").replace(/<\/?(p|ul|ol|li)>/g, "").trim();
    if (inner) out.push(inner);
  }
  if (out.length === 0 && html.replace(/<[^>]*>/g, "").trim()) out.push(html.trim());
  return out;
}

// ---- layout items the form switches

export function sectionItems(layout: SiteLayout, kind: SectionKind): { id: string; visible: boolean }[] {
  return layout.sections.find((s) => s.kind === kind)?.items ?? [];
}

/** Items in layout order; ids the layout doesn't list yet come last, shown. */
export function ordered<T extends { id: string }>(
  layout: SiteLayout,
  kind: SectionKind,
  list: T[],
): (T & { visible: boolean })[] {
  const items = sectionItems(layout, kind);
  const byId = new Map(list.map((x) => [x.id, x]));
  const out: (T & { visible: boolean })[] = [];
  for (const it of items) {
    const x = byId.get(it.id);
    if (x) {
      out.push({ ...x, visible: it.visible });
      byId.delete(it.id);
    }
  }
  for (const x of byId.values()) out.push({ ...x, visible: true });
  return out;
}

function withItems(
  layout: SiteLayout,
  kind: SectionKind,
  fn: (items: { id: string; visible: boolean }[]) => { id: string; visible: boolean }[],
): SiteLayout {
  return {
    ...layout,
    sections: layout.sections.map((s) => (s.kind === kind ? { ...s, items: fn(s.items) } : s)),
  };
}

export function setItemVisible(
  layout: SiteLayout,
  kind: SectionKind,
  id: string,
  visible: boolean,
): SiteLayout {
  return withItems(layout, kind, (items) =>
    items.some((i) => i.id === id)
      ? items.map((i) => (i.id === id ? { ...i, visible } : i))
      : [...items, { id, visible }],
  );
}

/** Moves `id` one place up or down among `ids` (the order on screen), writing that order. */
export function moveItem(
  layout: SiteLayout,
  kind: SectionKind,
  ids: string[],
  id: string,
  by: -1 | 1,
): SiteLayout {
  const i = ids.indexOf(id);
  const j = i + by;
  if (i < 0 || j < 0 || j >= ids.length) return layout;
  const next = [...ids];
  next.splice(i, 1);
  next.splice(j, 0, id);
  return withItems(layout, kind, (items) => {
    const vis = new Map(items.map((x) => [x.id, x.visible]));
    const rest = items.filter((x) => !next.includes(x.id));
    return [...next.map((x) => ({ id: x, visible: vis.get(x) ?? true })), ...rest];
  });
}

/** Adds a new item at the top, shown (a new role goes first on the timeline). */
export function prependItem(layout: SiteLayout, kind: SectionKind, id: string): SiteLayout {
  return withItems(layout, kind, (items) => [{ id, visible: true }, ...items.filter((i) => i.id !== id)]);
}

export function removeLayoutItem(layout: SiteLayout, kind: SectionKind, id: string): SiteLayout {
  return withItems(layout, kind, (items) => items.filter((i) => i.id !== id));
}

/** Moves an element of a plain array one place. */
export function shift<T>(list: T[], index: number, by: -1 | 1): T[] {
  const j = index + by;
  if (index < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(index, 1);
  if (x !== undefined) next.splice(j, 0, x);
  return next;
}

export const LETS_TALK_HINT: Record<Profile["contact"]["letsTalk"], string> = {
  contact: "Scrolls to Contact, as your site does today. If Contact is hidden, it opens an email.",
  email: "Opens an email to you.",
  linkedin: "Opens your LinkedIn profile in a new tab.",
  booking: "Opens your booking page in a new tab.",
};

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}
