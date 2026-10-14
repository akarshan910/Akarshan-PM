import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type ImageState = "loading" | "loaded" | "failed";

/** useLayoutEffect in the browser, useEffect while prerendering (no warning on the server). */
const useBrowserLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * The load state of one `<img>` (M-IMG-FADE), shared by C20's Image and the project cover: loading
 * until the file arrives or fails, and `instant` when a prerendered image had already finished before
 * hydration, so it skips the fade. The state belongs to one `src`: a new image starts loading again.
 * `forced` shows one state without loading anything (the catalogue and QA only).
 */
export function useImageLoad(src: string, forced?: ImageState) {
  const ref = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<{ src: string; state: ImageState }>({ src, state: "loading" });
  const [instant, setInstant] = useState(false);
  const state = forced ?? (status.src === src ? status.state : "loading");
  const settle = (next: ImageState) => {
    setStatus({ src, state: next });
  };

  useBrowserLayoutEffect(() => {
    const img = ref.current;
    if (forced || !img?.complete) return;
    setInstant(true);
    settle(img.naturalWidth > 0 ? "loaded" : "failed");
  }, [forced, src]);

  return {
    ref,
    state,
    instant,
    onLoad: () => {
      settle("loaded");
    },
    onError: () => {
      settle("failed");
    },
  };
}
