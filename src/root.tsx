import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse } from "react-router";

import { ErrorState } from "./components/states/ErrorState";
import { NotFound } from "./components/states/NotFound";
import { StatePage } from "./components/states/StatePage";
import type { Route } from "./+types/root";
import { BOOTSTRAP_SCRIPT } from "./lib/bootstrap";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./motion/keyframes.css";
import "./motion/reveal.css";

/**
 * A neutral default title for pages without their own meta: the SPA fallback (Studio and unknown
 * paths before JavaScript runs) would otherwise have none (WCAG 2.4.2). Route meta replaces it.
 */
export function meta(_: Route.MetaArgs) {
  return [{ title: "Portfolio" }];
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP_SCRIPT }} />
        <Meta />
        <link
          rel="preload"
          href="/fonts/archivo-latin-wdth-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/geist-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

/** A 404 response shows the 404 page; anything else, the error state (03 · Page states, C21). */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return notFound ? (
    <StatePage>
      <NotFound />
    </StatePage>
  ) : (
    <StatePage center>
      <ErrorState />
    </StatePage>
  );
}
