import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cx } from "../cx";
import { Icon } from "../icons";
import styles from "./Toast.module.css";

/** Undo and "View live ↗" stay for 7 seconds (05 · Shell, Website builder). */
export const TOAST_DURATION = 7000;

export type ToastTone = "success" | "neutral" | "error";

export interface ToastOptions {
  message: string;
  /** success: green tick. neutral: no icon (an undoable delete). error: dark red, alert icon. */
  tone?: ToastTone;
  /** A button, such as Undo or "Try again". */
  action?: { label: string; onAction: () => void };
  /** A link, such as "View live ↗". */
  link?: { label: string; href: string };
  /** Milliseconds before it leaves on its own. Hovering or focusing it pauses the clock. */
  duration?: number | undefined;
}

interface ToastViewProps extends ToastOptions {
  onDismiss?: () => void;
}

/** One toast, as drawn. `ToastProvider` places it bottom centre; the catalogue shows it in place. */
export function Toast({ message, tone = "success", action, link, onDismiss }: ToastViewProps) {
  return (
    <div className={[styles.toast, tone === "error" ? styles.error : ""].filter(Boolean).join(" ")}>
      {tone === "success" ? <Icon name="tick" className={cx("ico", styles.okIco)} /> : null}
      {tone === "error" ? <Icon name="alert-circle" className={cx("ico", styles.errIco)} /> : null}
      <span className={styles.msg}>{message}</span>
      {link ? (
        <a className={styles.act} href={link.href} target="_blank" rel="noreferrer">
          {link.label}
        </a>
      ) : null}
      {action ? (
        <button
          type="button"
          className={styles.act}
          onClick={() => {
            action.onAction();
            onDismiss?.();
          }}
        >
          {action.label}
        </button>
      ) : null}
      {onDismiss ? (
        <button type="button" className={styles.close} aria-label="Dismiss" onClick={onDismiss}>
          <Icon name="close" />
        </button>
      ) : null}
    </div>
  );
}

interface ToastApi {
  /** Shows a toast, replacing the one on screen: one at a time. */
  show: (toast: ToastOptions) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** The toast API. Use inside `ToastProvider`. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast needs a <ToastProvider> above it.");
  return api;
}

/**
 * Holds the one toast on screen and its polite live region. The region stays mounted, so screen
 * readers hear each message once.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { key: number }) | null>(null);
  const [paused, setPaused] = useState(false);
  const key = useRef(0);
  const remaining = useRef(0);
  const started = useRef(0);

  const dismiss = useCallback(() => {
    setToast(null);
  }, []);
  const show = useCallback((next: ToastOptions) => {
    key.current += 1;
    remaining.current = next.duration ?? TOAST_DURATION;
    setPaused(false);
    setToast({ ...next, key: key.current });
  }, []);

  useEffect(() => {
    if (!toast || paused) return;
    const shown = toast.key;
    started.current = Date.now();
    const t = setTimeout(() => {
      setToast(null);
    }, remaining.current);
    return () => {
      clearTimeout(t);
      // Pausing keeps the time left; a newer toast has already reset it.
      if (key.current === shown) {
        remaining.current = Math.max(0, remaining.current - (Date.now() - started.current));
      }
    };
  }, [toast, paused]);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {toast?.message ?? ""}
      </div>
      {toast ? (
        <div
          className={styles.dock}
          onMouseEnter={() => {
            setPaused(true);
          }}
          onMouseLeave={() => {
            setPaused(false);
          }}
          onFocus={() => {
            setPaused(true);
          }}
          onBlur={() => {
            setPaused(false);
          }}
        >
          <Toast
            key={toast.key}
            message={toast.message}
            {...(toast.tone ? { tone: toast.tone } : {})}
            {...(toast.action ? { action: toast.action } : {})}
            {...(toast.link ? { link: toast.link } : {})}
            onDismiss={dismiss}
          />
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
