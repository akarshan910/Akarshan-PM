/**
 * Projects (05 · Projects; StudioProjects: default, dragging, layout changed, menu open, delete
 * confirm, filtered, no results, loading, error; StudioMobile › Projects).
 *
 * The order here is the homepage order: reordering edits the draft layout, and nothing goes live
 * until "Publish layout". Rows are cards on phones, where "Reorder" switches to ↑ ↓ buttons.
 */
import * as Menu from "@radix-ui/react-dropdown-menu";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router";

import { cx } from "../../cx";
import buttons from "../Button.module.css";
import { Dialog } from "../Dialog";
import { StudioIcon } from "../StudioIcon";
import { relative, thumbBackground } from "~/lib/studio/format";
import {
  counts,
  listGroups,
  type ListFilter,
  type ListGroup,
  type ListRow,
} from "~/lib/studio/projects-list";
import type { ProjectRow } from "~/lib/studio/repo";
import type { SiteLayout } from "~/lib/types";
import styles from "./ProjectsList.module.css";

export interface ProjectsListProps {
  layout: SiteLayout;
  rows: ProjectRow[];
  now: Date;
  layoutChanged: boolean;
  publishing: boolean;
  onMove: (shelfId: string, projectId: string, to: number) => void;
  onStar: (shelfId: string, projectId: string) => void;
  onDuplicate: (row: ProjectRow, shelfId: string) => void;
  onUnpublish: (row: ProjectRow) => void;
  onDelete: (row: ProjectRow) => void;
  onDiscard: () => void;
  onPublishLayout: () => void;
  onNewProject: (shelfId?: string) => void;
  /** The live region's message. */
  announce: (message: string) => void;
}

const GRIP = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
    {[6, 12, 18].map((y) => (
      <g key={y}>
        <circle cx="9" cy={y} r="1.6" />
        <circle cx="15" cy={y} r="1.6" />
      </g>
    ))}
  </svg>
);
const MORE = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);
const STAR = "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z";
const UNPUBLISH =
  "M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-2.8 3.6M6.6 6.6A17 17 0 002 12s3.6 7 10 7a9.6 9.6 0 004.4-1";

function Ico({ d }: { d: string }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function ProjectsList(props: ProjectsListProps) {
  const { layout, rows, now, layoutChanged, publishing, announce } = props;
  const [filter, setFilter] = useState<ListFilter>("all");
  const [query, setQuery] = useState("");
  const [drag, setDrag] = useState<{ shelf: string; id: string } | null>(null);
  const [moved, setMoved] = useState<{ id: string; flip: number } | null>(null);
  const [reorder, setReorder] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirm, setConfirm] = useState<ProjectRow | null>(null);
  const focusAfter = useRef<string | null>(null);

  const groups = listGroups(layout, rows, filter, query);
  const c = counts(rows);
  const filtering = filter !== "all" || query.trim() !== "";
  const anyShown = groups.some((g) => g.rows.length > 0);

  // Keep keyboard focus on the handle that just moved.
  useEffect(() => {
    if (!focusAfter.current) return;
    document.querySelector<HTMLButtonElement>(`[data-handle="${focusAfter.current}"]`)?.focus();
    focusAfter.current = null;
  });

  useEffect(() => {
    if (!drag) return;
    const end = () => {
      const g = groups.find((x) => x.id === drag.shelf);
      const r = g?.rows.find((x) => x.row.id === drag.id);
      if (g && r) announce(`${r.title} moved to position ${r.position} on ${g.name}.`);
      setMoved((m) => ({ id: drag.id, flip: (m?.flip ?? 0) + 1 }));
      setDrag(null);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [drag, groups, announce]);

  const move = (g: ListGroup, r: ListRow, to: number, focus: boolean) => {
    if (filtering) {
      announce("Reordering is paused while a filter or search is on.");
      return;
    }
    if (to < 0 || to >= g.total) return;
    props.onMove(g.id, r.row.id, to);
    setMoved((m) => ({ id: r.row.id, flip: (m?.flip ?? 0) + 1 }));
    if (focus) focusAfter.current = r.row.id;
    announce(`${r.title}, position ${to + 1} of ${g.total} on ${g.name}.`);
  };

  const onHandleKey = (g: ListGroup, r: ListRow) => (e: KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    move(g, r, r.position - 1 + (e.key === "ArrowUp" ? -1 : 1), true);
  };

  const star = (g: ListGroup, r: ListRow) => {
    if (r.lead || r.position === 1) {
      announce(`${r.title} is already the lead card. Star another project to replace it.`);
      return;
    }
    props.onStar(g.id, r.row.id);
    setMoved((m) => ({ id: r.row.id, flip: (m?.flip ?? 0) + 1 }));
    announce(`${r.title} moved to the top. It is now the lead card on ${g.name}.`);
  };

  const clearAll = () => {
    setFilter("all");
    setQuery("");
  };

  return (
    <>
      <header className={styles.appbar}>
        <h1 className={styles.appTitle}>Projects</h1>
        <button
          type="button"
          className="ib"
          aria-label="Search"
          aria-expanded={searchOpen}
          aria-controls="project-search"
          onClick={() => {
            // On phones the field opens from here (StudioMobile); it's always shown on larger screens.
            setSearchOpen(true);
            requestAnimationFrame(() => document.getElementById("project-search")?.focus());
          }}
        >
          <StudioIcon name="search" />
        </button>
        <button
          type="button"
          className={cx(buttons.cta, styles.newIcon)}
          aria-label="New project"
          onClick={() => {
            props.onNewProject();
          }}
        >
          <StudioIcon name="plus" />
        </button>
      </header>
      <main className={styles.main}>
        <div className={styles.top}>
          <div>
            <div className="mono">
              <Link to="/studio">Studio</Link> / Projects
            </div>
            <h1 className={styles.h1}>Projects</h1>
            <p className={styles.lede}>
              This order is your homepage order. Drag a row, or focus its handle and use the arrow keys.{" "}
              <Link to="/studio/website" className={cx(styles.u, "t44")}>
                Arrange the whole homepage in Website →
              </Link>
            </p>
          </div>
          <button
            type="button"
            className={buttons.cta}
            onClick={() => {
              props.onNewProject();
            }}
          >
            <StudioIcon name="plus" size={16} />
            New project
          </button>
        </div>

        <div className={styles.tools}>
          <div className="seg" role="group" aria-label="Filter projects">
            {(
              [
                ["all", `All ${c.all}`],
                ["published", `Published ${c.published}`],
                ["drafts", `Drafts ${c.drafts}`],
              ] as const
            ).map(([f, label]) => (
              <button
                key={f}
                type="button"
                className="t44"
                aria-pressed={filter === f}
                onClick={() => {
                  setFilter(f);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <label className={cx(styles.search, "t44")} data-open={searchOpen || query !== "" || undefined}>
            <span className="sr-only">Search projects</span>
            <StudioIcon name="search" className={cx("ico", styles.searchIco)} />
            <input
              id="project-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              onBlur={() => {
                if (!query) setSearchOpen(false);
              }}
              placeholder="Search by title or company"
            />
          </label>
          {filtering ? (
            <div className={styles.paused}>
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
                <circle cx="12" cy="12" r="9" />
                <path d="M10 9v6M14 9v6" />
              </svg>
              Reordering is paused while a filter or search is on.
              <button type="button" onClick={clearAll}>
                Show all
              </button>
            </div>
          ) : null}
        </div>

        {layoutChanged ? (
          <div className={styles.bar} role="region" aria-label="Unpublished layout changes">
            <span className={styles.barDot} />
            <span className={styles.barText}>
              <span className={styles.barTitle}>Homepage layout changed, not live yet</span>
              <span className={styles.barSub}>Publishing updates the homepage only. Drafts stay drafts.</span>
            </span>
            <button type="button" className={styles.discard} onClick={props.onDiscard} disabled={publishing}>
              Discard
            </button>
            <button
              type="button"
              className={buttons.cta}
              aria-busy={publishing}
              onClick={props.onPublishLayout}
            >
              {publishing ? <span className={styles.spin} aria-hidden="true" /> : null}
              {publishing ? "Publishing…" : "Publish layout"}
            </button>
          </div>
        ) : null}

        {groups.map((g, gi) =>
          filtering && g.rows.length === 0 && !anyShown ? null : (
            <section key={g.id} aria-labelledby={`shelf-${g.id}`}>
              <div className={cx(styles.groupHead, gi > 0 && styles.groupHeadNext)}>
                <div className={styles.groupName}>
                  <h2 id={`shelf-${g.id}`} className={styles.h2}>
                    {g.name}
                  </h2>
                  <span className="mono">{g.total} on this shelf</span>
                  <span className={styles.phoneCount}>{g.total}</span>
                </div>
                <Link to="/studio/website" className={cx(styles.editShelf, "t44")}>
                  Edit shelf in Website
                </Link>
                <button
                  type="button"
                  className={cx(styles.reorderBtn, "t44")}
                  aria-pressed={reorder === g.id}
                  onClick={() => {
                    setReorder(reorder === g.id ? null : g.id);
                  }}
                >
                  {reorder === g.id ? "Done" : "Reorder"}
                </button>
              </div>
              <div
                className={cx("card", styles.list)}
                role="list"
                aria-label={`${g.name} projects, in homepage order`}
              >
                <div className={styles.hd} aria-hidden="true">
                  <span />
                  <span>#</span>
                  <span />
                  <span>Project</span>
                  <span>Status</span>
                  <span>Lead</span>
                  <span>Updated</span>
                  <span />
                </div>
                {g.rows.map((r) => {
                  const dragging = drag?.id === r.row.id;
                  const flash =
                    moved?.id === r.row.id && !dragging ? (moved.flip % 2 ? "flashA" : "flashB") : "";
                  return (
                    <div
                      key={r.row.id}
                      role="listitem"
                      className={cx(styles.prow, flash, dragging && styles.dragging)}
                      onPointerEnter={() => {
                        if (drag && drag.shelf === g.id && drag.id !== r.row.id) {
                          const from = g.rows.find((x) => x.row.id === drag.id);
                          if (from) props.onMove(g.id, drag.id, r.position - 1);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className={cx("ib", styles.handle)}
                        data-handle={r.row.id}
                        aria-label={`Move ${r.title}`}
                        aria-describedby="reorder-help"
                        aria-disabled={filtering}
                        onPointerDown={(e) => {
                          if (filtering || e.button !== 0) return;
                          e.preventDefault();
                          setDrag({ shelf: g.id, id: r.row.id });
                        }}
                        onKeyDown={onHandleKey(g, r)}
                      >
                        {GRIP}
                      </button>
                      <span className={styles.pos}>{r.position}</span>
                      <span
                        aria-hidden="true"
                        className={styles.thumb}
                        style={{ background: thumbBackground(r.row.draft.visuals.accent) }}
                      />
                      <Link
                        to={`/studio/projects/${r.row.id}/overview`}
                        className={cx(styles.titleCell, "t44")}
                      >
                        <span className={styles.title}>{r.title}</span>
                        <span className={styles.sub}>{r.sub}</span>
                        <span className={styles.phoneStatus}>
                          <StatusChips r={r} small />
                          <span className={styles.phoneWhen}>
                            {r.status === "draft" ? `${r.percent}% ready` : relative(r.row.updatedAt, now)}
                          </span>
                        </span>
                      </Link>
                      <span className={styles.status}>
                        <StatusChips r={r} />
                      </span>
                      <span className={styles.lead}>
                        <button
                          type="button"
                          className="ib"
                          aria-pressed={r.lead}
                          aria-label={`Lead card: ${r.title}`}
                          title={
                            r.lead ? "Lead card: first on its shelf" : "Move to the top as the lead card"
                          }
                          style={{ color: r.lead ? "#D61F33" : "#6A6A72" }}
                          onClick={() => {
                            star(g, r);
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            aria-hidden="true"
                            style={{
                              fill: r.lead ? "#D61F33" : "none",
                              stroke: "currentColor",
                              strokeWidth: 1.75,
                              strokeLinejoin: "round",
                            }}
                          >
                            <path d={STAR} />
                          </svg>
                        </button>
                      </span>
                      <span className={styles.updated}>{relative(r.row.updatedAt, now)}</span>
                      {reorder === g.id ? (
                        <span className={styles.arrows}>
                          <button
                            type="button"
                            className="ib"
                            aria-label={`Move ${r.title} up`}
                            disabled={r.position === 1 || filtering}
                            onClick={() => {
                              move(g, r, r.position - 2, false);
                            }}
                          >
                            <StudioIcon name="up" />
                          </button>
                          <button
                            type="button"
                            className="ib"
                            aria-label={`Move ${r.title} down`}
                            disabled={r.position === g.total || filtering}
                            onClick={() => {
                              move(g, r, r.position, false);
                            }}
                          >
                            <StudioIcon name="down" />
                          </button>
                        </span>
                      ) : (
                        <RowMenu
                          r={r}
                          onDuplicate={() => {
                            props.onDuplicate(r.row, g.id);
                          }}
                          onUnpublish={() => {
                            props.onUnpublish(r.row);
                          }}
                          onDelete={() => {
                            setConfirm(r.row);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
                {g.rows.length === 0 ? (
                  <div className={styles.emptyShelf}>
                    {filtering ? "Nothing on this shelf matches." : "No projects on this shelf yet."}
                  </div>
                ) : null}
              </div>
            </section>
          ),
        )}

        {filtering && !anyShown ? (
          <div className={cx("card", styles.none)}>
            <h2 className={styles.noneTitle}>
              {query.trim() ? `No projects match “${query.trim()}”` : "No projects match"}
            </h2>
            <p className={styles.noneText}>Try a company name, like SugarFit or Zynga.</p>
            <button type="button" className={buttons.btn} onClick={clearAll} style={{ marginTop: 18 }}>
              Clear search
            </button>
          </div>
        ) : null}

        <p id="reorder-help" className={styles.help}>
          <span>
            <span style={{ color: "var(--ac)" }}>★</span> The first project on a shelf is its large lead card.
            Star another to move it to the top.
          </span>
          <span>Drafts keep their place but stay hidden until published.</span>
          <span>Focus a handle and press ↑ or ↓ to move a project.</span>
        </p>
      </main>

      <Dialog
        open={confirm !== null}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
        icon={<Ico d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />}
        iconTone="err"
        title={`Delete “${confirm?.draft.overview.title || "Untitled project"}”?`}
        description={
          confirm?.published
            ? `It comes off the live site straight away and its link, /work/${confirm.publishedSlug ?? confirm.slug}, stops working. Its images and videos stay in your media library.`
            : "It has never been published, so the live site doesn’t change. Its images and videos stay in your media library."
        }
        confirmLabel="Delete project"
        confirmVariant="danger"
        footerStart={
          confirm?.published ? (
            <button
              type="button"
              className={buttons.link}
              onClick={() => {
                const row = confirm;
                setConfirm(null);
                props.onUnpublish(row);
              }}
            >
              Unpublish instead
            </button>
          ) : undefined
        }
        onConfirm={() => {
          if (confirm) props.onDelete(confirm);
          setConfirm(null);
        }}
      />
    </>
  );
}

function StatusChips({ r, small }: { r: ListRow; small?: boolean }) {
  const sm = small ? styles.chipSm : "";
  return (
    <>
      {r.status !== "draft" && !small ? (
        <span className={cx("chip", styles.live)}>
          <span className={styles.liveDot} />
          Published
        </span>
      ) : null}
      {r.status === "published" && small ? (
        <span className={cx("chip", sm, styles.live)}>Published</span>
      ) : null}
      {r.status === "edits" ? <span className={cx("chip", sm, styles.edits)}>Edits not live</span> : null}
      {r.status === "draft" ? (
        <>
          <span className={cx("chip", sm, styles.draft)}>Draft</span>
          {small ? null : <span className={styles.ready}>{r.percent}% ready</span>}
        </>
      ) : null}
    </>
  );
}

function RowMenu({
  r,
  onDuplicate,
  onUnpublish,
  onDelete,
}: {
  r: ListRow;
  onDuplicate: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  const id = r.row.id;
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <button type="button" className="ib" aria-label={`Actions for ${r.title}`}>
          {MORE}
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          className={cx("st", styles.menu)}
          align="end"
          sideOffset={4}
          aria-label={`Actions for ${r.title}`}
        >
          <Menu.Item asChild className={styles.mi}>
            <Link to={`/studio/projects/${id}/overview`}>
              <Ico d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
              Edit
            </Link>
          </Menu.Item>
          <Menu.Item asChild className={styles.mi}>
            <Link to={`/studio/preview/project/${id}`}>
              <Ico d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z" />
              Preview draft
            </Link>
          </Menu.Item>
          <Menu.Item className={styles.mi} onSelect={onDuplicate}>
            <Ico d="M8 8h12v12H8zM4 16V4h12" />
            Duplicate as draft
          </Menu.Item>
          {r.status === "published" ? (
            <Menu.Item className={styles.mi} onSelect={onUnpublish}>
              <Ico d={UNPUBLISH} />
              Unpublish
            </Menu.Item>
          ) : null}
          {r.status === "edits" ? (
            <>
              <Menu.Item asChild className={styles.mi}>
                <Link to={`/studio/projects/${id}/overview?publish=1`}>
                  <Ico d="M12 19V5M5 12l7-7 7 7" />
                  Review and publish
                </Link>
              </Menu.Item>
              <Menu.Item className={styles.mi} onSelect={onUnpublish}>
                <Ico d={UNPUBLISH} />
                Unpublish
              </Menu.Item>
            </>
          ) : null}
          {r.status === "draft" ? (
            r.missing > 0 ? (
              <Menu.Item
                className={styles.mi}
                disabled
                aria-disabled="true"
                style={{ alignItems: "flex-start" }}
              >
                <Ico d="M12 19V5M5 12l7-7 7 7" />
                <span>
                  Publish
                  <span className={styles.miss}>
                    {r.missing} required {r.missing === 1 ? "field" : "fields"} missing
                  </span>
                </span>
              </Menu.Item>
            ) : (
              <Menu.Item asChild className={styles.mi}>
                <Link to={`/studio/projects/${id}/overview?publish=1`}>
                  <Ico d="M12 19V5M5 12l7-7 7 7" />
                  Publish
                </Link>
              </Menu.Item>
            )
          ) : null}
          <div className={styles.sep} />
          <Menu.Item className={cx(styles.mi, styles.danger)} onSelect={onDelete}>
            <Ico d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            Delete…
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** StudioProjects › loading. */
export function ProjectsSkeleton() {
  const widths: [string, string][] = [
    ["60%", "36%"],
    ["52%", "30%"],
    ["64%", "40%"],
    ["48%", "28%"],
  ];
  return (
    <main className={styles.main}>
      <div className="shim" style={{ width: 160, height: 30 }} />
      <div
        className="card"
        style={{ marginTop: 24, padding: "8px 0" }}
        aria-busy="true"
        aria-label="Loading projects"
      >
        {widths.map(([a, b], i) => (
          <div key={i} className={styles.skRow}>
            <div className="shim" style={{ height: 18 }} />
            <div className="shim" style={{ height: 42 }} />
            <div>
              <div className="shim" style={{ width: a, height: 14 }} />
              <div className="shim" style={{ marginTop: 8, width: b, height: 12 }} />
            </div>
            <div className="shim" style={{ height: 22 }} />
            <div className="shim" style={{ height: 14 }} />
          </div>
        ))}
      </div>
    </main>
  );
}
