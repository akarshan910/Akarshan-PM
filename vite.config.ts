import { reactRouter } from "@react-router/dev/vite";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

import { copyFonts } from "./scripts/copy-fonts.ts";
import { copyLocalCovers } from "./scripts/copy-local-covers.ts";

/** Puts the self-hosted fonts (and, for local content, the V0 covers) in public/ whenever Vite starts. */
function selfHostedFonts(): Plugin {
  let root = ".";
  return {
    name: "pm:self-hosted-fonts",
    configResolved(config) {
      root = config.root;
    },
    buildStart() {
      copyFonts(root);
      // The local-v0 content serves the V0 covers from /media/v0 (dev and local builds only).
      if ((process.env.CONTENT_SOURCE ?? "local-v0") === "local-v0") copyLocalCovers(root);
    },
  };
}

export default defineConfig({
  plugins: [selfHostedFonts(), reactRouter()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // Lazy routes (the catalogue, Studio) import these after the first page loads. Discovered that late,
  // Vite re-optimises and reloads mid-visit, and a page can end up with two copies of React. Listing them
  // makes the dev server bundle them before the first request.
  optimizeDeps: {
    include: [
      "zod",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
  },
});
