/**
 * The builder's outline (StudioSite `.tr` rows): the pinned Navigation row, then every section in
 * page order with its handle, chevron, name and chips, "live/total" and eye; open sections list
 * their items the same way. Handles drag, or move one place with ↑ ↓ (the hero stays first and the
 * footer last); a moved row flashes (M-ST-FLASH).
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { cx } from "../../cx";
import buttons from "../Button.module.css";
import { StudioIcon } from "../StudioIcon";
import styles from "./Website.module.css";
import type { SiteLayout } from "~/lib/types";
import {
  navLinks,
  outlineKids,
  pinned,
  sectionCount,
  sectionName,
  sectionNote,
  type Ctx,
  type OutlineKid,
  type Section,
} from "~/lib/studio/website";

export type Sel = { kind: "nav" } | { kind: "sec"; id: string } | { kind: "kid"; p: string; id: string };

const GRIP = (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor">
    {[6, 12, 18].map((y) => (
      <g key={y}>
        <circle cx="9" cy={y} r="1.6" />
        <circle cx="15" cy={y} r="1.6" />
      </g>
    ))}
  </svg>
);

const EyeOn = (
  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 17, height: 17 }}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = (
  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 17, height: 17 }}>
    <path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-2.8 3.6M6.6 6.6A17 17 0 002 12s3.6 7 10 7a9.6 9.6 0 004.4-1" />
  </svg>
);

export function kidEyeTitle(s: Section, k: OutlineKid): string {
  if (k.draft) return "Publish the project first";
  if (s.kind === "shelf")
    return k.visible ? "On the homepage" : "Off the homepage. Still on /work and at its own address";
  return k.visible ? "On the site" : "Hidden";
}

interface Drag {
  kind: "sec" | "kid";
  p?: string;
  id: string;
}

export function Outline({
  layout,
  ctx,
  sel,
  open,
  moved,
  onSelect,
  onToggleOpen,
  onEyeSection,
  onEyeKid,
  onMoveSection,
  onMoveKid,
  onPlaceSection,
  onPlaceKid,
  onDragEnd,
  onAddSection,
}: {
  layout: SiteLayout;
  ctx: Ctx;
  sel: Sel;
  open: Record<string, boolean>;
  moved: { id: string; flip: number } | null;
  onSelect: (sel: Sel) => void;
  onToggleOpen: (id: string) => void;
  onEyeSection: (s: Section) => void;
  onEyeKid: (s: Section, k: OutlineKid) => void;
  onMoveSection: (s: Section, by: -1 | 1) => boolean;
  onMoveKid: (s: Section, k: OutlineKid, by: -1 | 1) => boolean;
  onPlaceSection: (id: string, index: number) => void;
  onPlaceKid: (p: string, id: string, index: number) => void;
  onDragEnd: (d: Drag) => void;
  onAddSection: () => void;
}) {
  const tree = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const focusAfter = useRef<string | null>(null);

  useEffect(() => {
    if (!drag) return;
    const end = () => {
      onDragEnd(drag);
      setDrag(null);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [drag, onDragEnd]);

  // A row moved by the keyboard keeps focus on its handle.
  useEffect(() => {
    const id = focusAfter.current;
    if (!id) return;
    focusAfter.current = null;
    tree.current?.querySelector<HTMLElement>(`[data-handle="${CSS.escape(id)}"]`)?.focus();
  });

  const shown = layout.sections.filter((s) => s.visible).length;
  const flash = (id: string) =>
    moved?.id === id && drag?.id !== id ? (moved.flip % 2 ? "flashA" : "flashB") : "";

  const secKey = (s: Section) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    if (onMoveSection(s, e.key === "ArrowUp" ? -1 : 1)) focusAfter.current = s.id;
  };
  const kidKey = (s: Section, k: OutlineKid) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    if (onMoveKid(s, k, e.key === "ArrowUp" ? -1 : 1)) focusAfter.current = `${s.id}-${k.id}`;
  };

  return (
    <section aria-labelledby="h-tree" className={styles.outline}>
      <div className={cx("card", styles.tree)} ref={tree}>
        <div className={styles.treeHead}>
          <h2 id="h-tree">Homepage</h2>
          <span>
            {shown} of {layout.sections.length} sections on
          </span>
        </div>
        <div className={cx(styles.tr, sel.kind === "nav" && styles.sel)} style={{ marginBottom: 4 }}>
          <span style={{ width: 26 }} />
          <span style={{ width: 24 }} />
          <button
            type="button"
            className={styles.tl}
            aria-current={sel.kind === "nav" || undefined}
            onClick={() => {
              onSelect({ kind: "nav" });
            }}
          >
            <span className={styles.nm}>Navigation</span>
            <span className={styles.pin}>Pinned</span>
          </button>
          <span className={styles.count}>{navLinks(layout).length} links</span>
          <span style={{ width: 32 }} />
        </div>
        {layout.sections.map((s, index) => {
          const name = sectionName(s);
          const isOpen = Boolean(open[s.id]);
          const kids = outlineKids(s, ctx);
          const note = sectionNote(s, ctx);
          const isSel = sel.kind === "sec" && sel.id === s.id;
          return (
            <div key={s.id}>
              <div
                className={cx(
                  styles.tr,
                  isSel && styles.sel,
                  flash(s.id),
                  drag?.id === s.id && styles.dragging,
                )}
                onPointerEnter={() => {
                  if (drag?.kind === "sec" && drag.id !== s.id && !pinned(s)) onPlaceSection(drag.id, index);
                }}
              >
                <button
                  type="button"
                  className={styles.hd}
                  data-handle={s.id}
                  aria-label={`Move section ${name}`}
                  aria-describedby="tree-help"
                  aria-disabled={pinned(s) || undefined}
                  style={{ visibility: pinned(s) ? "hidden" : undefined }}
                  tabIndex={pinned(s) ? -1 : undefined}
                  onPointerDown={(e) => {
                    if (pinned(s) || e.button !== 0) return;
                    e.preventDefault();
                    setDrag({ kind: "sec", id: s.id });
                  }}
                  onKeyDown={secKey(s)}
                >
                  {GRIP}
                </button>
                <button
                  type="button"
                  className={styles.chev}
                  aria-expanded={isOpen}
                  aria-label={`Show what’s inside ${name}`}
                  style={{ visibility: kids.length ? undefined : "hidden" }}
                  tabIndex={kids.length ? undefined : -1}
                  onClick={() => {
                    onToggleOpen(s.id);
                  }}
                >
                  <svg
                    className="ico"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    style={{ width: 15, height: 15, transform: `rotate(${isOpen ? 90 : 0}deg)` }}
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={styles.tl}
                  aria-current={isSel || undefined}
                  onClick={() => {
                    onSelect({ kind: "sec", id: s.id });
                  }}
                >
                  <span className={cx(styles.nm, !s.visible && styles.off)}>{name}</span>
                  {pinned(s) ? (
                    <span className={styles.pin}>{s.kind === "hero" ? "First" : "Last"}</span>
                  ) : null}
                  {s.nav ? (
                    <span className={cx(styles.mini, styles.miniNav)}>Nav · {s.nav.label}</span>
                  ) : null}
                  {note ? <span className={cx(styles.mini, styles.miniWarn)}>{note}</span> : null}
                </button>
                <span className={styles.count}>{sectionCount(s, ctx)}</span>
                <button
                  type="button"
                  className={styles.eye}
                  role="switch"
                  aria-checked={s.visible}
                  aria-disabled={s.kind === "hero" || undefined}
                  aria-label={`Show ${name} on the site`}
                  title={s.kind === "hero" ? "The hero always shows" : s.visible ? "On the site" : "Hidden"}
                  style={{ color: s.visible ? "var(--tx)" : "#8F8D87" }}
                  onClick={() => {
                    onEyeSection(s);
                  }}
                >
                  {s.visible ? EyeOn : EyeOff}
                </button>
              </div>
              {isOpen && kids.length ? (
                <div className={styles.kids}>
                  {kids.map((k, ki) => {
                    const isKidSel = sel.kind === "kid" && sel.p === s.id && sel.id === k.id;
                    const off = k.visible === false;
                    return (
                      <div
                        key={k.id}
                        className={cx(
                          styles.tr,
                          styles.kidRow,
                          isKidSel && styles.sel,
                          flash(k.id),
                          drag?.id === k.id && styles.dragging,
                        )}
                        onPointerEnter={() => {
                          if (drag?.kind === "kid" && drag.p === s.id && drag.id !== k.id && k.movable)
                            onPlaceKid(s.id, drag.id, ki);
                        }}
                      >
                        {k.movable ? (
                          <button
                            type="button"
                            className={cx(styles.hd, styles.hdKid)}
                            data-handle={`${s.id}-${k.id}`}
                            aria-label={`Move ${k.name}`}
                            aria-describedby="tree-help"
                            onPointerDown={(e) => {
                              if (e.button !== 0) return;
                              e.preventDefault();
                              setDrag({ kind: "kid", p: s.id, id: k.id });
                            }}
                            onKeyDown={kidKey(s, k)}
                          >
                            {GRIP}
                          </button>
                        ) : (
                          <span style={{ width: 26, flex: "none" }} />
                        )}
                        <button
                          type="button"
                          className={cx(styles.tl, styles.kid)}
                          aria-current={isKidSel || undefined}
                          onClick={() => {
                            onSelect({ kind: "kid", p: s.id, id: k.id });
                          }}
                        >
                          <span className={cx(styles.nm, off && styles.off)}>{k.name}</span>
                          {k.chip ? (
                            <span className={cx(styles.mini, k.draft ? styles.miniWarn : styles.miniOk)}>
                              {k.chip}
                            </span>
                          ) : null}
                        </button>
                        {k.visible === null ? (
                          <span style={{ width: 28, flex: "none" }} />
                        ) : (
                          <button
                            type="button"
                            className={cx(styles.eye, styles.eyeKid)}
                            role="switch"
                            aria-checked={k.visible}
                            aria-disabled={k.draft || undefined}
                            aria-label={`Show ${k.name}`}
                            title={kidEyeTitle(s, k)}
                            style={{ color: k.visible ? "var(--tx)" : "#8F8D87" }}
                            onClick={() => {
                              onEyeKid(s, k);
                            }}
                          >
                            {k.visible ? EyeOn : EyeOff}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button type="button" className={cx(buttons.btn, styles.add)} onClick={onAddSection}>
            <StudioIcon name="plus" size={15} />
            Add section
          </button>
        </div>
      </div>
      <p id="tree-help" className={styles.help}>
        Drag a handle, or focus it and press ↑ ↓. The eye turns anything on or off. Hero and footer stay
        pinned.
      </p>
    </section>
  );
}
