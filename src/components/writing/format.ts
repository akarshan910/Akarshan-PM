import { formatDate } from "~/components/sections/Footer";

/** "13 Oct 2026", in the site's time zone (the footer's format). */
export function postDate(iso: string): string {
  return formatDate(iso)?.text ?? "";
}

/** "6 min read" in metas, "6 min" in the list's end column (WritingPublic.dc.html). */
export function minutes(n: number, long = true): string {
  return long ? `${String(n)} min read` : `${String(n)} min`;
}
