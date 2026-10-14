import "~/styles/studio.css";
import type { Route } from "./+types/dashboard";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Studio" }, { name: "robots", content: "noindex, nofollow" }];
}

/** Studio is client-only: no server loader, and nothing here is prerendered. */
export function clientLoader(_: Route.ClientLoaderArgs) {
  return null;
}

/** Placeholder until M4. */
export default function StudioDashboard() {
  return <main className="st" />;
}
