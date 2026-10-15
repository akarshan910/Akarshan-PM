import { describe, expect, it } from "vitest";

import type { PublicContent } from "~/lib/content-source";
import { robotsTxt, rssDate, rssXml, RSS_ITEMS, sitemapXml, xml } from "~/lib/feeds";
import { MEDIA_PATH, publicBucketUrl, publishedMediaPaths } from "~/lib/media-files";
import type { Img } from "~/lib/published";
import {
  clip,
  DEFAULT_SITE_URL,
  homeSeo,
  NOINDEX,
  postSeo,
  projectSeo,
  seoMeta,
  siteUrl,
  workSeo,
  writingSeo,
} from "~/lib/seo";
import { loadLocalV0 } from "~/lib/sources/local-v0";

import { loadBoardContent } from "../fixtures/board-content";

const SITE = "https://example.test";
const v0 = loadLocalV0(new Date("2026-10-13T12:00:00Z"));
const boards = loadBoardContent(1440);
const UUID = "0b8f8c2e-1d3a-4c5b-9e7f-112233445566";

const img = (extra: Partial<Img> = {}): Img => ({
  src: `/media/${UUID}/r2/960.webp`,
  srcset: `/media/${UUID}/r2/480.webp 480w, /media/${UUID}/r2/960.webp 960w`,
  width: 1600,
  height: 900,
  alt: "A cover",
  dominant: "#111",
  ...extra,
});

describe("siteUrl and clip", () => {
  it("defaults to the Vercel address (D53), trims slashes, and refuses anything but https", () => {
    expect(siteUrl(undefined)).toBe(DEFAULT_SITE_URL);
    expect(siteUrl(" ")).toBe(DEFAULT_SITE_URL);
    expect(siteUrl("https://example.test/")).toBe(SITE);
    expect(siteUrl("http://localhost:4173")).toBe("http://localhost:4173");
    expect(() => siteUrl("http://example.test")).toThrow(/https/);
    expect(() => siteUrl("https://example.test/path")).toThrow(/https/);
  });

  it("cuts descriptions at a word within 160 characters", () => {
    expect(clip("  short   text ")).toBe("short text");
    const long = clip("word ".repeat(60));
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith("word…")).toBe(true);
    expect(clip("x".repeat(200))).toBe(`${"x".repeat(159)}…`);
  });
});

describe("page metadata (06 · SEO)", () => {
  it("home: name · title, the positioning as plain text, Person JSON-LD", () => {
    const seo = homeSeo(v0, SITE);
    expect(seo.title).toBe("Akarshan Kumar · Senior Product Manager");
    expect(seo.description).not.toMatch(/<strong>/);
    expect(seo.canonical).toBe(`${SITE}/`);
    expect(seo.image.url).toBe(`${SITE}/og-default.png`);
    expect(seo.jsonLd).toMatchObject({
      "@type": "Person",
      name: "Akarshan Kumar",
      sameAs: [v0.profile.contact.linkedin],
    });
    const bare = {
      ...v0,
      profile: { ...v0.profile, title: "", contact: { showPhone: false, letsTalk: "contact" as const } },
    };
    expect(homeSeo(bare, SITE).title).toBe("Akarshan Kumar");
    expect(homeSeo(bare, SITE).jsonLd).not.toHaveProperty("sameAs");
  });

  it("work and writing use 06's fixed descriptions", () => {
    expect(workSeo(v0, SITE)).toMatchObject({ title: "Work · Akarshan Kumar", canonical: `${SITE}/work` });
    expect(writingSeo(v0, SITE)).toMatchObject({
      description: "Notes on product, data and building.",
      canonical: `${SITE}/writing`,
    });
  });

  it("a case study: seo title, else the title; the og crop, else the default; noindex when not allowed", () => {
    const entry = v0.projects[0];
    if (!entry) throw new Error("no project");
    const plain = projectSeo(v0, entry, SITE);
    expect(plain.title).toBe(`${entry.project.overview.title} · Akarshan Kumar`);
    expect(plain.canonical).toBe(`${SITE}/work/${entry.slug}`);
    expect(plain.image.url).toBe(`${SITE}/og-default.png`);
    expect(plain).not.toHaveProperty("noindex");

    const withCover = {
      ...entry,
      indexAllowed: false,
      project: {
        ...entry.project,
        visuals: { ...entry.project.visuals, cover: img({ og: `/media/${UUID}/r2/og.jpg` }) },
      },
    };
    const covered = projectSeo(v0, withCover, SITE);
    expect(covered.image).toEqual({
      url: `${SITE}/media/${UUID}/r2/og.jpg`,
      width: 1200,
      height: 630,
      alt: "A cover",
    });
    expect(covered.noindex).toBe(true);

    const own = {
      ...entry,
      project: { ...entry.project, seo: { title: "Own title", description: "Own text.", ogImage: img() } },
    };
    const seo = projectSeo(v0, own, SITE);
    expect(seo).toMatchObject({ title: "Own title · Akarshan Kumar", description: "Own text." });
    expect(seo.image.url).toBe(`${SITE}/media/${UUID}/r2/960.webp`);
  });

  it("a post: article times, BlogPosting, and the canonical it names", () => {
    const entry = boards.posts[0];
    if (!entry) throw new Error("no post");
    const seo = postSeo(boards, entry, SITE);
    expect(seo.type).toBe("article");
    expect(seo.article).toEqual({ published: entry.publishedAt, modified: entry.post.modifiedAt });
    expect(seo.jsonLd).toMatchObject({
      "@type": "BlogPosting",
      headline: entry.post.title,
      keywords: "Product, AI",
    });
    const elsewhere = {
      ...entry,
      post: { ...entry.post, canonicalUrl: "https://medium.example/post", topics: [] },
    };
    const moved = postSeo(boards, elsewhere, SITE);
    expect(moved.canonical).toBe("https://medium.example/post");
    expect(moved.jsonLd).not.toHaveProperty("keywords");
  });

  it("turns a PageSeo into tags", () => {
    const tags = seoMeta({ ...homeSeo(v0, SITE), noindex: true, article: { published: "a", modified: "b" } });
    expect(tags).toContainEqual({ tagName: "link", rel: "canonical", href: `${SITE}/` });
    expect(tags).toContainEqual({ name: "robots", content: "noindex" });
    expect(tags).toContainEqual({ property: "og:image:width", content: "1200" });
    expect(tags).toContainEqual({ property: "article:modified_time", content: "b" });
    expect(tags.some((t) => "script:ld+json" in t)).toBe(true);
    const minimal = seoMeta({ ...workSeo(v0, SITE), description: undefined as never });
    expect(minimal.some((t) => "name" in t && t.name === "description")).toBe(false);
    expect(NOINDEX).toEqual([{ name: "robots", content: "noindex, nofollow" }]);
  });
});

describe("feeds (06 · Build-time data)", () => {
  it("robots.txt allows all but Studio and previews, and lists the sitemap", () => {
    expect(robotsTxt(SITE)).toBe(
      "User-agent: *\nAllow: /\nDisallow: /studio\nDisallow: /preview\n\nSitemap: https://example.test/sitemap.xml\n",
    );
  });

  it("the sitemap lists public pages only; Writing only with posts", () => {
    const map = sitemapXml(v0, SITE);
    expect(map).toContain(`<loc>${SITE}/</loc>`);
    for (const p of v0.projects) expect(map).toContain(`<loc>${SITE}/work/${p.slug}</loc>`);
    expect(map).not.toContain("/writing");
    expect(map).not.toContain("/studio");

    const hidden = {
      ...v0,
      projects: v0.projects.map((p, i) => (i === 0 ? { ...p, indexAllowed: false } : p)),
    };
    expect(sitemapXml(hidden, SITE)).not.toContain(`/work/${v0.projects[0]?.slug ?? ""}<`);

    const withPosts = sitemapXml(boards, SITE);
    expect(withPosts).toContain(`<loc>${SITE}/writing</loc>`);
    expect(withPosts).toContain(`<loc>${SITE}/writing/your-post</loc>`);
    const crossPosted: PublicContent = {
      ...boards,
      posts: boards.posts.map((p) => ({
        ...p,
        post: { ...p.post, canonicalUrl: "https://medium.example/x" },
      })),
    };
    expect(sitemapXml(crossPosted, SITE)).not.toContain("/writing/your-post");
  });

  it("the feed: none without posts, the 20 newest, escaped", () => {
    expect(rssXml(v0, SITE)).toBeNull();
    const feed = rssXml(boards, SITE) ?? "";
    expect(feed).toContain("<title>Writing · Akarshan Kumar</title>");
    expect(feed).toContain(`<link>${SITE}/writing/your-post</link>`);
    expect(feed.indexOf("[Your latest post title]")).toBeLessThan(feed.indexOf("[Post title 2]"));
    expect(feed).toContain("<category>Product</category>");

    const many: PublicContent = {
      ...boards,
      layout: { ...boards.layout, sections: boards.layout.sections.filter((s) => s.kind !== "writing") },
      posts: Array.from({ length: RSS_ITEMS + 3 }, (_, i) => {
        const base = boards.posts[0];
        if (!base) throw new Error("no post");
        return {
          ...base,
          id: `p${String(i)}`,
          slug: `p-${String(i)}`,
          publishedAt: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
          post: { ...base.post, title: `A & B <${String(i)}>`, excerpt: "", topics: [] },
        };
      }),
    };
    const big = rssXml(many, SITE) ?? "";
    expect(big.match(/<item>/g)).toHaveLength(RSS_ITEMS);
    expect(big).toContain("A &amp; B &lt;22&gt;");
    expect(big).not.toContain("A &amp; B &lt;0&gt;");
    expect(big).not.toContain("<description></description>");
    expect(big).toContain("<description>Writing by Akarshan Kumar.</description>");
  });

  it("escapes XML and dates RSS items as RFC 822", () => {
    expect(xml(`a<b>&"'\u0001`)).toBe("a&lt;b&gt;&amp;&quot;&apos;");
    expect(rssDate("2026-10-13T12:00:00Z")).toBe("Tue, 13 Oct 2026 12:00:00 GMT");
  });
});

describe("published media paths (06 · Storage)", () => {
  it("collects src, srcset and og paths of published images, and nothing else", () => {
    const entry = v0.projects[0];
    if (!entry) throw new Error("no project");
    const content: PublicContent = {
      ...v0,
      projects: [
        {
          ...entry,
          project: {
            ...entry.project,
            visuals: {
              ...entry.project.visuals,
              cover: img({ og: `/media/${UUID}/r2/og.jpg` }),
              gallery: [img()],
            },
          },
        },
      ],
    };
    expect(publishedMediaPaths(content)).toEqual([
      `/media/${UUID}/r2/480.webp`,
      `/media/${UUID}/r2/960.webp`,
      `/media/${UUID}/r2/og.jpg`,
    ]);
    expect(publishedMediaPaths(v0)).toEqual([]); // V0 covers live at /media/v0
    for (const bad of [
      "/media/v0/x.webp",
      `/media/${UUID}/r2/../x.webp`,
      `https://evil.test/media/${UUID}/r2/a.webp`,
    ])
      expect(MEDIA_PATH.test(bad)).toBe(false);
  });

  it("maps a path to the public bucket", () => {
    expect(publicBucketUrl("https://abc.supabase.co/", `/media/${UUID}/r2/og.jpg`)).toBe(
      `https://abc.supabase.co/storage/v1/object/public/pm-media-public/${UUID}/r2/og.jpg`,
    );
  });
});
