import { useSyncExternalStore } from "react";

import { CaseStudyNeighbours } from "~/components/case-study/CaseStudyNeighbours";
import { CaseStudyPage } from "~/components/case-study/CaseStudyPage";
import { SiteFooter } from "~/components/footer/SiteFooter";
import { formatDate } from "~/components/sections/Footer";
import { NotFound } from "~/components/states/NotFound";
import { caseStudyView } from "~/lib/case-study";
import { loadPublicContent } from "~/lib/content.server";
import { isQa, QA_NOW } from "~/lib/qa";

import type { Route } from "./+types/work.$slug";

/**
 * The published project only, as the page's view (10 · Security gates). Only listed projects are
 * prerendered; any other address gets the 404 state.
 */
export async function loader({ params }: Route.LoaderArgs) {
  return { view: caseStudyView(await loadPublicContent(), params.slug) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData.view) return [{ title: "Page not found" }, { name: "robots", content: "noindex" }];
  const { project, name } = loaderData.view;
  const { overview, seo } = project;
  const description = seo.description ?? overview.summary;
  return [
    { title: `${seo.title ?? overview.title} · ${name}` },
    ...(description ? [{ name: "description", content: description }] : []),
  ];
}

const noSubscribe = () => () => undefined;

/** /work/:slug (03 · Case study). */
export default function CaseStudy({ loaderData }: Route.ComponentProps) {
  const { view } = loaderData;
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  if (!view) {
    return (
      <main id="main">
        <NotFound />
      </main>
    );
  }
  const date = hydrated && isQa() ? formatDate(QA_NOW) : formatDate(view.updatedAt);
  return (
    <>
      <CaseStudyPage key={view.slug} view={view} />
      <CaseStudyNeighbours view={view} />
      <SiteFooter
        year={date?.year ?? QA_NOW.getFullYear()}
        name={view.name}
        back={{ href: "/work", label: "Back to all work" }}
      />
    </>
  );
}
