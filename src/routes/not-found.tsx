import { NotFound } from "~/components/states/NotFound";
import { StatePage, useLayoutData } from "~/components/states/StatePage";

import type { Route } from "./+types/not-found";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Page not found" }, { name: "robots", content: "noindex" }];
}

/**
 * The 404 page (03 · Page states, C21). Prerendered as /404 for the host to serve with a 404
 * status; also the SPA catch-all. Writing shows only once a post is published (D19).
 */
export default function NotFoundRoute() {
  return <NotFoundPage />;
}

export function NotFoundPage() {
  const layout = useLayoutData();
  return (
    <StatePage>
      <NotFound showWriting={layout?.hasPosts ?? false} />
    </StatePage>
  );
}
