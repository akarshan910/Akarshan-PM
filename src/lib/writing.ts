/**
 * Views for the Writing pages (03 · Writing pages): the /writing list and a post. Like `site.ts`,
 * these return only what the page shows, built from published posts.
 */
import type { PublicContent, PublicPost } from "./content-source";
import type { Img, PostPublished } from "./published";

/** Posts per page on /writing; older ones are on "Older posts" pages (03). */
export const POSTS_PER_PAGE = 20;

export interface PostCard {
  slug: string;
  href: string;
  title: string;
  publishedAt: string;
  excerpt: string;
  /** The first topic; the list shows one. */
  topic?: string;
  topics: string[];
  readingMinutes: number;
  cover?: Img;
}

export interface WritingIndexView {
  /** The Writing section's intro: one line on what the owner writes about. */
  intro?: string;
  rss: boolean;
  /** Every topic in use, most used first, then A–Z. "All" is the page's own. */
  topics: string[];
  /** Newest first. */
  posts: PostCard[];
}

export interface PostView {
  slug: string;
  publishedAt: string;
  post: PostPublished;
  byline: { name: string; title?: string; company?: string };
  next?: { href: string; title: string };
}

/** Published posts, newest first. */
export function newestFirst(posts: PublicPost[]): PublicPost[] {
  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function postCard(p: PublicPost): PostCard {
  const { post } = p;
  return {
    slug: p.slug,
    href: `/writing/${p.slug}`,
    title: post.title,
    publishedAt: p.publishedAt,
    excerpt: post.excerpt,
    ...(post.topics[0] ? { topic: post.topics[0] } : {}),
    topics: post.topics,
    readingMinutes: post.readingMinutes,
    ...(post.cover ? { cover: post.cover } : {}),
  };
}

function topicsByUse(posts: PublicPost[]): string[] {
  const count = new Map<string, number>();
  for (const p of posts) for (const t of p.post.topics) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}

/** /writing, or null while nothing is published (the page is then the 404, D19). */
export function writingIndex(content: PublicContent): WritingIndexView | null {
  if (content.posts.length === 0) return null;
  const posts = newestFirst(content.posts);
  // The section's settings apply even while it's off the homepage.
  const section = content.layout.sections.find((s) => s.kind === "writing");
  const intro = section?.header?.intro;
  return {
    ...(intro ? { intro } : {}),
    rss: section?.writing?.rss ?? true,
    topics: topicsByUse(posts),
    posts: posts.map(postCard),
  };
}

/** One post, with the byline and the next older post (03 · /writing/:slug). */
export function postView(content: PublicContent, slug: string): PostView | null {
  const posts = newestFirst(content.posts);
  const i = posts.findIndex((p) => p.slug === slug);
  const found = posts[i];
  if (!found) return null;
  const older = posts[i + 1];
  const { profile } = content;
  const company = profile.experience[0]?.company;
  return {
    slug: found.slug,
    publishedAt: found.publishedAt,
    post: found.post,
    byline: {
      name: profile.name,
      ...(profile.title ? { title: profile.title } : {}),
      ...(company ? { company } : {}),
    },
    ...(older ? { next: { href: `/writing/${older.slug}`, title: older.post.title } } : {}),
  };
}

/** The page of the list a `?page=` value asks for, clamped to the pages that exist. */
export function pageOf(value: string | null, total: number): number {
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, pages) : 1;
}
