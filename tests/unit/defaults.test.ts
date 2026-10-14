import { describe, expect, it } from "vitest";

import {
  defaultLayout,
  emptyProfile,
  firstFreeAccent,
  newBlock,
  newChapter,
  newPost,
  newProject,
  newTextSection,
  nextUntitledSlug,
} from "~/lib/defaults";
import { ACCENTS, Block, Post, Profile, Project, Section, SiteLayout } from "~/lib/schemas";
import type { BlockType } from "~/lib/types";

const BLOCK_TYPES: BlockType[] = [
  "text",
  "heading",
  "list",
  "quote",
  "callout",
  "metrics",
  "table",
  "image",
  "gallery",
  "beforeafter",
  "video",
  "prototype",
  "journey",
  "ownership",
  "cards",
  "divider",
];

describe("defaults", () => {
  it("every factory passes its schema", () => {
    expect(() => Project.parse(newProject())).not.toThrow();
    expect(() => Post.parse(newPost())).not.toThrow();
    expect(() => Profile.parse(emptyProfile())).not.toThrow();
    expect(() => SiteLayout.parse(defaultLayout())).not.toThrow();
    expect(() => Section.parse(newTextSection(1))).not.toThrow();
    const chapter = newChapter();
    expect(() => Project.parse({ ...newProject(), story: [chapter] })).not.toThrow();
    for (const t of BLOCK_TYPES) {
      const block = newBlock(t);
      expect(block.type).toBe(t);
      expect(() => Block.parse(block), t).not.toThrow();
    }
  });

  it("new things start empty, so they hide", () => {
    const p = newProject();
    expect(p.overview.title).toBe("");
    expect(p.story).toEqual([]);
    expect(p.outcomes).toEqual([]);
    expect(p.settings.redirectOldSlug).toBe(false);
    expect(newTextSection(2)).toMatchObject({ id: "text-2", header: { title: "Text section 2" } });
  });

  it("numbers untitled slugs after the highest one taken", () => {
    expect(nextUntitledSlug([])).toBe("untitled-1");
    expect(nextUntitledSlug(["untitled-1", "untitled-4", "arcana-workspace"])).toBe("untitled-5");
  });

  it("picks the first accent not used on the shelf", () => {
    expect(firstFreeAccent([])).toBe("teal");
    expect(firstFreeAccent(["teal", "amber"])).toBe("sky");
    expect(firstFreeAccent(ACCENTS)).toBe("teal");
  });

  it("gives blocks and chapters unique ids", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newBlock("text").id));
    expect(ids.size).toBe(200);
    expect(newChapter().id).not.toBe(newChapter().id);
  });
});
