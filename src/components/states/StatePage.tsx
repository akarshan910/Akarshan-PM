import type { ReactNode } from "react";
import { useRouteLoaderData } from "react-router";

import { PageFooter } from "~/components/footer/PageFooter";
import type { SiteChrome } from "~/lib/site";

import { cx } from "../cx";
import styles from "./StatePage.module.css";

/** What the public layout's loader shares with the pages under it. */
interface LayoutData {
  chrome: SiteChrome;
  hasPosts?: boolean;
}

/** The public layout's data, when the page is inside it (the SPA catch-all isn't). */
export function useLayoutData(): LayoutData | undefined {
  return useRouteLoaderData<LayoutData>("routes/public-layout");
}

/**
 * A page state as a whole page (03 · Page states): one message under the nav, then the footer.
 * Every state keeps the nav and footer, and reads without JavaScript.
 */
export function StatePage({ children, center = false }: { children: ReactNode; center?: boolean }) {
  const layout = useLayoutData();
  return (
    <>
      <main id="main" className={cx("wrap", styles.page, center && styles.center)}>
        {children}
      </main>
      {layout ? <PageFooter footer={layout.chrome.footer} /> : null}
    </>
  );
}
