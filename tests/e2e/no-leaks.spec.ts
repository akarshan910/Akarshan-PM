import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

/**
 * Drafts never leak, at the build level (08 · Drafts never leak; 10 · Security gates › Drafts). The data
 * level is supabase/tests/no-leaks.test.ts. This half runs in CI's `no-leaks` job against a local Supabase
 * stack seeded by scripts/seed-leak-markers.ts, which writes the manifest below; without one it skips.
 */
interface Manifest {
  /** Every marker string seeded where a visitor must never see it. */
  markers: string[];
  /** The local stack: its URL and the demo anon key `supabase status` prints. */
  supabaseUrl: string;
  anonKey: string;
  /** Addresses of drafts, scheduled posts and other things that must 404. */
  missingPaths: string[];
  /** The unlisted project's address: it renders with noindex and isn't linked. */
  unlistedPath?: string;
  /** A live preview link (pm-preview) and how to revoke it. */
  preview?: { url: string; revokeUrl: string; revokeHeaders: Record<string, string>; marker: string };
}

const manifestPath = process.env.NO_LEAKS_MANIFEST;
const manifest: Manifest | null = manifestPath
  ? (JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest)
  : null;

/** Tables anon can be asked about; RLS and column grants decide what comes back. */
const TABLES = [
  "profile",
  "site_layout",
  "projects",
  "posts",
  "media",
  "owners",
  "project_revisions",
  "post_revisions",
  "site_revisions",
  "slug_redirects",
  "preview_links",
  "link_checks",
  "deploys",
];
const RPCS = ["public_redirects", "topic_counts"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const found = (text: string, markers: string[]) => markers.filter((m) => text.includes(m));

test.describe("drafts never leak (build)", () => {
  test.skip(!manifest, "Runs in CI's no-leaks job, with NO_LEAKS_MANIFEST from the seed script");

  test("no marker in any built file", () => {
    const m = manifest as Manifest;
    const leaks = files("build/client")
      .filter((f) => /\.(html|js|json|data|xml|txt)$/.test(f))
      .flatMap((f) => found(readFileSync(f, "utf8"), m.markers).map((marker) => `${f}: ${marker}`));
    const vercel = (() => {
      try {
        return readFileSync("vercel.json", "utf8");
      } catch {
        return "";
      }
    })();
    leaks.push(...found(vercel, m.markers).map((marker) => `vercel.json: ${marker}`));
    expect(leaks).toEqual([]);
  });

  test("anon gets no marker from any table or function", async () => {
    const m = manifest as Manifest;
    const anon = createClient(m.supabaseUrl, m.anonKey, {
      db: { schema: "pm" },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const leaks: string[] = [];
    for (const table of TABLES) {
      // `*` is refused where anon has column grants only; then each published column is tried alone.
      const { data } = await anon.from(table).select("*");
      leaks.push(...found(JSON.stringify(data ?? []), m.markers).map((x) => `${table}: ${x}`));
      for (const column of ["published", "draft", "slug", "published_slug", "body", "token_hash"]) {
        const one = await anon.from(table).select(column);
        leaks.push(
          ...found(JSON.stringify(one.data ?? []), m.markers).map((x) => `${table}.${column}: ${x}`),
        );
      }
    }
    for (const fn of RPCS) {
      const result: { data: unknown } = await anon.rpc(fn);
      leaks.push(...found(JSON.stringify(result.data ?? []), m.markers).map((x) => `${fn}(): ${x}`));
    }
    expect(leaks).toEqual([]);
  });

  test("drafts and scheduled posts are not found", async ({ page }) => {
    const m = manifest as Manifest;
    for (const path of m.missingPaths) {
      const res = await page.goto(path);
      const html = (await res?.text()) ?? "";
      expect(found(html, m.markers), path).toEqual([]);
      await expect(page.getByRole("heading", { level: 1 }), path).toContainText("404");
      expect(found(await page.content(), m.markers), path).toEqual([]);
    }
  });

  test("the unlisted project renders with noindex and isn't linked", async ({ page }) => {
    const m = manifest as Manifest;
    // The unlisted shell (work.unlisted.tsx) arrives in M5; HANDOFF Next item 4.
    test.fixme(!m.unlistedPath, "The seed manifest has no unlisted path yet");
    await page.goto(m.unlistedPath as string);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const linked = files("build/client")
      .filter((f) => f.endsWith(".html"))
      .filter((f) => readFileSync(f, "utf8").includes(`href="${m.unlistedPath as string}"`));
    expect(linked).toEqual([]);
  });

  test("a preview link is no-store and noindex, and 410 once revoked", async ({ request }) => {
    const m = manifest as Manifest;
    test.fixme(!m.preview, "The seed manifest has no preview link yet");
    const p = m.preview as NonNullable<Manifest["preview"]>;
    const live = await request.get(p.url);
    expect(live.headers()["cache-control"]).toContain("no-store");
    expect(live.headers()["x-robots-tag"] ?? "").toContain("noindex");
    expect(await live.text()).toContain(p.marker);
    const revoke = await request.delete(p.revokeUrl, { headers: p.revokeHeaders });
    expect(revoke.ok()).toBe(true);
    expect((await request.get(p.url)).status()).toBe(410);
  });
});
