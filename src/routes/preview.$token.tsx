import type { Route } from "./+types/preview.$token";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Preview" }, { name: "robots", content: "noindex, nofollow" }];
}

/** Placeholder until M5 builds draft previews. */
export default function Preview() {
  return <main />;
}
