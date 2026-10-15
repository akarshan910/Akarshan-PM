import { describe, expect, it } from "vitest";

import {
  buildRoutes,
  inlineScripts,
  pathOf,
  publicCsp,
  scriptHash,
  studioCsp,
  uncovered,
  type Page,
  type Route,
} from "../../scripts/vercel-config";

const page = (path: string, ...scripts: string[]): Page => ({
  path,
  html: `<html><head><script src="/assets/a.js"></script>${scripts.map((s) => `<script>${s}</script>`).join("")}<script type="application/ld+json">{"a":1}</script></head></html>`,
});

const inputs = {
  supabaseUrl: "https://ref.supabase.co",
  frameHosts: ["https://www.youtube-nocookie.com"],
  prototypeHosts: ["https://proto.example.test", "https://www.youtube-nocookie.com"],
};

const pages = [
  page("/", "boot()", "ctx('home')"),
  page("/work/arcana-workspace", "boot()", "ctx('arcana')"),
  page("/__spa-fallback", "boot()", "spa()"),
  page("/404", "boot()", "ctx('404')"),
];

const csp = (routes: Route[], path: string) =>
  routes
    .filter((r): r is Extract<Route, { continue: true }> => "continue" in r)
    .filter((r) => new RegExp(r.src).test(path) && r.headers["Content-Security-Policy"])
    .at(-1)?.headers["Content-Security-Policy"] ?? "";

describe("vercel-config", () => {
  it("hashes inline scripts only, not external or JSON-LD ones", () => {
    expect(inlineScripts(page("/", "boot()", "ctx('home')").html)).toEqual(["boot()", "ctx('home')"]);
    expect(scriptHash("boot()")).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);
  });

  it("maps built files to addresses", () => {
    expect(pathOf("index.html")).toBe("/");
    expect(pathOf("work/index.html")).toBe("/work");
    expect(pathOf("work/arcana-workspace/index.html")).toBe("/work/arcana-workspace");
    expect(pathOf("__spa-fallback.html")).toBe("/__spa-fallback");
  });

  it("gives each page exactly its own hashes, and Studio the fallback's", () => {
    const routes = buildRoutes(pages, [], inputs);
    expect(csp(routes, "/work/arcana-workspace")).toContain(scriptHash("ctx('arcana')"));
    expect(csp(routes, "/work/arcana-workspace")).not.toContain(scriptHash("ctx('home')"));
    expect(csp(routes, "/")).not.toContain(scriptHash("ctx('arcana')"));
    expect(csp(routes, "/studio/projects")).toContain(scriptHash("spa()"));
    expect(csp(routes, "/studio/projects")).toContain("https://challenges.cloudflare.com");
    // An unlisted project has no file: the site-wide rule carries the fallback's hashes.
    expect(csp(routes, "/work/unlisted-one")).toContain(scriptHash("spa()"));
    expect(uncovered(pages, routes)).toEqual([]);
  });

  it("finds an inline script no header allows", () => {
    const routes = buildRoutes(pages, [], inputs);
    const changed = pages.map((p) => (p.path === "/" ? page("/", "boot()", "ctx('changed')") : p));
    expect(uncovered(changed, routes)).toEqual(["/: an inline script has no hash in its CSP"]);
  });

  it("writes redirects first and ends with the fallback and the 404", () => {
    const routes = buildRoutes(
      pages,
      [
        {
          source: "/",
          destination: "/work/arcana-workspace",
          permanent: true,
          has: [{ type: "query", key: "open", value: "3" }],
        },
        { source: "/work/old-name", destination: "/work/arcana-workspace", permanent: true },
        { source: "/work/gone", destination: "/work?moved=1", permanent: false },
      ],
      inputs,
    );
    expect(routes[0]).toEqual({
      src: "^/$",
      status: 308,
      headers: { Location: "/work/arcana-workspace" },
      has: [{ type: "query", key: "open", value: "3" }],
    });
    expect(routes[1]).toMatchObject({ src: "^/work/old-name/?$", status: 308 });
    expect(routes[2]).toMatchObject({ status: 307, headers: { Location: "/work?moved=1" } });
    const tail = routes.slice(-4);
    expect(tail[0]).toEqual({ handle: "filesystem" });
    expect(tail[1]).toMatchObject({ dest: "/__spa-fallback.html", headers: { "X-Robots-Tag": "noindex" } });
    expect(tail[3]).toEqual({ src: "^/(.*)$", dest: "/404.html", status: 404 });
  });

  it("follows 01 · Headers for Studio and previews", () => {
    const routes = buildRoutes(pages, [], inputs);
    const studio = routes.find((r) => "src" in r && r.src === "^/studio(/.*)?$");
    const preview = routes.find((r) => "src" in r && r.src === "^/preview(/.*)?$");
    expect(studio).toMatchObject({
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "Referrer-Policy": "same-origin",
      },
    });
    expect(preview).toMatchObject({
      headers: { "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" },
    });
  });

  it("builds the CSPs from the hosts", () => {
    const pub = publicCsp([], inputs);
    expect(pub).toContain("frame-src https://proto.example.test https://www.youtube-nocookie.com;");
    expect(pub).toContain("connect-src 'self' https://ref.supabase.co");
    expect(pub).toContain("frame-ancestors 'none'");
    expect(publicCsp([], { frameHosts: [], prototypeHosts: [] })).toContain("frame-src 'none'");
    const studio = studioCsp([], inputs);
    expect(studio).toContain("wss://ref.supabase.co");
    expect(studio).not.toContain("youtube");
  });

  it("refuses a build without the fallback or the 404 page", () => {
    expect(() => buildRoutes(pages.slice(0, 2), [], inputs)).toThrow(/__spa-fallback/);
    expect(() => buildRoutes(pages.slice(0, 3), [], inputs)).toThrow(/404/);
  });
});
