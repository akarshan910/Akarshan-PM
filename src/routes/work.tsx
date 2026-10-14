import { useCallback, useState, useSyncExternalStore } from "react";
import { type ShouldRevalidateFunctionArgs, useSearchParams } from "react-router";

import { SiteFooter } from "~/components/footer/SiteFooter";
import { formatDate } from "~/components/sections/Footer";
import { WorkList } from "~/components/work/WorkList";
import { loadPublicContent } from "~/lib/content.server";
import { isQa, QA_NOW } from "~/lib/qa";
import { buildChrome } from "~/lib/site";
import { EMPTY_QUERY, parseWorkQuery, workQueryString, workRows, type WorkQuery } from "~/lib/work-list";

import type { Route } from "./+types/work";
import styles from "./work.module.css";

/** Card data for every published, listed project, nothing more (10 · Security gates). */
export async function loader() {
  const content = await loadPublicContent();
  const { rows, shelves } = workRows(content);
  const { footer } = buildChrome(content);
  return { rows, shelves, footer };
}

/** Filters live in the address; changing them never refetches the prerendered data. */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname === nextUrl.pathname ? false : defaultShouldRevalidate;
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `Work · ${loaderData.footer.name}` },
    {
      name: "description",
      content: `Every project by ${loaderData.footer.name}, with filters by shelf, company, topic and label.`,
    },
  ];
}

const noSubscribe = () => () => undefined;

/** /work (03 · Work list). The prerendered page holds the first 24 rows in Your order. */
export default function Work({ loaderData }: Route.ComponentProps) {
  const { rows, shelves, footer } = loaderData;
  const [params, setParams] = useSearchParams();
  // The prerendered HTML has no query; the address is applied once hydrated.
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const search = params.toString();
  // The address updates after a navigation tick; until it does, the controls show what was chosen,
  // so a checkbox never snaps back for a frame.
  const [pending, setPending] = useState<{ from: string; query: WorkQuery } | null>(null);
  const query =
    pending && pending.from === search ? pending.query : hydrated ? parseWorkQuery(params) : EMPTY_QUERY;
  const moved = hydrated && params.get("moved") === "1";

  const onChange = useCallback(
    (next: WorkQuery) => {
      setPending({ from: params.toString(), query: next });
      setParams(new URLSearchParams(workQueryString(next, params)), {
        replace: true,
        preventScrollReset: true,
      });
    },
    [params, setParams],
  );
  const dismissMoved = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete("moved");
    setParams(next, { replace: true, preventScrollReset: true });
  }, [params, setParams]);

  const date = hydrated && isQa() ? formatDate(QA_NOW) : formatDate(footer.updatedAt);
  return (
    <>
      <main id="main" className={`wrap ${styles.page}`}>
        <WorkList
          rows={rows}
          shelves={shelves}
          query={query}
          onChange={onChange}
          moved={moved}
          onDismissMoved={dismissMoved}
        />
      </main>
      <SiteFooter
        year={date?.year ?? QA_NOW.getFullYear()}
        name={footer.name}
        {...(footer.credit ? { credit: footer.credit } : {})}
        {...(date ? { updated: date.text } : {})}
      />
    </>
  );
}
