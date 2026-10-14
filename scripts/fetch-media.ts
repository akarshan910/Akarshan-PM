/**
 * Copies every image the published content uses into the build (06 · Storage): visitors never load
 * images from Supabase. Each `/media/<id>/r<rev>/<file>` path is downloaded from `pm-media-public` into
 * `build/client/media/…`, through a cache keyed by path (a revision never changes, so an unchanged
 * image isn't fetched again). A failed download fails the build. Runs after `react-router build`.
 *
 * The V0 and fixture sources serve their covers from /media/v0 (copied from design/covers), so with
 * them there's nothing to download.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { loadPublicContent } from "../src/lib/content.server";
import { publicBucketUrl, publishedMediaPaths } from "../src/lib/media-files";

const out = join(process.env.PM_BUILD_DIR ?? "build", "client");
const cache = join("node_modules", ".cache", "pm-media");
/** 06 · Storage: nothing larger is ever uploaded. */
const MAX_BYTES = 10 * 1024 * 1024;

const paths = publishedMediaPaths(await loadPublicContent());
if (paths.length === 0) {
  console.log("fetch-media: no published media to copy");
  process.exit(0);
}
const supabase = process.env.VITE_SUPABASE_URL;
if (!supabase) throw new Error("fetch-media: VITE_SUPABASE_URL is needed to copy published media.");

let fetched = 0;
for (const path of paths) {
  const cached = join(cache, path);
  if (!existsSync(cached)) {
    const res = await fetch(publicBucketUrl(supabase, path));
    if (!res.ok) throw new Error(`fetch-media: ${path} answered ${String(res.status)}`);
    const body = Buffer.from(await res.arrayBuffer());
    if (body.byteLength > MAX_BYTES) throw new Error(`fetch-media: ${path} is over 10 MB`);
    mkdirSync(dirname(cached), { recursive: true });
    writeFileSync(cached, body);
    fetched++;
  }
  const target = join(out, path);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(cached, target);
}
console.log(`fetch-media: ${String(paths.length)} files (${String(fetched)} downloaded, the rest cached)`);
