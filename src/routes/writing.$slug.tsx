import { isRouteErrorResponse } from "react-router";

import { PageFooter } from "~/components/footer/PageFooter";
import { PostPage } from "~/components/writing/PostPage";
import { loadPublicContent } from "~/lib/content.server";
import { postSeo, seoMeta, siteUrl } from "~/lib/seo";
import { buildChrome } from "~/lib/site";
import { postView } from "~/lib/writing";

import type { Route } from "./+types/writing.$slug";
import { NotFoundPage } from "./not-found";

/** One published post. Drafts and scheduled posts don't exist here, so they 404 (03 · Page states). */
export async function loader({ params }: Route.LoaderArgs) {
  const content = await loadPublicContent();
  const view = postView(content, params.slug);
  if (!view) return { view: null, footer: buildChrome(content).footer };
  const entry = content.posts.find((p) => p.slug === view.slug);
  const site = siteUrl(process.env.SITE_URL);
  return {
    view,
    footer: buildChrome(content).footer,
    // The share links use the site's own address, even when the canonical points elsewhere.
    url: `${site}/writing/${view.slug}`,
    ...(entry ? { seo: postSeo(content, entry, site) } : {}),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  // No data at all: the host's 404.html, hydrating at an unpublished post's address.
  if (!loaderData?.view || !("seo" in loaderData))
    return [{ title: "Page not found" }, { name: "robots", content: "noindex" }];
  return seoMeta(loaderData.seo);
}

/** /writing/:slug (03 · Writing pages). */
export default function Post({ loaderData }: Route.ComponentProps) {
  if (!loaderData.view) return <NotFoundPage />;
  return (
    <>
      <PostPage view={loaderData.view} url={loaderData.url} />
      <PageFooter footer={loaderData.footer} />
    </>
  );
}

/**
 * An address with no prerendered post (a draft or a scheduled one): the host serves 404.html with a
 * 404 status (D83), which hydrates here with no data for this route. That's the 404 state, not an
 * error. A real load failure on a published post still shows the error state.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const missing =
    (isRouteErrorResponse(error) && error.status === 404) ||
    (error instanceof Error && /No result found for routeId/.test(error.message));
  if (!missing) throw error;
  return <NotFoundPage />;
}
