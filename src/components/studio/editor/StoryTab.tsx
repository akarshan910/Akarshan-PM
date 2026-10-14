/**
 * Story (05 · Story; EditorCaseStudy, StudioMobile › Editor · Story): chapters on the left (drag,
 * or a focused handle and ↑ ↓), the chapter's blocks in the middle, and the chapter's or the
 * selected block's settings on the right. Phones show one chapter at a time behind a switcher.
 */
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router";

import { cx } from "../../cx";
import { Icon } from "../../icons";
import { metricsOutcomes, tableRows } from "~/lib/case-study";
import { chapterHasContent, blockHasContent, riceFlags } from "~/lib/studio/checks";
import {
  BLOCK_LABEL,
  BLOCK_TYPES,
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
} from "~/lib/studio/story";
import type { Block, BlockType, Chapter, Project } from "~/lib/types";
import buttons from "../Button.module.css";
import { Segmented, Switch } from "../Controls";
import { SelectField } from "../Field";
import { RichArea } from "../RichArea";
import { useShell } from "../shell/ShellContext";
import { useToast } from "../Toast";
import { useEditor } from "./ProjectEditor";
import styles from "./StoryTab.module.css";

type TableBlock = Extract<Block, { type: "table" }>;

const ICONS: Record<BlockType, string> = {
  text: "M5 6h14M5 10h14M5 14h10M5 18h7",
  heading: "M6 5v14M18 5v14M6 12h12",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  callout: "M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z",
  metrics: "M4 20V10M10 20V4M16 20v-7M2 20h20",
  table: "M3 5h18v14H3zM3 10h18M3 15h18M9 5v14",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4",
  gallery: "M3 7h13v13H3zM8 3h13v13",
  video: "M3 6h13v12H3zM16 10l5-3v10l-5-3",
  prototype: "M7 3h10v18H7zM11 18h2",
  beforeafter: "M12 3v18M4 6h16v12H4z",
  journey: "M3 12h18M6 9v6M12 9v6M18 9v6",
  ownership: "M9 8a3 3 0 106 0 3 3 0 00-6 0M4 20c.8-3.5 3.6-5 8-5s7.2 1.5 8 5",
  quote: "M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6",
  cards: "M3 5h8v14H3zM13 5h8v14h-8z",
  divider: "M3 12h18",
};

const PLACEHOLDERS: Partial<Record<BlockType, [string, string]>> = {
  image: ["Choose an image from your media library, or upload one. Alt text is required.", "Choose image"],
  gallery: ["Pick two or more images. Each needs alt text.", "Choose images"],
  beforeafter: ["Pick a before and an after image. Readers drag a slider to compare.", "Choose images"],
  journey: ["Add three to seven stages, one line each.", ""],
  divider: ["A thin rule between ideas. Nothing to fill in.", ""],
};

function Ico({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
      <path d={d} />
    </svg>
  );
}

export function StoryTab() {
  const e = useEditor();
  const { announce } = useShell();
  const toast = useToast();
  const d = e.draft;
  const [pal, setPal] = useState(false);
  const [moved, setMoved] = useState<{ id: string; flip: number; kind: "ch" | "b" } | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [rice, setRice] = useState<{
    block: string;
    before: TableBlock;
    text: string;
    kind: "use" | "ok";
  } | null>(null);
  const focusAfter = useRef<string | null>(null);

  // ?block= from the dashboard opens that block's chapter and selects it.
  const [params] = useSearchParams();
  const [sel, setSel] = useState<string | null>(() => {
    const id = params.get("block");
    return d.story.find((ch) => ch.blocks.some((b) => b.id === id))?.id ?? d.story[0]?.id ?? null;
  });
  const [selB, setSelB] = useState<string | null>(() => params.get("block"));

  useEffect(() => {
    if (!focusAfter.current) return;
    document.querySelector<HTMLElement>(`[data-handle="${focusAfter.current}"]`)?.focus();
    focusAfter.current = null;
  });

  useEffect(() => {
    if (!drag) return;
    const end = () => {
      const i = e.draft.story.findIndex((c) => c.id === drag);
      const c = e.draft.story[i];
      if (c) announce(`${c.title || "Untitled chapter"} moved.`);
      setMoved((m) => ({ id: drag, flip: (m?.flip ?? 0) + 1, kind: "ch" }));
      setDrag(null);
    };
    window.addEventListener("pointerup", end);
    return () => {
      window.removeEventListener("pointerup", end);
    };
  }, [drag, e.draft.story, announce]);

  const chapter = d.story.find((c) => c.id === sel) ?? d.story[0];
  const chIndex = chapter ? d.story.indexOf(chapter) : -1;
  const flash = (id: string, kind: "ch" | "b") => {
    setMoved((m) => ({ id, flip: (m?.flip ?? 0) + 1, kind }));
  };
  const visible = d.story.filter((c) => !c.hidden && chapterHasContent(c)).length;

  const keyMove = (c: Chapter) => (ev: KeyboardEvent) => {
    if (ev.key !== "ArrowUp" && ev.key !== "ArrowDown") return;
    ev.preventDefault();
    const i = d.story.indexOf(c);
    const j = ev.key === "ArrowUp" ? i - 1 : i + 1;
    if (j < 0 || j >= d.story.length) return;
    e.update((x) => moveChapter(x, c.id, j));
    flash(c.id, "ch");
    focusAfter.current = c.id;
    announce(`${c.title || "Untitled chapter"} is now chapter ${j + 1} of ${d.story.length}.`);
  };

  const add = (type: BlockType) => {
    if (!chapter) return;
    const r = addBlock(e.draft, chapter.id, type);
    e.update(() => r.draft);
    setSelB(r.id);
    setPal(false);
    flash(r.id, "b");
    announce(`${BLOCK_LABEL[type]} block added.`);
  };

  const onAddChapter = () => {
    const r = addChapter(e.draft);
    e.update(() => r.draft);
    setSel(r.id);
    setSelB(null);
    setPal(false);
    flash(r.id, "ch");
  };

  const selBlock = chapter?.blocks.find((b) => b.id === selB);

  return (
    <div className={styles.wrap}>
      <nav aria-label="Chapters" className={styles.chapters}>
        <div className={cx("card", styles.chCard)} style={{ userSelect: drag ? "none" : undefined }}>
          <div className={styles.chHead}>
            <span className="mono">Chapters</span>
            <span className={styles.chCount}>
              {visible} of {d.story.length} on the live page
            </span>
          </div>
          {d.story.map((c, i) => {
            const sub = chapterSub(c);
            const cur = c.id === chapter?.id;
            const anim =
              moved?.kind === "ch" && moved.id === c.id && drag !== c.id
                ? moved.flip % 2
                  ? "flashA"
                  : "flashB"
                : "";
            return (
              <div
                key={c.id}
                className={cx(styles.chr, anim, drag === c.id && styles.chDrag)}
                onPointerEnter={() => {
                  if (drag && drag !== c.id) e.update((x) => moveChapter(x, drag, i));
                }}
              >
                <button
                  type="button"
                  className={styles.hdl}
                  data-handle={c.id}
                  aria-label={`Move ${c.title || "Untitled chapter"}`}
                  aria-describedby="ch-help"
                  onPointerDown={(ev) => {
                    if (ev.button !== 0) return;
                    ev.preventDefault();
                    setDrag(c.id);
                  }}
                  onKeyDown={keyMove(c)}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
                    {[6, 12, 18].map((y) => (
                      <g key={y}>
                        <circle cx="9" cy={y} r="1.6" />
                        <circle cx="15" cy={y} r="1.6" />
                      </g>
                    ))}
                  </svg>
                </button>
                <button
                  type="button"
                  className={styles.chb}
                  aria-current={cur ? "true" : undefined}
                  onClick={() => {
                    setSel(c.id);
                    setSelB(null);
                    setPal(false);
                  }}
                >
                  <span className={styles.chNum}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.chTitle} style={{ color: sub.muted ? "#6A6A72" : "#141416" }}>
                    {c.title || "Untitled chapter"}
                  </span>
                  <span />
                  <span className={styles.chSub} style={{ color: sub.muted ? "#8A5A00" : "#6A6A72" }}>
                    {sub.text}
                  </span>
                </button>
                <button
                  type="button"
                  className="ib"
                  aria-pressed={c.hidden}
                  aria-label={`Hide ${c.title || "Untitled chapter"} on the live page`}
                  title={
                    c.hidden
                      ? "Hidden. Click to show it on the live page"
                      : "Shown. Click to hide it on the live page"
                  }
                  style={{ width: 34, height: 34, color: c.hidden ? "#8A5A00" : "#6A6A72" }}
                  onClick={() => {
                    e.update((x) => patchChapter(x, c.id, { hidden: !c.hidden }));
                  }}
                >
                  <Icon name={c.hidden ? "image-off" : "eye"} />
                </button>
              </div>
            );
          })}
          <button type="button" className={cx(buttons.btn, styles.addCh)} onClick={onAddChapter}>
            <Icon name="plus" size={16} />
            Add chapter
          </button>
        </div>
        <p id="ch-help" className={styles.help}>
          Drag a handle, or focus it and press ↑ or ↓. Empty chapters are hidden on the live page, so a draft
          never shows a blank section.
        </p>
      </nav>

      {chapter ? (
        <section aria-labelledby="ch-title" className={styles.center}>
          <label className={styles.switcher}>
            <span className="sr-only">Chapter</span>
            <select
              value={chapter.id}
              onChange={(ev) => {
                setSel(ev.target.value);
                setSelB(null);
              }}
            >
              {d.story.map((c, i) => (
                <option key={c.id} value={c.id}>
                  {String(i + 1).padStart(2, "0")} {c.title || "Untitled chapter"}
                </option>
              ))}
            </select>
            <span className={styles.swNum}>{String(chIndex + 1).padStart(2, "0")}</span>
            <span className={styles.swTitle}>{chapter.title || "Untitled chapter"}</span>
            <span className={styles.swCount}>{d.story.length} chapters</span>
            <Icon name="chevron-down" />
          </label>
          <div className={styles.chBar}>
            <span className="mono">Chapter {String(chIndex + 1).padStart(2, "0")}</span>
            {chapter.hidden || !chapterHasContent(chapter) ? (
              <span className={cx("chip", styles.muted)}>
                {chapter.hidden ? "Hidden by you" : "Hidden on the live page · empty"}
              </span>
            ) : null}
            <span style={{ flex: 1 }} />
            <Link
              to={`/studio/preview/project/${e.row.id}#${liveAnchor(d, chapter.id) ?? ""}`}
              className={styles.u}
            >
              Preview this chapter
            </Link>
          </div>
          <label className="sr-only" htmlFor="ch-title">
            Chapter title
          </label>
          <input
            id="ch-title"
            className={cx(styles.ttl, !chapter.title.trim() && styles.ttlBad)}
            value={chapter.title}
            aria-invalid={!chapter.title.trim()}
            aria-describedby={!chapter.title.trim() ? "ch-title-err" : undefined}
            onChange={(ev) => {
              const t = ev.target.value;
              e.update((x) => patchChapter(x, chapter.id, { title: t }));
            }}
          />
          {!chapter.title.trim() ? (
            <div id="ch-title-err" className={styles.titleErr}>
              Give this chapter a title. It’s shown on the page and in the contents.
            </div>
          ) : null}

          {chapter.blocks.length === 0 ? (
            <div className={styles.emptyCh}>
              <div className={styles.emptyHead}>
                <span className={styles.emptyIco}>
                  <Icon name="image-off" />
                </span>
                <div>
                  <div className={styles.emptyTitle}>
                    Nothing here yet, so this chapter is hidden on the live page.
                  </div>
                  <div className={styles.emptyText}>It appears as soon as it has a block with content.</div>
                </div>
              </div>
              {chapter.prompts?.length ? (
                <div className={styles.prompts}>
                  <div className="mono" style={{ fontSize: 11 }}>
                    Questions to answer
                  </div>
                  {chapter.prompts.map((p, i) => (
                    <div key={p} className={styles.prompt} style={{ marginTop: i === 0 ? 8 : 4 }}>
                      {p}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className={styles.starts}>
                <span>Start with</span>
                {(["ownership", "text", "list"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={buttons.btn}
                    style={{ height: 38 }}
                    onClick={() => {
                      add(t);
                    }}
                  >
                    {BLOCK_TYPES.find((x) => x.type === t)?.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.blocks}>
            {chapter.blocks.map((b, i) => (
              <BlockCard
                key={b.id}
                block={b}
                draft={d}
                first={i === 0}
                last={i === chapter.blocks.length - 1}
                selected={b.id === selB}
                ring={moved?.kind === "b" && moved.id === b.id ? (moved.flip % 2 ? "ringA" : "ringB") : ""}
                rice={rice?.block === b.id ? rice : null}
                onSelect={() => {
                  setSelB(b.id);
                }}
                onChange={(fn) => {
                  e.update((x) => patchBlock(x, chapter.id, b.id, fn));
                }}
                onMove={(dir) => {
                  e.update((x) => moveBlock(x, chapter.id, b.id, dir));
                  flash(b.id, "b");
                  announce(`Block moved to position ${i + 1 + dir} of ${chapter.blocks.length}.`);
                }}
                onDuplicate={() => {
                  const r = duplicateBlock(e.draft, chapter.id, b.id);
                  e.update(() => r.draft);
                  setSelB(r.id);
                  flash(r.id, "b");
                  toast.show({ message: "Block duplicated.", tone: "neutral" });
                }}
                onDelete={() => {
                  const r = deleteBlock(e.draft, chapter.id, b.id);
                  e.update(() => r.draft);
                  setSelB(null);
                  announce("Block deleted.");
                  toast.show({
                    message: `${BLOCK_LABEL[b.type]} block deleted.`,
                    tone: "neutral",
                    action: {
                      label: "Undo",
                      onAction: () => {
                        if (r.block) {
                          const blk = r.block;
                          e.update((x) => restoreBlock(x, chapter.id, blk, r.index));
                          setSelB(blk.id);
                          flash(blk.id, "b");
                        }
                        toast.show({ message: "Block restored." });
                        announce("Block restored.");
                      },
                    },
                  });
                }}
                onRice={(kind) => {
                  if (b.type !== "table") return;
                  const problem = riceProblem(b);
                  if (!problem) return;
                  const before = b;
                  if (kind === "use") {
                    const previousTop = tableRows(b).find((r) => r.cells[0] === "1")?.cells[1] ?? "";
                    const r = riceUseComputed(b, problem.flag);
                    e.update((x) => patchBlock(x, chapter.id, b.id, () => r.block));
                    const msg = `Score set to ${problem.flag.computed}. ${problem.flag.item} now ranks ${r.rank === 1 ? "first" : `#${r.rank}`}.`;
                    announce(msg);
                    const stale = previousTop ? staleMentions(e.draft, previousTop) : [];
                    setRice({
                      block: b.id,
                      before,
                      kind: "use",
                      text: `${problem.flag.item} now ranks ${r.rank === 1 ? "first" : `#${r.rank}`}.${
                        stale.length
                          ? ` ${stale.map((t) => `“${t}”`).join(" and ")} still mention ${previousTop} first. Update them, or undo.`
                          : ""
                      }`,
                    });
                  } else if (kind === "effort") {
                    e.update((x) => patchBlock(x, chapter.id, b.id, () => riceSetEffort(b, problem.flag)));
                    const msg = `Effort set to ${problem.flag.effortForShown} months. The score of ${problem.flag.shown} now matches.`;
                    announce(msg);
                    setRice({
                      block: b.id,
                      before,
                      kind: "ok",
                      text: `Effort set to ${problem.flag.effortForShown} months, so the score of ${problem.flag.shown} now matches its inputs.`,
                    });
                  } else {
                    e.update((x) => patchBlock(x, chapter.id, b.id, () => riceKeep(b, problem.flag)));
                    announce(`Marked as reviewed. The score stays ${problem.flag.shown}.`);
                    setRice({
                      block: b.id,
                      before,
                      kind: "ok",
                      text: `Marked as reviewed. The score stays ${problem.flag.shown}.`,
                    });
                  }
                }}
                onRiceUndo={() => {
                  if (!rice) return;
                  const before = rice.before;
                  e.update((x) => patchBlock(x, chapter.id, b.id, () => before));
                  setRice(null);
                  announce("Change undone.");
                }}
              />
            ))}
          </div>

          {pal ? (
            <div className={cx("card", styles.pal)} role="group" aria-label="Block types">
              <div className={styles.palHead}>
                <span>Add a block to “{chapter.title || "Untitled chapter"}”</span>
                <button
                  type="button"
                  className="ib"
                  aria-label="Close block list"
                  onClick={() => {
                    setPal(false);
                  }}
                >
                  <Icon name="close" />
                </button>
              </div>
              <div className={styles.palGrid}>
                {BLOCK_TYPES.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    className={styles.pt}
                    onClick={() => {
                      add(t.type);
                    }}
                  >
                    <span className={styles.pti}>
                      <Ico d={ICONS[t.type]} />
                    </span>
                    <span className={styles.ptName}>{t.name}</span>
                    <span className={styles.ptDesc}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.addb}
              aria-expanded={false}
              onClick={() => {
                setPal(true);
              }}
            >
              <Icon name="plus" />
              Add block
            </button>
          )}
        </section>
      ) : (
        <section className={styles.center}>
          <div className={styles.emptyCh}>
            <div className={styles.emptyTitle}>No chapters yet.</div>
            <button type="button" className={buttons.btn} onClick={onAddChapter}>
              Add chapter
            </button>
          </div>
        </section>
      )}

      <aside aria-label="Settings" className={styles.settings}>
        <div className={cx("card", styles.setCard)}>
          {chapter && !selBlock ? (
            <ChapterSettings
              chapter={chapter}
              slug={e.row.publishedSlug ?? e.row.slug}
              anchor={liveAnchor(d, chapter.id)}
              onToggle={() => {
                e.update((x) => patchChapter(x, chapter.id, { hidden: !chapter.hidden }));
              }}
            />
          ) : null}
          {chapter && selBlock ? (
            <BlockSettings
              block={selBlock}
              projectId={e.row.id}
              screens={e.draft.visuals.hero.type === "prototype" ? (e.draft.visuals.hero.screens ?? []) : []}
              onBack={() => {
                setSelB(null);
              }}
              onChange={(fn) => {
                e.update((x) => patchBlock(x, chapter.id, selBlock.id, fn));
              }}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function ChapterSettings({
  chapter,
  slug,
  anchor,
  onToggle,
}: {
  chapter: Chapter;
  slug: string;
  anchor: string | null;
  onToggle: () => void;
}) {
  const empty = !chapterHasContent(chapter);
  return (
    <div className={styles.setBox}>
      <div className="mono">Chapter settings</div>
      <div className={styles.setLabel}>Link to this chapter</div>
      <div className={styles.anchor}>{anchor ? `/work/${slug}#${anchor}` : `/work/${slug}`}</div>
      <div className={styles.setNote}>
        {anchor ? "Updates when you rename the chapter." : "Hidden chapters have no link on the live page."}
      </div>
      <div className={styles.rule} />
      <Switch checked={!chapter.hidden} onCheckedChange={onToggle}>
        Show on the live page
      </Switch>
      <div className={styles.setNote}>
        {chapter.hidden
          ? "Hidden by you. It keeps its content."
          : empty
            ? "On, but empty chapters stay hidden until they have content."
            : "Visible in the page and its contents list."}
      </div>
    </div>
  );
}

function BlockSettings({
  block,
  projectId,
  screens,
  onBack,
  onChange,
}: {
  block: Block;
  projectId: string;
  screens: { label: string; startPath: string }[];
  onBack: () => void;
  onChange: (fn: (b: Block) => Block) => void;
}) {
  const t = block.type;
  return (
    <div className={styles.setBox}>
      <div className={styles.setTop}>
        <span className="mono">{BLOCK_LABEL[t]} settings</span>
        <button type="button" className={styles.back} onClick={onBack}>
          Chapter settings
        </button>
      </div>
      {block.type === "text" ? (
        <div className={styles.setSec}>
          <Segmented
            label="Style"
            options={[
              { value: "body", label: "Body" },
              { value: "lead", label: "Lead" },
            ]}
            value={block.style}
            onChange={(style) => {
              onChange((b) => (b.type === "text" ? { ...b, style } : b));
            }}
          />
          <div className={styles.hint}>Lead is larger. Use it once, to open a chapter.</div>
        </div>
      ) : null}
      {block.type === "callout" ? (
        <div className={styles.setSec}>
          <Segmented
            label="Tone"
            options={[
              { value: "neutral", label: "Neutral" },
              { value: "accent", label: "Accent" },
            ]}
            value={block.tone}
            onChange={(tone) => {
              onChange((b) => (b.type === "callout" ? { ...b, tone } : b));
            }}
          />
        </div>
      ) : null}
      {block.type === "cards" ? (
        <div className={styles.setSec}>
          <Segmented
            label="Columns"
            options={[
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
            ]}
            value={String(block.columns) as "2" | "3" | "4"}
            onChange={(v) => {
              onChange((b) => (b.type === "cards" ? { ...b, columns: Number(v) as 2 | 3 | 4 } : b));
            }}
          />
          <div className={styles.hint}>On phones, cards stack into one column.</div>
        </div>
      ) : null}
      {block.type === "table" ? (
        <div className={styles.switches}>
          {(
            [
              ["checkFormula", "Check scores against inputs"],
              ["sortByScore", "Sort rows by score"],
              ["highlightTop", "Highlight the top three"],
              ["phoneCards", "On phones, show rows as cards"],
            ] as const
          ).map(([k, label]) => {
            const on = k === "highlightTop" ? block.highlightTop > 0 : block[k];
            return (
              <Switch
                key={k}
                checked={on}
                onCheckedChange={(v) => {
                  onChange((b) =>
                    b.type === "table"
                      ? k === "highlightTop"
                        ? { ...b, highlightTop: v ? 3 : 0 }
                        : { ...b, [k]: v }
                      : b,
                  );
                }}
              >
                {label}
              </Switch>
            );
          })}
        </div>
      ) : null}
      {block.type === "metrics" ? (
        <div className={styles.setText}>
          These numbers come from Outcomes, so the page, the card and this chapter always agree.
          <Link to={`/studio/projects/${projectId}/outcomes`} className={styles.setLink}>
            Edit in Outcomes →
          </Link>
        </div>
      ) : null}
      {block.type === "prototype" ? (
        <div className={styles.setSec}>
          <SelectField
            id="f-scr"
            label="Opens on"
            value={block.startPath ?? ""}
            onChange={(ev) => {
              const startPath = ev.target.value;
              onChange((b) =>
                b.type === "prototype" ? (startPath ? { ...b, startPath } : { id: b.id, type: b.type }) : b,
              );
            }}
            hint="Screens come from the prototype in Visuals."
          >
            <option value="">Home</option>
            {screens.map((s) => (
              <option key={s.startPath} value={s.startPath}>
                {s.label}
              </option>
            ))}
          </SelectField>
        </div>
      ) : null}
      {[
        "image",
        "gallery",
        "video",
        "beforeafter",
        "journey",
        "ownership",
        "divider",
        "heading",
        "list",
        "quote",
      ].includes(t) ? (
        <div className={styles.setText}>
          Fill this block, or remove it. Empty blocks are skipped on the live page.
        </div>
      ) : null}
    </div>
  );
}

function BlockCard({
  block: b,
  draft,
  first,
  last,
  selected,
  ring,
  rice,
  onSelect,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
  onRice,
  onRiceUndo,
}: {
  block: Block;
  draft: Project;
  first: boolean;
  last: boolean;
  selected: boolean;
  ring: string;
  rice: { kind: "use" | "ok"; text: string } | null;
  onSelect: () => void;
  onChange: (fn: (b: Block) => Block) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRice: (kind: "use" | "effort" | "keep") => void;
  onRiceUndo: () => void;
}) {
  const empty = !blockHasContent(b) && b.type !== "divider";
  const isRice = b.type === "table" && b.formula === "rice";
  const flags = b.type === "table" ? riceFlags(b) : [];
  const warn =
    flags.length > 0 ? `${flags.length} ${flags.length === 1 ? "row needs" : "rows need"} a look` : "";
  const label = `${BLOCK_LABEL[b.type]}${isRice ? " · RICE" : ""}`;
  const setBody = (html: string) => {
    onChange((x) => ("body" in x ? { ...x, body: html } : x));
  };
  const placeholder = PLACEHOLDERS[b.type];

  return (
    <article
      className={cx(styles.blk, selected && styles.blkSel, warn && styles.blkWarn, ring)}
      aria-label={`${BLOCK_LABEL[b.type]} block`}
    >
      <div className={styles.bh}>
        <button
          type="button"
          className={styles.bt}
          aria-pressed={selected}
          title="Select to see this block’s settings"
          onClick={onSelect}
        >
          <Ico d={ICONS[b.type]} size={15} />
          {label}
        </button>
        {warn ? <span className={cx("chip", styles.warnChip)}>{warn}</span> : null}
        {empty ? <span className={cx("chip", styles.muted)}>Empty · skipped on the live page</span> : null}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="ib"
          aria-label="Move block up"
          aria-disabled={first}
          onClick={() => {
            if (!first) onMove(-1);
          }}
        >
          <Ico d="M12 19V5M6 11l6-6 6 6" />
        </button>
        <button
          type="button"
          className="ib"
          aria-label="Move block down"
          aria-disabled={last}
          onClick={() => {
            if (!last) onMove(1);
          }}
        >
          <Ico d="M12 5v14M6 13l6 6 6-6" />
        </button>
        <button type="button" className="ib" aria-label="Duplicate block" onClick={onDuplicate}>
          <Ico d="M8 8h12v12H8zM4 16V4h12" />
        </button>
        <button type="button" className="ib" aria-label="Delete block" onClick={onDelete}>
          <Ico d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </button>
      </div>

      {b.type === "text" ? (
        <RichArea
          value={b.body}
          onChange={setBody}
          onFocus={onSelect}
          label="Text content"
          placeholder="Write something…"
          style={{ fontSize: b.style === "lead" ? 20 : 16 }}
        />
      ) : null}
      {b.type === "list" ? (
        <RichArea
          value={b.body}
          onChange={(h) => {
            setBody(asList(h));
          }}
          onFocus={onSelect}
          label="List content"
          placeholder="One point per line"
        />
      ) : null}
      {b.type === "heading" || b.type === "quote" ? (
        <textarea
          className={styles.rt}
          value={b.body}
          onChange={(ev) => {
            setBody(ev.target.value);
          }}
          onFocus={onSelect}
          aria-label={`${BLOCK_LABEL[b.type]} content`}
          placeholder={b.type === "heading" ? "Heading" : "The quote, then who said it"}
          style={
            b.type === "heading" ? { fontSize: 22, fontWeight: 600, minHeight: 48 } : { fontStyle: "italic" }
          }
        />
      ) : null}
      {b.type === "callout" ? (
        <div className={styles.callout} style={{ background: b.tone === "accent" ? "#FDECEE" : "#F2F1EE" }}>
          <span style={{ marginTop: 10, color: b.tone === "accent" ? "#C2182C" : "#4A4A51" }}>
            <Ico d={ICONS.callout} />
          </span>
          <RichArea
            value={b.body}
            onChange={setBody}
            onFocus={onSelect}
            label="Callout text"
            style={{ minHeight: 56, fontWeight: 500 }}
          />
        </div>
      ) : null}
      {b.type === "metrics" ? (
        <div className={styles.metrics}>
          {metricsOutcomes(b, draft.outcomes).map((o) => (
            <div key={o.id} className={styles.metric}>
              <div className={styles.mVal}>{o.value}</div>
              <div className={styles.mLbl}>{o.label}</div>
              <span className={cx("chip", styles.mType)}>{o.type.toUpperCase()}</span>
            </div>
          ))}
          {metricsOutcomes(b, draft.outcomes).length === 0 ? (
            <div className={styles.ph}>
              <span style={{ flex: 1 }}>No results in the strip yet. Add them in Outcomes.</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {b.type === "table" ? <TableView block={b} rice={rice} onRice={onRice} onUndo={onRiceUndo} /> : null}
      {b.type === "cards" ? (
        <div className={styles.cards} style={{ "--cols": b.columns } as CSSProperties}>
          {b.items.map((it, i) => (
            <div key={i} className={styles.cardItem}>
              {it.kicker ? <span className={styles.cardKicker}>{it.kicker}</span> : null}
              {it.title}
              {it.note ? <span className={styles.cardNote}>{it.note}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
      {b.type === "prototype" ? (
        <div className={styles.proto}>
          <span aria-hidden="true" className={styles.protoPhone} />
          <span className={styles.protoText}>
            <strong>
              Prototype · opens on{" "}
              {draft.visuals.hero.type === "prototype"
                ? (draft.visuals.hero.screens?.find((s) => s.startPath === b.startPath)?.label ?? "Home")
                : "Home"}
            </strong>
            <span>Uses this project’s prototype. Visitors can click through every screen.</span>
          </span>
        </div>
      ) : null}
      {b.type === "ownership" ? (
        <div className={styles.own}>
          {(
            [
              ["mine", "My ownership", "What you personally did and decided"],
              ["team", "Team result", "What the team shipped together"],
              ["business", "Business outcome", "What changed, labelled achieved, target or projected"],
            ] as const
          ).map(([k, label, ph]) => (
            <label key={k} className={styles.ownField}>
              {label}
              <textarea
                className={styles.ownInp}
                placeholder={ph}
                value={b[k] ?? ""}
                onFocus={onSelect}
                onChange={(ev) => {
                  const v = ev.target.value;
                  onChange((x) => (x.type === "ownership" ? { ...x, [k]: v } : x));
                }}
              />
            </label>
          ))}
        </div>
      ) : null}
      {b.type === "video" ? (
        <input
          className={styles.inp}
          aria-label="Video link"
          placeholder="Paste a YouTube, Vimeo, Loom or Google Drive link."
          defaultValue={b.url}
          onFocus={onSelect}
          onChange={(ev) => {
            const v = ev.target.value.trim();
            if (v === "" || /^https:\/\/\S+$/.test(v))
              onChange((x) => (x.type === "video" ? { ...x, url: v } : x));
          }}
        />
      ) : null}
      {b.type === "journey" && b.stages.length > 0 ? (
        <ol className={styles.journey}>
          {b.stages.map((s, i) => (
            <li key={i}>{s.title}</li>
          ))}
        </ol>
      ) : null}
      {placeholder &&
      !(b.type === "journey" && b.stages.length > 0) &&
      !(b.type !== "divider" && blockHasContent(b)) ? (
        <div className={styles.ph}>
          <span style={{ flex: 1 }}>{placeholder[0]}</span>
          {placeholder[1] ? (
            <Link to="/studio/media" className={buttons.btn} style={{ height: 38 }}>
              {placeholder[1]}
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function TableView({
  block,
  rice,
  onRice,
  onUndo,
}: {
  block: TableBlock;
  rice: { kind: "use" | "ok"; text: string } | null;
  onRice: (kind: "use" | "effort" | "keep") => void;
  onUndo: () => void;
}) {
  const isRice = block.formula === "rice";
  const problem = isRice ? riceProblem(block) : null;
  const rows = tableRows(block);
  const flagged = new Set(riceFlags(block).map((f) => f.row));
  if (!isRice)
    return block.rows.length === 0 ? (
      <div className={styles.ph}>
        <span style={{ flex: 1 }}>
          An empty table. Add columns and rows, then pick a formula if it scores something.
        </span>
      </div>
    ) : (
      <div className={styles.tableWrap}>
        <table className={styles.plainTable}>
          <thead>
            <tr>
              {block.columns.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <div className={styles.table}>
      {problem && !rice ? (
        <div className={styles.riceOpen}>
          <span>
            <strong>{problem.text.split(":")[0]}:</strong>
            {problem.text.slice(problem.text.indexOf(":") + 1)}
          </span>
          <span className={styles.fixes}>
            <button
              type="button"
              className={styles.fixb}
              onClick={() => {
                onRice("use");
              }}
            >
              Use {problem.flag.computed} and re-rank
            </button>
            <button
              type="button"
              className={styles.fixb}
              onClick={() => {
                onRice("effort");
              }}
            >
              Set effort to {problem.flag.effortForShown} mo
            </button>
            <button
              type="button"
              className={styles.fixb}
              onClick={() => {
                onRice("keep");
              }}
            >
              Keep as is
            </button>
          </span>
        </div>
      ) : null}
      {rice?.kind === "use" ? (
        <div className={styles.riceUse}>
          <span style={{ flex: 1 }}>
            <strong>{rice.text.split(".")[0]}.</strong>
            {rice.text.slice(rice.text.indexOf(".") + 1)}
          </span>
          <button type="button" className={styles.fixb} onClick={onUndo}>
            Undo
          </button>
        </div>
      ) : null}
      {rice?.kind === "ok" ? (
        <div className={styles.riceOk}>
          <Icon name="tick" />
          <span style={{ flex: 1 }}>{rice.text}</span>
          <button type="button" className={styles.fixb} style={{ borderColor: "#B7DCC6" }} onClick={onUndo}>
            Undo
          </button>
        </div>
      ) : null}
      <div className={styles.tableWrap}>
        <div role="table" aria-label="RICE prioritisation" className={styles.riceTable}>
          <div className={cx(styles.tr, styles.trh)} role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">Idea</span>
            <span className={styles.num} role="columnheader">
              Reach
            </span>
            <span className={styles.num} role="columnheader">
              Impact
            </span>
            <span className={styles.num} role="columnheader">
              Confidence
            </span>
            <span className={styles.num} role="columnheader">
              Effort
            </span>
            <span className={styles.num} role="columnheader">
              Score
            </span>
          </div>
          {rows.map((r) => {
            const i = Number(r.key.split("-").pop());
            const bad = flagged.has(i);
            const [rank = "", item = "", reach = "", imp = "", conf = "", eff = "", score = ""] = r.cells;
            return (
              <div
                key={r.key}
                className={styles.tr}
                role="row"
                style={{ background: bad ? "#FFFBF0" : r.top ? "#F6F5F2" : undefined }}
              >
                <span role="cell" className={styles.rank}>
                  {rank}
                </span>
                <span role="cell" className={styles.item}>
                  {bad ? (
                    <Icon
                      name="alert"
                      size={15}
                      label="Score doesn’t match inputs"
                      style={{ color: "var(--warn)" }}
                    />
                  ) : null}
                  {item}
                </span>
                <span className={styles.num} role="cell">
                  {reach}
                </span>
                <span className={styles.num} role="cell">
                  {imp}
                </span>
                <span className={styles.num} role="cell">
                  {conf}
                </span>
                <span className={styles.num} role="cell">
                  {eff}
                </span>
                <span
                  className={styles.num}
                  role="cell"
                  style={{ fontWeight: 600, color: bad ? "#8A5A00" : undefined }}
                >
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.riceCards}>
        {rows.slice(0, 3).map((r) => {
          const i = Number(r.key.split("-").pop());
          const bad = flagged.has(i);
          return (
            <div key={r.key} className={cx(styles.rc, bad && styles.rcBad)}>
              <div className={styles.rcTop}>
                <span>
                  <span className={styles.rank}>#{r.cells[0]}</span> <strong>{r.cells[1]}</strong>
                </span>
                <span style={{ fontWeight: 700, color: bad ? "#8A5A00" : "#141416" }}>{r.cells[6]}</span>
              </div>
              <div className={styles.rcSub} style={{ color: bad ? "#8A5A00" : undefined }}>
                {bad
                  ? `Inputs give ${riceFlags(block).find((f) => f.row === i)?.computed ?? ""}. Tap to fix.`
                  : r.rice?.inputs}
              </div>
            </div>
          );
        })}
        {rows.length > 3 ? <span className={styles.more}>+ {rows.length - 3} more rows</span> : null}
      </div>
      <div className={styles.tableNote}>
        Score = reach × impact × confidence ÷ effort in months.{" "}
        {block.sortByScore ? "Sorted by score." : "In the order you entered them."}
      </div>
    </div>
  );
}
