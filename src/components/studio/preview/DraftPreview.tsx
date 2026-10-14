/**
 * Draft preview (05 · Draft preview; StudioPreview): the bar ("Back to editor", "Draft preview ·
 * not public · noindex", Desktop / Tablet / Phone, Highlight changes, Compare with live, Share
 * preview, Publish changes) over the draft drawn with the public components at the device's width.
 * Compare shows the live page beside it, scrolling together.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import { useRepo } from "../data";
import { useShell } from "../shell/ShellContext";
import { useToast } from "../Toast";
import { PreviewFrame } from "./PreviewFrame";
import styles from "./DraftPreview.module.css";
import { PublicPage } from "./PublicPage";
import {
  highlightCss,
  highlights,
  previewLinks,
  previewSite,
  studioNotes,
  type PreviewKind,
  type PreviewSource,
} from "~/lib/studio/preview";

const DEVICES = {
  desk: { label: "Desktop", w: 1280, h: 860, rad: 6, bez: 0, compare: 0.52 },
  tab: { label: "Tablet", w: 834, h: 980, rad: 26, bez: 10, compare: 0.78 },
  phone: { label: "Phone", w: 390, h: 800, rad: 40, bez: 10, compare: 1 },
} as const;
type Device = keyof typeof DEVICES;

const ICON: Record<Device, string> = {
  desk: "M3 5h18v11H3zM8 20h8M12 16v4",
  tab: "M5 3h14v18H5zM11 18h2",
  phone: "M7 3h10v18H7zM11 18h2",
};

export function DraftPreview({ kind, id, source }: { kind: PreviewKind; id: string; source: PreviewSource }) {
  const repo = useRepo();
  const { announce } = useShell();
  const toast = useToast();
  const [device, setDevice] = useState<Device>("desk");
  const [highlight, setHighlight] = useState(true);
  const [compare, setCompare] = useState(false);
  const [share, setShare] = useState<{ open: boolean; url: string | null; copied: boolean }>({
    open: false,
    url: null,
    copied: false,
  });
  const windows = useRef<{ live: Window | null; draft: Window | null }>({ live: null, draft: null });

  const draft = useMemo(() => previewSite(source, kind, id, "draft"), [source, kind, id]);
  const live = useMemo(() => previewSite(source, kind, id, "live"), [source, kind, id]);
  const css = useMemo(
    () => (highlight ? highlightCss(highlights(source, kind, id)) : ""),
    [highlight, source, kind, id],
  );
  const notes = useMemo(() => studioNotes(source, kind, id), [source, kind, id]);
  const links = previewLinks(kind, id);
  const d = DEVICES[device];
  const scale = compare ? d.compare : 1;

  // Compare: the two pages scroll together.
  useEffect(() => {
    if (!compare) return;
    let syncing = false;
    const follow = (from: "live" | "draft") => () => {
      if (syncing) return;
      const a = windows.current[from];
      const b = windows.current[from === "live" ? "draft" : "live"];
      if (!a || !b) return;
      syncing = true;
      const max = a.document.documentElement.scrollHeight - a.innerHeight;
      const ratio = max > 0 ? a.scrollY / max : 0;
      b.scrollTo(0, ratio * (b.document.documentElement.scrollHeight - b.innerHeight));
      requestAnimationFrame(() => {
        syncing = false;
      });
    };
    const fl = follow("live");
    const fd = follow("draft");
    const w = windows.current;
    w.live?.addEventListener("scroll", fl);
    w.draft?.addEventListener("scroll", fd);
    return () => {
      w.live?.removeEventListener("scroll", fl);
      w.draft?.removeEventListener("scroll", fd);
    };
  }, [compare, device]);

  useEffect(() => {
    if (!share.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShare((s) => ({ ...s, open: false }));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [share.open]);

  const openShare = async () => {
    if (share.open) {
      setShare((s) => ({ ...s, open: false }));
      return;
    }
    if (share.url) {
      setShare((s) => ({ ...s, open: true }));
      return;
    }
    try {
      const r = await repo.previews.create(kind, kind === "site" ? undefined : id);
      setShare({ open: true, url: r.url, copied: false });
    } catch {
      toast.show({ message: "Couldn’t create a preview link. Try again.", tone: "error" });
    }
  };
  const copy = async () => {
    if (!share.url) return;
    try {
      await navigator.clipboard.writeText(share.url);
    } catch {
      // The link is on screen to copy by hand.
    }
    setShare((s) => ({ ...s, copied: true }));
    announce("Link copied.");
  };

  const views: { which: "live" | "draft"; data: NonNullable<typeof draft> }[] = [];
  if (compare && live) views.push({ which: "live", data: live });
  if (draft) views.push({ which: "draft", data: draft });

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <Link to={links.back} className={styles.back}>
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to editor
        </Link>
        <h1 className={styles.flag}>
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14 }}>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 018 0v3" />
          </svg>
          Draft preview · not public · noindex
        </h1>
        <span style={{ flex: 1 }} />
        <div className="seg" role="group" aria-label="Device">
          {(Object.keys(DEVICES) as Device[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={device === k}
              onClick={() => {
                setDevice(k);
                announce(`${DEVICES[k].label} preview.`);
              }}
            >
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 15, height: 15 }}>
                <path d={ICON[k]} />
              </svg>
              {DEVICES[k].label}
            </button>
          ))}
        </div>
        {(
          [
            [
              "Highlight changes",
              highlight,
              () => {
                setHighlight(!highlight);
              },
            ],
            [
              "Compare with live",
              compare,
              () => {
                if (!live && !compare) {
                  announce("Not published yet, so there’s no live version to compare.");
                  return;
                }
                setCompare(!compare);
                announce(compare ? "Draft only." : "Comparing live and draft side by side.");
              },
            ],
          ] as const
        ).map(([label, on, toggle]) => (
          <button
            key={label}
            type="button"
            className={styles.sw}
            role="switch"
            aria-checked={on}
            onClick={toggle}
          >
            <span
              className={styles.trk}
              aria-hidden="true"
              style={{ background: on ? "#F2F1EE" : "#4A4A51" }}
            >
              <span
                className={styles.knb}
                style={{ left: on ? 18 : 2, background: on ? "#141416" : "#F2F1EE" }}
              />
            </span>
            {label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <div className={styles.shareWrap}>
          <button
            type="button"
            className={styles.pbtn}
            aria-expanded={share.open}
            onClick={() => void openShare()}
          >
            <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
              <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
            </svg>
            Share preview
          </button>
          {share.open && share.url ? (
            <div role="dialog" aria-label="Share preview link" className={styles.share}>
              <div className={styles.shareTitle}>Anyone with this link can view the draft</div>
              <div className={styles.shareSub}>
                Expires in 7 days. Never indexed. Revoke it from URL &amp; SEO.
              </div>
              <div className={styles.shareRow}>
                <span className={styles.shareUrl}>{share.url}</span>
                <button type="button" className={styles.copy} onClick={() => void copy()}>
                  {share.copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <Link to={links.publish} className={styles.pubc}>
          Publish changes
        </Link>
      </header>
      <main className={styles.main} id="main">
        {views.map((v) => (
          <div key={`${v.which}-${device}`} className={styles.view}>
            {compare ? (
              <div className={styles.cap} style={{ color: v.which === "draft" ? "#F5C66B" : "#9BE7C4" }}>
                <span className={styles.capDot} />
                {v.which === "draft" ? "Draft · what you’ll publish" : "Live · what visitors see now"}
              </div>
            ) : null}
            <div
              className={styles.device}
              style={{
                width: Math.round(d.w * scale),
                height: Math.round(d.h * scale),
                borderRadius: d.rad,
                boxShadow: `0 0 0 ${String(d.bez)}px #121216, 0 30px 70px rgba(0,0,0,.5)`,
              }}
            >
              <PreviewFrame
                title={`${v.which === "draft" ? "Draft" : "Live"} page, ${d.label.toLowerCase()}`}
                width={d.w}
                height={d.h}
                scale={scale}
                onWindow={(w) => {
                  windows.current[v.which] = w;
                }}
              >
                <PublicPage
                  kind={kind}
                  content={v.data.content}
                  slug={v.data.slug}
                  {...(v.which === "draft" ? { css, notes } : {})}
                />
              </PreviewFrame>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
