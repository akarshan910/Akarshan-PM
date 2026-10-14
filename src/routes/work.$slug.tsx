import type { Route } from "./+types/work.$slug";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Case study" }];
}

/** Placeholder until M2 builds the case study. */
export default function CaseStudy() {
  return <main />;
}
