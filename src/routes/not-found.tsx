import type { Route } from "./+types/not-found";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Page not found" }];
}

/** Placeholder until M1 builds the 404 state. */
export default function NotFound() {
  return <main />;
}
