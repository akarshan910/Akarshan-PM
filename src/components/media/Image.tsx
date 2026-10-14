import { cx } from "../cx";
import { Icon } from "../icons";
import styles from "./Image.module.css";
import type { ImageData } from "./types";
import { type ImageState, useImageLoad } from "./useImageLoad";

export type { ImageState } from "./useImageLoad";

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
  const { ref, state: shown, instant, onLoad, onError } = useImageLoad(image.src, forced);

  const box = cx(styles.box, instant && styles.instant, className);

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
              onLoad={onLoad}
              onError={onError}
            />
          )}
          {shown === "loading" ? <span className={styles.shim} aria-hidden="true" /> : null}
        </>
      )}
    </span>
  );
}
