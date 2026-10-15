import { Outlet, type ShouldRevalidateFunctionArgs, useLocation } from "react-router";

import { PillNav } from "~/components/nav/PillNav";
import { loadPublicContent } from "~/lib/content.server";
import { LAYOUT_DATA_PATH, layoutData, type LayoutData } from "~/lib/site";

import type { Route } from "./+types/public-layout";

export async function loader() {
  return layoutData(await loadPublicContent());
}

/**
 * Prerendered pages hydrate with the loader's data. The SPA fallback (an unlisted /work/<slug>, D83)
 * has none and no `.data` file to fetch, so the chrome comes from the build's layout.json, and the
 * page's own boundary (the unlisted shell, the 404) can render inside the nav and footer.
 */
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs): Promise<LayoutData> {
  try {
    return await serverLoader();
  } catch (error) {
    const res = await fetch(LAYOUT_DATA_PATH).catch(() => null);
    if (!res?.ok) throw error;
    return (await res.json()) as LayoutData;
  }
}

/** The chrome never changes with the query string (a /work filter, a legacy ?open= link). */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname === nextUrl.pathname ? false : defaultShouldRevalidate;
}

export default function PublicLayout({ loaderData }: Route.ComponentProps) {
  const { chrome, firstShelf, workLink, writingLink, heroId } = loaderData;
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const onWork = pathname === "/work" || pathname.startsWith("/work/");
  const onWriting = pathname === "/writing" || pathname.startsWith("/writing/");
  return (
    <>
      <PillNav
        links={chrome.nav}
        letsTalk={chrome.letsTalk}
        current={onHome ? undefined : onWork ? workLink : onWriting ? (writingLink ?? "") : ""}
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
