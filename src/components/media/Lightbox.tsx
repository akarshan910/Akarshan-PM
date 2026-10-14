import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "../icons";
import { Image } from "./Image";
import styles from "./Lightbox.module.css";
import type { ImageData } from "./types";
import { prefersReducedMotion } from "~/motion/reduced-motion";

import { useModal } from "./useModal";

export interface LightboxItem {
  image: ImageData;
  caption?: string;
}

interface LightboxProps {
  items: LightboxItem[];
  /** The open image, or null when the lightbox is closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  /** Called once the close animation has finished. Focus then returns to the thumbnail. */
  onClose: () => void;
}

/** The close fade (M-LIGHTBOX). */
const CLOSE_MS = 200;
/** How far a swipe has to travel to change image. */
const SWIPE_PX = 40;

/**
 * C20 · Lightbox (03 · Media › Enlarged, M-LIGHTBOX). A modal dialog: arrows, the arrow keys or a
 * swipe move between images, Esc or ✕ closes, and focus returns to the thumbnail that opened it.
 */
export function Lightbox({ items, index, onIndexChange, onClose }: LightboxProps) {
  const open = index !== null && items[index] !== undefined;
  const root = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [closing, setClosing] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function close() {
    if (closing) return;
    if (prefersReducedMotion()) {
      onClose();
      return;
    }
    setClosing(true);
    timer.current = setTimeout(() => {
      setClosing(false);
      onClose();
    }, CLOSE_MS);
  }

  useModal(root, open, close, closeButton, (event) => {
    if (index === null || items.length < 2) return;
    const last = items.length - 1;
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % items.length
        : event.key === "ArrowLeft"
          ? (index + last) % items.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    onIndexChange(next);
  });
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  if (!open || typeof document === "undefined") return null;
  const count = items.length;
  const item = items[index] as LightboxItem;
  const go = (step: number) => {
    onIndexChange((index + step + count) % count);
  };

  return createPortal(
    <div
      ref={root}
      className={closing ? `${styles.root} ${styles.closing}` : styles.root}
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged image"
      tabIndex={-1}
    >
      <div className={styles.backdrop} aria-hidden="true" onClick={close} />
      <div
        className={styles.stage}
        role="presentation"
        onPointerDown={(event) => {
          swipe.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = swipe.current;
          swipe.current = null;
          if (!start || count < 2) return;
          const dx = event.clientX - start.x;
          if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(event.clientY - start.y))
            go(dx < 0 ? 1 : -1);
        }}
      >
        <figure className={styles.figure}>
          <div
            key={index}
            className={styles.frame}
            style={{ ["--ar" as string]: `${item.image.width / item.image.height}` }}
          >
            <Image image={item.image} fit="contain" priority sizes="100vw" />
          </div>
          <figcaption className={`mono ${styles.caption}`} aria-live="polite">
            {count > 1 ? `${index + 1} / ${count}` : null}
            {count > 1 && item.caption ? " · " : null}
            {item.caption}
          </figcaption>
        </figure>
      </div>
      <button
        ref={closeButton}
        type="button"
        className={`${styles.round} ${styles.close}`}
        aria-label="Close"
        onClick={close}
      >
        <Icon name="close" />
      </button>
      {count > 1 ? (
        <>
          <button
            type="button"
            className={`${styles.round} ${styles.prev}`}
            aria-label="Previous image"
            onClick={() => {
              go(-1);
            }}
          >
            <Icon name="chevron-left" />
          </button>
          <button
            type="button"
            className={`${styles.round} ${styles.next}`}
            aria-label="Next image"
            onClick={() => {
              go(1);
            }}
          >
            <Icon name="chevron-right" />
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
