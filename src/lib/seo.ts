/**
 * Per-page metadata (06 · SEO): title, description, canonical, Open Graph and JSON-LD. Loaders build a
 * `PageSeo` at prerender time, where `SITE_URL` is known (D53), and each route's `meta` turns it into
 * tags with `seoMeta`. Everything here comes from published content; nothing is invented.
 */
import type { PublicContent, PublicPost, PublicProject } from "./content-source";
import type { Img } from "./published";
import { richTextToPlain } from "./rich-text";

/** The site's origin when SITE_URL isn't set (D53). */
export const DEFAULT_SITE_URL = "https://akarshan-pm.vercel.app";
/** The default share image, committed to public/ (06 · SEO). */
export const DEFAULT_OG = { path: "/og-default.png", width: 1200, height: 630 } as const;
export const DESCRIPTION_LENGTH = 160;

export interface OgImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface PageSeo {
  title: string;
  description?: string;
  /** Absolute. */
  canonical: string;
  image: OgImage;
  type: "website" | "article" | "profile";
  noindex?: boolean;
  /** Posts: `article:published_time` and `article:modified_time`. */
  article?: { published: string; modified: string };
  /** Schema.org data, written as `application/ld+json`. */
  jsonLd?: Record<string, unknown>;
  siteName: string;
}

/** `SITE_URL` without a trailing slash, or the default origin. Only https origins are accepted. */
export function siteUrl(value: string | undefined): string {
  const v = value?.trim().replace(/\/+$/, "");
  if (!v) return DEFAULT_SITE_URL;
  if (!/^https:\/\/[^/\s]+$/.test(v) && !/^http:\/\/localhost(:\d+)?$/.test(v))
    throw new Error(`SITE_URL must be an https origin, got "${v}".`);
  return v;
}

/** Plain text, whitespace collapsed, cut at a word within `max` characters. */
export function clip(text: string, max = DESCRIPTION_LENGTH): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s.,;:–—-]+$/, "")}…`;
}

const absolute = (site: string, path: string) => (/^https?:\/\//.test(path) ? path : `${site}${path}`);

function defaultImage(site: string, alt: string): OgImage {
  return { url: `${site}${DEFAULT_OG.path}`, width: DEFAULT_OG.width, height: DEFAULT_OG.height, alt };
}

/** The image's 1200×630 crop, or nothing when it has none (06 · Storage › Crop). */
function ogCrop(site: string, img: Img | undefined): OgImage | undefined {
  if (!img?.og) return undefined;
  return { url: absolute(site, img.og), width: 1200, height: 630, alt: img.alt };
}

const tagline = (content: PublicContent) => {
  const { name, title } = content.profile;
  return title ? `${name} · ${title}` : name;
};

export function homeSeo(content: PublicContent, site: string): PageSeo {
  const { profile } = content;
  const description = clip(richTextToPlain(profile.positioning));
  const sameAs = [profile.contact.linkedin, profile.contact.github].filter((v): v is string => Boolean(v));
  return {
    title: tagline(content),
    ...(description ? { description } : {}),
    canonical: `${site}/`,
    image: defaultImage(site, profile.name),
    type: "profile",
    siteName: profile.name,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      url: `${site}/`,
      ...(profile.title ? { jobTitle: profile.title } : {}),
      ...(sameAs.length > 0 ? { sameAs } : {}),
    },
  };
}

export function workSeo(content: PublicContent, site: string): PageSeo {
  const { name } = content.profile;
  return {
    title: `Work · ${name}`,
    description: "Every project, with labelled results.",
    canonical: `${site}/work`,
    image: defaultImage(site, name),
    type: "website",
    siteName: name,
  };
}

export function projectSeo(content: PublicContent, entry: PublicProject, site: string): PageSeo {
  const { name } = content.profile;
  const { overview, seo, visuals } = entry.project;
  const description = clip(seo.description ?? overview.summary);
  const image =
    (seo.ogImage
      ? (ogCrop(site, seo.ogImage) ?? {
          url: absolute(site, seo.ogImage.src),
          width: seo.ogImage.width,
          height: seo.ogImage.height,
          alt: seo.ogImage.alt,
        })
      : undefined) ??
    ogCrop(site, visuals.cover) ??
    defaultImage(site, name);
  return {
    title: `${seo.title ?? overview.title} · ${name}`,
    ...(description ? { description } : {}),
    canonical: `${site}/work/${entry.slug}`,
    image,
    type: "article",
    siteName: name,
    ...(entry.indexAllowed === false ? { noindex: true } : {}),
  };
}

export function writingSeo(content: PublicContent, site: string): PageSeo {
  const { name } = content.profile;
  return {
    title: `Writing · ${name}`,
    description: "Notes on product, data and building.",
    canonical: `${site}/writing`,
    image: defaultImage(site, name),
    type: "website",
    siteName: name,
  };
}

export function postSeo(content: PublicContent, entry: PublicPost, site: string): PageSeo {
  const { name } = content.profile;
  const { post } = entry;
  const description = clip(post.seo.description ?? post.excerpt);
  const canonical = post.canonicalUrl ?? `${site}/writing/${entry.slug}`;
  const image = ogCrop(site, post.cover) ?? defaultImage(site, name);
  return {
    title: post.seo.title ?? `${post.title} · ${name}`,
    ...(description ? { description } : {}),
    canonical,
    image,
    type: "article",
    siteName: name,
    article: { published: entry.publishedAt, modified: post.modifiedAt },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      ...(description ? { description } : {}),
      datePublished: entry.publishedAt,
      dateModified: post.modifiedAt,
      author: { "@type": "Person", name, url: `${site}/` },
      mainEntityOfPage: canonical,
      image: image.url,
      ...(post.topics.length > 0 ? { keywords: post.topics.join(", ") } : {}),
    },
  };
}

/** A meta descriptor, as React Router's `meta` returns them. */
export type MetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { tagName: "link"; rel: string; href: string }
  | { "script:ld+json": Record<string, unknown> };

/** The tags for one page. */
export function seoMeta(seo: PageSeo): MetaTag[] {
  const tags: MetaTag[] = [{ title: seo.title }];
  if (seo.description) tags.push({ name: "description", content: seo.description });
  tags.push({ tagName: "link", rel: "canonical", href: seo.canonical });
  if (seo.noindex) tags.push({ name: "robots", content: "noindex" });
  tags.push(
    { property: "og:type", content: seo.type },
    { property: "og:site_name", content: seo.siteName },
    { property: "og:title", content: seo.title },
    { property: "og:url", content: seo.canonical },
    { property: "og:image", content: seo.image.url },
    { property: "og:image:width", content: String(seo.image.width) },
    { property: "og:image:height", content: String(seo.image.height) },
    { property: "og:image:alt", content: seo.image.alt },
    { name: "twitter:card", content: "summary_large_image" },
  );
  if (seo.description) tags.push({ property: "og:description", content: seo.description });
  if (seo.article)
    tags.push(
      { property: "article:published_time", content: seo.article.published },
      { property: "article:modified_time", content: seo.article.modified },
    );
  if (seo.jsonLd) tags.push({ "script:ld+json": seo.jsonLd });
  return tags;
}

/** Pages nobody should index (06 · SEO › noindex): drafts, previews, the unlisted shell, Studio. */
export const NOINDEX: MetaTag[] = [{ name: "robots", content: "noindex, nofollow" }];
