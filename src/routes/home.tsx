import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";

import { HomeContext, legacyAnchors, SECTIONS } from "~/components/sections";
import { loadPublicContent } from "~/lib/content.server";
import { legacyCaseRedirect } from "~/lib/legacy-links";
import { homeSeo, seoMeta, siteUrl } from "~/lib/seo";
import { buildHomeView } from "~/lib/site";

import type { Route } from "./+types/home";

export async function loader() {
  const content = await loadPublicContent();
  return { ...buildHomeView(content), seo: homeSeo(content, siteUrl(process.env.SITE_URL)) };
}

/** Title, description, canonical, Open Graph and Person JSON-LD (06 · SEO). */
export function meta({ loaderData }: Route.MetaArgs) {
  return seoMeta(loaderData.seo);
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
