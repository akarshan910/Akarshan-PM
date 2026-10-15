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
  if (!loaderData.view || !("seo" in loaderData))
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
