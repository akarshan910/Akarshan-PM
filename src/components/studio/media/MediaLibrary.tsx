/**
 * Media (05 · Media; StudioMedia › uploading, needs alt text, delete blocked, empty filter;
 * StudioMobile › Upload sheet): the storage meter, upload by drop or browse with the upload
 * problems, the filters and search, the grid, and the detail panel with alt text, "Used in",
 * Replace file, Download and Delete….
 */
import * as RadixDialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router";

import { cx } from "../../cx";
import { Icon } from "../../icons";
import buttons from "../Button.module.css";
import { useRepo, useStudio } from "../data";
import { useShell } from "../shell/ShellContext";
import { StudioIcon } from "../StudioIcon";
import { useToast } from "../Toast";
import styles from "./MediaLibrary.module.css";
import { useUpload } from "./useUpload";
import { relative } from "~/lib/studio/format";
import type { MediaRow, MediaUse } from "~/lib/studio/repo";
import { formatBytes } from "~/lib/studio/upload";

type Filter = "all" | "img" | "doc";

const ext = (m: MediaRow) =>
  (m.filename.split(".").pop() ?? (m.kind === "document" ? "pdf" : "img")).toUpperCase();

export function MediaLibrary({
  rows: initial,
  uses: initialUses,
  storage,
}: {
  rows: MediaRow[];
  uses: Record<string, MediaUse[]>;
  storage: { used: number; quota: number };
}) {
  const repo = useRepo();
  const { cache } = useStudio();
  const toast = useToast();
  const { announce } = useShell();
  const [rows, setRows] = useState(initial);
  const [uses, setUses] = useState(initialUses);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [needAlt, setNeedAlt] = useState(false);
  const [unused, setUnused] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(initial[0]?.id ?? null);
  const [ask, setAsk] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [drag, setDrag] = useState(false);
  const [used, setUsed] = useState(storage.used);
  const browse = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const upload = useUpload();

  useEffect(() => {
    let live = true;
    void Promise.all(initial.map(async (m) => [m.id, await repo.media.url(m, "960")] as const)).then(
      (pairs) => {
        if (live) setUrls(Object.fromEntries(pairs));
      },
    );
    return () => {
      live = false;
    };
  }, [initial, repo]);

  const needsAlt = (m: MediaRow) => m.kind === "image" && !m.decorative && !m.alt?.trim();
  const isUnused = (m: MediaRow) => (uses[m.id] ?? []).length === 0;
  const shown = rows.filter((m) => {
    if (filter === "img" && m.kind !== "image") return false;
    if (filter === "doc" && m.kind !== "document") return false;
    if (needAlt && !needsAlt(m)) return false;
    if (unused && !isUnused(m)) return false;
    return !q.trim() || m.filename.toLowerCase().includes(q.trim().toLowerCase());
  });
  const current = rows.find((m) => m.id === sel);
  const currentUses = current ? (uses[current.id] ?? []) : [];

  /** Rows that made it, from an upload or a retry: into the grid, selected, counted. */
  const took = async (done: MediaRow[]) => {
    if (!done.length) return;
    setRows((r) => [...done, ...r]);
    setUses((u) => ({ ...u, ...Object.fromEntries(done.map((d) => [d.id, []])) }));
    for (const d of done) {
      const u = await repo.media.url(d, "960");
      setUrls((x) => ({ ...x, [d.id]: u }));
    }
    setSel(done[0]?.id ?? null);
    setUsed((n) => n + done.reduce((sum, d) => sum + d.bytes, 0));
    cache.invalidate("media");
  };

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const list = [...files];
    const done = await upload.upload(list);
    const failed = list.length - done.length;
    await took(done);
    const first = done[0];
    announce(
      failed > 0
        ? `Uploading ${done.length} ${done.length === 1 ? "file" : "files"}. ${failed} ${failed === 1 ? "file" : "files"} couldn’t be uploaded.`
        : first && first.kind === "image"
          ? `${first.filename} uploaded. Add alt text.`
          : "Uploaded.",
    );
  };

  const patch = async (id: string, p: Partial<Pick<MediaRow, "alt" | "filename">>) => {
    setRows((r) => r.map((m) => (m.id === id ? { ...m, ...p } : m)));
    try {
      const row = await repo.media.update(id, p);
      setRows((r) => r.map((m) => (m.id === id ? row : m)));
    } catch {
      toast.show({ message: "Couldn’t save the file details. Try again.", tone: "error" });
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    void addFiles(e.dataTransfer.files);
  };

  const pct = Math.min(100, (used / storage.quota) * 100);
  const failed = upload.items.filter((i) => i.state === "failed");

  return (
    <>
      <header className={styles.appbar}>
        <h1 className={styles.appTitle}>Media</h1>
        <button
          type="button"
          className={cx(buttons.cta, styles.newIcon)}
          aria-label="Upload"
          onClick={() => {
            setSheet(true);
          }}
        >
          <StudioIcon name="upload" />
        </button>
      </header>
      <main
        className={styles.main}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => {
          setDrag(false);
        }}
        onDrop={onDrop}
      >
        <div className={styles.top}>
          <div>
            <div className="mono">
              <Link to="/studio">Studio</Link> / Media
            </div>
            <h1 className={styles.h1}>Media</h1>
            <p className={styles.lede}>
              Every file you’ve uploaded. Images need alt text before a page that uses them can go live.
            </p>
          </div>
          <div className={styles.topRight}>
            <div className={styles.meter}>
              <div className={styles.meterHead}>
                <span>Storage</span>
                <span>{formatBytes(used)} of 1 GB</span>
              </div>
              <div
                className={styles.bar}
                role="meter"
                aria-label="Storage used"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pct)}
              >
                <span style={{ width: `${pct}%` }} />
              </div>
              <div className={styles.meterNote}>Prototypes and videos are links, so they don’t count.</div>
            </div>
            <button type="button" className={buttons.cta} onClick={() => browse.current?.click()}>
              <StudioIcon name="upload" size={16} />
              Upload
            </button>
          </div>
        </div>
        <input
          ref={browse}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          accept="image/png,image/jpeg,image/webp,image/gif,image/heic,application/pdf"
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className={cx(styles.dz, drag && styles.dzOn)}>
          <StudioIcon name="upload" size={26} style={{ color: "var(--tx3)" }} />
          <div className={styles.dzText}>
            <strong>Drop files here</strong>, or{" "}
            <button type="button" className={styles.browse} onClick={() => browse.current?.click()}>
              browse
            </button>
            . Images up to 10 MB · PDFs up to 10 MB. Prototypes and videos are links: add them in a project’s
            Visuals tab.
          </div>
        </div>

        {upload.items.some((i) => i.state === "uploading") ? (
          <div className={styles.uploading} role="status">
            {upload.items
              .filter((i) => i.state === "uploading")
              .map((i) => (
                <div key={i.key} className={styles.upRow}>
                  <span className={styles.upName}>{i.name}</span>
                  <span className={styles.bar}>
                    <span style={{ width: `${Math.round(i.fraction * 100)}%` }} />
                  </span>
                  <span className={styles.upPct}>{Math.round(i.fraction * 100)}%</span>
                </div>
              ))}
          </div>
        ) : null}
        {failed.length > 0 ? (
          <div className={styles.problems}>
            {failed.map((p) => (
              <div key={p.key} role="alert" className={styles.problem}>
                <Icon name="alert-circle" />
                <span className={styles.problemText}>
                  <strong>{p.name}</strong> ·{" "}
                  {p.message?.match(/^\d/) ? `Too large: ${p.message}` : p.message}
                </span>
                {p.retry ? (
                  <button
                    type="button"
                    className={buttons.btn}
                    style={{ height: 34 }}
                    onClick={() => {
                      void upload.retry(p.key).then(took);
                    }}
                  >
                    Retry
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ib"
                  aria-label="Dismiss"
                  onClick={() => {
                    upload.dismiss(p.key);
                  }}
                >
                  <Icon name="close" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.filters}>
          <div className="seg" role="group" aria-label="File type">
            {(
              [
                ["all", `All ${rows.length}`],
                ["img", `Images ${rows.filter((m) => m.kind === "image").length}`],
                ["doc", `Documents ${rows.filter((m) => m.kind === "document").length}`],
              ] as const
            ).map(([f, label]) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => {
                  setFilter(f);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.fchip}
            aria-pressed={needAlt}
            onClick={() => {
              setNeedAlt(!needAlt);
            }}
          >
            <Icon name="alert" size={15} />
            Needs alt text · {rows.filter(needsAlt).length}
          </button>
          <button
            type="button"
            className={styles.fchip}
            aria-pressed={unused}
            onClick={() => {
              setUnused(!unused);
            }}
          >
            Not used anywhere · {rows.filter(isUnused).length}
          </button>
          <label className={styles.search}>
            <span className="sr-only">Search files</span>
            <input
              type="search"
              className={styles.inp}
              value={q}
              placeholder="Search by file name"
              onChange={(e) => {
                setQ(e.target.value);
              }}
            />
          </label>
        </div>

        <div className={styles.cols}>
          <div className={styles.gridCol}>
            {shown.length > 0 ? (
              <div className={styles.grid}>
                {shown.map((m) => {
                  const n = (uses[m.id] ?? []).length;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={styles.mt}
                      aria-pressed={m.id === sel}
                      aria-label={`${m.filename}, ${n ? `used in ${n}` : "not used"}${needsAlt(m) ? ", needs alt text" : ""}`}
                      onClick={() => {
                        setSel(m.id);
                        setAsk(false);
                      }}
                    >
                      <span className={styles.th} aria-hidden="true">
                        {m.kind === "image" && urls[m.id] ? <img src={urls[m.id]} alt="" /> : null}
                        {m.kind === "document" ? (
                          <span className={styles.doc}>
                            <span />
                            <span />
                            <span />
                            <span />
                          </span>
                        ) : null}
                        <span className={styles.ext}>{ext(m)}</span>
                      </span>
                      <span className={styles.name}>{m.filename}</span>
                      <span className={styles.chips}>
                        <span className={cx("chip", styles.useChip, n === 0 && styles.useNone)}>
                          {n ? `Used in ${n}` : "Not used"}
                        </span>
                        {needsAlt(m) ? (
                          <span className={cx("chip", styles.useChip, styles.warn)}>Needs alt text</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.empty}>
                <StudioIcon name="media" size={28} style={{ color: "var(--tx3)" }} />
                <div className={styles.emptyTitle}>
                  {rows.length === 0
                    ? "No files yet"
                    : q.trim()
                      ? `No files match “${q.trim()}”`
                      : "Nothing here with these filters"}
                </div>
                <div className={styles.emptyText}>
                  {rows.length === 0
                    ? "Drop images or PDFs here. Prototypes and videos are added as links."
                    : "Try another type, or clear the filters."}
                </div>
                {rows.length === 0 ? (
                  <button type="button" className={buttons.btn} onClick={() => browse.current?.click()}>
                    Upload
                  </button>
                ) : (
                  <button
                    type="button"
                    className={buttons.btn}
                    onClick={() => {
                      setFilter("all");
                      setNeedAlt(false);
                      setUnused(false);
                      setQ("");
                    }}
                  >
                    Show all files
                  </button>
                )}
              </div>
            )}
          </div>

          <aside className={styles.side} aria-label="File details">
            <div className={cx("card", styles.details)}>
              {current ? (
                <div className={styles.detail}>
                  <div className={styles.preview}>
                    {current.kind === "image" && urls[current.id] ? (
                      <img src={urls[current.id]} alt="" />
                    ) : (
                      <span className={styles.pdf}>PDF</span>
                    )}
                  </div>
                  <label className={styles.lbl} htmlFor="f-name" style={{ marginTop: 16 }}>
                    File name
                  </label>
                  <input
                    id="f-name"
                    className={cx(styles.inp, styles.mono)}
                    value={current.filename}
                    onChange={(e) => {
                      setRows((r) =>
                        r.map((m) => (m.id === current.id ? { ...m, filename: e.target.value } : m)),
                      );
                    }}
                    onBlur={(e) => {
                      if (e.target.value.trim()) void patch(current.id, { filename: e.target.value.trim() });
                    }}
                  />
                  <div className={styles.meta}>
                    {[
                      ext(current),
                      current.width && current.height ? `${current.width} × ${current.height}` : "",
                      formatBytes(current.bytes),
                      `uploaded ${relative(current.createdAt, new Date()).toLowerCase()}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {current.kind === "document" || current.mime === "image/gif" ? (
                    <p className={styles.hint} style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.5 }}>
                      {current.kind === "document" ? "PDFs" : "GIFs"} go up as they are, so they keep their
                      own details, such as a PDF’s author and title. Photos lose their location and camera
                      data.
                    </p>
                  ) : null}
                  {current.kind === "image" ? (
                    <div className={styles.altBox}>
                      <label className={styles.lbl} htmlFor="f-alt">
                        Alt text <span className={styles.req}>Required to publish</span>
                      </label>
                      <textarea
                        id="f-alt"
                        className={cx(styles.inp, styles.ta, needsAlt(current) && styles.bad)}
                        value={current.alt ?? ""}
                        placeholder="What the image shows and why it matters"
                        aria-invalid={needsAlt(current)}
                        aria-describedby="f-alt-h"
                        onChange={(e) => {
                          const alt = e.target.value;
                          setRows((r) => r.map((m) => (m.id === current.id ? { ...m, alt } : m)));
                        }}
                        onBlur={(e) => {
                          void patch(current.id, { alt: e.target.value });
                        }}
                      />
                      <div className={styles.hrow} id="f-alt-h">
                        {needsAlt(current) && currentUses.length > 0 ? (
                          <span className={styles.err}>
                            Needs alt text: {currentUses.map((u) => u.title).join(", ")}
                          </span>
                        ) : (
                          <span className={styles.hint}>
                            Used wherever this image appears. Projects can override it.
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}
                  <div className={styles.usedTitle}>Used in</div>
                  <div className={styles.usedList}>
                    {currentUses.map((u) => (
                      <Link key={`${u.href}${u.where}`} to={u.href} className={styles.used}>
                        <span>{u.title}</span>
                        <span className={styles.where}>{u.where} →</span>
                      </Link>
                    ))}
                    {currentUses.length === 0 ? (
                      <span className={styles.notUsed}>Not used anywhere yet.</span>
                    ) : null}
                  </div>
                  <div className={styles.acts}>
                    <button
                      type="button"
                      className={buttons.btn}
                      style={{ height: 38 }}
                      onClick={() => replaceInput.current?.click()}
                    >
                      Replace file
                    </button>
                    <input
                      ref={replaceInput}
                      type="file"
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                      accept={
                        current.kind === "image"
                          ? "image/png,image/jpeg,image/webp,image/gif"
                          : "application/pdf"
                      }
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        void repo.media
                          .replace(current.id, {
                            file,
                            filename: file.name,
                            kind: current.kind,
                            mime: file.type,
                          })
                          .then(async (row) => {
                            setRows((r) => r.map((m) => (m.id === row.id ? row : m)));
                            const u = await repo.media.url(row, "960");
                            setUrls((x) => ({ ...x, [row.id]: u }));
                            toast.show({
                              message:
                                currentUses.length > 0
                                  ? `File replaced. ${currentUses.length} ${currentUses.length === 1 ? "page shows" : "pages show"} it after the next publish.`
                                  : "File replaced.",
                            });
                          });
                      }}
                    />
                    {urls[current.id] ? (
                      <a
                        className={buttons.btn}
                        style={{ height: 38 }}
                        href={urls[current.id]}
                        download={current.filename}
                      >
                        Download
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className={styles.dbtn}
                      onClick={() => {
                        setAsk(true);
                      }}
                    >
                      Delete…
                    </button>
                  </div>
                  {ask ? (
                    <div
                      className={styles.ask}
                      style={{ background: currentUses.length ? "var(--warnbg)" : "var(--errbg)" }}
                      role="alert"
                    >
                      <span style={{ color: currentUses.length ? "var(--warn)" : "#7A1A10" }}>
                        {currentUses.length
                          ? `This file is used in ${currentUses.length} ${currentUses.length === 1 ? "place" : "places"}. Remove it from ${currentUses.length === 1 ? "there" : "those places"} first, or use Replace file to swap it everywhere at once.`
                          : `Delete ${current.filename}? It isn’t used anywhere. This can’t be undone.`}
                      </span>
                      <span className={styles.askActs}>
                        <button
                          type="button"
                          className={buttons.btn}
                          style={{ height: 36 }}
                          onClick={() => {
                            setAsk(false);
                          }}
                        >
                          {currentUses.length ? "OK" : "Cancel"}
                        </button>
                        {currentUses.length === 0 ? (
                          <button
                            type="button"
                            className={styles.dfill}
                            onClick={() => {
                              void repo.media.remove(current.id).then((r) => {
                                setAsk(false);
                                if (!r.ok) {
                                  setUses((u) => ({ ...u, [current.id]: r.uses }));
                                  return;
                                }
                                const name = current.filename;
                                setRows((list) => list.filter((m) => m.id !== current.id));
                                setUsed((n) => Math.max(0, n - current.bytes));
                                setSel(null);
                                toast.show({ message: `Deleted ${name}.`, tone: "neutral" });
                                cache.invalidate("media");
                              });
                            }}
                          >
                            Delete file
                          </button>
                        ) : null}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className={styles.noSel}>
                  Select a file to see where it’s used and edit its alt text.
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <UploadSheet
        open={sheet}
        onOpenChange={setSheet}
        items={upload.items}
        rows={rows}
        onFiles={(f) => void addFiles(f)}
        onAlt={(id, alt) => void patch(id, { alt })}
      />
    </>
  );
}

/** StudioMobile › Upload sheet: library, camera or files, then alt text for what was added. */
function UploadSheet({
  open,
  onOpenChange,
  items,
  rows,
  onFiles,
  onAlt,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: ReturnType<typeof useUpload>["items"];
  rows: MediaRow[];
  onFiles: (files: FileList | null) => void;
  onAlt: (id: string, alt: string) => void;
}) {
  const [alts, setAlts] = useState<Record<string, string>>({});
  const waiting = items
    .filter((i) => i.state === "done" && i.row?.kind === "image")
    .map((i) => rows.find((r) => r.id === i.row?.id))
    .filter((r): r is MediaRow => r !== undefined && !r.alt?.trim());
  const pick = (accept: string, capture?: boolean) => (
    <input
      type="file"
      className="sr-only"
      accept={accept}
      multiple={!capture}
      {...(capture ? { capture: "environment" as const } : {})}
      onChange={(e) => {
        onFiles(e.target.files);
        e.target.value = "";
      }}
    />
  );
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <div className="st" style={{ background: "none" }}>
          <RadixDialog.Overlay className={styles.sheetOverlay} />
          <RadixDialog.Content className={styles.sheet} aria-describedby={undefined}>
            <div className={styles.grab} aria-hidden="true" />
            <RadixDialog.Title className={styles.sheetTitle}>Add to your media</RadixDialog.Title>
            <div className={styles.opts}>
              <label className={styles.opt}>
                <StudioIcon name="media" />
                Photo library
                {pick("image/*")}
              </label>
              <label className={styles.opt}>
                <StudioIcon name="camera" />
                Take a photo
                {pick("image/*", true)}
              </label>
              <label className={styles.opt}>
                <StudioIcon name="file" />
                Files · images and PDFs
                {pick("image/png,image/jpeg,image/webp,image/gif,image/heic,application/pdf")}
              </label>
            </div>
            {items
              .filter((i) => i.state === "uploading")
              .map((i) => (
                <div key={i.key} className={styles.sheetUp}>
                  <div className={styles.sheetUpHead}>
                    <span className={styles.mono}>{i.name}</span>
                    <span>{Math.round(i.fraction * 100)}%</span>
                  </div>
                  <div className={styles.bar}>
                    <span style={{ width: `${Math.round(i.fraction * 100)}%` }} />
                  </div>
                </div>
              ))}
            {waiting.map((r) => (
              <form
                key={r.id}
                className={styles.altAsk}
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = (alts[r.id] ?? "").trim();
                  if (v) onAlt(r.id, v);
                }}
              >
                <label htmlFor={`alt-${r.id}`} className={styles.altAskLbl}>
                  Alt text for {r.filename} <span className={styles.altReq}>Required</span>
                </label>
                <textarea
                  id={`alt-${r.id}`}
                  className={cx(styles.inp, styles.ta)}
                  placeholder="What the screen shows and why it matters"
                  value={alts[r.id] ?? ""}
                  onChange={(e) => {
                    setAlts((a) => ({ ...a, [r.id]: e.target.value }));
                  }}
                />
                <div className={styles.altAskActs}>
                  <button type="submit" className={buttons.cta} style={{ height: 42 }}>
                    Save
                  </button>
                </div>
              </form>
            ))}
          </RadixDialog.Content>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
