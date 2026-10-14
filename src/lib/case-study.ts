/**
 * The case study's data (03 · Case study): the published project found by its slug, its volume,
 * its neighbours in volume order, and the small pure rules the page draws from: the facts row,
 * chapter numbers, RICE rows, which outcomes a metrics block shows, the current chapter and the
 * reading progress. Plain functions, unit-tested; the page and its blocks only render the result.
 *
 * The loader returns the published shape only (10 · Security gates).
 */
import { ACCENT_COLOURS } from "./accents";
import type { PublicContent } from "./content-source";
import type { BlockPublished, ProjectPublished } from "./published";
import { PROJECT_KIND_LABELS } from "./schemas";
import { listedProjects } from "./site";

export interface Neighbour {
  slug: string;
  title: string;
  volume: string;
  accent: string;
  ground: string;
}

export interface CaseStudyView {
  slug: string;
  project: ProjectPublished;
  /** Unlisted projects have no volume number, so the tag and prev/next hide (03). */
  volume?: string;
  /** `--pa` and `--pg`. */
  accent: string;
  ground: string;
  prev?: Neighbour;
  next?: Neighbour;
  /** Published, listed volumes: "All work · N volumes". */
  volumes: number;
  /** The footer's "© {year} {name}". */
  name: string;
  updatedAt: string;
}

/** Finds a listed project by its live address. Null for anything else: the 404 state. */
export function caseStudyView(content: PublicContent, slug: string): CaseStudyView | null {
  const listed = listedProjects(content);
  const index = listed.findIndex((p) => p.slug === slug);
  const entry = listed[index];
  if (!entry) return null;
  const numbered = listed.filter((p) => p.volume);
  const at = numbered.indexOf(entry);
  const neighbour = (i: number): Neighbour | undefined => {
    const p = at < 0 ? undefined : numbered[i];
    if (!p?.volume) return undefined;
    const c = ACCENT_COLOURS[p.project.visuals.accent];
    return {
      slug: p.slug,
      title: p.project.overview.title,
      volume: p.volume,
      accent: c.accent,
      ground: c.ground,
    };
  };
  const colours = ACCENT_COLOURS[entry.project.visuals.accent];
  const prev = neighbour(at - 1);
  const next = neighbour(at + 1);
  return {
    slug: entry.slug,
    project: entry.project,
    ...(entry.volume ? { volume: entry.volume } : {}),
    accent: colours.accent,
    ground: colours.ground,
    ...(prev ? { prev } : {}),
    ...(next ? { next } : {}),
    volumes: numbered.length,
    name: content.profile.name,
    updatedAt: content.updatedAt,
  };
}

export interface Fact {
  label: string;
  value: string;
  /** "Read the PRD": a link, opening in a new tab. */
  href?: string;
}

/** The facts row: each fact hides on its own (03 · Case study). */
export function caseStudyFacts(overview: ProjectPublished["overview"]): Fact[] {
  const facts: (Fact | false)[] = [
    Boolean(overview.company) && { label: "Company", value: overview.company },
    { label: "Type", value: PROJECT_KIND_LABELS[overview.kind] },
    Boolean(overview.role) && { label: "My role", value: overview.role ?? "" },
    Boolean(overview.timeline) && { label: "Timeline", value: overview.timeline ?? "" },
    overview.topics.length > 0 && { label: "Focus", value: overview.topics.join(" · ") },
    Boolean(overview.team) && { label: "Team", value: overview.team ?? "" },
    Boolean(overview.prdUrl) && { label: "PRD", value: "Read the PRD", href: overview.prdUrl ?? "" },
  ];
  return facts.filter((f): f is Fact => f !== false);
}

/** The mono line after the chip: "Sri Mandir · Devotional consumer app". */
export function companyLine(overview: ProjectPublished["overview"]): string {
  return [overview.company, overview.sector].filter(Boolean).join(" · ");
}

/** Chapter numbers come from position: 01, 02… */
export function chapterNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** The chapter's DOM id, also its link target in the rail and the sheet. */
export function chapterAnchor(index: number): string {
  return `ch-${chapterNumber(index)}`;
}

type Outcome = ProjectPublished["outcomes"][number];

/** A metrics block: the outcomes it names, in its order; with none named, those marked inStrip. */
export function metricsOutcomes(
  block: { outcomeIds?: string[] | undefined },
  outcomes: Outcome[],
): Outcome[] {
  if (block.outcomeIds && block.outcomeIds.length > 0) {
    return block.outcomeIds
      .map((id) => outcomes.find((o) => o.id === id))
      .filter((o): o is Outcome => o !== undefined);
  }
  return outcomes.filter((o) => o.inStrip);
}

export type TableBlock = Extract<BlockPublished, { type: "table" }>;

export interface TableRow {
  key: string;
  cells: string[];
  /** Highlighted: one of the top `highlightTop` rows, tinted with the accent. */
  top: boolean;
  /** RICE only. */
  rice?: { rank: string; item: string; score: string; inputs: string };
}

/** Parses "85%", "2 mo", "2.5" to a number; NaN when it isn't one. */
function num(cell: string | undefined): number {
  return Number.parseFloat((cell ?? "").replace(/[^0-9.-]/g, ""));
}

/**
 * The table's rows as the site shows them: scores and inputs exactly as entered, sorted by score
 * when the owner asked, and the top `highlightTop` rows marked.
 */
export function tableRows(block: TableBlock): TableRow[] {
  const rice = block.formula === "rice";
  const scoreAt = block.columns.length - 1;
  const rows = block.rows.map((cells, i) => ({ cells, i }));
  if (block.sortByScore && rice) {
    rows.sort((a, b) => (num(b.cells[scoreAt]) || 0) - (num(a.cells[scoreAt]) || 0) || a.i - b.i);
  }
  return rows.map(({ cells, i }, position) => {
    const top = block.highlightTop > 0 && position < block.highlightTop;
    const row: TableRow = { key: `${block.id}-${i}`, cells, top };
    if (rice) {
      const [rank = "", item = "", r = "", imp = "", c = "", e = "", score = ""] = cells;
      row.rice = { rank, item, score, inputs: `R ${r} · I ${imp} · C ${c} · E ${e}` };
    }
    return row;
  });
}

/** iPad and phones show the top five rows first (03 · Blocks › table). */
export const TABLE_PREVIEW_ROWS = 5;

/** "Show all nine": the row count in words up to twelve, then digits. */
export function countWord(n: number): string {
  const words = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
  ];
  return words[n] ?? String(n);
}

export interface ChapterTop {
  id: string;
  top: number;
}

/**
 * M-CHAPTER-RAIL: the current chapter is the last one whose top has passed `line` (30% of the
 * viewport). Before the first chapter reaches it, the first chapter is current.
 */
export function currentChapter(tops: readonly ChapterTop[], line: number): string | null {
  let current: string | null = tops[0]?.id ?? null;
  for (const t of tops) if (t.top <= line) current = t.id;
  return current;
}

/** M-READ-PROGRESS: progress through the article body, 0 to 1. */
export function readingProgress(top: number, height: number, viewport: number): number {
  const travel = height - viewport;
  if (travel <= 0) return top <= 0 ? 1 : 0;
  return Math.min(1, Math.max(0, -top / travel));
}

/** "Whose result" on an outcome (EditorOutcomes.dc.html), shown under it when set (02 · C5). */
export const CREDIT_LABELS: Record<NonNullable<Outcome["credit"]>, string> = {
  mine: "My ownership",
  team: "Team result",
  business: "Business outcome",
};

type HeadingBlock = Extract<BlockPublished, { type: "heading" }>;
type ListBlock = Extract<BlockPublished, { type: "list" }>;

export type BlockGroup =
  | { kind: "block"; block: BlockPublished }
  | { kind: "boxes"; id: string; boxes: { heading: HeadingBlock; list: ListBlock }[] };

/**
 * A heading directly followed by a list draws as one box: the heading as its mono label and the
 * list inside (03 · Blocks › list, the boxed variant; CaseStudy.dc.html chapter 01's
 * "Assumptions" and chapter 06's mono card headings). Neighbouring boxes share a grid.
 */
export function groupBlocks(blocks: readonly BlockPublished[]): BlockGroup[] {
  const out: BlockGroup[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const after = blocks[i + 1];
    if (block?.type === "heading" && after?.type === "list") {
      const box = { heading: block, list: after };
      const last = out.at(-1);
      if (last?.kind === "boxes") last.boxes.push(box);
      else out.push({ kind: "boxes", id: block.id, boxes: [box] });
      i += 1;
    } else if (block) {
      out.push({ kind: "block", block });
    }
  }
  return out;
}

/** The empty cells of a hairline card grid's last row go to its last card, so no gap shows. */
export function lastCardSpan(count: number, columns: number): number {
  if (count <= 0 || columns <= 1) return 1;
  return columns - ((count - 1) % columns);
}
