import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Akarshan Kumar" }];
}

/** Placeholder until M2 builds the homepage. */
export default function Home() {
  return <main />;
}
