import { loadPublicContent } from "~/lib/content.server";
import { buildHomeView } from "~/lib/site";

import type { Route } from "./+types/home";

export async function loader() {
  return buildHomeView(await loadPublicContent());
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData.profile.name }];
}

/** Placeholder until M2 renders the sections (03 · Home). */
export default function Home(_: Route.ComponentProps) {
  return <main id="main" />;
}
