/**
 * The nav's scroll-spy, ported from the live site's `updateNavSection` (02 · C1, Behaviour 2):
 * the current section is the last one whose top is at or above the nav's bottom edge plus 10px.
 */
import { useEffect, useState, type RefObject } from "react";

export interface SectionTop {
  id: string;
  top: number;
}

/** The section with the lowest top that is still at or above `line`; null when none is. */
export function pickCurrent(tops: readonly SectionTop[], line: number): string | null {
  let current: SectionTop | null = null;
  for (const entry of tops) {
    if (entry.top <= line && (current === null || entry.top >= current.top)) current = entry;
  }
  return current?.id ?? null;
}

/**
 * Tracks the current section among `ids`. One passive scroll listener; layout is read once per
 * animation frame. Disabled, it returns null and listens to nothing.
 */
export function useScrollSpy(
  ids: readonly string[],
  navRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): [string | null, (id: string | null) => void] {
  const [current, setCurrent] = useState<string | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const nav = navRef.current;
      if (!nav) return;
      const line = nav.getBoundingClientRect().bottom + 10;
      const tops: SectionTop[] = [];
      for (const id of key.split("|")) {
        const el = id ? document.getElementById(id) : null;
        if (el) tops.push({ id, top: el.getBoundingClientRect().top });
      }
      setCurrent(pickCurrent(tops, line));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [key, navRef, enabled]);

  return [current, setCurrent];
}
