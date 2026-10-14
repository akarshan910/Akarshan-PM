import { type ReactNode, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { isCrossOriginHttps, prototypeUrl } from "~/lib/links";

import { Icon } from "../icons";
import actions from "../states/actions.module.css";
import { Image } from "./Image";
import styles from "./PrototypeEmbed.module.css";
import type { ImageData } from "./types";
import { useModal } from "./useModal";

export type PrototypeState = "poster" | "loading" | "running" | "error";
export type PrototypeFrame = "phone" | "tablet" | "desktop" | "none";

/** No `load` event within this long switches to "didn't load" (03 · Media › Prototypes). */
export const PROTOTYPE_TIMEOUT_MS = 15_000;

/** Phones, and iPad in portrait, open the prototype as a full-screen sheet (03 · Media). */
export const SHEET_QUERY = "(max-width: 767px), (max-width: 1279px) and (orientation: portrait)";

/** 03 · Media: the prototype iframe's sandbox. */
export const PROTOTYPE_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups";

interface PrototypeEmbedProps {
  /** The deployed prototype's `https:` address, on another origin. */
  url: string;
  /** A screen to open on, relative to `url` (a screen shortcut or the block's "Opens on"). */
  startPath?: string;
  /** The accessible name, e.g. "Sri Mandir prototype": the iframe title and the sheet's heading. */
  name: string;
  /** The poster from Studio, or the project's cover. */
  poster?: ImageData;
  frame?: PrototypeFrame;
  /** "visible" starts loading when the embed scrolls into view (inline only). */
  start?: "click" | "visible";
  /** False when `pm-check-link` found that the host blocks framing: it opens in a new tab. */
  embeddable?: boolean;
  /** `hero.note`: the line under the sheet. */
  note?: string;
  /** "auto" opens the sheet on phones and iPad in portrait, and plays inline elsewhere. */
  layout?: "auto" | "inline" | "sheet";
  /**
   * "bar" draws the embed's own call to action and its New tab ↗ and Exit ✕ bar (a Prototype
   * block). "external" leaves those to the case study's prototype heading, which drives `state`.
   */
  controls?: "bar" | "external";
  /** Controlled state: the case study's heading sets "loading" to explore and "poster" to exit. */
  state?: PrototypeState;
  onStateChange?: (state: PrototypeState) => void;
  /** Shows one state without loading anything. For the component catalogue and QA only. */
  display?: PrototypeState;
  /** With `display`: draw the phone sheet instead of the inline frame. */
  displaySheet?: boolean;
}

function subscribe(query: string) {
  return (notify: () => void) => {
    if (typeof matchMedia !== "function") return () => undefined;
    const list = matchMedia(query);
    list.addEventListener("change", notify);
    return () => {
      list.removeEventListener("change", notify);
    };
  };
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    useCallback((notify: () => void) => subscribe(query)(notify), [query]),
    () => typeof matchMedia === "function" && matchMedia(query).matches,
    () => false,
  );
}

function NewTab({
  href,
  className,
  children,
}: {
  href: string;
  className?: string | undefined;
  children: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * C20 · Prototype embed (03 · Media › Prototypes, M-PROTO). Nothing is requested until the
 * visitor explores. Then a sandboxed iframe loads inside the device frame with a spinner, fades
 * in, and keeps New tab ↗ and Exit ✕ in reach; Esc exits and focus returns to the poster. After
 * 15 seconds without loading it says so. Hosts that block framing open in a new tab instead.
 * On phones and iPad in portrait it opens as a full-screen sheet.
 */
export function PrototypeEmbed({
  url,
  startPath,
  name,
  poster,
  frame = "phone",
  start = "click",
  embeddable = true,
  note,
  layout = "auto",
  controls = "bar",
  state: controlled,
  onStateChange,
  display,
  displaySheet,
}: PrototypeEmbedProps) {
  const src = prototypeUrl(url, startPath);
  const [inner, setInner] = useState<PrototypeState>("poster");
  const [attempt, setAttempt] = useState(0);
  const state = display ?? controlled ?? inner;
  const narrow = useMediaQuery(SHEET_QUERY);
  const sheet = display ? Boolean(displaySheet) : layout === "sheet" || (layout === "auto" && narrow);
  const sheetOpen = sheet && state !== "poster";

  const root = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const posterButton = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetClose = useRef<HTMLButtonElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const previous = useRef<PrototypeState>(state);

  const set = useCallback(
    (next: PrototypeState) => {
      if (controlled === undefined) setInner(next);
      onStateChange?.(next);
    },
    [controlled, onStateChange],
  );

  const explore = useCallback(() => {
    if (!src) return;
    // Only ever framed from another origin (03 · Media); anything else opens in a new tab.
    if (!isCrossOriginHttps(src, window.location.origin)) {
      window.open(src, "_blank", "noopener,noreferrer");
      return;
    }
    setAttempt((n) => n + 1);
    set("loading");
  }, [src, set]);

  const exit = useCallback(() => {
    set("poster");
  }, [set]);

  // 15 seconds without a load event: "didn't load".
  useEffect(() => {
    if (display || state !== "loading") return;
    const timer = setTimeout(() => {
      set("error");
    }, PROTOTYPE_TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [display, state, attempt, set]);

  // Focus: into the frame while it loads, back to the poster when it exits (inline).
  useEffect(() => {
    const was = previous.current;
    previous.current = state;
    if (display || sheet || was === state) return;
    if (state === "poster") posterButton.current?.focus();
    else if (was === "poster") screen.current?.focus();
  }, [state, display, sheet]);

  // Esc exits the inline prototype while focus is on the page.
  useEffect(() => {
    if (display || sheet || state === "poster") return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") exit();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [display, sheet, state, exit]);

  // "When scrolled into view": start loading as the embed appears (inline, embeddable only).
  useEffect(() => {
    const node = root.current;
    if (display || start !== "visible" || !embeddable || sheet || state !== "poster" || !node) return;
    if (typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        explore();
      }
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
    // Only the first appearance starts it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display, start, embeddable, sheet]);

  useModal(sheetRef, sheetOpen && !display, exit, sheetClose);

  if (!src) return null;

  const live = state === "loading" || state === "running";
  const frameNode =
    live && !display ? (
      <iframe
        key={attempt}
        ref={iframe}
        className={styles.iframe}
        src={src}
        title={name}
        sandbox={PROTOTYPE_SANDBOX}
        referrerPolicy="no-referrer"
        allow="fullscreen"
        loading="lazy"
        data-state={state}
        onLoad={() => {
          if (state === "loading") set("running");
          iframe.current?.focus();
        }}
      />
    ) : null;

  const posterArt = poster ? (
    <Image image={{ ...poster, alt: "" }} className={styles.posterImage} />
  ) : (
    <span className={styles.posterGround} aria-hidden="true" />
  );

  const loading = (big: boolean) => (
    <div className={styles.status} role="status">
      <span className={big ? `${styles.spin} ${styles.spinBig}` : styles.spin} aria-hidden="true" />
      <span className={big ? styles.statusLabelPhone : `mono ${styles.statusLabel}`}>
        Loading the prototype…
      </span>
    </div>
  );

  const error = (phone: boolean) => (
    <div className={phone ? `${styles.error} ${styles.errorPhone}` : styles.error} role="alert">
      <div>
        <p className={styles.errorTitle}>The prototype didn’t load.</p>
        <p className={styles.errorText}>
          {phone
            ? "Check your connection and try again, or open it in a new tab."
            : "Try again, or open it in a new tab."}
        </p>
        <div className={styles.errorActions}>
          <button type="button" className={phone ? actions.btn3 : actions.btnx} onClick={explore}>
            Try again
          </button>
          <NewTab href={src} className={phone ? actions.btn3 : actions.btnx}>
            New tab ↗
          </NewTab>
        </div>
      </div>
    </div>
  );

  // What the device's screen shows inline.
  let screenContent;
  if (sheet || state === "poster") {
    screenContent = (
      <>
        {posterArt}
        {controls === "external" && embeddable ? (
          <span className={styles.dim}>
            <button
              ref={(node) => {
                posterButton.current = node;
              }}
              type="button"
              className={styles.bigPlay}
              aria-label="Explore the prototype"
              onClick={explore}
            >
              <Icon name="play" size={26} filled />
            </button>
          </span>
        ) : null}
      </>
    );
  } else if (state === "error") {
    screenContent = error(false);
  } else {
    screenContent = (
      <>
        {state === "loading" ? loading(false) : null}
        {display === "running" ? <span className={styles.runningStandIn}>{posterArt}</span> : frameNode}
      </>
    );
  }

  const showBar = controls === "bar" && !sheet && state !== "poster";
  const showCta = controls === "bar" && (sheet || state === "poster");

  const sheetNode = (
    <PrototypeSheet portal={!display}>
      <div
        ref={sheetRef}
        className={display ? `${styles.sheet} ${styles.sheetInPlace}` : styles.sheet}
        role="dialog"
        aria-modal={display ? undefined : "true"}
        aria-label={name}
        tabIndex={-1}
      >
        <div className={styles.sheetHead}>
          <span className={styles.sheetTitle}>{name}</span>
          <NewTab href={src} className={`${actions.btn3} ${styles.sheetNewTab}`}>
            New tab ↗
          </NewTab>
          <button
            ref={sheetClose}
            type="button"
            className={`${actions.btn3} ${styles.sheetClose}`}
            aria-label="Close the prototype"
            onClick={exit}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className={styles.sheetBody}>
          {state === "loading" ? loading(true) : null}
          {state === "error" ? error(true) : null}
          {display === "running" ? <span className={styles.runningStandIn}>{posterArt}</span> : frameNode}
        </div>
        {note ? <div className={styles.sheetNote}>{note}</div> : null}
      </div>
    </PrototypeSheet>
  );

  // The catalogue draws the open sheet on its own.
  if (display && displaySheet) return sheetNode;

  return (
    <div ref={root} className={styles.root} data-frame={frame} data-controls={controls} data-state={state}>
      {showBar ? (
        <div className={styles.bar}>
          <span className={styles.barTitle}>{name}</span>
          <NewTab href={src} className={`${actions.btn3} ${styles.barButton}`}>
            New tab ↗
          </NewTab>
          <button type="button" className={`${actions.btn3} ${styles.barButton}`} onClick={exit}>
            Exit
            <Icon name="close" />
          </button>
        </div>
      ) : null}
      <div className={styles.stage}>
        <div className={styles.device}>
          <div ref={screen} className={styles.screen} tabIndex={-1}>
            {screenContent}
          </div>
        </div>
        {showCta ? (
          <div className={styles.ctaStrip}>
            {embeddable ? (
              <button
                ref={(node) => {
                  posterButton.current = node;
                }}
                type="button"
                className={actions.ctax}
                onClick={explore}
              >
                Explore the prototype
              </button>
            ) : (
              <NewTab href={src} className={actions.ctax}>
                Open prototype ↗
              </NewTab>
            )}
          </div>
        ) : null}
      </div>
      {embeddable ? null : (
        <p className={styles.blockedNote}>
          This prototype opens in a new tab: its host doesn’t allow embedding.
        </p>
      )}

      {sheetOpen ? sheetNode : null}
    </div>
  );
}

/** The sheet covers the viewport from a portal; the catalogue draws it in place instead. */
function PrototypeSheet({ portal, children }: { portal: boolean; children: ReactNode }) {
  if (!portal || typeof document === "undefined") return <>{children}</>;
  return createPortal(children, document.body);
}
