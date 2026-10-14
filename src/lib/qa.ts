/**
 * `?qa=1` freezes everything random or time-based so pages can be compared with their boards
 * (08 · Pixel parity): floating previews take their rest slots, "Last updated" and the dashboard
 * greeting use 13 Oct 2026, 18:00, and the testimonial carousel starts at 1.
 */
export const QA_NOW = new Date("2026-10-13T18:00:00+05:30");

/** True when the page was opened with `?qa=1`. Safe to call during prerender (always false there). */
export function isQa(search: string = typeof window === "undefined" ? "" : window.location.search): boolean {
  return new URLSearchParams(search).get("qa") === "1";
}

/** The current time, or the frozen QA time under `?qa=1`. */
export function now(search?: string): Date {
  return isQa(search) ? new Date(QA_NOW) : new Date();
}
