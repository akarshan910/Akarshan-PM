/**
 * The cover inside a project card (02 · C7): the uploaded image with its focal point, or the
 * generated cover in the project's accent when there's none yet (06 · `cover?`).
 */
import { useCallback, useState, type CSSProperties, type ReactNode } from "react";

import { cx } from "../cx";
import styles from "./Cover.module.css";

export interface CoverImage {
  src: string;
  srcSet?: string | undefined;
  sizes?: string | undefined;
  /** Required on publish. */
  alt: string;
  width?: number | undefined;
  height?: number | undefined;
  /** The focal point, 0–1 across and down (`media.focal`). */
  focal?: { x: number; y: number } | undefined;
}

export interface CoverProps {
  image?: CoverImage | undefined;
  /** `--pa`: the project accent. */
  accent: string;
  /** `--pg`: the cover ground, which holds the box while the image loads. */
  ground: string;
  /** The generated cover's outlined number. Left out where the card draws its own. */
  number?: string | undefined;
  lazy?: boolean;
  className?: string | undefined;
  /** Overlays: the volume tag, the badge, the lead card's big number. */
  children?: ReactNode;
}

type LoadState = "loading" | "loaded" | "failed";

export function Cover({ image, accent, ground, number, lazy = true, className, children }: CoverProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [instant, setInstant] = useState(false);
  // A prerendered image that's already complete at hydration skips the fade (M-IMG-FADE).
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) {
      setInstant(true);
      setState("loaded");
    }
  }, []);
  const style = { "--pa": accent, "--pg": ground } as CSSProperties;

  return (
    <div className={cx(styles.cv, className)} style={style}>
      {image ? (
        state === "failed" ? (
          <span className={styles.alt}>{image.alt}</span>
        ) : (
          <>
            {state === "loading" && <span className={styles.shim} aria-hidden="true" />}
            <img
              ref={ref}
              className={styles.img}
              src={image.src}
              srcSet={image.srcSet}
              sizes={image.sizes}
              alt={image.alt}
              width={image.width}
              height={image.height}
              loading={lazy ? "lazy" : "eager"}
              decoding="async"
              data-state={state}
              data-instant={instant ? "" : undefined}
              style={
                image.focal
                  ? { objectPosition: `${image.focal.x * 100}% ${image.focal.y * 100}%` }
                  : undefined
              }
              onLoad={() => {
                setState("loaded");
              }}
              onError={() => {
                setState("failed");
              }}
            />
          </>
        )
      ) : (
        <>
          <span className={styles.tone} aria-hidden="true" />
          {number && (
            <span className={styles.num} aria-hidden="true">
              {number}
            </span>
          )}
        </>
      )}
      {children}
    </div>
  );
}
