import type { Route } from "./+types/writing.$slug";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Post" }];
}

/** Placeholder until M2 builds the post page. */
export default function Post() {
  return <main />;
}
