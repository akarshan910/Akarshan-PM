import { type RefObject, useEffect, useState } from "react";

import { currentChapter, readingProgress } from "~/lib/case-study";

/** M-CHAPTER-RAIL: a chapter is current once its top passes 30% of the viewport. */
const LINE = 0.3;

/**
 * Follows the reader through the article. The current chapter (M-CHAPTER-RAIL) is React state,
 * since it changes a handful of times; the reading progress (M-READ-PROGRESS) changes every frame,
 * so it's written to `--read` on `root` inside `requestAnimationFrame` and never re-renders.
 */
export function useChapterSpy(
  root: RefObject<HTMLElement | null>,
  article: RefObject<HTMLElement | null>,
  anchors: readonly string[],
): string | null {
  const [current, setCurrent] = useState<string | null>(anchors[0] ?? null);
  const key = anchors.join(" ");

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const body = article.current?.getBoundingClientRect();
      if (body) {
        const p = readingProgress(body.top, body.height, viewport);
        root.current?.style.setProperty("--read", p.toFixed(4));
      }
      const tops = anchors.flatMap((id) => {
        const node = document.getElementById(id);
        return node ? [{ id, top: node.getBoundingClientRect().top }] : [];
      });
      const next = currentChapter(tops, viewport * LINE);
      setCurrent((was) => (was === next ? was : next));
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    // Crossing the 30% line is what changes the chapter; scrolling drives the progress.
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(schedule, { rootMargin: `0px 0px -${100 - LINE * 100}% 0px` });
      for (const id of anchors) {
        const node = document.getElementById(id);
        if (node) observer.observe(node);
      }
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
    // `key` stands for `anchors`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, root, article]);

  return current;
}
