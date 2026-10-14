/** Copies the V0 covers (07 · Covers) into public/media/v0 for the local-v0 content source. */
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function copyLocalCovers(root = "."): void {
  const from = join(root, "design", "covers");
  const to = join(root, "public", "media", "v0");
  mkdirSync(to, { recursive: true });
  for (const file of readdirSync(from)) {
    if (file.endsWith(".webp")) copyFileSync(join(from, file), join(to, file));
  }
}
