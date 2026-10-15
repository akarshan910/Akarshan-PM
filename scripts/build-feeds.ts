/**
 * Writes `robots.txt`, `sitemap.xml` and `/writing/rss.xml` into the build (06 · Build-time data,
 * 01 · Routes), from the same published content the pages were prerendered from. The feed is written
 * only once a post is published. Runs after `react-router build`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { loadPublicContent } from "../src/lib/content.server";
import { robotsTxt, rssXml, sitemapXml } from "../src/lib/feeds";
import { siteUrl } from "../src/lib/seo";

const out = join(process.env.PM_BUILD_DIR ?? "build", "client");
const site = siteUrl(process.env.SITE_URL);
const content = await loadPublicContent();

function write(path: string, text: string) {
  const file = join(out, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  console.log(`build-feeds: ${path}`);
}

write("robots.txt", robotsTxt(site));
write("sitemap.xml", sitemapXml(content, site));
const rss = rssXml(content, site);
if (rss) write("writing/rss.xml", rss);
else console.log("build-feeds: no posts yet, so no /writing/rss.xml");
