/**
 * M-REVEAL (04): homepage sections after the hero fade in and rise 16px as their top passes 85% of
 * the viewport, once. Their blocks (the header, then each card, row, entry or item) follow 80ms
 * apart, at most five steps. The styles are in `reveal.css`.
 *
 * Nothing is hidden before this runs: the server HTML shows everything, so content is readable
 * without JavaScript and for crawlers (Ground rules 7). On the client a section already on screen
 * is left alone; one below the fold is hidden, then revealed by the observer. Under reduced motion
 * nothing is hidden and nothing moves.
 */
import { useEffect, useRef, type RefObject } from "react";

import { prefersReducedMotion } from "./reduced-motion";

export const REVEAL_MARGIN = "0px 0px -15% 0px";
/** The line the section's top must pass: 85% of the viewport height. */
export const REVEAL_LINE = 0.85;
export const MAX_STEP = 4;
const DURATION_MS = 560;
const STEP_MS = 80;

export const WAIT_CLASS = "rv-wait";
export const RUN_CLASS = "rv-run";

/** The stagger step of the nth block: 0, 1, 2, 3, 4, 4, 4… */
export function revealStep(index: number): number {
  return Math.min(Math.max(0, index), MAX_STEP);
}

/** A block takes part only when it's laid out (hidden layouts for other devices are skipped). */
function shown(el: Element): boolean {
  return el.getClientRects().length > 0;
}

export interface RevealOptions {
  /** Selects the section's blocks, in DOM order. Default: its direct children. */
  blocks?: string;
  /** Called once when the section is revealed (or straight away when it's left alone). */
  onReveal?: () => void;
  /** Called when the section is hidden, waiting for the observer. */
  onWait?: () => void;
}

/**
 * Prepares one section. Returns a cleanup function. Without IntersectionObserver, under reduced
 * motion, or when the section is already on screen, it does nothing but call `onReveal`.
 */
export function setupReveal(section: HTMLElement, options: RevealOptions = {}): () => void {
  const { onReveal, onWait } = options;
  const view = typeof window === "undefined" ? 0 : window.innerHeight;
  const already = section.getBoundingClientRect().top < view * REVEAL_LINE;
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined" || already) {
    onReveal?.();
    return () => undefined;
  }

  const blocks = [...section.querySelectorAll<HTMLElement>(options.blocks ?? ":scope > *")].filter(shown);
  blocks.forEach((el, i) => {
    el.dataset.revealStep = String(revealStep(i));
  });
  section.classList.add(WAIT_CLASS);
  onWait?.();

  let done: ReturnType<typeof setTimeout> | undefined;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      section.classList.add(RUN_CLASS);
      section.classList.remove(WAIT_CLASS);
      onReveal?.();
      // Once the last block has landed, the blocks get their own transitions back (hover etc.).
      done = setTimeout(
        () => {
          section.classList.remove(RUN_CLASS);
          for (const el of blocks) delete el.dataset.revealStep;
        },
        DURATION_MS + STEP_MS * MAX_STEP + 40,
      );
    },
    { rootMargin: REVEAL_MARGIN },
  );
  observer.observe(section);

  return () => {
    observer.disconnect();
    clearTimeout(done);
    section.classList.remove(WAIT_CLASS, RUN_CLASS);
    for (const el of blocks) delete el.dataset.revealStep;
  };
}

/** React wrapper: reveals the element the ref points at, once, after hydration. */
export function useReveal<T extends HTMLElement>(options: RevealOptions = {}): RefObject<T> {
  const ref = useRef<T>(null);
  const opts = useRef(options);
  useEffect(() => {
    opts.current = options;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return setupReveal(el, {
      ...(opts.current.blocks ? { blocks: opts.current.blocks } : {}),
      onReveal: () => opts.current.onReveal?.(),
      onWait: () => opts.current.onWait?.(),
    });
  }, []);
  return ref;
}
