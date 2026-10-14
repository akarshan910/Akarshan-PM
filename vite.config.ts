import { reactRouter } from "@react-router/dev/vite";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

import { copyFonts } from "./scripts/copy-fonts.ts";

/** Puts the self-hosted fonts in public/fonts whenever Vite starts, for dev and build alike. */
function selfHostedFonts(): Plugin {
  let root = ".";
  return {
    name: "pm:self-hosted-fonts",
    configResolved(config) {
      root = config.root;
    },
    buildStart() {
      copyFonts(root);
    },
  };
}

export default defineConfig({
  plugins: [selfHostedFonts(), reactRouter()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
