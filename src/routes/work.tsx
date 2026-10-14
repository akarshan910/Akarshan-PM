import type { Route } from "./+types/work";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Work" }];
}

/** Placeholder until M2 builds /work. */
export default function Work() {
  return <main />;
}
