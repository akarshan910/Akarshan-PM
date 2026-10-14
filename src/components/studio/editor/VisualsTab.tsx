/**
 * Visuals (05 · Visuals; EditorVisuals): the top of the page (image, video or prototype), the
 * accent, the cover with its focal point and crops, and the gallery with its details panel.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import { cx } from "../../cx";
import { Icon } from "../../icons";
import buttons from "../Button.module.css";
import { Segmented } from "../Controls";
import { useRepo } from "../data";
import { TextArea, TextField } from "../Field";
import { useShell } from "../shell/ShellContext";
import { StudioIcon } from "../StudioIcon";
import { useToast } from "../Toast";
import { useUpload } from "../media/useUpload";
import { EditorCols, Sec } from "./EditorFrame";
import { useEditor } from "./ProjectEditor";
import styles from "./VisualsTab.module.css";
import { ACCENT_COLOURS } from "~/lib/accents";
import { ACCENTS, SOFT_LIMITS } from "~/lib/schemas";
import { prototypeProblem, videoHost } from "~/lib/studio/checks";
import type { LinkStatus, MediaRow } from "~/lib/studio/repo";
import type { Accent, MediaRef, Project, ProjectHero } from "~/lib/types";

type Hero = ProjectHero;
type Gallery = Project["visuals"]["gallery"];

const ACCENT_NAMES: Record<Accent, string> = {
  teal: "Teal",
  amber: "Amber",
  sky: "Sky",
  violet: "Violet",
  coral: "Coral",
  slate: "Slate",
  green: "Green",
  yellow: "Yellow",
  lime: "Lime",
};

const FRAMES = {
  phone: [128, 230, 18, "3px solid #3A2A2C"],
  tablet: [176, 232, 14, "3px solid #3A2A2C"],
  desktop: [250, 160, 6, "3px solid #3A2A2C"],
  none: [220, 200, 4, "0"],
} as const;

const OK = "tick" as const;

export function VisualsTab() {
  const e = useEditor();
  const repo = useRepo();
  const toast = useToast();
  const { announce } = useShell();
  const v = e.draft.visuals;
  const hero = v.hero;
  const setVisuals = (fn: (vis: Project["visuals"]) => Project["visuals"]) => {
    e.update((d) => ({ ...d, visuals: fn(d.visuals) }));
  };

  // Each hero kind keeps what was typed, so switching back doesn't lose it.
  const kept = useRef<{ video?: Hero; prototype?: Hero }>({});
  const setHero = (type: "image" | "video" | "prototype") => {
    if (type === hero.type) return;
    if (hero.type !== "image") kept.current[hero.type] = hero;
    const next: Hero =
      type === "image"
        ? { type: "image" }
        : type === "video"
          ? (kept.current.video ?? { type: "video", url: "" })
          : (kept.current.prototype ?? { type: "prototype", url: "", frame: "phone", start: "click" });
    setVisuals((vis) => ({ ...vis, hero: next }));
  };

  // ---- media
  const byId = new Map(e.media.map((m) => [m.id, m]));
  const url = (id: string) => e.urls[id] ?? "";
  const addRows = async (rows: MediaRow[]) => {
    e.setMedia((m) => [...rows, ...m]);
    for (const r of rows) e.setUrl(r.id, await repo.media.url(r, "960"));
  };

  // ---- accent: name the other projects on the same shelf that use each one (D26)
  const shelf = e.layout.sections.find((s) => s.id === e.placement.shelfId);
  const sameShelf = new Map<Accent, string>();
  for (const item of shelf?.items ?? []) {
    if (item.id === e.row.id) continue;
    const other = e.rows.find((r) => r.id === item.id);
    if (other && !sameShelf.has(other.draft.visuals.accent))
      sameShelf.set(other.draft.visuals.accent, other.draft.overview.title);
  }
  const accUser = sameShelf.get(v.accent);
  const accHint = `${ACCENT_NAMES[v.accent]}${
    accUser
      ? `. ${accUser} on the same shelf uses it too: pick another so the two stand apart.`
      : ". Saved with the project; text on it is always near-black."
  }`;

  // ---- cover
  const cover = v.cover?.mediaId ? byId.get(v.cover.mediaId) : undefined;
  const [focal, setFocal] = useState(cover?.focal ?? { x: 0.5, y: 0.5 });
  const focalTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const moveFocal = (f: { x: number; y: number }) => {
    const c = (n: number) => Math.min(1, Math.max(0, Math.round(n * 100) / 100));
    const next = { x: c(f.x), y: c(f.y) };
    setFocal(next);
    announce("Focal point moved.");
    if (!cover) return;
    clearTimeout(focalTimer.current);
    focalTimer.current = setTimeout(() => {
      void repo.media.update(cover.id, { focal: next }).then((row) => {
        e.setMedia((m) => m.map((x) => (x.id === row.id ? row : x)));
      });
    }, 400);
  };
  useEffect(
    () => () => {
      clearTimeout(focalTimer.current);
    },
    [],
  );
  const onFocalClick = (ev: MouseEvent<HTMLButtonElement>) => {
    if (!ev.clientX && !ev.clientY) return;
    const r = ev.currentTarget.getBoundingClientRect();
    moveFocal({ x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height });
  };
  const onFocalKey = (ev: KeyboardEvent) => {
    const d = (
      { ArrowLeft: [-0.05, 0], ArrowRight: [0.05, 0], ArrowUp: [0, -0.05], ArrowDown: [0, 0.05] } as const
    )[ev.key as "ArrowLeft"] as readonly [number, number] | undefined;
    if (!d) return;
    ev.preventDefault();
    moveFocal({ x: focal.x + d[0], y: focal.y + d[1] });
  };
  const coverAlt = v.cover?.alt ?? cover?.alt ?? "";
  const coverUpload = useUpload({ images: true });
  const pickCover = async (files: FileList | null) => {
    if (!files?.length) return;
    const rows = await coverUpload.upload([...files].slice(0, 1));
    const row = rows[0];
    if (!row) return;
    await addRows(rows);
    setFocal(row.focal ?? { x: 0.5, y: 0.5 });
    setVisuals((vis) => ({ ...vis, cover: { mediaId: row.id } }));
  };

  // ---- gallery
  const gallery = v.gallery;
  const [sel, setSel] = useState<string | null>(gallery[0]?.mediaId ?? null);
  const upload = useUpload({ images: true });
  const setGallery = (fn: (g: Gallery) => Gallery) => {
    setVisuals((vis) => ({ ...vis, gallery: fn(vis.gallery) }));
  };
  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const rows = await upload.upload(files);
    if (rows.length === 0) return;
    await addRows(rows);
    setGallery((g) => [...g, ...rows.map((r) => ({ mediaId: r.id }))]);
    setSel(rows[0]?.id ?? null);
  };
  const altOf = (g: MediaRef) => g.alt ?? byId.get(g.mediaId)?.alt ?? "";
  const missing = gallery.filter((g) => !g.decorative && !altOf(g).trim()).length;
  const selIdx = gallery.findIndex((g) => g.mediaId === sel);
  const selItem = selIdx >= 0 ? gallery[selIdx] : undefined;
  const patchSel = (p: Partial<Gallery[number]>) => {
    setGallery((g) => g.map((x, i) => (i === selIdx ? { ...x, ...p } : x)));
  };
  const moveSel = (dir: number) => {
    const j = selIdx + dir;
    if (selIdx < 0 || j < 0 || j >= gallery.length) return;
    setGallery((g) => {
      const arr = g.slice();
      const [it] = arr.splice(selIdx, 1);
      if (it) arr.splice(j, 0, it);
      return arr;
    });
    announce(`Moved to position ${j + 1} of ${gallery.length}.`);
  };
  const removeSel = () => {
    if (!selItem) return;
    const at = selIdx;
    const item = selItem;
    setGallery((g) => g.filter((_, i) => i !== at));
    const next = gallery.filter((_, i) => i !== at)[Math.min(at, gallery.length - 2)];
    setSel(next?.mediaId ?? null);
    toast.show({
      message: "Removed from the gallery. The file stays in your media library.",
      action: {
        label: "Undo",
        onAction: () => {
          setGallery((g) => [...g.slice(0, at), item, ...g.slice(at)]);
          setSel(item.mediaId);
        },
      },
    });
  };

  return (
    <EditorCols
      asideLabel="Image details"
      aside={
        <div className={cx("card", styles.details)}>
          {selItem ? (
            <GalleryDetails
              item={selItem}
              row={byId.get(selItem.mediaId)}
              src={url(selItem.mediaId)}
              position={selIdx + 1}
              count={gallery.length}
              onPatch={patchSel}
              onMove={moveSel}
              onRemove={removeSel}
            />
          ) : (
            <div className={styles.noSel}>
              <StudioIcon name="media" size={28} />
              Select a gallery image to edit its alt text and caption.
            </div>
          )}
        </div>
      }
    >
      <Sec
        id="s-hero"
        title="Top of the page"
        sub="What a visitor meets first, under the title."
        aside={
          <div className="seg" role="group" aria-label="Hero type">
            {(
              [
                ["image", "Image"],
                ["video", "Video"],
                ["prototype", "Prototype"],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                aria-pressed={hero.type === t}
                onClick={() => {
                  setHero(t);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {hero.type === "prototype" ? (
          <PrototypeHero
            hero={hero}
            showErrors={e.showErrors}
            onChange={(h) => {
              setVisuals((vis) => ({ ...vis, hero: h }));
            }}
            check={(u) => repo.checkLink(u, "prototype")}
            posterSrc={hero.poster?.mediaId ? url(hero.poster.mediaId) : ""}
            onPoster={(files) => {
              void (async () => {
                if (!files?.length) return;
                const rows = await coverUpload.upload([...files].slice(0, 1));
                const row = rows[0];
                if (!row) return;
                await addRows(rows);
                setVisuals((vis) =>
                  vis.hero.type === "prototype"
                    ? { ...vis, hero: { ...vis.hero, poster: { mediaId: row.id } } }
                    : vis,
                );
              })();
            }}
          />
        ) : null}
        {hero.type === "video" ? (
          <VideoHero
            hero={hero}
            showErrors={e.showErrors}
            onChange={(h) => {
              setVisuals((vis) => ({ ...vis, hero: h }));
            }}
          />
        ) : null}
        {hero.type === "image" ? (
          <div className={styles.note}>
            <StudioIcon name="media" />
            Uses the cover image below, cropped to 16:10.
          </div>
        ) : null}
      </Sec>

      <Sec
        id="s-accent"
        title="Accent colour"
        sub="The project’s colour on the site: its volume tag, chapter and step numbers, highlighted table rows, and the generated cover if there’s no image."
      >
        <div role="radiogroup" aria-labelledby="s-accent" className={styles.swatches}>
          {ACCENTS.map((a) => {
            const used = sameShelf.get(a);
            return (
              <button
                key={a}
                type="button"
                className={styles.swatch}
                role="radio"
                aria-checked={v.accent === a}
                aria-label={`${ACCENT_NAMES[a]}${used ? `, also used by ${used}` : ""}`}
                style={{ background: ACCENT_COLOURS[a].accent }}
                onClick={() => {
                  setVisuals((vis) => ({ ...vis, accent: a }));
                  announce(`${ACCENT_NAMES[a]} chosen`);
                }}
              />
            );
          })}
        </div>
        <div className={styles.hrow}>
          <span className={styles.hint}>{accHint}</span>
        </div>
      </Sec>

      <Sec
        id="s-cover"
        title="Cover image and crops"
        sub="Click the image, or focus it and use the arrow keys, to choose what stays in frame. Every crop updates."
      >
        {cover ? (
          <>
            <div className={styles.coverRow}>
              <button
                type="button"
                id="f-cover"
                className={styles.focal}
                onClick={onFocalClick}
                onKeyDown={onFocalKey}
                aria-label={`Focal point at ${Math.round(focal.x * 100)}% across, ${Math.round(focal.y * 100)}% down. Use arrow keys to move it.`}
              >
                <img src={url(cover.id)} alt="" className={styles.focalImg} />
                <span className={styles.fp} style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }} />
              </button>
              <div className={styles.crops}>
                {(
                  [
                    [208, 130, "Homepage card · 16:10"],
                    [112, 140, "Mobile · 4:5"],
                    [248, 130, "Link preview · 1.91:1"],
                  ] as const
                ).map(([w, h, label]) => (
                  <div key={label}>
                    <div className={styles.crop} style={{ width: w, height: h }}>
                      <img
                        src={url(cover.id)}
                        alt=""
                        className={styles.cropImg}
                        style={{ objectPosition: `${focal.x * 100}% ${focal.y * 100}%` }}
                      />
                    </div>
                    <div className={styles.cropLabel}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.fld}>
              <TextArea
                id="f-coverAlt"
                label="Cover alt text"
                required
                value={coverAlt}
                minHeight={64}
                maxLength={SOFT_LIMITS.alt}
                onChange={(ev) => {
                  const alt = ev.target.value;
                  setVisuals((vis) => ({ ...vis, cover: { ...(vis.cover ?? { mediaId: cover.id }), alt } }));
                }}
                hint="Describe what the image shows. Skip “image of”."
                error={
                  coverAlt.trim()
                    ? undefined
                    : "Add alt text so screen reader users get the same information."
                }
                counter={{ limit: SOFT_LIMITS.alt }}
              />
            </div>
            <label className={cx(buttons.btn, styles.replace)}>
              Replace cover
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(ev) => void pickCover(ev.target.files)}
              />
            </label>
          </>
        ) : (
          <label className={styles.add} id="f-cover">
            <StudioIcon name="upload" size={22} />
            Add a cover image
            <span className={styles.addNote}>PNG, JPG, WebP or GIF · up to 10 MB</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(ev) => void pickCover(ev.target.files)}
            />
          </label>
        )}
        <UploadProblems items={coverUpload.items} onDismiss={coverUpload.dismiss} />
      </Sec>

      <Sec
        id="s-gal"
        title="Gallery"
        sub="Shown as a swipeable strip under the prototype. Select an image to edit its alt text, caption and position."
        aside={
          missing > 0 ? (
            <span className={cx("chip", styles.warnChip)}>
              {missing} {missing === 1 ? "needs" : "need"} alt text
            </span>
          ) : undefined
        }
      >
        <div className={styles.grid} id="f-gallery">
          {gallery.map((g) => {
            const row = byId.get(g.mediaId);
            const miss = !g.decorative && !altOf(g).trim();
            const chip = miss
              ? ["Needs alt text", styles.chipWarn]
              : g.decorative
                ? ["Decorative", styles.chipMuted]
                : ["Alt text ✓", styles.chipOk];
            const cap = g.caption || row?.filename || "Image";
            return (
              <button
                key={g.mediaId}
                type="button"
                className={styles.gt}
                aria-pressed={g.mediaId === sel}
                aria-label={`${cap}, ${chip[0]}`}
                onClick={() => {
                  setSel(g.mediaId);
                }}
              >
                <span className={styles.ph} aria-hidden="true">
                  {url(g.mediaId) ? <img src={url(g.mediaId)} alt="" /> : null}
                </span>
                <span className={styles.cap}>{cap}</span>
                <span className={cx("chip", styles.tileChip, chip[1])}>{chip[0]}</span>
              </button>
            );
          })}
          {upload.items
            .filter((i) => i.state !== "done")
            .map((i) => (
              <div
                key={i.key}
                className={styles.gt}
                aria-label={`${i.name}, ${i.state === "failed" ? "Failed" : "Uploading"}`}
              >
                <span className={styles.ph}>
                  {i.state === "uploading" ? (
                    <span className={styles.upOver}>
                      Uploading {Math.round(i.fraction * 100)}%
                      <span className={styles.bar}>
                        <span style={{ width: `${Math.round(i.fraction * 100)}%` }} />
                      </span>
                    </span>
                  ) : (
                    <span className={styles.failOver}>
                      <Icon name="alert-circle" />
                      <strong>{i.message?.startsWith(i.size) ? "Too large" : "Couldn’t upload"}</strong>
                      {i.message?.startsWith(i.size) ? `${i.size} · max 10 MB` : i.message}
                    </span>
                  )}
                </span>
                <span className={styles.cap}>{i.name}</span>
                <span
                  className={cx(
                    "chip",
                    styles.tileChip,
                    i.state === "failed" ? styles.chipErr : styles.chipMuted,
                  )}
                >
                  {i.state === "failed" ? "Failed" : "Uploading"}
                </span>
                {i.state === "failed" ? (
                  <button
                    type="button"
                    className={styles.dismiss}
                    aria-label={`Remove ${i.name}`}
                    onClick={() => {
                      upload.dismiss(i.key);
                    }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                ) : null}
              </div>
            ))}
          <label className={styles.addTile}>
            <StudioIcon name="upload" size={22} />
            Add images
            <span className={styles.addNote}>PNG, JPG, WebP or GIF · up to 10 MB</span>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,image/heic"
              className="sr-only"
              onChange={(ev) => {
                void addImages(ev.target.files);
                ev.target.value = "";
              }}
            />
          </label>
        </div>
      </Sec>
    </EditorCols>
  );
}

function UploadProblems({
  items,
  onDismiss,
}: {
  items: ReturnType<typeof useUpload>["items"];
  onDismiss: (k: string) => void;
}) {
  const failed = items.filter((i) => i.state === "failed");
  if (failed.length === 0) return null;
  return (
    <div className={styles.problems}>
      {failed.map((i) => (
        <div key={i.key} className={styles.problem} role="alert">
          <Icon name="alert-circle" />
          <span>
            <strong>{i.name}</strong> {i.message}
          </span>
          <button
            type="button"
            className="ib"
            aria-label={`Dismiss ${i.name}`}
            onClick={() => {
              onDismiss(i.key);
            }}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function GalleryDetails({
  item,
  row,
  src,
  position,
  count,
  onPatch,
  onMove,
  onRemove,
}: {
  item: Gallery[number];
  row: MediaRow | undefined;
  src: string;
  position: number;
  count: number;
  onPatch: (p: Partial<Gallery[number]>) => void;
  onMove: (dir: number) => void;
  onRemove: () => void;
}) {
  const alt = item.alt ?? row?.alt ?? "";
  const deco = Boolean(item.decorative);
  return (
    <div className={styles.selBox}>
      <div className="mono">
        Image {position} of {count}
      </div>
      <div className={styles.selImg}>{src ? <img src={src} alt="" /> : null}</div>
      <div className={styles.fld} style={{ marginTop: 16 }}>
        {deco ? (
          <>
            <span className={styles.lbl}>
              Alt text <span className={styles.req}>Not needed</span>
            </span>
            <div className={styles.decoNote}>
              Marked decorative, so no alt text is needed. Use this only for images a reader wouldn’t miss.
            </div>
          </>
        ) : (
          <TextArea
            id="f-alt"
            label="Alt text"
            required
            value={alt}
            minHeight={96}
            maxLength={SOFT_LIMITS.alt}
            onChange={(ev) => {
              onPatch({ alt: ev.target.value });
            }}
            hint="What the screen shows and why it matters."
            error={alt.trim() ? undefined : "Add alt text, or mark it decorative."}
            counter={{ limit: SOFT_LIMITS.alt }}
          />
        )}
      </div>
      <button
        type="button"
        className={styles.chk}
        role="switch"
        aria-checked={deco}
        onClick={() => {
          onPatch({ decorative: !deco });
        }}
      >
        <span aria-hidden="true" className={styles.trk} style={{ background: deco ? "#141416" : "#D2D0CA" }}>
          <span className={styles.knb} style={{ left: deco ? 18 : 2 }} />
        </span>
        Decorative: screen readers skip it
      </button>
      <div className={styles.fld}>
        <TextField
          id="f-cap"
          label="Caption"
          value={item.caption ?? ""}
          onChange={(ev) => {
            onPatch({ caption: ev.target.value });
          }}
        />
      </div>
      <div className={styles.posRow}>
        <span className={styles.posLbl}>Position</span>
        <span className={styles.flex} />
        <button
          type="button"
          className={cx("ib", styles.posBtn)}
          aria-label="Move earlier"
          disabled={position === 1}
          onClick={() => {
            onMove(-1);
          }}
        >
          <StudioIcon name="back" />
        </button>
        <span className={styles.posNum}>
          {position} / {count}
        </span>
        <button
          type="button"
          className={cx("ib", styles.posBtn)}
          aria-label="Move later"
          disabled={position === count}
          onClick={() => {
            onMove(1);
          }}
        >
          <Icon name="chevron-right" />
        </button>
      </div>
      <button type="button" className={styles.remove} onClick={onRemove}>
        Remove from gallery
      </button>
    </div>
  );
}

function VideoHero({
  hero,
  showErrors,
  onChange,
}: {
  hero: Extract<Hero, { type: "video" }>;
  showErrors: boolean;
  onChange: (h: Hero) => void;
}) {
  const [text, setText] = useState(hero.url);
  const host = videoHost(text.trim());
  const bad = (text.trim() !== "" && !host) || (showErrors && !host);
  return (
    <div className={styles.heroBody}>
      <TextField
        id="f-hero"
        label="Video link"
        value={text}
        placeholder="https://youtu.be/…"
        onChange={(ev) => {
          const t = ev.target.value;
          setText(t);
          const h = videoHost(t.trim());
          onChange({ ...hero, url: h ? t.trim() : "" });
        }}
        hint="YouTube, Vimeo, Loom or Google Drive. Video files aren’t uploaded: links keep the page fast and stay inside free storage."
        error={
          bad
            ? "That link isn’t from YouTube, Vimeo, Loom or Google Drive. Paste the share link from one of them."
            : undefined
        }
      />
      {host ? (
        <div className={styles.vidOk}>
          <span className={styles.vidThumb}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className={styles.vidText}>
            <strong>{host} video</strong>
            <span>
              {host === "Google Drive"
                ? "Set sharing to “Anyone with the link”; Studio checks it before publishing. Drive’s player can’t autoplay or loop."
                : `Embeds in privacy mode. Captions come from ${host}, so add them there.`}
            </span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function PrototypeHero({
  hero,
  showErrors,
  onChange,
  check,
  posterSrc,
  onPoster,
}: {
  hero: Extract<Hero, { type: "prototype" }>;
  showErrors: boolean;
  onChange: (h: Hero) => void;
  check: (url: string) => Promise<{ status: LinkStatus; detail?: string }>;
  posterSrc: string;
  onPoster: (files: FileList | null) => void;
}) {
  const [text, setText] = useState(hero.url);
  const [result, setResult] = useState<{
    url: string;
    status: LinkStatus;
    detail?: string | undefined;
  } | null>(null);
  const problem = prototypeProblem(text, showErrors);
  const trimmed = text.trim();
  useEffect(() => {
    if (!trimmed || prototypeProblem(trimmed, true)) return;
    let live = true;
    const t = setTimeout(() => {
      void check(trimmed).then((r) => {
        if (live) setResult({ url: trimmed, ...r });
      });
    }, 500);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [trimmed, check]);
  const r = result?.url === trimmed ? result : null;
  const loginError =
    r?.status === "login"
      ? "This is a Vercel preview link, which asks visitors to log in. Paste the production address instead."
      : "";
  const shown = problem || loginError;
  const [w, h, radius, border] = FRAMES[hero.frame];
  const lines: { ok: boolean; t: string }[] =
    r && !shown
      ? [
          { ok: true, t: "Opens without a login." },
          r.status === "no-frame"
            ? {
                ok: false,
                t: "This site doesn’t allow embedding, so visitors get an “Open prototype ↗” button instead of the frame.",
              }
            : { ok: true, t: "Loads inside a frame on your page." },
          ...(r.detail === "figma" ? [{ ok: true, t: "Figma prototype: it plays in Figma’s embed." }] : []),
        ]
      : [];
  return (
    <div className={styles.protoRow}>
      <div className={styles.protoFields}>
        <TextField
          id="f-hero"
          label="Prototype link"
          mono
          value={text}
          placeholder="https://your-prototype.vercel.app"
          onChange={(ev) => {
            const t = ev.target.value;
            setText(t);
            onChange({ ...hero, url: prototypeProblem(t, true) ? "" : t.trim() });
          }}
          hint="Deploy it, for example on Vercel, and paste its public address. Figma prototype links work too."
          error={shown || undefined}
        />
        {lines.length > 0 ? (
          <div className={styles.checks}>
            {lines.map((l) => (
              <div key={l.t} className={l.ok ? styles.checkOk : styles.checkWarn}>
                <Icon name={l.ok ? OK : "alert"} size={16} />
                <span>{l.t}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className={styles.fld}>
          <span className={styles.lbl}>Poster image</span>
          <div className={styles.poster}>
            <span className={styles.posterThumb}>{posterSrc ? <img src={posterSrc} alt="" /> : null}</span>
            <span className={styles.posterText}>Shown until a visitor loads the prototype.</span>
            <label className={cx(buttons.btn, styles.small)}>
              {posterSrc ? "Replace" : "Add"}
              <span className="sr-only"> poster image</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(ev) => {
                  onPoster(ev.target.files);
                }}
              />
            </label>
          </div>
        </div>
        <div className={styles.fld}>
          <Segmented
            label="Frame"
            options={[
              { value: "phone", label: "Phone" },
              { value: "tablet", label: "Tablet" },
              { value: "desktop", label: "Desktop" },
              { value: "none", label: "None" },
            ]}
            value={hero.frame}
            onChange={(frame) => {
              onChange({ ...hero, frame });
            }}
          />
        </div>
        <div className={styles.fld}>
          <Segmented
            label="Starts"
            options={[
              { value: "click", label: "On click" },
              { value: "visible", label: "When scrolled into view" },
            ]}
            value={hero.start}
            onChange={(start) => {
              onChange({ ...hero, start });
            }}
          />
          <div className={styles.hrow}>
            <span className={styles.hint}>
              {hero.start === "click"
                ? "Keeps the page fast: the prototype loads only when someone asks for it."
                : "Loads as it scrolls into view. Heavier, but it feels instant."}
            </span>
          </div>
        </div>
        <div className={styles.sandbox}>
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "var(--ok)" }}>
            <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
            <path d="M8.5 12l2.5 2.5 4.5-5" />
          </svg>
          <span>
            Prototypes load from their own address inside a sandboxed frame, so they can’t read your site,
            your visitors’ cookies or Studio. Use the production address: on Vercel, preview links ask
            visitors to log in.
          </span>
        </div>
      </div>
      <div className={styles.framePv} aria-label="Frame preview" role="img">
        <div className={styles.frameBox} style={{ width: w, height: h, borderRadius: radius, border }}>
          <div style={{ height: "22%", background: "#C7372F" }} />
          <div style={{ margin: "8% 9% 0", height: "8%", borderRadius: 4, background: "#E9E3DC" }} />
          <div style={{ margin: "7% 9% 0", height: "24%", borderRadius: 6, background: "#F5A524" }} />
        </div>
      </div>
    </div>
  );
}
