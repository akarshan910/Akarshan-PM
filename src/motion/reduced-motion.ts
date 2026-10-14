/**
 * Reduced motion (04 · Ground rules 1 and 9). The inline bootstrap marks `<html>` with `still` before
 * first paint when `prefers-reduced-motion: reduce` matches; CSS keys off both `html.still` and the
 * media query. Script reads it here: `prefersReducedMotion()` at the moment of an event, and
 * `useReducedMotion()` for anything rendered, which updates live when the setting or the class
 * changes. A live change of the setting also keeps the `still` class in step.
 */
import { useSyncExternalStore } from "react";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function query(): MediaQueryList | undefined {
  return typeof matchMedia === "function" ? matchMedia(REDUCED_MOTION_QUERY) : undefined;
}

/** True under the visitor's reduced-motion setting, or when `<html>` is marked `still`. */
export function prefersReducedMotion(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.classList.contains("still")) return true;
  return query()?.matches ?? false;
}

function subscribe(onChange: () => void): () => void {
  const root = document.documentElement;
  const mq = query();
  const onQuery = () => {
    root.classList.toggle("still", mq?.matches ?? false);
    onChange();
  };
  // Some test doubles of matchMedia have no listeners; the class observer still works there.
  const listens = mq !== undefined && "addEventListener" in mq;
  if (listens) mq.addEventListener("change", onQuery);
  const observer = new MutationObserver(onChange);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  return () => {
    if (listens) mq.removeEventListener("change", onQuery);
    observer.disconnect();
  };
}

/** Prerendering assumes motion; the first client render corrects it before anything animates. */
function serverSnapshot(): boolean {
  return false;
}

/** Live: re-renders when the reduced-motion setting or the `still` class changes. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, serverSnapshot);
}
