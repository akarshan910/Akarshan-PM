import { useEffect, useState } from "react";

import { SiteFooter } from "~/components/footer/SiteFooter";
import { formatDate } from "~/components/sections/Footer";
import { NotFound } from "~/components/states/NotFound";
import { StatePage, useLayoutData } from "~/components/states/StatePage";
import type { CaseStudyView } from "~/lib/case-study";
import { QA_NOW } from "~/lib/qa";
import { unlistedUrl, unlistedView } from "~/lib/unlisted";

import { CaseStudyPage } from "./CaseStudyPage";

type State = { kind: "loading" } | { kind: "found"; view: CaseStudyView } | { kind: "missing" };

/**
 * The unlisted shell (01 · Rendering, D24): a `/work/<slug>` address with no prerendered page. It asks
 * `pm-project` for the exact slug and shows the project (no volume, no prev/next) or the 404 page.
 * The page is `noindex` either way (the route's meta, and the host's X-Robots-Tag).
 */
export function UnlistedProject({ slug, fetcher = fetch }: { slug: string; fetcher?: typeof fetch }) {
  const layout = useLayoutData();
  const name = layout?.chrome.footer.name ?? "";
  const updatedAt = layout?.chrome.footer.updatedAt ?? "";
  const url = unlistedUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined, slug);
  const [state, setState] = useState<State>(url ? { kind: "loading" } : { kind: "missing" });

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetcher(url, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (res) => (res.ok ? (res.json() as Promise<unknown>) : null))
      .then((body) => {
        const view = unlistedView(body, slug, { name, updatedAt });
        setState(view ? { kind: "found", view } : { kind: "missing" });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
          setState({ kind: "missing" });
        }
      });
    return () => {
      controller.abort();
    };
  }, [fetcher, url, slug, name, updatedAt]);

  if (state.kind === "loading")
    return (
      <main id="main" aria-busy="true">
        <p className="sr-only" role="status">
          Loading the project
        </p>
      </main>
    );
  if (state.kind === "missing")
    return (
      <StatePage>
        <NotFound showWriting={layout?.hasPosts ?? false} />
      </StatePage>
    );
  return (
    <>
      <CaseStudyPage key={state.view.slug} view={state.view} />
      <SiteFooter
        year={formatDate(state.view.updatedAt)?.year ?? QA_NOW.getFullYear()}
        name={state.view.name}
        back={{ href: "/work", label: "Back to all work" }}
      />
    </>
  );
}
