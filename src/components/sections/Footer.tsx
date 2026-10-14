import { useSyncExternalStore } from "react";

import { SiteFooter } from "~/components/footer/SiteFooter";
import { isQa, QA_NOW } from "~/lib/qa";

import { useHomeContext } from "./context";
import type { SectionProps } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const noSubscribe = () => () => undefined;

/** The site's dates are Indian Standard Time, the owner's zone. */
const IST_MS = 330 * 60 * 1000;

/** "13 Oct 2026", the same on the server and in every browser. */
export function formatDate(value: string | Date): { text: string; year: number } | null {
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return null;
  const d = new Date(ms + IST_MS);
  return {
    text: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()] ?? ""} ${d.getUTCFullYear()}`,
    year: d.getUTCFullYear(),
  };
}

/**
 * The footer (03 · Footer, C19): "© {year} {name} · {credit}" and "Last updated {date}", the date
 * of the last site publish. Under `?qa=1` the date is frozen to 13 Oct 2026.
 */
export function Footer({ section, profile }: SectionProps) {
  const { updatedAt } = useHomeContext();
  const parts = new Set(section.items.map((i) => i.id));
  // Prerendered with the publish date; `?qa=1` swaps in the frozen date after hydration.
  const qa = useSyncExternalStore(
    noSubscribe,
    () => isQa(),
    () => false,
  );
  const date = qa ? formatDate(QA_NOW) : updatedAt ? formatDate(updatedAt) : null;
  const year = date?.year ?? QA_NOW.getFullYear();
  return (
    <SiteFooter
      year={year}
      name={profile.name}
      {...(parts.has("credit") && profile.footer.credit ? { credit: profile.footer.credit } : {})}
      {...(parts.has("updated") && date ? { updated: date.text } : {})}
    />
  );
}
