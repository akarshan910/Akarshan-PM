import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

/**
 * The component catalogue (M1) is for development and QA only. A production build
 * (`react-router build`) leaves it out unless CATALOGUE=1 is set for a local QA build. The dev
 * server and type generation include it. NODE_ENV can't decide this: the CLI sets it to
 * "production" for typegen too.
 */
const isBuild = process.argv.includes("build");
const catalogue =
  !isBuild || process.env.CATALOGUE === "1" ? [route("dev/components", "routes/dev/components.tsx")] : [];

/** Every route in 01 · Routes. Studio modules use clientLoader only. */
/**
 * With `ssr: false`, every route with a loader needs at least one prerendered page. A post route
 * is registered only once a post is published (type generation always includes it); until then
 * /writing/<slug> is simply a 404.
 */
const { loadPublicContent } = await import("./lib/content.server");
const hasPosts = process.argv.includes("typegen") || (await loadPublicContent()).posts.length > 0;

export default [
  // The public page shell (03 · The page shell): skip link and pill nav around every public page.
  layout("routes/public-layout.tsx", [
    index("routes/home.tsx"),
    route("work", "routes/work.tsx"),
    route("work/:slug", "routes/work.$slug.tsx"),
    route("writing", "routes/writing.tsx"),
    ...(hasPosts ? [route("writing/:slug", "routes/writing.$slug.tsx")] : []),
    // Prerendered as 404.html's source; the host serves it with status 404 for unknown paths (M5).
    route("404", "routes/not-found.tsx", { id: "not-found" }),
  ]),
  // Unknown paths reached inside the SPA (e.g. a mistyped link in Studio) render the same page.
  route("*", "routes/not-found.tsx", { id: "catch-all" }),
  route("preview/:token", "routes/preview.$token.tsx"),
  // Studio (05 · Routes): client-only, every screen a lazy route chunk.
  ...prefix("studio", [
    route("login", "routes/studio/login.tsx"),
    route("signed-out", "routes/studio/signed-out.tsx"),
    layout("routes/studio/shell.tsx", [
      index("routes/studio/dashboard.tsx"),
      route("website", "routes/studio/website.tsx"),
      route("website/profile", "routes/studio/profile.tsx"),
      route("projects", "routes/studio/projects.tsx"),
      route("projects/:id/:tab?", "routes/studio/editor.tsx"),
      route("writing", "routes/studio/writing.tsx"),
      route("writing/:id", "routes/studio/post.tsx"),
      route("media", "routes/studio/media.tsx"),
      route("preview/:kind/:id", "routes/studio/preview.tsx"),
    ]),
  ]),
  ...catalogue,
] satisfies RouteConfig;
