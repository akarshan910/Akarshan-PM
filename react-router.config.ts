import type { Config } from "@react-router/dev/config";

/**
 * Public routes are prerendered to static HTML; /studio/* is a client-only SPA
 * served by the SPA fallback (01 · Rendering). Dynamic paths (case studies,
 * posts) are added to `prerender` once their loaders read content.
 */
export default {
  appDirectory: "src",
  ssr: false,
  prerender: ["/", "/work", "/writing"],
} satisfies Config;
