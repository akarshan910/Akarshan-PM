import { useSyncExternalStore } from "react";

import { formatDate } from "~/components/sections/Footer";
import { isQa, QA_NOW } from "~/lib/qa";
import type { SiteChrome } from "~/lib/site";

import { SiteFooter } from "./SiteFooter";

const noSubscribe = () => () => undefined;

/**
 * The footer of every page other than Home (03 · Footer), from the site chrome. Under `?qa=1` the
 * date is frozen to 13 Oct 2026; the prerendered HTML carries the real one.
 */
export function PageFooter({
  footer,
  back,
}: {
  footer: SiteChrome["footer"];
  back?: { href: string; label: string };
}) {
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const date = hydrated && isQa() ? formatDate(QA_NOW) : formatDate(footer.updatedAt);
  return (
    <SiteFooter
      year={date?.year ?? QA_NOW.getFullYear()}
      name={footer.name}
      {...(footer.credit ? { credit: footer.credit } : {})}
      {...(date ? { updated: date.text } : {})}
      {...(back ? { back } : {})}
    />
  );
}
