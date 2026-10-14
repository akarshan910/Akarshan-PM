import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), iframe, input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for the lightbox and the prototype sheet: while `open`, Tab stays inside
 * `ref`, Escape calls `onEscape`, the page behind doesn't scroll, and on close focus returns to
 * the element that had it when the modal opened. `onKey` gets every other key press.
 */
export function useModal(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onEscape: () => void,
  initialFocus?: RefObject<HTMLElement | null>,
  onKey?: (event: KeyboardEvent) => void,
) {
  const escape = useRef(onEscape);
  const other = useRef(onKey);
  useEffect(() => {
    escape.current = onEscape;
    other.current = onKey;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    (initialFocus?.current ?? ref.current)?.focus();

    function handle(event: KeyboardEvent) {
      const root = ref.current;
      if (!root) return;
      if (event.key === "Escape") {
        event.preventDefault();
        escape.current();
        return;
      }
      if (event.key !== "Tab") {
        other.current?.(event);
        return;
      }
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        root.focus();
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !root.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus();
    };
    // The modal binds once per opening; refs are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
