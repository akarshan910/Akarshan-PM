/**
 * The defaults registry (10 · Default values, layer 3): what Studio creates when the owner adds
 * something. Every factory returns a document that passes its schema. New things start empty,
 * so they hide on the site until the owner fills them; nothing here is content.
 */
import { ACCENTS } from "./schemas";
import type { Accent, Block, BlockType, Chapter, Post, Profile, Project, Section, SiteLayout } from "./types";

/** A short random id for blocks, chapters and items. Ids only need to be unique within a document. */
export function newId(prefix = ""): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return prefix + Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

/** `untitled-n`, with n one more than the highest already taken (05 · Projects › New project). */
export function nextUntitledSlug(taken: Iterable<string>): string {
  let max = 0;
  for (const slug of taken) {
    const n = /^untitled-(\d+)$/.exec(slug)?.[1];
    if (n) max = Math.max(max, Number(n));
  }
  return `untitled-${max + 1}`;
}

/** The first accent not already used on the shelf, so new covers differ from their neighbours (D26). */
export function firstFreeAccent(usedOnShelf: Iterable<Accent>): Accent {
  const used = new Set(usedOnShelf);
  return ACCENTS.find((a) => !used.has(a)) ?? ACCENTS[0];
}

export function newProject(options: { kind?: Project["overview"]["kind"]; accent?: Accent } = {}): Project {
  return {
    schemaVersion: 1,
    overview: { title: "", company: "", summary: "", kind: options.kind ?? "study", topics: [] },
    visuals: { accent: options.accent ?? ACCENTS[0], hero: { type: "image" }, gallery: [] },
    story: [],
    outcomes: [],
    seo: {},
    // Off until the first publish; pm-publish turns it on then (D40).
    settings: { redirectOldSlug: false },
  };
}

export function newPost(): Post {
  return { schemaVersion: 1, title: "", blocks: [], topics: [], showOnHome: true, seo: {} };
}

export function newChapter(): Chapter {
  return { id: newId("c"), title: "", hidden: false, blocks: [] };
}

/** A block at the settings Studio shows first (05 · Story › block settings). */
export function newBlock(type: BlockType): Block {
  const id = newId("b");
  switch (type) {
    case "text":
      return { id, type, body: "", style: "body" };
    case "heading":
    case "list":
      return { id, type, body: "" };
    case "quote":
      return { id, type, body: "" };
    case "callout":
      return { id, type, body: "", tone: "neutral" };
    case "metrics":
      return { id, type };
    case "table":
      return {
        id,
        type,
        columns: [],
        rows: [],
        checkFormula: false,
        sortByScore: false,
        highlightTop: 0,
        phoneCards: true,
      };
    case "image":
      return { id, type, media: { mediaId: "" } };
    case "gallery":
    case "beforeafter":
      return { id, type, media: [] };
    case "video":
      return { id, type, url: "" };
    case "prototype":
      return { id, type };
    case "journey":
      return { id, type, stages: [] };
    case "ownership":
      return { id, type, mine: "" };
    case "cards":
      return { id, type, columns: 3, items: [] };
    case "divider":
      return { id, type };
  }
}

/** "Text section {n}", which Studio inserts before Contact (05 · Website builder › Add section). */
export function newTextSection(n: number): Section {
  return {
    id: `text-${n}`,
    kind: "text",
    visible: true,
    header: { title: `Text section ${n}` },
    items: [],
    text: { body: "" },
  };
}

export function emptyProfile(): Profile {
  return {
    schemaVersion: 1,
    name: "",
    title: "",
    positioning: "",
    heroButtons: {},
    about: { body: [] },
    proof: [],
    experience: [],
    skills: [],
    testimonials: [],
    offDuty: [],
    contact: { showPhone: false, letsTalk: "contact" },
    footer: {},
    facts: {},
    unconfirmed: [],
  };
}

const HERO_ITEMS = ["availability", "location", "name", "brush", "positioning", "intro", "buttons"];

/** The section order of 07 · Layout with nothing in it: a blank install, and a base for tests. */
export function defaultLayout(): SiteLayout {
  const section = (id: string, kind: Section["kind"], extra: Partial<Section> = {}): Section => ({
    id,
    kind,
    visible: true,
    items: [],
    ...extra,
  });
  return {
    schemaVersion: 1,
    sections: [
      section("hero", "hero", {
        items: HERO_ITEMS.map((id) => ({ id, visible: true })),
        hero: { motion: true, floaters: { items: [], atOnce: 3 } },
      }),
      section("proof", "proof"),
      section("shipped", "shelf", { visible: false, shelf: { name: "Shipped", rows: 2 } }),
      section("strategy", "shelf", { shelf: { name: "Strategy & prototypes", rows: 2 } }),
      section("writing", "writing", { writing: { latest: 3, rss: true } }),
      section("about", "about", { items: ["text", "points", "photo"].map((id) => ({ id, visible: true })) }),
      section("experience", "experience"),
      section("skills", "skills"),
      section("testimonials", "testimonials"),
      section("offduty", "offduty"),
      section("contact", "contact", {
        items: ["closing", "email", "linkedin", "github", "resume"].map((id) => ({ id, visible: true })),
      }),
      section("footer", "footer", { items: ["credit", "updated"].map((id) => ({ id, visible: true })) }),
    ],
  };
}
