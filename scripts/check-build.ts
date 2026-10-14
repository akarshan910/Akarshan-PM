/**
 * Post-build guard (10 · Security gates): the shipped site must not contain the dev-only
 * component catalogue, and no public page may reference Studio's code or styles.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const out = "build/client";
const problems: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(out);
if (process.env.CATALOGUE !== "1") {
  for (const file of files.filter((f) => /\.(js|html|json)$/.test(f))) {
    if (readFileSync(file, "utf8").includes("routes/dev/"))
      problems.push(`${file} contains the dev catalogue`);
  }
}
for (const file of files.filter((f) => f.endsWith(".html") && !f.endsWith("__spa-fallback.html"))) {
  const html = readFileSync(file, "utf8");
  if (/<(link|script)[^>]+(studio|dashboard|login)-[A-Za-z0-9_-]+\.(css|js)/.test(html)) {
    problems.push(`${file} loads Studio code`);
  }
}

if (problems.length > 0) {
  console.error(["Build check failed:", ...problems.map((p) => `  - ${p}`)].join("\n"));
  process.exit(1);
}
