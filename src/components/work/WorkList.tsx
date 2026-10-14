/**
 * The work list (03 · Work list, WorkScale.dc.html › "Laptop · the work page" and "Mobile · the
 * work page"; the empty result is PublicStates.dc.html › "No results on /work"). Controlled: the
 * page keeps the query in the address and passes it in.
 *
 * Laptop and iPad: shelf chips with counts (`aria-pressed`), the Company, Topic and Label
 * dropdowns, search and sort above a dense list. Phones: "All work · N" and "Filters (n)", which
 * opens a bottom sheet with every filter and "Clear filters" at its foot. 24 rows at a time.
 */
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import {
  activeFilterCount,
  activeFilters,
  EMPTY_QUERY,
  facets,
  filterRows,
  LABEL_NAMES,
  nextPageCount,
  noResultsMessage,
  PAGE_SIZE,
  shelfCounts,
  WORK_SORTS,
  type WorkQuery,
  type WorkRow,
  type WorkShelf,
  type WorkSort,
} from "~/lib/work-list";
import { useReveal } from "~/motion/reveal";

import { cx } from "../cx";
import { Icon } from "../icons";
import { ResultLabel } from "../labels/ResultLabel";
import { useModal } from "../media/useModal";
import { MovedNote } from "../states/MovedNote";
import { NoResults } from "../states/NoResults";
import { FilterGroup, FilterMenu, type FilterOption } from "./FilterMenu";
import styles from "./WorkList.module.css";

/** The search waits this long after the last key press (03 · Work list › Search). */
export const SEARCH_DEBOUNCE_MS = 150;

interface WorkListProps {
  rows: WorkRow[];
  shelves: WorkShelf[];
  query: WorkQuery;
  onChange: (query: WorkQuery) => void;
  /** `?moved=1`: the note above the list. */
  moved?: boolean;
  onDismissMoved?: () => void;
}

const volumesLabel = (n: number) => `${n} ${n === 1 ? "volume" : "volumes"}`;

export function WorkList({ rows, shelves, query, onChange, moved, onDismissMoved }: WorkListProps) {
  const filtered = useMemo(() => filterRows(rows, query), [rows, query]);
  const counts = useMemo(() => shelfCounts(rows, shelves, query), [rows, shelves, query]);
  const options = useMemo(() => {
    const f = facets(rows);
    const plain = (v: string): FilterOption => ({ value: v, label: v });
    return {
      company: f.companies.map(plain),
      topic: f.topics.map(plain),
      label: f.labels.map((l): FilterOption => ({ value: l, label: LABEL_NAMES[l] })),
    };
  }, [rows]);

  // Paging restarts at 24 whenever the query changes.
  const key = JSON.stringify(query);
  const [paging, setPaging] = useState({ key, limit: PAGE_SIZE });
  const limit = paging.key === key ? paging.limit : PAGE_SIZE;
  const shown = filtered.slice(0, limit);
  const more = nextPageCount(shown.length, filtered.length);
  const firstNew = useRef<number | null>(null);
  const list = useReveal<HTMLUListElement>({ blocks: ":scope > li" });
  useEffect(() => {
    if (firstNew.current === null) return;
    list.current?.querySelectorAll<HTMLAnchorElement>("a")[firstNew.current]?.focus();
    firstNew.current = null;
  }, [limit, list]);

  // The search box types freely; the query follows 150ms after the last key.
  const [text, setText] = useState({ q: query.q, value: query.q });
  const value = text.q === query.q ? text.value : query.q;
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef({ query, onChange });
  useEffect(() => {
    latest.current = { query, onChange };
  });
  useEffect(
    () => () => {
      clearTimeout(pending.current);
    },
    [],
  );
  const search = (next: string) => {
    setText({ q: query.q, value: next });
    clearTimeout(pending.current);
    pending.current = setTimeout(() => {
      // Merge into the query as it is by then: another filter may have changed meanwhile.
      latest.current.onChange({ ...latest.current.query, q: next });
    }, SEARCH_DEBOUNCE_MS);
  };

  const [sheetOpen, setSheetOpen] = useState(false);

  const set = (patch: Partial<WorkQuery>) => {
    onChange({ ...query, ...patch });
  };
  const clear = () => {
    clearTimeout(pending.current);
    onChange({ ...EMPTY_QUERY, sort: query.sort });
  };
  const chips = activeFilters(query, shelves);
  const searchId = useId();
  const sortId = useId();

  const shelfChips = (
    <>
      <button
        type="button"
        className={styles.fc}
        aria-pressed={!query.shelf}
        onClick={() => {
          const { shelf: _shelf, ...rest } = query;
          onChange(rest);
        }}
      >
        All {counts.all}
      </button>
      {counts.shelves.map((s) => (
        <button
          key={s.id}
          type="button"
          className={styles.fc}
          aria-pressed={query.shelf === s.id}
          onClick={() => {
            set({ shelf: s.id });
          }}
        >
          {s.name} {s.count}
        </button>
      ))}
    </>
  );

  const sortSelect = (id: string) => (
    <span className={styles.sortWrap}>
      <label htmlFor={id} className="sr-only">
        Sort
      </label>
      <select
        id={id}
        className={cx(styles.fc, styles.sort)}
        value={query.sort}
        onChange={(e) => {
          set({ sort: e.target.value as WorkSort });
        }}
      >
        {WORK_SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <span className={styles.caret} aria-hidden="true">
        ▾
      </span>
    </span>
  );

  const searchBox = (id: string, className?: string) => (
    <span className={className}>
      <label htmlFor={id} className="sr-only">
        Search work
      </label>
      <input
        id={id}
        type="search"
        className={styles.search}
        placeholder="Search work"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          search(e.target.value);
        }}
      />
    </span>
  );

  return (
    <div className={styles.root}>
      {moved ? (
        <div className={styles.moved}>
          <MovedNote kind="project" {...(onDismissMoved ? { onDismiss: onDismissMoved } : {})} />
        </div>
      ) : null}

      <div className={styles.head}>
        <div className={cx("mono", styles.kicker)}>All work</div>
        <h1 className={styles.title}>
          <span className={styles.laptopOnly}>{volumesLabel(rows.length)}</span>
          <span className={styles.phoneOnly}>All work · {rows.length}</span>
        </h1>
        <button
          type="button"
          className={cx(styles.fc, styles.filtersButton)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => {
            setSheetOpen(true);
          }}
        >
          Filters ({activeFilterCount(query)})
        </button>
      </div>

      <div className={styles.controls} role="group" aria-label="Filter and sort">
        {shelfChips}
        <span className={styles.sep} aria-hidden="true" />
        <FilterMenu
          label="Company"
          options={options.company}
          selected={query.company}
          onChange={(company) => {
            set({ company });
          }}
        />
        <FilterMenu
          label="Topic"
          options={options.topic}
          selected={query.topic}
          onChange={(topic) => {
            set({ topic });
          }}
        />
        <FilterMenu
          label="Label"
          options={options.label}
          selected={query.label}
          onChange={(label) => {
            set({ label: label as WorkQuery["label"] });
          }}
        />
        {searchBox(searchId, styles.searchWrap)}
        {sortSelect(sortId)}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <NoResults
            filters={chips.map((c, i) => ({
              id: `${c.kind}-${i}`,
              label: c.label,
              kind: c.kind,
              onRemove: () => {
                onChange(c.without);
              },
            }))}
            message={noResultsMessage(query, shelves)}
            onClear={clear}
            {...(query.q.trim()
              ? {
                  onKeepSearch: () => {
                    onChange({ ...EMPTY_QUERY, q: query.q, sort: query.sort });
                  },
                }
              : {})}
          />
        </div>
      ) : (
        <div className={styles.table}>
          <div className={cx(styles.row, styles.rowHead)} aria-hidden="true">
            <span>Vol</span>
            <span>Project</span>
            <span className={styles.company}>Company</span>
            <span className={styles.shelf}>Shelf</span>
            <span className={styles.headline}>Headline</span>
          </div>
          <ul ref={list} className={styles.list}>
            {shown.map((r) => (
              <li key={r.slug}>
                <Link className={styles.row} to={`/work/${r.slug}`}>
                  <span className={styles.vol}>
                    {r.volume ? (
                      <>
                        <span className={styles.laptopOnly}>VOL.</span>
                        <span className={styles.phoneOnly}>
                          <span className="sr-only">Volume </span>
                        </span>
                        {r.volume}
                      </>
                    ) : null}
                  </span>
                  <span className={styles.name}>{r.title}</span>
                  <span className={styles.company}>{r.company}</span>
                  <span className={styles.shelf}>{r.shelf?.name}</span>
                  <span className={styles.headline}>
                    {r.headline ? (
                      <>
                        <span className={styles.value}>{r.headline.value}</span>
                        <ResultLabel type={r.headline.type} className={styles.tag} />
                      </>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.foot}>
        <span className={styles.count} aria-live="polite">
          Showing {shown.length} of {filtered.length}
        </span>
        {more > 0 ? (
          <button
            type="button"
            className={styles.more}
            onClick={() => {
              firstNew.current = shown.length;
              setPaging({ key, limit: limit + PAGE_SIZE });
            }}
          >
            Load {more} more
          </button>
        ) : null}
      </div>

      {sheetOpen ? (
        <FilterSheet
          onClose={() => {
            setSheetOpen(false);
          }}
        >
          {searchBox(`${searchId}-sheet`, styles.sheetSearch)}
          <fieldset className={styles.group}>
            <legend className={styles.groupLabel}>Shelf</legend>
            <div className={styles.chipRow}>{shelfChips}</div>
          </fieldset>
          <FilterGroup
            label="Company"
            options={options.company}
            selected={query.company}
            onChange={(company) => {
              set({ company });
            }}
          />
          <FilterGroup
            label="Topic"
            options={options.topic}
            selected={query.topic}
            onChange={(topic) => {
              set({ topic });
            }}
          />
          <FilterGroup
            label="Label"
            options={options.label}
            selected={query.label}
            onChange={(label) => {
              set({ label: label as WorkQuery["label"] });
            }}
          />
          <div className={styles.group}>
            <span className={styles.groupLabel} aria-hidden="true">
              Sort
            </span>
            {sortSelect(`${sortId}-sheet`)}
          </div>
          <div className={styles.sheetFoot}>
            <button type="button" className={styles.more} onClick={clear}>
              Clear filters
            </button>
          </div>
        </FilterSheet>
      ) : null}
    </div>
  );
}

/** Phones: every filter in a bottom sheet (03 · Work list › Phones). Esc or ✕ closes it. */
function FilterSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useModal(ref, true, onClose, close);
  // A tap outside the sheet closes it.
  useEffect(() => {
    function onDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) closeRef.current();
    }
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);
  return (
    <div className={styles.backdrop}>
      <div
        ref={ref}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.sheetHead}>
          <h2 id={titleId} className={styles.sheetTitle}>
            Filters
          </h2>
          <button
            ref={close}
            type="button"
            className={styles.sheetClose}
            aria-label="Close filters"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className={styles.sheetBody}>{children}</div>
      </div>
    </div>
  );
}
