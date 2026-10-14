import { describe, expect, it } from "vitest";

import { newBlock, newProject } from "../defaults";
import type { Block, Project } from "../types";
import { cleanRich } from "./rich";
import {
  addBlock,
  addChapter,
  asList,
  chapterSub,
  deleteBlock,
  duplicateBlock,
  liveAnchor,
  moveBlock,
  moveChapter,
  patchBlock,
  patchChapter,
  restoreBlock,
  riceKeep,
  riceProblem,
  riceSetEffort,
  riceUseComputed,
  staleMentions,
} from "./story";
import { must } from "./test-helpers";
import { checkFile, formatBytes } from "./upload";

type TableBlock = Extract<Block, { type: "table" }>;

const rice = (): TableBlock => ({
  ...(newBlock("table") as TableBlock),
  formula: "rice",
  checkFormula: true,
  columns: ["#", "Feature", "Reach", "Impact", "Conf.", "Effort", "RICE"],
  rows: [
    ["1", "WhatsApp integration", "9", "2.5", "85%", "2 mo", "9.6"],
    ["2", "Product education", "7", "2", "65%", "1 mo", "9.1"],
    ["3", "Subscription packages", "8", "2.5", "85%", "1.5 mo", "5.7"],
  ],
});

function project(): Project {
  let d = newProject();
  const a = addChapter(d);
  d = a.draft;
  const b = addChapter(d);
  d = b.draft;
  return d;
}

describe("chapters", () => {
  it("adds, moves, patches and describes chapters", () => {
    let d = project();
    const [a, b] = d.story.map((c) => c.id);
    expect(d.story[0]?.title).toBe("New chapter");
    d = moveChapter(d, must(b), 0);
    expect(d.story.map((c) => c.id)).toEqual([b, a]);
    expect(moveChapter(d, must(b), 9).story.map((c) => c.id)).toEqual([b, a]);
    d = patchChapter(d, must(a), { hidden: true });
    expect(chapterSub(must(d.story[1]))).toEqual({ text: "Hidden by you", muted: true });
    expect(chapterSub(must(d.story[0]))).toEqual({ text: "Hidden · empty", muted: true });
    const r = addBlock(d, must(b), "text");
    d = patchBlock(r.draft, must(b), r.id, (x) => (x.type === "text" ? { ...x, body: "<p>Hi</p>" } : x));
    expect(chapterSub(must(d.story[0]))).toEqual({ text: "1 block", muted: false });
    expect(liveAnchor(d, must(b))).toBe("ch-01");
    expect(liveAnchor(d, must(a))).toBeNull();
  });

  it("moves, duplicates, deletes and restores blocks", () => {
    let d = project();
    const c = must(d.story[0]).id;
    const t1 = addBlock(d, c, "text");
    const t2 = addBlock(t1.draft, c, "heading");
    d = t2.draft;
    d = moveBlock(d, c, t2.id, -1);
    expect(must(d.story[0]).blocks.map((b) => b.id)).toEqual([t2.id, t1.id]);
    const dup = duplicateBlock(d, c, t2.id);
    expect(must(dup.draft.story[0]).blocks).toHaveLength(3);
    expect(must(dup.draft.story[0]).blocks[1]?.id).toBe(dup.id);
    expect(duplicateBlock(d, c, "nope").draft).toEqual(d);
    const del = deleteBlock(dup.draft, c, dup.id);
    expect(must(del.draft.story[0]).blocks).toHaveLength(2);
    const back = restoreBlock(del.draft, c, must(del.block), del.index);
    expect(must(back.story[0]).blocks.map((b) => b.id)).toEqual(
      must(dup.draft.story[0]).blocks.map((b) => b.id),
    );
  });

  it("turns typed lines into a list", () => {
    expect(asList("<p>One</p><p>Two</p>")).toBe("<ul><li>One</li><li>Two</li></ul>");
    expect(asList("<ul><li>A</li></ul>")).toBe("<ul><li>A</li></ul>");
    expect(asList("")).toBe("");
    expect(asList("plain")).toBe("plain");
  });
});

describe("RICE fixes", () => {
  it("re-ranks with the computed score, sets the effort, or marks reviewed", () => {
    const b = rice();
    const p = must(riceProblem(b));
    expect(p.text).toBe(
      "Subscription packages: its inputs give 11.3 (8 × 2.5 × 85% ÷ 1.5), but its score says 5.7. A 3-month effort would give 5.7.",
    );
    const used = riceUseComputed(b, p.flag);
    expect(used.rank).toBe(1);
    expect(used.block.rows.map((r) => [r[0], r[6]])).toEqual([
      ["2", "9.6"],
      ["3", "9.1"],
      ["1", "11.3"],
    ]);
    expect(riceProblem(used.block)).toBeNull();
    const eff = riceSetEffort(b, p.flag);
    expect(eff.rows[2]?.[5]).toBe("3 mo");
    expect(riceProblem(eff)).toBeNull();
    expect(riceKeep(b, p.flag).reviewed).toEqual(["Subscription packages"]);
    expect(riceProblem(riceKeep(b, p.flag))).toBeNull();
  });

  it("finds text that still names the old order", () => {
    let d = project();
    const c = must(d.story[0]).id;
    const r = addBlock(d, c, "callout");
    d = patchBlock(r.draft, c, r.id, (x) =>
      x.type === "callout" ? { ...x, body: "<p>WhatsApp integration first.</p>" } : x,
    );
    expect(staleMentions(d, "WhatsApp integration")).toEqual(["New chapter"]);
    expect(staleMentions(d, "Nothing")).toEqual([]);
  });
});

describe("cleanRich", () => {
  it("keeps only the allowlist and wraps loose text", () => {
    expect(cleanRich('Hi <b>there</b> <script>x()</script><a href="javascript:x">l</a>')).toBe(
      "<p>Hi <strong>there</strong> l</p>",
    );
    expect(cleanRich("<div>One</div><div>Two</div>")).toBe("<p>One</p><p>Two</p>");
    expect(cleanRich('<p>A <a href="https://x.test">link</a> &amp; "q"</p>')).toBe(
      '<p>A <a href="https://x.test">link</a> &amp; "q"</p>',
    );
    expect(cleanRich("<p> </p>")).toBe("");
    expect(cleanRich("<p>a</p><p>b</p>", "inline")).toBe("a  b");
    expect(cleanRich("<ul><li>x</li></ul>")).toBe("<ul><li>x</li></ul>");
  });
});

describe("upload rules", () => {
  it("accepts images and PDFs and names what it refuses", () => {
    expect(checkFile({ name: "a.png", type: "image/png", size: 10 })).toEqual({
      ok: true,
      kind: "image",
      heic: false,
    });
    expect(checkFile({ name: "IMG.heic", type: "", size: 10 })).toEqual({
      ok: true,
      kind: "image",
      heic: true,
    });
    expect(checkFile({ name: "cv.pdf", type: "application/pdf", size: 10 })).toEqual({
      ok: true,
      kind: "document",
      heic: false,
    });
    expect(checkFile({ name: "cv.pdf", type: "application/pdf", size: 10 }, { images: true })).toMatchObject({
      ok: false,
      reason: "type",
    });
    expect(checkFile({ name: "big.png", type: "image/png", size: 14.2 * 1024 * 1024 })).toEqual({
      ok: false,
      reason: "too-large",
      message: "14.2 MB. Images can be up to 10 MB.",
    });
    expect(checkFile({ name: "doc.pdf", type: "application/pdf", size: 18.4 * 1024 * 1024 })).toMatchObject({
      message: "18.4 MB. PDFs can be up to 10 MB.",
    });
    expect(checkFile({ name: "walk.mp4", type: "video/mp4", size: 1 })).toMatchObject({ reason: "video" });
    expect(checkFile({ name: "prototype.html", type: "text/html", size: 1 })).toMatchObject({
      reason: "prototype",
    });
    expect(checkFile({ name: "x.txt", type: "text/plain", size: 1 })).toMatchObject({
      reason: "type",
      message: "Use an image (PNG, JPG, WebP, GIF or HEIC) or a PDF.",
    });
    expect(formatBytes(2048)).toBe("2 KB");
  });
});
