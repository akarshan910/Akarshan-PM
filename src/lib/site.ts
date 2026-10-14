/**
 * Views for the public pages, built from published content (03 · Home, 10 · Security gates).
 *
 * Prerendering writes each loader's whole return value into the page, so these functions are the
 * line drafts never cross: hidden sections, hidden items, unpublished or unlisted project ids and
 * empty parts are removed here, before any page sees them.
 */
import type { PublicContent, PublicProject } from "./content-source";
import type { ProfilePublished } from "./published";
import type { Section, SiteLayout } from "./types";
import { numberVolumes } from "./volumes";

export interface NavLink {
  /** The section id; also the DOM anchor. */
  id: string;
  label: string;
  href: string;
}

export interface LetsTalk {
  href: string;
  newTab: boolean;
}

export interface SiteChrome {
  nav: NavLink[];
  letsTalk?: LetsTalk;
  footer: { name: string; credit?: string; updatedAt: string };
  contact: { email?: string; linkedin?: string; resume?: string };
}

export interface ProjectEntry extends PublicProject {
  /** Two-digit volume number; none for projects that aren't on a visible shelf. */
  volume?: string;
}

export interface HomeView {
  chrome: SiteChrome;
  /** Visible sections with something to show, in page order. Items are visible ones only. */
  sections: Section[];
  profile: ProfilePublished;
  /** Every published, listed project the visible sections refer to, by id. */
  projects: Record<string, ProjectEntry>;
  posts: PublicContent["posts"];
}

/** Ids a section's items may refer to, so items pointing at nothing (or at drafts) are dropped. */
function knownItems(
  section: Section,
  profile: ProfilePublished,
  projects: Map<string, PublicProject>,
): Set<string> | null {
  switch (section.kind) {
    case "proof":
      return new Set([
        ...profile.proof.map((p) => p.id),
        ...(profile.spaces?.items.length ? ["spaces"] : []),
      ]);
    case "experience":
      return new Set(profile.experience.map((e) => e.id));
    case "skills":
      return new Set(profile.skills.map((g) => g.id));
    case "testimonials":
      return new Set(profile.testimonials.map((t) => t.id));
    case "offduty":
      return new Set(profile.offDuty.map((o) => o.id));
    case "shelf":
      return new Set([...projects.values()].filter((p) => p.listed).map((p) => p.id));
    default:
      return null; // part names (hero, about, contact, footer): kept as they are
  }
}

/** The layout a visitor may see: hidden sections and items, drafts and empty parts removed. */
export function publicSections(content: PublicContent): Section[] {
  const projects = new Map(content.projects.map((p) => [p.id, p]));
  const showOnHome = content.posts.filter((p) => p.post.showOnHome);
  const out: Section[] = [];

  for (const section of content.layout.sections) {
    if (!section.visible) continue;
    const known = knownItems(section, content.profile, projects);
    const items = section.items.filter((i) => i.visible && (known === null || known.has(i.id)));
    const kept: Section = { ...section, items };

    if (section.hero) {
      kept.hero = {
        ...section.hero,
        floaters: {
          ...section.hero.floaters,
          items: section.hero.floaters.items.filter((id) => projects.get(id)?.listed),
        },
      };
    }

    // 03 · Home: a section renders only with something in it.
    if (known !== null && items.length === 0) continue;
    if (section.kind === "writing" && showOnHome.length === 0) continue;
    if (section.kind === "text" && !section.text?.body) continue;
    out.push(kept);
  }
  return out;
}

/** 03 · The page shell: where "Let's Talk" goes, falling back down Contact → email → LinkedIn. */
export function letsTalkTarget(profile: ProfilePublished, contactShown: boolean): LetsTalk | undefined {
  const { letsTalk, email, linkedin, booking } = profile.contact;
  const contact = contactShown ? { href: "/#contact", newTab: false } : undefined;
  const mail = email ? { href: `mailto:${email}`, newTab: false } : undefined;
  const li = linkedin ? { href: linkedin, newTab: true } : undefined;
  const chosen =
    letsTalk === "email"
      ? mail
      : letsTalk === "linkedin"
        ? li
        : letsTalk === "booking" && booking
          ? { href: booking, newTab: true }
          : contact;
  return chosen ?? contact ?? mail ?? li;
}

export function buildChrome(
  content: PublicContent,
  sections: Section[] = publicSections(content),
): SiteChrome {
  const { profile } = content;
  const letsTalk = letsTalkTarget(
    profile,
    sections.some((s) => s.kind === "contact"),
  );
  return {
    nav: sections
      .filter((s) => s.nav)
      .map((s) => ({ id: s.id, label: s.nav?.label ?? "", href: `/#${s.id}` })),
    ...(letsTalk ? { letsTalk } : {}),
    footer: {
      name: profile.name,
      ...(profile.footer.credit ? { credit: profile.footer.credit } : {}),
      updatedAt: content.updatedAt,
    },
    contact: {
      ...(profile.contact.email ? { email: profile.contact.email } : {}),
      ...(profile.contact.linkedin ? { linkedin: profile.contact.linkedin } : {}),
      ...(profile.contact.resume ? { resume: profile.contact.resume } : {}),
    },
  };
}

/** Volume numbers for every listed project, in shelf order (02 · C9). */
export function volumes(content: PublicContent, sections: Section[]): Map<string, string> {
  return numberVolumes(
    sections,
    new Map(content.projects.map((p) => [p.id, { published: true, listed: p.listed }])),
  );
}

export function buildHomeView(content: PublicContent): HomeView {
  const sections = publicSections(content);
  const numbers = volumes(content, sections);
  const referenced = new Set(
    sections.flatMap((s) => (s.kind === "shelf" ? s.items.map((i) => i.id) : (s.hero?.floaters.items ?? []))),
  );
  const projects: Record<string, ProjectEntry> = {};
  for (const p of content.projects) {
    if (!p.listed || !referenced.has(p.id)) continue;
    const volume = numbers.get(p.id);
    projects[p.id] = volume ? { ...p, volume } : { ...p };
  }
  return {
    chrome: buildChrome(content, sections),
    sections,
    profile: content.profile,
    projects,
    posts: content.posts.filter((p) => p.post.showOnHome),
  };
}

/** Every listed project with its volume, in volume order then publish order (03 · /work). */
export function listedProjects(content: PublicContent): ProjectEntry[] {
  const numbers = volumes(content, publicSections(content));
  return content.projects
    .filter((p) => p.listed)
    .map((p): ProjectEntry => {
      const volume = numbers.get(p.id);
      return volume ? { ...p, volume } : { ...p };
    })
    .sort((a, b) => (a.volume ?? "999").localeCompare(b.volume ?? "999"));
}

/** Layout type re-exported for page modules. */
export type { SiteLayout };
