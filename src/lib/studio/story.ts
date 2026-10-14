/**
 * The Story tab's edits (05 · Story; EditorCaseStudy): chapters and blocks as pure functions over
 * the project draft, and the RICE fixes with the board's announcements.
 */
import { chapterAnchors } from "../case-study";
import { newBlock, newChapter, newId } from "../defaults";
import type { Block, BlockType, Chapter, Project } from "../types";
import { chapterHasContent, riceFlags, round1, type RiceFlag } from "./checks";

type TableBlock = Extract<Block, { type: "table" }>;

export const BLOCK_TYPES: { type: BlockType; name: string; desc: string }[] = [
  { type: "text", name: "Text", desc: "Paragraphs, bold and links" },
  { type: "heading", name: "Heading", desc: "A subhead inside the chapter" },
  { type: "list", name: "List", desc: "Bulleted or numbered points" },
  { type: "callout", name: "Callout", desc: "One idea you want remembered" },
  { type: "metrics", name: "Metrics", desc: "Results from Outcomes, with their labels" },
  { type: "table", name: "Table", desc: "Scoring or comparison, with an optional formula" },
  { type: "image", name: "Image", desc: "One image with caption and alt text" },
  { type: "gallery", name: "Gallery", desc: "A swipeable strip of images" },
  { type: "video", name: "Video", desc: "YouTube, Vimeo, Loom or Google Drive link" },
  { type: "prototype", name: "Prototype", desc: "Open the prototype on a chosen screen" },
  { type: "beforeafter", name: "Before / after", desc: "Two images with a slider" },
  { type: "journey", name: "Journey", desc: "Stages across a timeline" },
  { type: "ownership", name: "Ownership", desc: "What you owned, the team, the business" },
  { type: "quote", name: "Quote", desc: "From a user or a stakeholder" },
  { type: "cards", name: "Cards", desc: "Two to four side-by-side groups" },
  { type: "divider", name: "Divider", desc: "A thin rule between ideas" },
];

export const BLOCK_LABEL: Record<BlockType, string> = {
  text: "Text",
  heading: "Heading",
  list: "List",
  callout: "Callout",
  metrics: "Metrics · from Outcomes",
  table: "Table",
  image: "Image",
  gallery: "Gallery",
  video: "Video",
  prototype: "Prototype",
  beforeafter: "Before / after",
  journey: "Journey",
  ownership: "Ownership",
  quote: "Quote",
  cards: "Cards",
  divider: "Divider",
};

const mapChapter = (d: Project, id: string, fn: (c: Chapter) => Chapter): Project => ({
  ...d,
  story: d.story.map((c) => (c.id === id ? fn(c) : c)),
});

function move<T>(arr: readonly T[], from: number, to: number): T[] {
  const out = arr.slice();
  if (from < 0 || to < 0 || from >= out.length || to >= out.length) return out;
  const [x] = out.splice(from, 1);
  if (x !== undefined) out.splice(to, 0, x);
  return out;
}

export function moveChapter(d: Project, id: string, to: number): Project {
  return {
    ...d,
    story: move(
      d.story,
      d.story.findIndex((c) => c.id === id),
      to,
    ),
  };
}

/** "Add chapter": a visible chapter called "New chapter", with the board's prompt. */
export function addChapter(d: Project): { draft: Project; id: string } {
  const c: Chapter = {
    ...newChapter(),
    title: "New chapter",
    prompts: ["What should a reader take from this chapter?"],
  };
  return { draft: { ...d, story: [...d.story, c] }, id: c.id };
}

export function patchChapter(d: Project, id: string, p: Partial<Chapter>): Project {
  return mapChapter(d, id, (c) => ({ ...c, ...p }));
}

export function addBlock(d: Project, chapterId: string, type: BlockType): { draft: Project; id: string } {
  const b = newBlock(type);
  return { draft: mapChapter(d, chapterId, (c) => ({ ...c, blocks: [...c.blocks, b] })), id: b.id };
}

export function patchBlock(d: Project, chapterId: string, blockId: string, fn: (b: Block) => Block): Project {
  return mapChapter(d, chapterId, (c) => ({
    ...c,
    blocks: c.blocks.map((b) => (b.id === blockId ? fn(b) : b)),
  }));
}

export function moveBlock(d: Project, chapterId: string, blockId: string, dir: -1 | 1): Project {
  return mapChapter(d, chapterId, (c) => {
    const i = c.blocks.findIndex((b) => b.id === blockId);
    return { ...c, blocks: move(c.blocks, i, i + dir) };
  });
}

export function duplicateBlock(
  d: Project,
  chapterId: string,
  blockId: string,
): { draft: Project; id: string } {
  const id = newId("b");
  return {
    draft: mapChapter(d, chapterId, (c) => {
      const i = c.blocks.findIndex((b) => b.id === blockId);
      const src = c.blocks[i];
      if (!src) return c;
      const blocks = c.blocks.slice();
      blocks.splice(i + 1, 0, { ...structuredClone(src), id });
      return { ...c, blocks };
    }),
    id,
  };
}

export function deleteBlock(
  d: Project,
  chapterId: string,
  blockId: string,
): { draft: Project; block: Block | undefined; index: number } {
  const c = d.story.find((x) => x.id === chapterId);
  const index = c ? c.blocks.findIndex((b) => b.id === blockId) : -1;
  return {
    draft: mapChapter(d, chapterId, (ch) => ({ ...ch, blocks: ch.blocks.filter((b) => b.id !== blockId) })),
    block: c?.blocks[index],
    index,
  };
}

export function restoreBlock(d: Project, chapterId: string, block: Block, index: number): Project {
  return mapChapter(d, chapterId, (c) => {
    const blocks = c.blocks.slice();
    blocks.splice(Math.min(index, blocks.length), 0, block);
    return { ...c, blocks };
  });
}

/** The chapter's link on the live page: its position among the chapters visitors see. */
export function liveAnchor(d: Project, chapterId: string): string | null {
  const live = d.story.filter((c) => !c.hidden && chapterHasContent(c));
  const i = live.findIndex((c) => c.id === chapterId);
  return i < 0 ? null : (chapterAnchors(live.map((c) => c.title))[i] ?? null);
}

/** The chapter list's second line (EditorCaseStudy): "Hidden by you", "Hidden · empty", "3 blocks". */
export function chapterSub(c: Chapter): { text: string; muted: boolean } {
  if (c.hidden) return { text: "Hidden by you", muted: true };
  if (!chapterHasContent(c)) return { text: "Hidden · empty", muted: true };
  return { text: `${c.blocks.length} ${c.blocks.length === 1 ? "block" : "blocks"}`, muted: false };
}

/** A list block's body: lines typed as paragraphs become list items. */
export function asList(html: string): string {
  if (!html || /<(ul|ol)>/.test(html)) return html;
  const items = [...html.matchAll(/<p>(.*?)<\/p>/g)].map((m) => m[1] ?? "").filter((x) => x.trim() !== "");
  return items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>` : html;
}

// ---------------------------------------------------------------------------------------------
// RICE fixes (EditorCaseStudy › re-ranked)
// ---------------------------------------------------------------------------------------------

const fmt = (n: number) => String(round1(n));

/** Re-numbers the `#` column by score, highest first. */
function rerank(rows: string[][]): string[][] {
  const scoreAt = (r: string[]) => Number.parseFloat((r[r.length - 1] ?? "").replace(/[^0-9.-]/g, "")) || 0;
  const order = rows.map((r, i) => ({ i, s: scoreAt(r) })).sort((a, b) => b.s - a.s || a.i - b.i);
  const rank = new Map(order.map((o, n) => [o.i, String(n + 1)]));
  return rows.map((r, i) => [rank.get(i) ?? r[0] ?? "", ...r.slice(1)]);
}

export function riceUseComputed(block: TableBlock, flag: RiceFlag): { block: TableBlock; rank: number } {
  const rows = block.rows.map((r, i) => (i === flag.row ? [...r.slice(0, -1), fmt(flag.computed)] : r));
  const ranked = rerank(rows);
  return { block: { ...block, rows: ranked }, rank: Number(ranked[flag.row]?.[0]) };
}

export function riceSetEffort(block: TableBlock, flag: RiceFlag): TableBlock {
  return {
    ...block,
    rows: block.rows.map((r, i) =>
      i === flag.row
        ? [
            r[0] ?? "",
            r[1] ?? "",
            r[2] ?? "",
            r[3] ?? "",
            r[4] ?? "",
            `${fmt(flag.effortForShown)} mo`,
            ...r.slice(6),
          ]
        : r,
    ),
  };
}

export function riceKeep(block: TableBlock, flag: RiceFlag): TableBlock {
  return { ...block, reviewed: [...new Set([...(block.reviewed ?? []), flag.item])] };
}

/** The first flagged row, with the sentence the board shows for it. */
export function riceProblem(block: TableBlock): { flag: RiceFlag; text: string } | null {
  const flag = riceFlags(block)[0];
  if (!flag) return null;
  const row = block.rows[flag.row] ?? [];
  const [, , r, i, c, e] = row;
  return {
    flag,
    text: `${flag.item}: its inputs give ${fmt(flag.computed)} (${r ?? ""} × ${i ?? ""} × ${c ?? ""} ÷ ${(e ?? "").replace(/\s*mo$/, "")}), but its score says ${fmt(flag.shown)}. A ${fmt(flag.effortForShown)}-month effort would give ${fmt(flag.shown)}.`,
  };
}

/** Text that still names the old order: chapters whose text or callouts mention the previous top item. */
export function staleMentions(d: Project, previousTop: string): string[] {
  const out: string[] = [];
  for (const c of d.story)
    if (c.blocks.some((b) => (b.type === "text" || b.type === "callout") && b.body.includes(previousTop)))
      out.push(c.title || "Untitled");
  return out;
}
