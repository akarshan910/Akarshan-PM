/**
 * The host's routing and headers (01 · Headers, 01 · Routes › Old links), as Vercel's Build Output API
 * config (`.vercel/output/config.json`). That file is read after the build, so it can carry what only the
 * build knows: each page's inline-script hashes, the prototype hosts and the redirects (D83). Pure
 * functions; `write-vercel-config.ts` does the files.
 */
import { createHash } from "node:crypto";

import type { VercelRedirect } from "../src/lib/redirects";

/** The origins videos and embeds load from (src/lib/links.ts FRAME_HOSTS, 01 · Headers). */
export interface HeaderInputs {
  supabaseUrl?: string;
  frameHosts: readonly string[];
  prototypeHosts: readonly string[];
}

export type Route =
  | { src: string; headers: Record<string, string>; continue: true }
  | { src: string; status: number; headers: { Location: string }; has?: VercelRedirect["has"] }
  | { src: string; dest: string; status?: number; headers?: Record<string, string> }
  | { handle: "filesystem" };

/** The live site's prototype files and the projects they belong to (07 · Legacy links). */
export const LEGACY_PROTOTYPES: Record<string, string> = {
  "/sri_mandir_prototype.html": "puja-engagement-platform",
  "/word_trip_prototype.html": "word-games-monetisation-strategy",
  "/farmville3_prototype.html": "revenue-growth-strategy",
};

/**
 * Old prototype paths → their deployed addresses (`scripts/v0-prototypes.json`), permanently. The files
 * themselves never ship: prototypes don't run on the site's origin (D11). Unknown or non-https entries
 * are skipped, so until the file exists those paths are 404s.
 */
export function prototypeRedirects(deployed: Record<string, unknown>): VercelRedirect[] {
  return Object.entries(LEGACY_PROTOTYPES).flatMap(([source, slug]) => {
    const url = deployed[slug];
    if (typeof url !== "string" || !/^https:\/\/[^\s"']+$/.test(url)) return [];
    return [{ source, destination: url, permanent: true }];
  });
}

/** `<script>` bodies the browser runs: everything inline except JSON-LD, which is data. */
export function inlineScripts(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] ?? "";
    const body = m[2] ?? "";
    if (/\bsrc\s*=/.test(attrs) || /type\s*=\s*["']?application\/ld\+json/i.test(attrs)) continue;
    if (body.length > 0) out.push(body);
  }
  return out;
}

export const scriptHash = (body: string) =>
  `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`;

/** A built file's address: `work/index.html` → `/work`, `index.html` → `/`. */
export function pathOf(file: string): string {
  const p = file
    .replace(/\\/g, "/")
    .replace(/(^|\/)index\.html$/, "")
    .replace(/\.html$/, "");
  return `/${p}`.replace(/\/+$/, "") || "/";
}

const origin = (url: string | undefined) => {
  try {
    return url ? new URL(url).origin : undefined;
  } catch {
    return undefined;
  }
};

/** The public pages' CSP, with exactly the given inline-script hashes. */
export function publicCsp(hashes: readonly string[], i: HeaderInputs): string {
  const sb = origin(i.supabaseUrl);
  const frames = [...new Set([...i.frameHosts, ...i.prototypeHosts])].sort();
  return [
    "default-src 'self'",
    ["script-src 'self'", ...hashes].join(" "),
    "style-src 'self' 'unsafe-inline'",
    ["img-src 'self' data:", sb].filter(Boolean).join(" "),
    ["connect-src 'self'", sb].filter(Boolean).join(" "),
    frames.length ? `frame-src ${frames.join(" ")}` : "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/** Studio's CSP: Turnstile, the realtime socket, and no video or prototype hosts. */
export function studioCsp(hashes: readonly string[], i: HeaderInputs): string {
  const sb = origin(i.supabaseUrl);
  const ws = sb?.replace(/^http/, "ws");
  const turnstile = "https://challenges.cloudflare.com";
  return [
    "default-src 'self'",
    ["script-src 'self'", turnstile, ...hashes].join(" "),
    "style-src 'self' 'unsafe-inline'",
    ["img-src 'self' data: blob:", sb].filter(Boolean).join(" "),
    ["connect-src 'self'", sb, ws].filter(Boolean).join(" "),
    `frame-src 'self' ${turnstile}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exact = (path: string) => (path === "/" ? "^/$" : `^${escape(path)}/?$`);

const COMMON = {
  "X-Content-Type-Options": "nosniff",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
};

export interface Page {
  /** Its address (`pathOf`). */
  path: string;
  html: string;
}

/**
 * Routes, in the order Vercel applies them: redirects; headers that every later match may override
 * (site-wide, then each page with its own hashes, then Studio and previews); the files; then the SPA
 * fallback for unlisted projects, Studio and previews; then the 404 page with status 404.
 */
export function buildRoutes(pages: readonly Page[], redirects: readonly VercelRedirect[], i: HeaderInputs) {
  const fallback = pages.find((p) => p.path === "/__spa-fallback");
  const notFound = pages.find((p) => p.path === "/404");
  if (!fallback) throw new Error("write-vercel-config: build/client/__spa-fallback.html is missing");
  if (!notFound) throw new Error("write-vercel-config: build/client/404/index.html is missing");
  const hashesOf = (p: Page) => [...new Set(inlineScripts(p.html).map(scriptHash))];
  const shellHashes = [...new Set([...hashesOf(fallback), ...hashesOf(notFound)])];

  const routes: Route[] = [];
  for (const r of redirects) {
    const src = r.source === "/" ? "^/$" : exact(r.source);
    routes.push({
      src,
      status: r.permanent ? 308 : 307,
      headers: { Location: r.destination },
      ...(r.has ? { has: r.has } : {}),
    });
  }
  // Site-wide; the SPA fallback's and the 404's hashes cover addresses with no file of their own.
  routes.push({
    src: "^/(.*)$",
    headers: {
      ...COMMON,
      "Content-Security-Policy": publicCsp(shellHashes, i),
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
    continue: true,
  });
  routes.push({
    src: "^/(assets|fonts|media)/(.*)$",
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    continue: true,
  });
  for (const p of pages) {
    if (p === fallback || p === notFound) continue;
    routes.push({
      src: exact(p.path),
      headers: { "Content-Security-Policy": publicCsp(hashesOf(p), i) },
      continue: true,
    });
  }
  routes.push({
    src: "^/studio(/.*)?$",
    headers: {
      "Content-Security-Policy": studioCsp(hashesOf(fallback), i),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "same-origin",
    },
    continue: true,
  });
  routes.push({
    src: "^/preview(/.*)?$",
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Referrer-Policy": "no-referrer" },
    continue: true,
  });
  routes.push({ handle: "filesystem" });
  routes.push({
    src: "^/work/[a-z0-9]+(?:-[a-z0-9]+)*/?$",
    dest: "/__spa-fallback.html",
    headers: { "X-Robots-Tag": "noindex" },
  });
  routes.push({ src: "^/(studio|preview)(/.*)?$", dest: "/__spa-fallback.html" });
  routes.push({ src: "^/(.*)$", dest: "/404.html", status: 404 });
  return routes;
}

/** Every inline script on every page must be allowed by the CSP its address gets (01 · Headers). */
export function uncovered(pages: readonly Page[], routes: readonly Route[]): string[] {
  const problems: string[] = [];
  const headerRoutes = routes.filter(
    (r): r is Extract<Route, { continue: true }> => "continue" in r && "Content-Security-Policy" in r.headers,
  );
  const cspFor = (path: string) =>
    headerRoutes.filter((r) => new RegExp(r.src).test(path)).at(-1)?.headers["Content-Security-Policy"] ?? "";
  for (const p of pages) {
    const at = p.path === "/__spa-fallback" ? "/studio" : p.path === "/404" ? "/no-such-page" : p.path;
    const csp = cspFor(at);
    for (const body of inlineScripts(p.html)) {
      if (!csp.includes(scriptHash(body)))
        problems.push(`${p.path}: an inline script has no hash in its CSP`);
    }
  }
  return problems;
}
