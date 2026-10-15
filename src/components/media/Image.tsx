import { FETCH_HIGH } from "../cards/Cover";
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
  /**
   * The page's largest image (01 · Performance budget: motion must not delay LCP): eager, high
   * fetch priority, and never hidden waiting for JavaScript, so there's no fade.
   */
  lcp?: boolean;
  /** How the image fills its box. */
  fit?: "cover" | "contain";
  className?: string | undefined;
  /** Shows one state without loading anything. For the component catalogue and QA only. */
  state?: ImageState;
  /** A fixed box ratio such as "16 / 9", cropping the image to it; by default the image's own. */
  ratio?: string;
}

/**
 * C20 · Image (03 · Media, M-IMG-FADE). The box keeps the image's exact aspect ratio and its
 * dominant colour with a slow sheen while loading, fades the image in over 320ms, and shows the
 * alt text in place if the file fails, never the browser's broken-image icon.
 */
export function Image({
  image,
  sizes,
  priority,
  lcp,
  fit = "cover",
  className,
  state: forced,
  ratio,
}: ImageProps) {
  const { ref, state: shown, instant, onLoad, onError } = useImageLoad(image.src, forced);

  const box = cx(styles.box, instant && styles.instant, className);

  return (
    <span
      className={box}
      data-state={shown}
      data-lcp={lcp ? "" : undefined}
      style={{ aspectRatio: ratio ?? `${image.width} / ${image.height}`, backgroundColor: image.dominant }}
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
              loading={priority || lcp ? "eager" : "lazy"}
              decoding={lcp ? "auto" : "async"}
              {...(lcp ? FETCH_HIGH : {})}
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
