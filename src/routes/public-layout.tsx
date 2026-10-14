import { Outlet, useLocation } from "react-router";

import { PillNav } from "~/components/nav/PillNav";
import { loadPublicContent } from "~/lib/content.server";
import { buildChrome, publicSections } from "~/lib/site";

import type { Route } from "./+types/public-layout";

export async function loader() {
  const content = await loadPublicContent();
  const sections = publicSections(content);
  return {
    chrome: buildChrome(content, sections),
    /** "Skip to work" jumps to the first shelf on Home (03 · The page shell). */
    firstShelf: sections.find((s) => s.kind === "shelf")?.id,
    /** On a case study, the nav's Work link is the current one. */
    workLink: sections.find((s) => s.kind === "shelf" && s.nav)?.id,
    heroId: sections.find((s) => s.kind === "hero")?.id,
  };
}

export default function PublicLayout({ loaderData }: Route.ComponentProps) {
  const { chrome, firstShelf, workLink, heroId } = loaderData;
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const onWork = pathname === "/work" || pathname.startsWith("/work/");
  return (
    <>
      <PillNav
        links={chrome.nav}
        letsTalk={chrome.letsTalk}
        current={onHome ? undefined : onWork ? workLink : ""}
        {...(onHome && heroId ? { heroId } : {})}
        contactId="contact"
        skipTo={onHome && firstShelf ? `#${firstShelf}` : "#main"}
        email={chrome.contact.email}
        linkedin={chrome.contact.linkedin}
        resume={chrome.contact.resume}
      />
      <Outlet />
    </>
  );
}
