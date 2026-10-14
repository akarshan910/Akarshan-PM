import { describe, expect, it } from "vitest";

import { newPost } from "~/lib/defaults";
import { postExcerpt, publishPost, readingMinutes, type Img } from "~/lib/published";
import { Post as PostSchema } from "~/lib/schemas";
import type { Post, PostBlock } from "~/lib/types";

const img = (alt: string): Img => ({
  src: "/media/a.webp",
  srcset: "/media/a.webp 1600w",
  width: 1600,
  height: 900,
  alt,
  dominant: "#111",
});
const resolveImg = (ref: { mediaId: string }) => (ref.mediaId === "m1" ? img("Media alt") : undefined);
const words = (n: number) => Array.from({ length: n }, (_, i) => `w${String(i)}`).join(" ");
const text = (id: string, body: string): PostBlock => ({ id, type: "text", body });

describe("readingMinutes (words ÷ 220, rounded up, at least 1)", () => {
  it("is 1 for an empty post", () => {
    expect(readingMinutes([])).toBe(1);
  });

  it("rounds up, and counts headings, quotes, code, facts and captions", () => {
    expect(readingMinutes([text("a", `<p>${words(220)}</p>`)])).toBe(1);
    expect(
      readingMinutes([text("a", `<p>${words(220)}</p>`), { id: "h", type: "heading", body: "One" }]),
    ).toBe(2);
    const blocks: PostBlock[] = [
      { id: "q", type: "quote", body: words(120) },
      { id: "c", type: "code", body: words(100) },
      { id: "f", type: "fact", value: "+20%", label: "renewal", resultType: "achieved" },
      { id: "i", type: "image", mediaId: "m1", caption: "a b c" },
      { id: "j", type: "image", mediaId: "m1" },
      { id: "e", type: "embed", url: "https://example.com" },
    ];
    expect(readingMinutes(blocks)).toBe(2); // 120 + 100 + 2 + 3 = 225 words
  });
});

describe("postExcerpt", () => {
  it("uses the post's own excerpt", () => {
    expect(postExcerpt({ excerpt: "  Mine.  ", blocks: [text("a", "<p>Body</p>")] })).toBe("Mine.");
  });

  it("falls back to the body's text, as is when it's short", () => {
    expect(postExcerpt({ blocks: [text("a", "<p>Short <strong>body</strong>.</p>")] })).toBe("Short body.");
    expect(postExcerpt({ excerpt: "", blocks: [] })).toBe("");
  });

  it("cuts a long body at a word, within 160 characters", () => {
    const out = postExcerpt({ blocks: [text("a", `<p>${"word ".repeat(60)}</p>`)] });
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("word…")).toBe(true);
  });

  it("cuts mid-word when there's no space to cut at", () => {
    const out = postExcerpt({ blocks: [text("a", `<p>${"x".repeat(200)}</p>`)] });
    expect(out).toBe(`${"x".repeat(159)}…`);
  });
});

describe("publishPost", () => {
  const draft: Post = {
    ...newPost(),
    title: "A post",
    cover: { mediaId: "m1", alt: "Own alt" },
    blocks: [
      text("t", "<p>Hello world</p>"),
      { id: "i", type: "image", mediaId: "m1", caption: "Caption" },
      { id: "x", type: "image", mediaId: "missing" },
    ],
  };

  it("resolves the cover and image blocks, and drops images with no media", () => {
    const out = publishPost(draft, resolveImg, "2026-10-15T10:00:00Z");
    expect(out.cover?.alt).toBe("Own alt");
    expect(out.blocks).toEqual([
      draft.blocks[0],
      { id: "i", type: "image", media: { ...img("Media alt"), caption: "Caption" } },
    ]);
    expect(out.readingMinutes).toBe(1);
    expect(out.excerpt).toBe("Hello world");
    expect(out.modifiedAt).toBe("2026-10-15T10:00:00Z");
    expect(JSON.stringify(out)).not.toContain("mediaId");
  });

  it("leaves the cover out when there's none", () => {
    const out = publishPost({ ...newPost(), title: "No cover" }, resolveImg, "2026-10-15T10:00:00Z");
    expect(out).not.toHaveProperty("cover");
    expect(PostSchema.safeParse(newPost()).success).toBe(true);
  });
});
