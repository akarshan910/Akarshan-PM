import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

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
export default [
  index("routes/home.tsx"),
  route("work", "routes/work.tsx"),
  route("work/:slug", "routes/work.$slug.tsx"),
  route("writing", "routes/writing.tsx"),
  route("writing/:slug", "routes/writing.$slug.tsx"),
  route("preview/:token", "routes/preview.$token.tsx"),
  ...prefix("studio", [index("routes/studio/dashboard.tsx"), route("login", "routes/studio/login.tsx")]),
  ...catalogue,
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
