import { type RefObject, useEffect } from "react";

import { readingProgress } from "~/lib/case-study";

/**
 * M-READ-PROGRESS for a post: scroll progress through `body`, written to `--read` on `root`
 * inside `requestAnimationFrame`, so it never re-renders. It runs under reduced motion too.
 */
export function useReadingProgress(root: RefObject<HTMLElement | null>, body: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = body.current?.getBoundingClientRect();
      if (box)
        root.current?.style.setProperty(
          "--read",
          readingProgress(box.top, box.height, window.innerHeight).toFixed(4),
        );
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [root, body]);
}
