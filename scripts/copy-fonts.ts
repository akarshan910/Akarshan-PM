/**
 * Copies the self-hosted fonts (and their OFL licence) from node_modules into public/fonts.
 * vite.config.ts runs it whenever Vite starts (dev, build), so `react-router dev` always has the
 * fonts; `node scripts/copy-fonts.ts` still works on its own.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const FONTS: Record<string, string[]> = {
  archivo: ["archivo-latin-wdth-normal", "archivo-latin-ext-wdth-normal"],
  geist: ["geist-latin-wght-normal", "geist-latin-ext-wght-normal"],
  "geist-mono": ["geist-mono-latin-wght-normal", "geist-mono-latin-ext-wght-normal"],
  "jetbrains-mono": ["jetbrains-mono-latin-wght-normal", "jetbrains-mono-latin-ext-wght-normal"],
};

export function copyFonts(root = "."): void {
  const out = join(root, "public", "fonts");
  mkdirSync(out, { recursive: true });
  for (const [pkg, files] of Object.entries(FONTS)) {
    const dir = join(root, "node_modules", "@fontsource-variable", pkg);
    for (const file of files) copyFileSync(join(dir, "files", `${file}.woff2`), join(out, `${file}.woff2`));
    copyFileSync(join(dir, "LICENSE"), join(out, `${pkg}-LICENSE.txt`));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) copyFonts();
