// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WritingSection } from "~/components/sections/WritingSection";
import type { PublicPost } from "~/lib/content-source";
import { newPost } from "~/lib/defaults";
import { publishPost, type Img } from "~/lib/published";
import type { PostBlock, Section } from "~/lib/types";
import { POSTS_PER_PAGE, postCard, type PostView, type WritingIndexView } from "~/lib/writing";

import { PostPage } from "./PostPage";
import { WritingIndex } from "./WritingIndex";

const cover: Img = {
  src: "/media/c.webp",
  srcset: "/media/c.webp 1600w",
  width: 1600,
  height: 900,
  alt: "A cover",
  dominant: "#222",
};

function post(n: number, extra: Partial<Parameters<typeof publishPost>[0]> = {}): PublicPost {
  return {
    id: `p${String(n)}`,
    slug: `post-${String(n)}`,
    publishedAt: `2026-09-${String(10 + n)}T10:00:00Z`,
    post: publishPost(
      {
        ...newPost(),
        title: `Post ${String(n)}`,
        topics: n % 2 ? ["AI"] : ["Product"],
        blocks: [{ id: "t", type: "text", body: `<p>Body ${String(n)}</p>` }],
        ...extra,
      },
      () => cover,
      "2026-10-01T10:00:00Z",
    ),
  };
}

const view = (posts: PublicPost[]): WritingIndexView => ({
  intro: "On <strong>product</strong>.",
  rss: true,
  topics: ["AI", "Product"],
  posts: posts.map(postCard),
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WritingIndex", () => {
  const posts = [post(3, { cover: { mediaId: "m" } }), post(2), post(1)];

  it("shows the header, RSS, chips, the lead and the rows", () => {
    const onTopic = vi.fn();
    render(
      <WritingIndex
        view={view(posts)}
        topic={undefined}
        page={1}
        onTopic={onTopic}
        pageHref={(n) => `?page=${String(n)}`}
      />,
      { wrapper: MemoryRouter },
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Writing.");
    expect(screen.getByText("product").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "RSS" })).toHaveAttribute("href", "/writing/rss.xml");
    const chips = within(screen.getByRole("group", { name: "Filter by topic" })).getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual(["All", "AI", "Product"]);
    expect(chips[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chips[1] as HTMLElement);
    expect(onTopic).toHaveBeenCalledWith("AI");
    const lead = screen.getByRole("link", { name: /Latest/ });
    expect(lead).toHaveAttribute("href", "/writing/post-3");
    expect(within(lead).getByRole("img", { name: "A cover" })).toBeInTheDocument();
    expect(lead).toHaveTextContent("13 Sep 2026 · 1 min read · AI");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Older posts" })).toBeNull();
  });

  it("filters by topic and leaves out what's empty", () => {
    render(
      <WritingIndex
        view={{ ...view(posts), intro: undefined, rss: false, topics: [] } as unknown as WritingIndexView}
        topic="Product"
        page={1}
        onTopic={() => undefined}
        pageHref={() => ""}
      />,
      { wrapper: MemoryRouter },
    );
    expect(screen.getByRole("link", { name: /Latest/ })).toHaveAttribute("href", "/writing/post-2");
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.queryByRole("link", { name: "RSS" })).toBeNull();
  });

  it("pages 20 at a time, with Older posts", () => {
    const many = Array.from({ length: POSTS_PER_PAGE + 2 }, (_, i) => post(i + 1));
    const { rerender } = render(
      <WritingIndex
        view={view(many)}
        topic={undefined}
        page={1}
        onTopic={() => undefined}
        pageHref={(n) => `/writing?page=${String(n)}`}
      />,
      { wrapper: MemoryRouter },
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(POSTS_PER_PAGE - 1);
    expect(screen.getByRole("link", { name: "Older posts" })).toHaveAttribute("href", "/writing?page=2");
    rerender(
      <WritingIndex
        view={view(many)}
        topic={undefined}
        page={2}
        onTopic={() => undefined}
        pageHref={() => ""}
      />,
    );
    expect(screen.queryByRole("link", { name: /Latest/ })).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("PostPage", () => {
  const blocks: PostBlock[] = [
    { id: "a", type: "text", body: '<p>Hello <a href="https://example.com">there</a></p>' },
    { id: "b", type: "heading", body: "A heading" },
    { id: "c", type: "quote", body: "A quote" },
    { id: "d", type: "image", mediaId: "m", caption: "A caption" },
    { id: "e", type: "fact", value: "+20%", label: "T2D renewal", resultType: "achieved" },
    { id: "f", type: "code", language: "ts", body: "const a = 1;" },
    { id: "g", type: "code", body: "plain" },
    { id: "h", type: "embed", url: "https://www.figma.com/file/x" },
  ];
  const p = post(2, { subtitle: "A subtitle", cover: { mediaId: "m" }, blocks });
  const full: PostView = {
    slug: p.slug,
    publishedAt: p.publishedAt,
    post: p.post,
    byline: { name: "Akarshan Kumar", title: "Product Manager", company: "Sugar.fit" },
    next: { href: "/writing/post-1", title: "Post 1" },
  };

  it("renders the meta, title, byline, cover, every block, share and next", () => {
    render(<PostPage view={full} url="https://example.com/writing/post-2" />, { wrapper: MemoryRouter });
    expect(screen.getByRole("link", { name: "← Writing" })).toHaveAttribute("href", "/writing");
    expect(screen.getByRole("heading", { level: 1, name: "Post 2" })).toBeInTheDocument();
    expect(screen.getByText("A subtitle")).toBeInTheDocument();
    expect(screen.getByText("Product Manager · Sugar.fit")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "A heading" })).toBeInTheDocument();
    expect(screen.getByText("A quote").tagName).toBe("BLOCKQUOTE");
    expect(screen.getByText("A caption").tagName).toBe("FIGCAPTION");
    expect(screen.getByText("+20%")).toBeInTheDocument();
    expect(screen.getByText("ACHIEVED")).toBeInTheDocument();
    expect(screen.getByText("const a = 1;").closest("pre")).toHaveAttribute("data-language", "ts");
    expect(screen.getByRole("link", { name: /www\.figma\.com/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2Fwriting%2Fpost-2",
    );
    expect(screen.getByRole("link", { name: /^X/ }).getAttribute("href")).toContain("text=Post%202");
    expect(screen.getByRole("link", { name: /Next post/ })).toHaveAttribute("href", "/writing/post-1");
  });

  it("copies the link and says so", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<PostPage view={full} url="https://example.com/writing/post-2" />, { wrapper: MemoryRouter });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith("https://example.com/writing/post-2");
    expect(screen.getByText("Link copied")).toBeInTheDocument();
  });

  it("uses the page's own address without a site URL, and hides empty parts", () => {
    const bare = post(1, { blocks: [{ id: "x", type: "embed", url: "javascript:alert(1)" }] });
    render(
      <PostPage
        view={{ slug: bare.slug, publishedAt: bare.publishedAt, post: bare.post, byline: { name: "A" } }}
      />,
      { wrapper: MemoryRouter },
    );
    expect(screen.getByRole("link", { name: /LinkedIn/ }).getAttribute("href")).toContain(
      encodeURIComponent(window.location.origin),
    );
    expect(screen.queryByRole("link", { name: /Next post/ })).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("link", { name: /javascript/ })).toBeNull();
  });
});

describe("WritingSection", () => {
  const section: Section = {
    id: "writing",
    kind: "writing",
    visible: true,
    items: [],
    writing: { latest: 3, rss: true },
  };

  it("shows the cards, All posts and RSS", () => {
    const posts = [post(2, { cover: { mediaId: "m" } }), post(1)];
    render(<WritingSection section={section} profile={{} as never} projects={{}} posts={posts} />, {
      wrapper: MemoryRouter,
    });
    expect(screen.getByRole("heading", { level: 2, name: "Writing" })).toBeInTheDocument();
    expect(screen.getByText("Latest posts")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All posts →" })).toHaveAttribute("href", "/writing");
    expect(screen.getByRole("link", { name: "RSS" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("list")).toHaveAttribute("data-count", "2");
  });

  it("hides without posts, and RSS when it's off", () => {
    const { container, rerender } = render(
      <WritingSection section={section} profile={{} as never} projects={{}} posts={[]} />,
      { wrapper: MemoryRouter },
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <WritingSection
        section={{
          ...section,
          header: { kicker: "Notes", title: "Posts" },
          writing: { latest: 2, rss: false },
        }}
        profile={{} as never}
        projects={{}}
        posts={[post(1)]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Posts" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "RSS" })).toBeNull();
  });
});
