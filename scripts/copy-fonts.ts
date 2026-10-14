/** Copies the self-hosted fonts (and their OFL licence) from node_modules into public/fonts. */
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const FONTS: Record<string, string[]> = {
  archivo: ["archivo-latin-wdth-normal", "archivo-latin-ext-wdth-normal"],
  geist: ["geist-latin-wght-normal", "geist-latin-ext-wght-normal"],
  "geist-mono": ["geist-mono-latin-wght-normal", "geist-mono-latin-ext-wght-normal"],
  "jetbrains-mono": ["jetbrains-mono-latin-wght-normal", "jetbrains-mono-latin-ext-wght-normal"],
};

const out = join("public", "fonts");
mkdirSync(out, { recursive: true });
for (const [pkg, files] of Object.entries(FONTS)) {
  const dir = join("node_modules", "@fontsource-variable", pkg);
  for (const file of files) copyFileSync(join(dir, "files", `${file}.woff2`), join(out, `${file}.woff2`));
  copyFileSync(join(dir, "LICENSE"), join(out, `${pkg}-LICENSE.txt`));
}
