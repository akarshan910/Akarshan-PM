import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Icon } from "../icons";
import styles from "./Image.module.css";
import type { ImageData } from "./types";

export type ImageState = "loading" | "loaded" | "failed";

/** useLayoutEffect in the browser, useEffect while prerendering (no warning on the server). */
const useBrowserLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

interface ImageProps {
  image: ImageData;
  /** The `sizes` attribute for `srcset`. */
  sizes?: string;
  /** Above the fold: load eagerly instead of lazily. */
  priority?: boolean;
  /** How the image fills its box. */
  fit?: "cover" | "contain";
  className?: string | undefined;
  /** Shows one state without loading anything. For the component catalogue and QA only. */
  state?: ImageState;
}

/**
 * C20 · Image (03 · Media, M-IMG-FADE). The box keeps the image's exact aspect ratio and its
 * dominant colour with a slow sheen while loading, fades the image in over 320ms, and shows the
 * alt text in place if the file fails, never the browser's broken-image icon.
 */
export function Image({ image, sizes, priority, fit = "cover", className, state: forced }: ImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  // The state belongs to one `src`: a new image starts loading again.
  const [status, setStatus] = useState<{ src: string; state: ImageState }>({
    src: image.src,
    state: "loading",
  });
  const [instant, setInstant] = useState(false);
  const shown = forced ?? (status.src === image.src ? status.state : "loading");
  const settle = (state: ImageState) => {
    setStatus({ src: image.src, state });
  };

  // A prerendered image that finished before hydration skips the fade (M-IMG-FADE).
  useBrowserLayoutEffect(() => {
    const img = ref.current;
    if (forced || !img?.complete) return;
    setInstant(true);
    settle(img.naturalWidth > 0 ? "loaded" : "failed");
  }, [forced, image.src]);

  const box = [styles.box, instant ? styles.instant : "", className ?? ""].filter(Boolean).join(" ");

  return (
    <span
      className={box}
      data-state={shown}
      style={{ aspectRatio: `${image.width} / ${image.height}`, backgroundColor: image.dominant }}
    >
      {shown === "failed" ? (
        <span className={styles.failed}>
          <span>
            <Icon name="image-off" size={26} className={`ico ${styles.failedIcon}`} />
            {image.alt ? <span className={styles.alt}>{image.alt}</span> : null}
          </span>
        </span>
      ) : (
        <>
          {forced === "loading" ? null : (
            <img
              ref={ref}
              className={styles.img}
              src={image.src}
              srcSet={image.srcset}
              sizes={sizes}
              width={image.width}
              height={image.height}
              alt={image.alt}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              style={fit === "contain" ? { objectFit: "contain" } : undefined}
              onLoad={() => {
                settle("loaded");
              }}
              onError={() => {
                settle("failed");
              }}
            />
          )}
          {shown === "loading" ? <span className={styles.shim} aria-hidden="true" /> : null}
        </>
      )}
    </span>
  );
}
