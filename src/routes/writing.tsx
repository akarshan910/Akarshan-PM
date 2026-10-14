import { useCallback, useState, useSyncExternalStore } from "react";
import { type ShouldRevalidateFunctionArgs, useSearchParams } from "react-router";

import { PageFooter } from "~/components/footer/PageFooter";
import { WritingIndex } from "~/components/writing/WritingIndex";
import { loadPublicContent } from "~/lib/content.server";
import { seoMeta, siteUrl, writingSeo } from "~/lib/seo";
import { buildChrome } from "~/lib/site";
import { writingAddress, writingIndex } from "~/lib/writing";

import type { Route } from "./+types/writing";
import { NotFoundPage } from "./not-found";

/** The list's cards only. Null while nothing is published: the page is then the 404 (D19). */
export async function loader() {
  const content = await loadPublicContent();
  return {
    view: writingIndex(content),
    footer: buildChrome(content).footer,
    seo: writingSeo(content, siteUrl(process.env.SITE_URL)),
  };
}

/** Topic and page live in the address; changing them never refetches the prerendered data. */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname === nextUrl.pathname ? false : defaultShouldRevalidate;
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData.view) return [{ title: "Page not found" }, { name: "robots", content: "noindex" }];
  return seoMeta(loaderData.seo);
}

const noSubscribe = () => () => undefined;

/** /writing (03 · Writing pages). The prerendered page is the first page under All. */
export default function Writing({ loaderData }: Route.ComponentProps) {
  const { view, footer } = loaderData;
  const [params, setParams] = useSearchParams();
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  // Until the address catches up, the chips show what was chosen (see /work).
  const [pending, setPending] = useState<{ from: string; topic: string | undefined } | null>(null);
  const { topic, page } = writingAddress(view, hydrated ? params : null, pending);

  const onTopic = useCallback(
    (next: string | undefined) => {
      setPending({ from: params.toString(), topic: next });
      const out = new URLSearchParams(params);
      out.delete("page");
      if (next) out.set("topic", next);
      else out.delete("topic");
      setParams(out, { replace: true, preventScrollReset: true });
    },
    [params, setParams],
  );
  const pageHref = useCallback(
    (n: number) => {
      const out = new URLSearchParams(topic ? { topic } : {});
      if (n > 1) out.set("page", String(n));
      const q = out.toString();
      return q ? `/writing?${q}` : "/writing";
    },
    [topic],
  );

  if (!view) return <NotFoundPage />;
  return (
    <>
      <WritingIndex view={view} topic={topic} page={page} onTopic={onTopic} pageHref={pageHref} />
      <PageFooter footer={footer} />
    </>
  );
}
