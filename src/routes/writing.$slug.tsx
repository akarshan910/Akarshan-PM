import { PageFooter } from "~/components/footer/PageFooter";
import { PostPage } from "~/components/writing/PostPage";
import { loadPublicContent } from "~/lib/content.server";
import { buildChrome } from "~/lib/site";
import { postView } from "~/lib/writing";

import type { Route } from "./+types/writing.$slug";
import { NotFoundPage } from "./not-found";

/** One published post. Drafts and scheduled posts don't exist here, so they 404 (03 · Page states). */
export async function loader({ params }: Route.LoaderArgs) {
  const content = await loadPublicContent();
  const view = postView(content, params.slug);
  if (!view) return { view: null, footer: buildChrome(content).footer };
  // SITE_URL is the canonical origin (01 · Environment); without it the page uses its own address.
  const site = process.env.SITE_URL?.replace(/\/+$/, "");
  return {
    view,
    footer: buildChrome(content).footer,
    ...(site ? { url: `${site}/writing/${view.slug}` } : {}),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData.view) return [{ title: "Page not found" }, { name: "robots", content: "noindex" }];
  const { post } = loaderData.view;
  const title = post.seo.title ?? `${post.title} · ${loaderData.footer.name}`;
  const description = post.seo.description ?? post.excerpt;
  return [{ title }, ...(description ? [{ name: "description", content: description }] : [])];
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
