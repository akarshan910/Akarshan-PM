import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

/** Every route in 01 · Routes. Studio modules use clientLoader only. */
export default [
  index("routes/home.tsx"),
  route("work", "routes/work.tsx"),
  route("work/:slug", "routes/work.$slug.tsx"),
  route("writing", "routes/writing.tsx"),
  route("writing/:slug", "routes/writing.$slug.tsx"),
  route("preview/:token", "routes/preview.$token.tsx"),
  ...prefix("studio", [index("routes/studio/dashboard.tsx"), route("login", "routes/studio/login.tsx")]),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
