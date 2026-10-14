/**
 * The server-side sanitiser (06 · Rich text: "sanitised twice … and in the pm-publish function").
 * It parses with the site's own allowlist parser (`lib/rich-text.ts`, the same code the site renders
 * with) and writes the allowed tree back out as HTML, so what is stored in `published` is exactly
 * what the renderer would keep. Then it walks each published document and applies it to every
 * `Inline` and `Rich` field.
 */
import type { BlockPublished, PostPublished, ProfilePublished, ProjectPublished } from "./lib/published.ts";
import { parseRichText, type RichNode } from "./lib/rich-text.ts";
import type { SiteLayout } from "./lib/types.ts";

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

function serialize(nodes: readonly RichNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return escapeText(n.text);
      if (n.type === "a") return `<a href="${escapeAttr(n.href)}">${serialize(n.children)}</a>`;
      return `<${n.type}>${serialize(n.children)}</${n.type}>`;
    })
    .join("");
}

export function sanitizeInline(html: string): string {
  return serialize(parseRichText(html, { inline: true }));
}

export function sanitizeRich(html: string): string {
  return serialize(parseRichText(html));
}

const inl = (v: string | undefined) => (v === undefined ? undefined : sanitizeInline(v));
function opt<T extends object, K extends keyof T>(obj: T, key: K, value: T[K] | undefined): T {
  if (value === undefined) {
    const { [key]: _drop, ...rest } = obj;
    return rest as T;
  }
  return { ...obj, [key]: value };
}

function sanitizeBlock(block: BlockPublished): BlockPublished {
  switch (block.type) {
    case "text":
    case "list":
    case "callout":
      return { ...block, body: sanitizeRich(block.body) };
    case "ownership": {
      let b = { ...block, mine: sanitizeInline(block.mine) };
      b = opt(b, "team", inl(block.team));
      b = opt(b, "business", inl(block.business));
      return opt(b, "decision", inl(block.decision));
    }
    default:
      return block;
  }
}

export function sanitizeProject(p: ProjectPublished): ProjectPublished {
  let overview = opt(p.overview, "problem", inl(p.overview.problem));
  overview = opt(overview, "proposal", inl(p.overview.proposal));
  return {
    ...p,
    overview,
    story: p.story.map((c) => ({ ...c, blocks: c.blocks.map(sanitizeBlock) })),
  };
}

export function sanitizeProfile(p: ProfilePublished): ProfilePublished {
  const out: ProfilePublished = opt(
    { ...p, positioning: sanitizeInline(p.positioning) },
    "intro",
    inl(p.intro),
  );
  return {
    ...out,
    about: {
      ...p.about,
      body: p.about.body.map(sanitizeInline),
      ...(p.about.points
        ? { points: p.about.points.map((pt) => ({ ...pt, text: sanitizeInline(pt.text) })) }
        : {}),
    },
    experience: p.experience.map((e) => ({
      ...opt(e, "summary", inl(e.summary)),
      highlights: e.highlights.map((h) => ({
        ...h,
        items: h.items.map((i) => ({ ...i, text: sanitizeInline(i.text) })),
      })),
    })),
  };
}

export function sanitizeLayout(layout: SiteLayout): SiteLayout {
  return {
    ...layout,
    sections: layout.sections.map((s) => {
      let out = s;
      if (s.header) out = { ...out, header: opt(s.header, "intro", inl(s.header.intro)) };
      if (s.text) out = { ...out, text: { body: sanitizeRich(s.text.body) } };
      return out;
    }),
  };
}

export function sanitizePost(p: PostPublished): PostPublished {
  return {
    ...p,
    blocks: p.blocks.map((b) => (b.type === "text" ? { ...b, body: sanitizeRich(b.body) } : b)),
  };
}
