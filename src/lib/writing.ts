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
  /** Every topic in use, newest first. "All" is the page's own. */
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

/** Every topic in use, in the order the newest posts first name them. */
function topicsInUse(posts: PublicPost[]): string[] {
  return [...new Set(posts.flatMap((p) => p.post.topics))];
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
    topics: topicsInUse(posts),
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

/**
 * The topic and page /writing shows. `params` is null before hydration (the prerendered page is
 * the first page under All). A topic just chosen (`pending`) wins only until the address catches
 * up; after that the address is the truth, so a later `?page=` is followed.
 */
export function writingAddress(
  view: WritingIndexView | null,
  params: URLSearchParams | null,
  pending: { from: string; topic: string | undefined } | null,
): { topic: string | undefined; page: number } {
  if (!view || !params) return { topic: undefined, page: 1 };
  const waiting = pending !== null && pending.from === params.toString();
  const chosen = waiting ? pending.topic : (params.get("topic") ?? undefined);
  const topic = chosen && view.topics.includes(chosen) ? chosen : undefined;
  const total = topic ? view.posts.filter((p) => p.topics.includes(topic)).length : view.posts.length;
  return { topic, page: waiting ? 1 : pageOf(params.get("page"), total) };
}
