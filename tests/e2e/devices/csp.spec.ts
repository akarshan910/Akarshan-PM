import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { PAGES } from "../a11y/pages";
import { knownDefect } from "./known-defects";

/**
 * CSP in the browser (08 · Security checks; D83). The host's headers live in
 * `.vercel/output/config.json` (written by `npm run build`). For every page and the built Studio and
 * preview routes, documents are served as Vercel would: per-path headers merged in route order,
 * then the filesystem, then the fallbacks (SPA shell, 404). With that CSP enforced, nothing on the
 * page may trigger a `securitypolicyviolation`. Assets come from the normal preview server.
 */
type VercelRoute = {
  src?: string;
  dest?: string;
  status?: number;
  headers?: Record<string, string>;
  continue?: boolean;
  has?: unknown[];
  handle?: string;
};

const OUTPUT = ".vercel/output";
const config = existsSync(join(OUTPUT, "config.json"))
  ? (JSON.parse(readFileSync(join(OUTPUT, "config.json"), "utf8")) as { routes: VercelRoute[] })
  : null;

/** The static file Vercel would serve for a path, if any. */
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

/** Resolves a document request the way Vercel's routes would: status, headers and body. */
function resolve(path: string) {
  if (!config) throw new Error("No .vercel/output/config.json: run `npm run build` first");
  const headers: Record<string, string> = {};
  const routes = config.routes;
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

async function serveLikeVercel(page: Page, mutate?: (html: string) => string) {
  await page.route("**/*", async (route) => {
    const req = route.request();
    if (req.resourceType() !== "document") return route.continue();
    const { status, headers, file } = resolve(new URL(req.url()).pathname);
    const body = readFileSync(file, "utf8");
    await route.fulfill({
      status,
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
      body: mutate ? mutate(body) : body,
    });
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      w.__csp.push(`${e.violatedDirective} ${e.blockedURI || "inline"} ${e.sourceFile}:${e.lineNumber}`);
    });
  });
}

/** zod 4's `allowsEval` probe: a caught `new Function` reported as a script-src 'eval' violation. */
const ZOD_PROBE = /^script-src(-elem)? eval /;

const violations = (page: Page) => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

const ROUTES = [
  ...PAGES.map((p) => ({ name: p.name, path: p.path })),
  // Studio and preview, as built: Studio's repo is dev-only, so these show its sign-in and states.
  { name: "studio sign-in", path: "/studio/login" },
  { name: "studio dashboard (signed out)", path: "/studio" },
  { name: "studio signed-out", path: "/studio/signed-out" },
  { name: "preview link", path: "/preview/qa-not-a-real-token" },
  { name: "unknown path", path: "/qa-no-such-page" },
];

test.describe("CSP in the browser", () => {
  test.skip(!config, "Run `npm run build` first: it writes .vercel/output/config.json");

  for (const r of ROUTES) {
    test(`${r.name}: no CSP violations`, async ({ page }) => {
      await serveLikeVercel(page);
      const res = await page.goto(r.path);
      expect(res?.headers()["content-security-policy"], "the page carries a CSP").toBeTruthy();
      await page.waitForLoadState("load");
      // Scroll through, so reveals, lazy media and late scripts run under the policy too.
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += 800) {
        await page.evaluate((top) => {
          scrollTo({ top, behavior: "instant" });
        }, y);
        await page.waitForTimeout(80);
      }
      await page.waitForTimeout(1500);
      // While QA-P1 is open, zod's eval probe is set aside; anything else still fails.
      const open = Boolean(knownDefect("csp", 0));
      expect((await violations(page)).filter((v) => !(open && ZOD_PROBE.test(v)))).toEqual([]);
    });
  }

  test("QA-P1: no eval probe on public pages", async ({ page }) => {
    const known = knownDefect("csp", 0);
    test.fail(Boolean(known), known ? `${known.id}: ${known.note}` : "");
    await serveLikeVercel(page);
    await page.goto("/");
    await page.waitForTimeout(1500);
    expect((await violations(page)).filter((v) => ZOD_PROBE.test(v))).toEqual([]);
  });

  test("negative control: an unhashed inline script is blocked", async ({ page }) => {
    await serveLikeVercel(page, (html) =>
      html.replace("</body>", "<script>window.__qaInline = 1;</script></body>"),
    );
    await page.goto("/");
    await page.waitForTimeout(500);
    expect(
      await page.evaluate(() => (window as unknown as { __qaInline?: number }).__qaInline),
    ).toBeUndefined();
    expect((await violations(page)).some((v) => v.startsWith("script-src"))).toBe(true);
  });
});
