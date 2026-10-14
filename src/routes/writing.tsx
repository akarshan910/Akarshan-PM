import type { Route } from "./+types/writing";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Writing" }];
}

/** Placeholder until M2 builds /writing. */
export default function Writing() {
  return <main />;
}
