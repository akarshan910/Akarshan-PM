/**
 * The published shape (06 · Published shape): what a visitor's page is built from. Publishing
 * turns a draft into this shape: media references become resolved images, private fields go, and
 * hidden or empty parts are removed. Public components accept only these types, so a draft-only
 * field can never be rendered by accident.
 */
import { richTextToPlain } from "./rich-text";
import type { Block, MediaRef, Post, PostBlock, Profile, Project } from "./types";

/** A resolved image (06): every variant the build copied into /media, plus its alt text. */
export interface Img {
  src: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
  /** The dominant colour, shown while the image loads. */
  dominant: string;
  /** The 1200×630 Open Graph crop, when one exists. */
  og?: string;
  /** The focal point, 0–1 across and down (`media.focal`). */
  focal?: { x: number; y: number };
}

/** Turns a draft's media reference into a published image, or undefined when it has none. */
export type ResolveImg = (ref: MediaRef) => Img | undefined;

type Without<T, K extends PropertyKey> = Omit<T, K & keyof T>;

export type BlockPublished =
  | Exclude<Block, { type: "image" | "gallery" | "beforeafter" | "video" }>
  | { id: string; type: "image"; media: Img & { caption?: string } }
  | { id: string; type: "gallery" | "beforeafter"; media: (Img & { caption?: string })[] }
  | { id: string; type: "video"; url: string; title?: string; poster?: Img; duration?: string };

export interface ChapterPublished {
  id: string;
  title: string;
  blocks: BlockPublished[];
}

export type ProjectHeroPublished =
  | { type: "image" }
  | { type: "video"; url: string; title?: string; poster?: Img; duration?: string }
  | (Without<Extract<Project["visuals"]["hero"], { type: "prototype" }>, "poster"> & { poster?: Img });

export interface ProjectPublished {
  overview: Project["overview"];
  visuals: {
    accent: Project["visuals"]["accent"];
    hero: ProjectHeroPublished;
    cover?: Img;
    gallery: (Img & { caption?: string })[];
  };
  story: ChapterPublished[];
  /** No `evidence`: it's private (06). */
  outcomes: Without<Project["outcomes"][number], "evidence">[];
  headlineOutcomeId?: string;
  seo: { title?: string; description?: string; ogImage?: Img };
}

export interface ProfilePublished extends Without<
  Profile,
  "facts" | "unconfirmed" | "about" | "experience" | "contact"
> {
  about: Without<Profile["about"], "photo"> & { photo?: Img };
  experience: Profile["experience"];
  contact: Without<Profile["contact"], "resume" | "phone"> & { resume?: string; phone?: string };
}

export interface PostPublished extends Without<Post, "cover" | "blocks"> {
  cover?: Img;
  blocks: (
    Exclude<PostBlock, { type: "image" }> | { id: string; type: "image"; media: Img & { caption?: string } }
  )[];
  readingMinutes: number;
  excerpt: string;
  modifiedAt: string;
}

/** Applies a reference's alt override or decorative flag to the media row's image. */
function resolve(ref: MediaRef | undefined, resolveImg: ResolveImg): Img | undefined {
  if (!ref || ref.mediaId === "") return undefined;
  const img = resolveImg(ref);
  if (!img) return undefined;
  if (ref.decorative) return { ...img, alt: "" };
  return ref.alt ? { ...img, alt: ref.alt } : img;
}

function captioned(
  ref: MediaRef & { caption?: string | undefined },
  resolveImg: ResolveImg,
): (Img & { caption?: string }) | undefined {
  const img = resolve(ref, resolveImg);
  if (!img) return undefined;
  return ref.caption ? { ...img, caption: ref.caption } : img;
}

const isPresent = <T>(v: T | undefined): v is T => v !== undefined;

function publishBlock(block: Block, resolveImg: ResolveImg): BlockPublished | undefined {
  switch (block.type) {
    case "image": {
      const media = captioned(block.media, resolveImg);
      return media ? { id: block.id, type: "image", media } : undefined;
    }
    case "gallery":
    case "beforeafter": {
      const media = block.media.map((m) => captioned(m, resolveImg)).filter(isPresent);
      return media.length > 0 ? { id: block.id, type: block.type, media } : undefined;
    }
    case "video":
      return block.url
        ? { id: block.id, type: "video", url: block.url, ...(block.title ? { title: block.title } : {}) }
        : undefined;
    case "table": {
      // `reviewed` is Studio's own bookkeeping; visitors see the table as entered.
      const { reviewed: _reviewed, ...table } = block;
      return table;
    }
    default:
      return block;
  }
}

/** A draft project → what visitors get (06 · Published shape). */
export function publishProject(draft: Project, resolveImg: ResolveImg): ProjectPublished {
  const { hero } = draft.visuals;
  let heroOut: ProjectHeroPublished;
  if (hero.type === "prototype") {
    const { poster, ...rest } = hero;
    const img = resolve(poster, resolveImg);
    heroOut = hero.url ? { ...rest, ...(img ? { poster: img } : {}) } : { type: "image" };
  } else if (hero.type === "video") {
    heroOut = hero.url
      ? { type: "video", url: hero.url, ...(hero.title ? { title: hero.title } : {}) }
      : { type: "image" };
  } else {
    heroOut = hero;
  }

  const cover = resolve(draft.visuals.cover, resolveImg);
  const ogImage =
    draft.seo.ogImage === "cover"
      ? cover
      : draft.seo.ogImage
        ? resolve(draft.seo.ogImage, resolveImg)
        : undefined;

  return {
    overview: draft.overview,
    visuals: {
      accent: draft.visuals.accent,
      hero: heroOut,
      ...(cover ? { cover } : {}),
      gallery: draft.visuals.gallery.map((g) => captioned(g, resolveImg)).filter(isPresent),
    },
    story: draft.story
      .filter((c) => !c.hidden)
      .map((c) => ({
        id: c.id,
        title: c.title,
        blocks: c.blocks.map((b) => publishBlock(b, resolveImg)).filter(isPresent),
      }))
      .filter((c) => c.blocks.length > 0),
    outcomes: draft.outcomes.map(({ evidence: _evidence, ...o }) => o),
    ...(draft.headlineOutcomeId ? { headlineOutcomeId: draft.headlineOutcomeId } : {}),
    seo: {
      ...(draft.seo.title ? { title: draft.seo.title } : {}),
      ...(draft.seo.description ? { description: draft.seo.description } : {}),
      ...(ogImage ? { ogImage } : {}),
    },
  };
}

/** A draft profile → what visitors get: no facts or "Worth a check", no hidden bullets. */
export function publishProfile(draft: Profile, resolveImg: ResolveImg): ProfilePublished {
  const { facts: _facts, unconfirmed: _unconfirmed, about, experience, contact, ...rest } = draft;
  const photo = resolve(about.photo, resolveImg);
  const { resume, phone, showPhone, ...links } = contact;
  const resumeUrl =
    resume?.url ?? (resume?.mediaId ? resolveImg({ mediaId: resume.mediaId })?.src : undefined);
  return {
    ...rest,
    about: {
      body: about.body,
      ...(about.points ? { points: about.points } : {}),
      ...(photo ? { photo } : {}),
    },
    experience: experience.map((e) => ({
      ...e,
      highlights: e.highlights
        .map((h) => ({ ...h, items: h.items.filter((i) => !i.hidden) }))
        .filter((h) => h.items.length > 0),
    })),
    contact: {
      ...links,
      showPhone,
      ...(resumeUrl ? { resume: resumeUrl } : {}),
      // The number is published only when the owner chose to show it (06).
      ...(showPhone && phone ? { phone } : {}),
    },
  };
}

/** Words per minute for the reading time (05 · Writing, 06 · Publishing). */
export const WORDS_PER_MINUTE = 220;
/** The excerpt's length when the owner didn't write one (06 · Published shape). */
export const EXCERPT_LENGTH = 160;

/** The words a reader reads, in order: text, headings, quotes, code and cited facts. */
function postText(blocks: PostBlock[]): string[] {
  return blocks.flatMap((b) => {
    switch (b.type) {
      case "text":
        return [richTextToPlain(b.body)];
      case "heading":
      case "quote":
      case "code":
        return [b.body];
      case "fact":
        return [`${b.value} ${b.label}`];
      case "image":
        return b.caption ? [b.caption] : [];
      default:
        return [];
    }
  });
}

/** Words ÷ 220, rounded up, at least 1 (05 · Writing). */
export function readingMinutes(blocks: PostBlock[]): number {
  const words = postText(blocks)
    .join(" ")
    .split(/\s+/)
    .filter((w) => w !== "").length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** The post's own excerpt, or its first 160 characters of body text, cut at a word. */
export function postExcerpt(post: Pick<Post, "excerpt" | "blocks">): string {
  const own = post.excerpt?.trim();
  if (own) return own;
  const text = post.blocks
    .filter((b) => b.type === "text")
    .map((b) => richTextToPlain(b.body))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= EXCERPT_LENGTH) return text;
  const cut = text.slice(0, EXCERPT_LENGTH - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > EXCERPT_LENGTH / 2 ? cut.slice(0, space) : cut).replace(/[\s.,;:–—-]+$/, "")}…`;
}

/** A draft post → what visitors get: resolved images, the reading time, excerpt and modified time. */
export function publishPost(draft: Post, resolveImg: ResolveImg, modifiedAt: string): PostPublished {
  const { cover, blocks, ...rest } = draft;
  const img = resolve(cover, resolveImg);
  const published: PostPublished["blocks"] = [];
  for (const block of blocks) {
    if (block.type === "image") {
      const { id, type: _type, ...ref } = block;
      const media = captioned(ref, resolveImg);
      if (media) published.push({ id, type: "image", media });
    } else {
      published.push(block);
    }
  }
  return {
    ...rest,
    ...(img ? { cover: img } : {}),
    blocks: published,
    readingMinutes: readingMinutes(blocks),
    excerpt: postExcerpt(draft),
    modifiedAt,
  };
}
