/**
 * Writes Vercel's Build Output (`.vercel/output`): the built site as `static/`, plus `config.json` with
 * the redirects, the per-page Content-Security-Policy hashes and the SPA-fallback and 404 rules
 * (01 · Headers, D83). Runs after the feeds and media are in build/client. Fails if any inline script
 * would be blocked by the CSP its address gets.
 */
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { loadPublicContent } from "../src/lib/content.server";
import { FRAME_HOSTS } from "../src/lib/links";
import { readRedirects, vercelRedirects } from "../src/lib/redirects";
import { buildRoutes, pathOf, uncovered, type Page } from "./vercel-config";

const build = join(process.env.PM_BUILD_DIR ?? "build", "client");
const out = ".vercel/output";

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return path.endsWith(".html") ? [path] : [];
  });
}

const pages: Page[] = htmlFiles(build).map((f) => ({
  path: pathOf(relative(build, f)),
  html: readFileSync(f, "utf8"),
}));

const content = await loadPublicContent();
const prototypeHosts = content.projects.flatMap((p) => {
  const hero = p.project.visuals.hero;
  if (hero.type !== "prototype" || !hero.url) return [];
  try {
    return [new URL(hero.url).origin];
  } catch {
    return [];
  }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
let rows: Awaited<ReturnType<typeof readRedirects>> = [];
if (process.env.CONTENT_SOURCE === "supabase") {
  const { publicReader } = await import("../src/lib/supabase");
  rows = await readRedirects(publicReader(supabaseUrl ?? "", process.env.VITE_SUPABASE_ANON_KEY ?? ""));
}

const routes = buildRoutes(pages, vercelRedirects(rows), {
  ...(supabaseUrl ? { supabaseUrl } : {}),
  frameHosts: FRAME_HOSTS,
  prototypeHosts,
});
const problems = uncovered(pages, routes);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(build, join(out, "static"), { recursive: true });
// Vercel's last route serves /404.html for every unknown address, with status 404.
cpSync(join(build, "404", "index.html"), join(out, "static", "404.html"));
writeFileSync(join(out, "config.json"), `${JSON.stringify({ version: 3, routes }, null, 2)}\n`);
console.log(
  `write-vercel-config: ${routes.length} routes, ${pages.length} pages hashed, ` +
    `${rows.length} redirect rows, ${new Set(prototypeHosts).size} prototype hosts`,
);
