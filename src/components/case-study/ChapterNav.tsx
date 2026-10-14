import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { chapterNumber } from "~/lib/case-study";

import { cx } from "../cx";
import { Icon } from "../icons";
import styles from "./CaseStudy.module.css";

export interface ChapterLink {
  anchor: string;
  title: string;
}

interface ChapterNavProps {
  chapters: ChapterLink[];
  current: string | null;
}

// Server renders have no layout; the browser measures before paint.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The laptop's sticky rail (M-CHAPTER-RAIL): "Chapters · N", the 2px progress line, then each
 * chapter, the current one highlighted with the 3px marker sliding to it.
 */
export function ChapterRail({ chapters, current }: ChapterNavProps) {
  const list = useRef<HTMLOListElement>(null);
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(null);

  useIsoLayoutEffect(() => {
    const place = () => {
      const link = list.current?.querySelector<HTMLElement>('a[aria-current="true"]');
      setMarker(link ? { top: link.offsetTop, height: link.offsetHeight } : null);
    };
    place();
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
    };
  }, [current]);

  return (
    <nav className={cx(styles.rail, styles.notIpad, styles.notPhone)} aria-label="Chapters">
      <div className={styles.railInner}>
        <div className={cx(styles.mono, styles.railHead)}>Chapters · {chapters.length}</div>
        <div className={styles.line} aria-hidden="true">
          <span />
        </div>
        <ol ref={list} className={styles.toc}>
          {chapters.map((c, i) => (
            <li key={c.anchor}>
              <a href={`#${c.anchor}`} aria-current={c.anchor === current ? "true" : undefined}>
                <span className={styles.tocNum}>{chapterNumber(i)}</span>
                {c.title}
              </a>
            </li>
          ))}
          {marker ? (
            <li
              className={styles.marker}
              aria-hidden="true"
              style={{ height: marker.height, transform: `translateY(${marker.top}px)` }}
            />
          ) : null}
        </ol>
      </div>
    </nav>
  );
}

/**
 * The chapter bar for iPad and phones (`.cbar`): "01 / 08", the current chapter and "Chapters ▾".
 * It's one button that opens the chapter sheet under it (M-CHAPTER-SHEET); choosing a chapter
 * closes the sheet and scrolls there. Esc or a click outside closes it.
 */
export function ChapterBar({ chapters, current }: ChapterNavProps) {
  const [open, setOpen] = useState(false);
  const sheetId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const index = Math.max(
    0,
    chapters.findIndex((c) => c.anchor === current),
  );
  const total = chapterNumber(chapters.length - 1);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={wrap} className={cx(styles.barWrap, styles.notLaptop)}>
      <button
        ref={button}
        type="button"
        className={styles.bar}
        aria-label="Jump to chapter"
        aria-expanded={open}
        aria-controls={sheetId}
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        <span className={styles.barNum}>{chapterNumber(index)}</span>
        <span className={styles.barCount}>
          {chapterNumber(index)} / {total}
        </span>
        <span className={styles.barTitle}>{chapters[index]?.title}</span>
        <span className={styles.barMore}>
          <span className={styles.barMoreLabel}>Chapters</span>
          <Icon name="chevron-down" size={16} className={styles.chev} />
        </span>
      </button>
      <div className={styles.line} aria-hidden="true">
        <span />
      </div>
      <nav id={sheetId} className={styles.sheet} aria-label="Chapters" hidden={!open}>
        <div className={cx(styles.mono, styles.sheetHead)}>Chapters · {chapters.length}</div>
        <ol>
          {chapters.map((c, i) => (
            <li key={c.anchor}>
              <a
                href={`#${c.anchor}`}
                aria-current={c.anchor === current ? "true" : undefined}
                onClick={() => {
                  setOpen(false);
                  // The link hides with the sheet; focus follows the reader to the chapter (QA-D5).
                  document.getElementById(`${c.anchor}-t`)?.focus({ preventScroll: true });
                }}
              >
                <span className={styles.sheetNum}>{chapterNumber(i)}</span>
                {c.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
