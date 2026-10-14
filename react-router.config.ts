import type { Config } from "@react-router/dev/config";

/**
 * Public routes are prerendered to static HTML; /studio/* is a client-only SPA served by the SPA
 * fallback (01 · Rendering). Case studies and posts are prerendered at their live addresses, read
 * from the same content source the loaders use.
 */
export default {
  appDirectory: "src",
  // The parity build (CONTENT_SOURCE=fixture:boards) goes to its own folder, so it never mixes with
  // the real build (08 · Pixel parity).
  buildDirectory: process.env.PM_BUILD_DIR ?? "build",
  ssr: false,
  async prerender() {
    const { loadPublicContent } = await import("./src/lib/content.server");
    const content = await loadPublicContent();
    return [
      "/",
      "/work",
      "/writing",
      "/404",
      ...content.projects.filter((p) => p.listed).map((p) => `/work/${p.slug}`),
      ...content.posts.map((p) => `/writing/${p.slug}`),
    ];
  },
} satisfies Config;
