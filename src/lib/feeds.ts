/**
 * The build's text files (01 · Routes, 06 · SEO): `robots.txt`, `sitemap.xml` and `/writing/rss.xml`.
 * Pure functions of the published content and the site's origin; `scripts/build-feeds.ts` writes them.
 * Only published, public pages appear: unlisted projects never reach the build, and a project with
 * `index_allowed = false` is left out of the sitemap.
 */
import type { PublicContent } from "./content-source";
import { richTextToPlain } from "./rich-text";
import { newestFirst } from "./writing";

/** The feed carries the 20 newest posts (01 · Routes). */
export const RSS_ITEMS = 20;

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/** Escapes text for XML; also drops characters XML 1.0 can't carry. */
export function xml(text: string): string {
  return (
    text
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
      .replace(/[&<>"']/g, (c) => XML_ESCAPES[c] ?? c)
  );
}

export function robotsTxt(site: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /studio",
    "Disallow: /preview",
    "",
    `Sitemap: ${site}/sitemap.xml`,
    "",
  ].join("\n");
}

const day = (iso: string) => iso.slice(0, 10);

/** Every public page, with the date it last changed. */
export function sitemapXml(content: PublicContent, site: string): string {
  const latest = (dates: string[]) => dates.sort().at(-1) ?? content.updatedAt;
  const projects = content.projects.filter((p) => p.listed && p.indexAllowed !== false);
  const posts = newestFirst(content.posts);
  const urls: { loc: string; lastmod: string }[] = [
    { loc: `${site}/`, lastmod: content.updatedAt },
    { loc: `${site}/work`, lastmod: latest(projects.map((p) => p.publishedAt)) },
    ...projects.map((p) => ({ loc: `${site}/work/${p.slug}`, lastmod: p.publishedAt })),
    ...(posts.length > 0
      ? [
          { loc: `${site}/writing`, lastmod: latest(posts.map((p) => p.post.modifiedAt)) },
          ...posts
            .filter((p) => !p.post.canonicalUrl)
            .map((p) => ({ loc: `${site}/writing/${p.slug}`, lastmod: p.post.modifiedAt })),
        ]
      : []),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${xml(u.loc)}</loc><lastmod>${day(u.lastmod)}</lastmod></url>`),
    "</urlset>",
    "",
  ].join("\n");
}

/** RFC 822 dates, as RSS 2.0 wants them. */
export function rssDate(iso: string): string {
  return new Date(iso).toUTCString();
}

/** `/writing/rss.xml`: the 20 newest posts, or null while nothing is published. */
export function rssXml(content: PublicContent, site: string): string | null {
  const posts = newestFirst(content.posts).slice(0, RSS_ITEMS);
  if (posts.length === 0) return null;
  const { name } = content.profile;
  const intro = content.layout.sections.find((s) => s.kind === "writing")?.header?.intro;
  const description = intro ? richTextToPlain(intro) : `Writing by ${name}.`;
  const items = posts.map((p) => {
    const link = `${site}/writing/${p.slug}`;
    return [
      "    <item>",
      `      <title>${xml(p.post.title)}</title>`,
      `      <link>${xml(link)}</link>`,
      `      <guid isPermaLink="true">${xml(link)}</guid>`,
      `      <pubDate>${rssDate(p.publishedAt)}</pubDate>`,
      ...(p.post.excerpt ? [`      <description>${xml(p.post.excerpt)}</description>`] : []),
      ...p.post.topics.map((t) => `      <category>${xml(t)}</category>`),
      "    </item>",
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xml(`Writing · ${name}`)}</title>`,
    `    <link>${xml(`${site}/writing`)}</link>`,
    `    <description>${xml(description)}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${xml(`${site}/writing/rss.xml`)}" rel="self" type="application/rss+xml"/>`,
    `    <lastBuildDate>${rssDate(posts[0]?.post.modifiedAt ?? content.updatedAt)}</lastBuildDate>`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
