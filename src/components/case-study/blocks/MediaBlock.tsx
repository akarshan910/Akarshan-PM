import { useRef, useState } from "react";

import { Image } from "~/components/media/Image";
import { Lightbox } from "~/components/media/Lightbox";
import type { BlockPublished, Img } from "~/lib/published";

import styles from "./Blocks.module.css";

type MediaBlockType = Extract<BlockPublished, { type: "image" | "gallery" | "beforeafter" }>;
type Props = { block: MediaBlockType };

type Captioned = Img & { caption?: string };

const SIZES = "(max-width: 767px) 100vw, (max-width: 1279px) 770px, 820px";
const GALLERY_SIZES = "(max-width: 767px) 150px, 400px";

/**
 * `image`, `gallery` and `beforeafter` (chapter 05's screens, "Click to enlarge"): each opens the
 * lightbox (M-LIGHTBOX), with focus back on the thumbnail when it closes. Captions sit under the
 * image. On phones a gallery scrolls sideways.
 */
export function MediaBlock({ block }: Props) {
  const items: Captioned[] = block.type === "image" ? [block.media] : block.media;
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  if (items.length === 0) return null;

  const close = () => {
    const at = open;
    setOpen(null);
    if (at !== null) thumbs.current[at]?.focus();
  };

  const thumb = (img: Captioned, i: number, sizes: string) => (
    <button
      ref={(node) => {
        thumbs.current[i] = node;
      }}
      type="button"
      className={styles.enlarge}
      aria-label={img.alt ? `Enlarge: ${img.alt}` : `Enlarge image ${i + 1}`}
      onClick={() => {
        setOpen(i);
      }}
    >
      <Image image={img} sizes={sizes} />
    </button>
  );

  return (
    <>
      {block.type === "image" ? (
        <figure className={styles.figure}>
          {thumb(block.media, 0, SIZES)}
          {block.media.caption ? (
            <figcaption className={styles.caption}>{block.media.caption}</figcaption>
          ) : null}
        </figure>
      ) : (
        <div>
          <ul className={styles.gallery} data-type={block.type}>
            {items.map((img, i) => (
              <li key={`${img.src}-${i}`}>
                <figure className={styles.figure}>
                  {thumb(img, i, GALLERY_SIZES)}
                  {img.caption ? <figcaption className={styles.caption}>{img.caption}</figcaption> : null}
                </figure>
              </li>
            ))}
          </ul>
          {block.type === "gallery" && items.length > 2 ? (
            <div className={styles.swipeHint}>Swipe for more · tap to enlarge</div>
          ) : null}
        </div>
      )}
      <Lightbox
        items={items.map((img) => ({ image: img, ...(img.caption ? { caption: img.caption } : {}) }))}
        index={open}
        onIndexChange={setOpen}
        onClose={close}
      />
    </>
  );
}
