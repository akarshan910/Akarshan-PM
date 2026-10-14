import { describe, expect, it } from "vitest";

import { newBlock, newChapter, newPost, newProject } from "../defaults";
import type { Block, Project } from "../types";
import {
  blockHasContent,
  honesty,
  postChecks,
  postIssues,
  postWords,
  projectChecks,
  projectIssues,
  prototypeProblem,
  readiness,
  readingMinutes,
  riceFlags,
  riceScore,
  siteNeedsConfirm,
  slugProblem,
  videoHost,
} from "./checks";
import type { MediaRow } from "./repo";
import { testRepo } from "./test-helpers";

const noMedia = () => undefined;
const ctx = { slug: "a-title", media: noMedia };

function filled(): Project {
  const p = newProject();
  p.overview = { ...p.overview, title: "A title", company: "Co", summary: "Short." };
  return p;
}

const rice = (
  rows: string[][],
  extra: Partial<Extract<Block, { type: "table" }>> = {},
): Extract<Block, { type: "table" }> => ({
  ...(newBlock("table") as Extract<Block, { type: "table" }>),
  formula: "rice",
  checkFormula: true,
  columns: ["#", "Feature", "Reach", "Impact", "Conf.", "Effort", "RICE"],
  rows,
  ...extra,
});

describe("slugProblem, videoHost, prototypeProblem", () => {
  it("follow the boards' rules", () => {
    expect(slugProblem("")).toBe("Add an address.");
    expect(slugProblem("Bad--one")).toBe("Use only lowercase letters, numbers and single hyphens.");
    expect(slugProblem("good-one-2")).toBe("");
    expect(videoHost("https://youtu.be/abc")).toBe("YouTube");
    expect(videoHost("https://vimeo.com/123")).toBe("Vimeo");
    expect(videoHost("https://www.loom.com/share/abc")).toBe("Loom");
    expect(videoHost("https://drive.google.com/file/d/abc/view")).toBe("Google Drive");
    expect(videoHost("https://example.com/v.mp4")).toBe("");
    expect(prototypeProblem("", false)).toBe("");
    expect(prototypeProblem("", true)).toBe("Paste the prototype’s address.");
    expect(prototypeProblem("http://x", true)).toBe("Use an https:// address.");
    expect(prototypeProblem("https://app-git-main-me.vercel.app", true)).toMatch(/Vercel preview/);
    expect(prototypeProblem("https://app.vercel.app", true)).toBe("");
  });
});

describe("RICE", () => {
  it("scores rows and flags a mismatch with the effort that would match", () => {
    const row = ["6", "Subscription packages", "8", "2.5", "85%", "1.5 mo", "5.7"];
    expect(riceScore(row)).toBeCloseTo(11.33, 2);
    expect(riceScore(["1", "x", "1", "1", "100%", "0 mo", "1"])).toBeNaN();
    const flags = riceFlags(rice([row, ["1", "WhatsApp integration", "9", "2.5", "85%", "2 mo", "9.6"]]));
    expect(flags).toEqual([
      { row: 0, item: "Subscription packages", computed: 11.3, shown: 5.7, effortForShown: 3 },
    ]);
  });

  it("skips reviewed rows, unchecked tables, other tables and blank scores", () => {
    const row = ["6", "Subscription packages", "8", "2.5", "85%", "1.5 mo", "5.7"];
    expect(riceFlags(rice([row], { reviewed: ["Subscription packages"] }))).toEqual([]);
    expect(riceFlags(rice([row], { checkFormula: false }))).toEqual([]);
    expect(riceFlags({ ...rice([row]), formula: undefined })).toEqual([]);
    expect(riceFlags(rice([["1", "x", "1", "1", "100%", "1 mo", ""]]))).toEqual([]);
  });
});

describe("blockHasContent", () => {
  it("knows an empty block from a filled one, for every type", () => {
    const types = [
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
    ] as const;
    const always = new Set(["metrics", "divider", "prototype"]);
    for (const t of types) expect(blockHasContent(newBlock(t))).toBe(always.has(t));
    expect(blockHasContent({ id: "b", type: "text", body: "<p>Hi</p>", style: "body" })).toBe(true);
    expect(blockHasContent({ id: "b", type: "heading", body: "Hi" })).toBe(true);
    expect(blockHasContent({ id: "b", type: "ownership", mine: "Me" })).toBe(true);
  });
});

describe("projectIssues", () => {
  it("lists every blocker with its tab, in tab order", () => {
    const p = newProject();
    p.overview.prdUrl = "http://x";
    p.overview.summary = "x".repeat(141);
    p.visuals.cover = { mediaId: "m1" };
    p.visuals.gallery = [{ mediaId: "m2" }, { mediaId: "m3", decorative: true }];
    p.visuals.hero = { type: "video", url: "https://example.com/v" };
    const ch = newChapter();
    ch.blocks = [
      { id: "b1", type: "text", body: "<p>Hi</p>", style: "body" },
      { id: "b2", type: "image", media: { mediaId: "m4" } },
      { id: "b3", type: "gallery", media: [{ mediaId: "m5" }] },
    ];
    const table = rice([["6", "Subscription packages", "8", "2.5", "85%", "1.5 mo", "5.7"]]);
    ch.blocks.push(table);
    p.story = [ch];
    p.outcomes = [
      { id: "o1", value: "", label: "", type: "target", inStrip: true },
      { id: "o2", value: "5", label: "x", type: "achieved", inStrip: true },
    ];
    const issues = projectIssues(p, { slug: "", media: noMedia });
    expect(issues.map((i) => [i.tab, i.message])).toEqual([
      ["overview", "Title is required."],
      ["overview", "Company or client is required."],
      ["overview", "Summary is over 140 characters."],
      ["overview", "PRD link must start with https://"],
      ["visuals", "1 image needs alt text."],
      ["visuals", "The cover needs alt text."],
      ["visuals", "The video link isn’t from YouTube, Vimeo, Loom or Google Drive."],
      ["story", "Chapter 1 needs a title."],
      ["story", "An image in the story needs alt text."],
      ["story", "An image in the story needs alt text."],
      ["outcomes", "Fill in or delete result 1."],
      ["outcomes", "Result 2 is marked achieved but has no evidence note."],
      ["settings", "Page address: Add an address."],
    ]);
  });

  it("passes a filled draft, takes alt text from the media row, and checks the prototype", () => {
    const p = filled();
    expect(projectIssues(p, ctx)).toEqual([]);
    p.overview.summary = "";
    expect(projectIssues(p, ctx).map((i) => i.message)).toEqual(["Summary is required."]);
    const q = filled();
    q.visuals.cover = { mediaId: "m1" };
    q.visuals.gallery = [{ mediaId: "m1" }, { mediaId: "m2" }];
    const row = { alt: "Alt", decorative: false } as MediaRow;
    const media = (id: string) =>
      id === "m1" ? row : id === "m2" ? ({ alt: null, decorative: true } as MediaRow) : undefined;
    expect(projectIssues(q, { slug: "a", media })).toEqual([]);
    q.visuals.hero = { type: "prototype", url: "", frame: "phone", start: "click" };
    expect(projectIssues(q, { slug: "a", media }).map((i) => i.message)).toEqual([
      "Prototype: Paste the prototype’s address.",
    ]);
  });
});

describe("projectChecks and honesty", () => {
  it("warns about hidden chapters, an empty role, RICE rows and outcome wording", () => {
    const p = filled();
    p.overview.kind = "study";
    const ch = newChapter();
    ch.title = "My role and decisions";
    p.story = [ch];
    p.story.push({
      ...newChapter(),
      blocks: [rice([["6", "Subscription packages", "8", "2.5", "85%", "1.5 mo", "5.7"]])],
    });
    p.outcomes = [
      { id: "o1", value: "+30%", label: "orders", type: "target", credit: "business", inStrip: true },
      { id: "o2", value: "12%", label: "x", type: "achieved", inStrip: true },
      { id: "o3", value: "5", label: "y", type: "projected", credit: "team", inStrip: true },
    ];
    p.headlineOutcomeId = "o1";
    const texts = projectChecks(p).map((c) => c.text);
    expect(texts).toContain("My role is empty, so that chapter stays hidden. You can publish anyway.");
    expect(texts).toContain("RICE table: one row’s score doesn’t match its inputs. Review");
    expect(texts).toContain("1 chapter stays hidden: My role and decisions.");
    expect(texts).toContain(
      "This project is a strategy study (see Overview). Achieved results usually come from shipped work. Is 12% measured?",
    );
    expect(texts).toContain("Result 3 is projected. Note the method, so you can explain it.");
    expect(texts).toContain("Result 2 doesn’t say whose result it is.");
    expect(texts).toContain(
      "The card headline is labelled Target, and the summary doesn’t claim it as achieved.",
    );
    expect(
      honesty(p)
        .filter((h) => h.level === "err")
        .map((h) => h.text),
    ).toEqual(["Result 2 is marked achieved with no evidence note."]);
    p.story.push({ ...newChapter(), hidden: true }, { ...newChapter(), hidden: true });
    expect(projectChecks(p).map((c) => c.text)).toContain(
      "3 chapters stay hidden: My role and decisions, Untitled, Untitled.",
    );
  });
});

describe("readiness", () => {
  it("counts the recommended fields and names the empty ones", () => {
    expect(readiness(newProject())).toEqual({
      percent: 0,
      missing: [
        "Title",
        "Company",
        "Summary",
        "Problem",
        "Proposal",
        "My role",
        "Cover image",
        "Story",
        "Results",
      ],
    });
    const p = filled();
    expect(readiness(p).percent).toBe(33);
  });
});

describe("posts", () => {
  it("counts words, reading time and the publish checks", () => {
    const post = newPost();
    expect(postIssues(post, { media: noMedia }).map((i) => i.message)).toEqual(["Add a title."]);
    post.title = "T";
    post.cover = { mediaId: "c" };
    expect(postIssues(post, { media: noMedia }).map((i) => i.message)).toEqual(["The cover needs alt text."]);
    post.blocks = [
      { id: "a", type: "text", body: "<p>one two three</p>" },
      { id: "b", type: "code", body: "x = 1" },
    ];
    expect(postWords(post)).toBe(6);
    expect(readingMinutes(0)).toBe(1);
    expect(readingMinutes(221)).toBe(2);
    expect(postChecks(post, postIssues(post, { media: noMedia })).map((c) => c.text)).toEqual([
      "Title is set.",
      "Short so far (6 words). Publishing is still fine.",
      "No excerpt: the first lines will be used.",
      "The cover needs alt text.",
      "Will show on your homepage’s Writing section.",
    ]);
    post.showOnHome = false;
    post.excerpt = "E";
    post.title = "";
    post.cover = undefined;
    post.blocks = [{ id: "a", type: "text", body: "w ".repeat(400) }];
    expect(
      postChecks(post, postIssues(post, { media: noMedia })).map((c) => [c.text, Boolean(c.block)]),
    ).toEqual([
      ["Add a title.", true],
      ["400 words.", false],
      ["Excerpt is set.", false],
      ["Only on /writing and in RSS.", false],
    ]);
  });
});

describe("siteNeedsConfirm", () => {
  it("lists the unconfirmed facts that would be visible", async () => {
    const { repo } = testRepo();
    const profile = (await repo.profile.get()).draft;
    const layout = (await repo.layout.get()).draft;
    const all = siteNeedsConfirm(profile, layout);
    expect(all).toEqual(profile.unconfirmed);
    const hidden = {
      ...layout,
      sections: layout.sections.map((s) =>
        s.kind === "proof" || s.kind === "experience" ? { ...s, visible: false } : s,
      ),
    };
    expect(siteNeedsConfirm({ ...profile, availability: "" }, hidden)).toEqual(["title"]);
  });
});
