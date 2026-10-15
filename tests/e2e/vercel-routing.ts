import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import type { Page } from "@playwright/test";

/**
 * Serves documents the way Vercel would from the build's `.vercel/output` (D83): per-path headers merged
 * in route order, then the filesystem, then the fallbacks (the SPA shell for unlisted projects, Studio
 * and previews; 404.html with status 404 for the rest). `vite preview` answers an unknown path with
 * another page's HTML, so tests about what a visitor gets at an address go through this instead. Assets
 * still come from the preview server. (QA's csp.spec.ts has the same logic with a CSP listener.)
 */
type VercelRoute = {
  src?: string;
  dest?: string;
  status?: number;
  headers?: Record<string, string>;
  has?: unknown[];
  handle?: string;
};

const OUTPUT = ".vercel/output";

function config(): { routes: VercelRoute[] } {
  const file = join(OUTPUT, "config.json");
  if (!existsSync(file)) throw new Error("No .vercel/output/config.json: run `npm run build` first");
  return JSON.parse(readFileSync(file, "utf8")) as { routes: VercelRoute[] };
}

function staticFile(path: string) {
  const root = join(OUTPUT, "static");
  const clean = decodeURIComponent(path).replace(/\/+$/, "");
  for (const candidate of [
    path.endsWith("/") ? `${clean}/index.html` : clean,
    `${clean}/index.html`,
    `${clean}.html`,
  ]) {
    const file = join(root, candidate);
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

/** The status, headers and file Vercel's routes give a document request for `path`. */
export function resolveLikeVercel(path: string) {
  const { routes } = config();
  const headers: Record<string, string> = {};
  const fs = routes.findIndex((r) => r.handle === "filesystem");
  for (const r of routes.slice(0, fs)) {
    if (!r.src || r.status || r.has) continue; // redirects aren't exercised here
    if (new RegExp(r.src).test(path)) Object.assign(headers, r.headers);
  }
  const file = staticFile(path);
  if (file) return { status: 200, headers, file };
  for (const r of routes.slice(fs + 1)) {
    if (!r.src || !new RegExp(r.src).test(path)) continue;
    Object.assign(headers, r.headers);
    return { status: r.status ?? 200, headers, file: join(OUTPUT, "static", r.dest ?? "/404.html") };
  }
  return { status: 404, headers, file: join(OUTPUT, "static", "404.html") };
}

/** Routes the page's document requests through `resolveLikeVercel`. */
export async function serveLikeVercel(page: Page) {
  await page.route("**/*", async (route) => {
    const req = route.request();
    if (req.resourceType() !== "document") return route.continue();
    const { status, headers, file } = resolveLikeVercel(new URL(req.url()).pathname);
    await route.fulfill({
      status,
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
      body: readFileSync(file, "utf8"),
    });
  });
}
