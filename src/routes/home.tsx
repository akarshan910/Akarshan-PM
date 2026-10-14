import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";

import { HomeContext, legacyAnchors, SECTIONS } from "~/components/sections";
import { loadPublicContent } from "~/lib/content.server";
import { legacyCaseRedirect } from "~/lib/legacy-links";
import { richTextToPlain } from "~/lib/rich-text";
import { buildHomeView } from "~/lib/site";

import type { Route } from "./+types/home";

export async function loader() {
  return buildHomeView(await loadPublicContent());
}

/** Title and description from the profile; full SEO arrives in M5. */
export function meta({ loaderData }: Route.MetaArgs) {
  const { profile } = loaderData;
  const title = profile.title ? `${profile.name} · ${profile.title}` : profile.name;
  const description = richTextToPlain(profile.positioning);
  return [{ title }, ...(description ? [{ name: "description", content: description }] : [])];
}

/** Home (03 · Home): the published layout's sections, in order. The footer sits after `<main>`. */
export default function Home({ loaderData }: Route.ComponentProps) {
  const { sections, profile, projects, posts, chrome } = loaderData;
  const navigate = useNavigate();
  // The live site's `?open=<id>` links go to the case study (07 · Legacy links).
  useEffect(() => {
    const to = legacyCaseRedirect(window.location.search);
    if (to) void navigate(to, { replace: true });
  }, [navigate]);
  const context = useMemo(
    () => ({ anchors: legacyAnchors(sections), updatedAt: chrome.footer.updatedAt }),
    [sections, chrome.footer.updatedAt],
  );
  const render = (section: (typeof sections)[number]) => {
    const Section = SECTIONS[section.kind];
    return <Section key={section.id} section={section} profile={profile} projects={projects} posts={posts} />;
  };
  const body = sections.filter((s) => s.kind !== "footer");
  const footer = sections.filter((s) => s.kind === "footer");
  return (
    <HomeContext.Provider value={context}>
      <main id="main">{body.map(render)}</main>
      {footer.map(render)}
    </HomeContext.Provider>
  );
}
