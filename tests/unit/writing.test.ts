import { describe, expect, it } from "vitest";

import type { PublicContent, PublicPost } from "~/lib/content-source";
import { newPost } from "~/lib/defaults";
import { publishPost } from "~/lib/published";
import { buildHomeView } from "~/lib/site";
import { loadLocalV0 } from "~/lib/sources/local-v0";
import type { Section } from "~/lib/types";
import { POSTS_PER_PAGE, pageOf, postView, writingAddress, writingIndex } from "~/lib/writing";

const v0 = loadLocalV0(new Date("2026-10-13T18:00:00Z"));

function post(n: number, topics: string[] = [], showOnHome = true): PublicPost {
  const day = String(n).padStart(2, "0");
  return {
    id: `p${String(n)}`,
    slug: `post-${String(n)}`,
    publishedAt: `2026-09-${day}T10:00:00Z`,
    post: publishPost(
      {
        ...newPost(),
        title: `Post ${String(n)}`,
        topics,
        showOnHome,
        blocks: [{ id: "t", type: "text", body: "<p>Body</p>" }],
      },
      () => undefined,
      `2026-09-${day}T10:00:00Z`,
    ),
  };
}

const writingSection = (patch: Partial<Section> = {}): Section => ({
  id: "writing",
  kind: "writing",
  visible: true,
  items: [],
  header: { intro: "On product." },
  writing: { latest: 2, rss: false },
  ...patch,
});

function withPosts(posts: PublicPost[], section: Section | null = writingSection()): PublicContent {
  const sections = v0.layout.sections.filter((s) => s.kind !== "writing");
  if (section) sections.splice(3, 0, section);
  return { ...v0, posts, layout: { ...v0.layout, sections } };
}

describe("writingIndex", () => {
  it("is null while nothing is published, so /writing is the 404 (D19)", () => {
    expect(writingIndex(v0)).toBeNull();
  });

  it("lists every post newest first, with the intro, RSS and topics as the newest posts name them", () => {
    const view = writingIndex(withPosts([post(1, ["AI"]), post(3, ["Data", "AI"]), post(2, ["Product"])]));
    expect(view?.posts.map((p) => p.slug)).toEqual(["post-3", "post-2", "post-1"]);
    expect(view?.posts[0]).toMatchObject({
      href: "/writing/post-3",
      topic: "Data",
      excerpt: "Body",
      readingMinutes: 1,
    });
    expect(view?.topics).toEqual(["Data", "AI", "Product"]);
    expect(view?.intro).toBe("On product.");
    expect(view?.rss).toBe(false);
  });

  it("defaults RSS on and leaves the intro out without a Writing section", () => {
    const view = writingIndex(withPosts([post(1)], null));
    expect(view?.rss).toBe(true);
    expect(view).not.toHaveProperty("intro");
    expect(view?.posts[0]).not.toHaveProperty("topic");
  });
});

describe("postView", () => {
  const content = withPosts([post(1), post(2), post(3)]);

  it("has the byline from the profile and the next older post", () => {
    const view = postView(content, "post-2");
    expect(view?.byline.name).toBe(v0.profile.name);
    expect(view?.byline.company).toBe(v0.profile.experience[0]?.company);
    expect(view?.next).toEqual({ href: "/writing/post-1", title: "Post 1" });
  });

  it("has no next post for the oldest, and is null for an unknown slug", () => {
    expect(postView(content, "post-1")).not.toHaveProperty("next");
    expect(postView(content, "nope")).toBeNull();
  });

  it("leaves out an empty title and company", () => {
    const bare = { ...content, profile: { ...content.profile, title: "", experience: [] } };
    expect(postView(bare, "post-1")?.byline).toEqual({ name: v0.profile.name });
  });
});

describe("the homepage Writing section", () => {
  it("shows the newest `latest` posts marked Show on my homepage", () => {
    const home = buildHomeView(withPosts([post(1), post(2), post(3), post(4, [], false)]));
    expect(home.sections.some((s) => s.kind === "writing")).toBe(true);
    expect(home.posts.map((p) => p.slug)).toEqual(["post-3", "post-2"]);
  });

  it("returns no posts while the section is hidden", () => {
    const home = buildHomeView(withPosts([post(1)], writingSection({ visible: false })));
    expect(home.posts).toEqual([]);
  });

  it("caps to 3 when the section has no setting", () => {
    const home = buildHomeView(
      withPosts([post(1), post(2), post(3), post(4)], { ...writingSection(), writing: undefined }),
    );
    expect(home.posts).toHaveLength(3);
  });
});

describe("pageOf", () => {
  it("clamps ?page= to the pages that exist", () => {
    expect(pageOf(null, 5)).toBe(1);
    expect(pageOf("2", 5)).toBe(1);
    expect(pageOf("2", POSTS_PER_PAGE + 1)).toBe(2);
    expect(pageOf("9", POSTS_PER_PAGE + 1)).toBe(2);
    expect(pageOf("0", 50)).toBe(1);
    expect(pageOf("1.5", 50)).toBe(1);
    expect(pageOf("x", 0)).toBe(1);
  });
});

describe("writingAddress", () => {
  const many = writingIndex(
    withPosts(Array.from({ length: POSTS_PER_PAGE + 5 }, (_, i) => post(i + 1, i % 2 ? ["AI"] : ["Data"]))),
  );
  const q = (s: string) => new URLSearchParams(s);

  it("is the first page under All before hydration or without posts", () => {
    expect(writingAddress(many, null, null)).toEqual({ topic: undefined, page: 1 });
    expect(writingAddress(null, q("page=2"), null)).toEqual({ topic: undefined, page: 1 });
  });

  it("follows the address, ignoring unknown topics", () => {
    expect(writingAddress(many, q("page=2"), null)).toEqual({ topic: undefined, page: 2 });
    expect(writingAddress(many, q("topic=Nope&page=2"), null)).toEqual({ topic: undefined, page: 2 });
    // 12 posts on AI fit one page.
    expect(writingAddress(many, q("topic=AI&page=2"), null)).toEqual({ topic: "AI", page: 1 });
  });

  it("shows a chosen topic until the address catches up, then follows ?page= again", () => {
    const pending = { from: "", topic: "AI" };
    expect(writingAddress(many, q(""), pending)).toEqual({ topic: "AI", page: 1 });
    // The address changed since (the topic, then a later Older posts link): pending is stale.
    expect(writingAddress(many, q("page=2"), pending)).toEqual({ topic: undefined, page: 2 });
  });
});
