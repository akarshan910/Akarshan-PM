/**
 * The work list (03 · Work list: /work, WorkScale.dc.html › "the work page"): every published,
 * listed project as one dense row, with filters, search, sort and paging. Plain functions, so the
 * prerender and the browser agree, and the URL holds the whole state.
 *
 * The rows carry public card data only (10 · Security gates): no story, no evidence, nothing a
 * draft could add.
 */
import type { PublicContent } from "./content-source";
import type { ResultType } from "./types";
import { publicSections, volumes } from "./site";

export interface WorkRow {
  slug: string;
  /** Two-digit volume number; listed projects on a visible shelf always have one. */
  volume?: string;
  title: string;
  summary: string;
  company: string;
  topics: string[];
  /** The first visible shelf the project is on. */
  shelf?: { id: string; name: string };
  /** `headlineOutcomeId`'s value and result label (03 · Work list › Headline). */
  headline?: { value: string; type: ResultType };
  /** Every result label the project's outcomes carry, for the Label filter. */
  labels: ResultType[];
  /** `first_published_at`, for Newest. */
  firstPublishedAt: string;
}

export interface WorkShelf {
  id: string;
  name: string;
  count: number;
}

export type WorkSort = "order" | "newest" | "az";

export const WORK_SORTS: { value: WorkSort; label: string }[] = [
  { value: "order", label: "Your order" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A–Z" },
];

/** The filters, search and sort. Lists are "any of"; an empty list doesn't filter. */
export interface WorkQuery {
  shelf?: string;
  company: string[];
  topic: string[];
  label: ResultType[];
  q: string;
  sort: WorkSort;
}

export const EMPTY_QUERY: WorkQuery = { company: [], topic: [], label: [], q: "", sort: "order" };

/** Rows per page: the first 24 are in the prerendered HTML, then "Load 24 more". */
export const PAGE_SIZE = 24;

const RESULT_TYPES: readonly ResultType[] = ["achieved", "target", "projected", "baseline", "output"];

/** Every published, listed project as a row, in "Your order": shelf order, then order within it. */
export function workRows(content: PublicContent): { rows: WorkRow[]; shelves: WorkShelf[] } {
  const sections = publicSections(content);
  const numbers = volumes(content, sections);
  const listed = new Map(content.projects.filter((p) => p.listed).map((p) => [p.id, p]));
  const shelfOf = new Map<string, { id: string; name: string }>();
  const order: string[] = [];
  for (const s of sections) {
    if (s.kind !== "shelf") continue;
    for (const item of s.items) {
      if (!listed.has(item.id) || shelfOf.has(item.id)) continue;
      shelfOf.set(item.id, { id: s.id, name: s.shelf?.name ?? s.header?.title ?? s.id });
      order.push(item.id);
    }
  }
  // Listed projects on no visible shelf still belong on /work, after the shelved ones.
  for (const id of listed.keys()) if (!shelfOf.has(id)) order.push(id);

  const rows = order.map((id): WorkRow => {
    const entry = listed.get(id);
    if (!entry) throw new Error(`Unknown project ${id}`);
    const { overview, outcomes, headlineOutcomeId } = entry.project;
    const head = headlineOutcomeId ? outcomes.find((o) => o.id === headlineOutcomeId) : undefined;
    const volume = numbers.get(id);
    const shelf = shelfOf.get(id);
    return {
      slug: entry.slug,
      ...(volume ? { volume } : {}),
      title: overview.title,
      summary: overview.summary,
      company: overview.company,
      topics: overview.topics,
      ...(shelf ? { shelf } : {}),
      ...(head ? { headline: { value: head.value, type: head.type } } : {}),
      labels: RESULT_TYPES.filter((t) => outcomes.some((o) => o.type === t)),
      firstPublishedAt: entry.firstPublishedAt,
    };
  });

  const shelves: WorkShelf[] = [];
  for (const row of rows) {
    if (!row.shelf) continue;
    const found = shelves.find((s) => s.id === row.shelf?.id);
    if (found) found.count += 1;
    else shelves.push({ ...row.shelf, count: 1 });
  }
  return { rows, shelves };
}

/** Lower case, without accents: "Café" and "cafe" match (03 · Search). */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchesSearch(row: WorkRow, q: string): boolean {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = fold([row.title, row.company, row.summary, ...row.topics].join(" "));
  return words.every((w) => hay.includes(w));
}

/** Applies the filters, the search and the sort. */
export function filterRows(rows: readonly WorkRow[], query: WorkQuery, ignoreShelf = false): WorkRow[] {
  const out = rows.filter(
    (r) =>
      (ignoreShelf || !query.shelf || r.shelf?.id === query.shelf) &&
      (query.company.length === 0 || query.company.includes(r.company)) &&
      (query.topic.length === 0 || r.topics.some((t) => query.topic.includes(t))) &&
      (query.label.length === 0 || r.labels.some((l) => query.label.includes(l))) &&
      matchesSearch(r, query.q),
  );
  if (query.sort === "az") {
    return out
      .map((r, i) => ({ r, i }))
      .sort((a, b) => a.r.title.localeCompare(b.r.title, "en", { sensitivity: "base" }) || a.i - b.i)
      .map(({ r }) => r);
  }
  if (query.sort === "newest") {
    return out
      .map((r, i) => ({ r, i }))
      .sort((a, b) => b.r.firstPublishedAt.localeCompare(a.r.firstPublishedAt) || a.i - b.i)
      .map(({ r }) => r);
  }
  return out;
}

/** Shelf chip counts under the other filters: "All N", then "Shipped 4"… */
export function shelfCounts(
  rows: readonly WorkRow[],
  shelves: readonly WorkShelf[],
  query: WorkQuery,
): { all: number; shelves: WorkShelf[] } {
  const pool = filterRows(rows, query, true);
  return {
    all: pool.length,
    shelves: shelves.map((s) => ({ ...s, count: pool.filter((r) => r.shelf?.id === s.id).length })),
  };
}

/** The distinct companies and topics, for the dropdowns, in first-seen order. */
export function facets(rows: readonly WorkRow[]): {
  companies: string[];
  topics: string[];
  labels: ResultType[];
} {
  const companies = [...new Set(rows.map((r) => r.company).filter(Boolean))];
  const topics = [...new Set(rows.flatMap((r) => r.topics))];
  const labels = RESULT_TYPES.filter((t) => rows.some((r) => r.labels.includes(t)));
  return { companies, topics, labels };
}

/** Reads the state from the address: `?shelf=strategy&topic=Games&label=target&q=rice&sort=az`. */
export function parseWorkQuery(search: string | URLSearchParams): WorkQuery {
  const p = typeof search === "string" ? new URLSearchParams(search) : search;
  const sort = p.get("sort");
  const shelf = p.get("shelf");
  return {
    ...(shelf ? { shelf } : {}),
    company: p.getAll("company").filter(Boolean),
    topic: p.getAll("topic").filter(Boolean),
    label: p.getAll("label").filter((l): l is ResultType => RESULT_TYPES.includes(l as ResultType)),
    q: p.get("q") ?? "",
    sort: sort === "newest" || sort === "az" ? sort : "order",
  };
}

/** Writes the state back, leaving defaults out. Keeps other parameters (`moved`, `qa`) as they are. */
export function workQueryString(query: WorkQuery, keep?: URLSearchParams): string {
  const p = new URLSearchParams();
  if (keep) {
    for (const [k, v] of keep) {
      if (!["shelf", "company", "topic", "label", "q", "sort"].includes(k)) p.append(k, v);
    }
  }
  if (query.shelf) p.set("shelf", query.shelf);
  for (const c of query.company) p.append("company", c);
  for (const t of query.topic) p.append("topic", t);
  for (const l of query.label) p.append("label", l);
  if (query.q.trim()) p.set("q", query.q);
  if (query.sort !== "order") p.set("sort", query.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** How many filters are set, for "Filters (n)" on phones. The search and sort don't count. */
export function activeFilterCount(query: WorkQuery): number {
  return (query.shelf ? 1 : 0) + query.company.length + query.topic.length + query.label.length;
}

/** "Load 24 more", or fewer on the last page. 0 when everything shows. */
export function nextPageCount(shown: number, total: number): number {
  return Math.max(0, Math.min(PAGE_SIZE, total - shown));
}

/** The result labels as the filter names them. */
export const LABEL_NAMES: Record<ResultType, string> = {
  achieved: "Achieved",
  target: "Target",
  projected: "Projected",
  baseline: "Baseline",
  output: "Output",
};

export interface ActiveFilterPart {
  /** The query with this one filter removed. */
  without: WorkQuery;
  /** As shown on the chip: "Strategy", "Label: Achieved", “roadmap”. */
  label: string;
  kind: "shelf" | "filter" | "search";
}

/** The active filters as removable chips (PublicStates › No results on /work). */
export function activeFilters(query: WorkQuery, shelves: readonly WorkShelf[]): ActiveFilterPart[] {
  const out: ActiveFilterPart[] = [];
  if (query.shelf) {
    const { shelf: _shelf, ...without } = query;
    const name = shelves.find((s) => s.id === query.shelf)?.name ?? query.shelf;
    out.push({ without, label: name, kind: "shelf" });
  }
  const list = (key: "company" | "topic", title: string) => {
    for (const v of query[key]) {
      out.push({
        without: { ...query, [key]: query[key].filter((x) => x !== v) },
        label: `${title}: ${v}`,
        kind: "filter",
      });
    }
  };
  list("company", "Company");
  list("topic", "Topic");
  for (const l of query.label) {
    out.push({
      without: { ...query, label: query.label.filter((x) => x !== l) },
      label: `Label: ${LABEL_NAMES[l]}`,
      kind: "filter",
    });
  }
  if (query.q.trim())
    out.push({ without: { ...query, q: "" }, label: `“${query.q.trim()}”`, kind: "search" });
  return out;
}

const either = (items: readonly string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} or ${items.at(-1) ?? ""}`;

/** One sentence naming what was asked for: "Nothing in Strategy is labelled Achieved and mentions “roadmap”." */
export function noResultsMessage(query: WorkQuery, shelves: readonly WorkShelf[]): string {
  const where = query.shelf ? ` in ${shelves.find((s) => s.id === query.shelf)?.name ?? query.shelf}` : "";
  const clauses = [
    query.company.length > 0 && `is from ${either(query.company)}`,
    query.topic.length > 0 && `is about ${either(query.topic)}`,
    query.label.length > 0 && `is labelled ${either(query.label.map((l) => LABEL_NAMES[l]))}`,
    query.q.trim() !== "" && `mentions “${query.q.trim()}”`,
  ].filter((c): c is string => typeof c === "string");
  if (clauses.length === 0) return `Nothing${where} matches.`;
  return `Nothing${where} ${clauses.join(" and ")}.`;
}
