import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { resolveLikeVercel, serveLikeVercel } from "./vercel-routing";

/**
 * Drafts never leak, at the build level (08 · Drafts never leak; 10 · Security gates › Drafts). The data
 * level is supabase/tests/no-leaks.test.ts. This half runs in CI's `no-leaks` job against a local Supabase
 * stack seeded by `npm run seed:leaks` (scripts/seed-leak-markers.ts), whose manifest it reads from
 * NO_LEAKS_MANIFEST. The stack's URL and demo anon key come from `supabase status`.
 * Without a manifest it skips.
 */
interface Manifest {
  /** Every marker string, seeded where a visitor must never see it. */
  markers: string[];
  /** Draft, unlisted and scheduled ids: never in built files (anon may read them in the published layout). */
  privateIds: string[];
  /** A draft project's and a scheduled post's addresses: the 404 page. */
  notFound: string[];
  /** The unlisted project: rendered by the shell through pm-project, noindex, linked from nowhere. */
  unlisted: { path: string; slug: string };
  /** A live post, to prove the build did read the seeded content. */
  livePost: string;
  /** A live preview link; `marker` is in its draft. */
  preview: {
    token: string;
    tokenHash: string;
    marker: string;
    /** pm-preview's DELETE, with a signed-in local owner's session (the seed signs one in). */
    revokeUrl: string;
    revokeHeaders: Record<string, string>;
  };
}

const manifestPath = process.env.NO_LEAKS_MANIFEST;
const manifest: Manifest | null = manifestPath
  ? (JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest)
  : null;
const supabaseUrl = process.env.SUPABASE_URL ?? "";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";

/** Every pm table; RLS and the column grants decide what anon gets. */
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
/** `select *` is refused where anon has column grants only, so each column is also tried alone. */
const COLUMNS = ["id", "published", "draft", "slug", "published_slug", "visibility", "token_hash", "url"];
const RPCS = ["public_redirects", "topic_counts"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const found = (text: string, needles: string[]) => needles.filter((n) => text.includes(n));

test.describe("drafts never leak (build)", () => {
  test.skip(!manifest, "Runs in CI's no-leaks job, with NO_LEAKS_MANIFEST from npm run seed:leaks");

  test("the build read the seeded content", () => {
    const m = manifest as Manifest;
    expect(statSync(join("build/client", m.livePost, "index.html")).isFile()).toBe(true);
  });

  test("no marker or private id in any built file", () => {
    const m = manifest as Manifest;
    const needles = [...m.markers, ...m.privateIds];
    const built = files("build/client").filter((f) => /\.(html|js|json|data|xml|txt)$/.test(f));
    const extra = ["vercel.json"].filter((f) => {
      try {
        return statSync(f).isFile();
      } catch {
        return false;
      }
    });
    const leaks = [...built, ...extra].flatMap((f) =>
      found(readFileSync(f, "utf8"), needles).map((n) => `${f}: ${n}`),
    );
    expect(leaks).toEqual([]);
  });

  test("anon gets no marker from any table or function", async () => {
    const m = manifest as Manifest;
    const anon = createClient(supabaseUrl, anonKey, {
      db: { schema: "pm" },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const leaks: string[] = [];
    for (const table of TABLES) {
      for (const columns of ["*", ...COLUMNS]) {
        const result: { data: unknown } = await anon.from(table).select(columns);
        leaks.push(
          ...found(JSON.stringify(result.data ?? []), m.markers).map((x) => `${table}(${columns}): ${x}`),
        );
      }
    }
    for (const fn of RPCS) {
      const result: { data: unknown } = await anon.rpc(fn);
      leaks.push(...found(JSON.stringify(result.data ?? []), m.markers).map((x) => `${fn}(): ${x}`));
    }
    expect(leaks).toEqual([]);
  });

  /**
   * UNLISTED-1 (portfolio, open): an address with no prerendered page hydrates the SPA fallback, which
   * carries no loader data for the public layout either, so the root boundary shows the error state
   * before work.$slug's boundary can ask pm-project. Leak checks stay strict; only the render is expected
   * to fail until the shell is fixed, and this flips to "passed unexpectedly" when it is.
   */
  const UNLISTED_1 =
    "UNLISTED-1: /work/<slug> without a page shows the error state (SPA fallback has no layout data)";

  for (const kind of ["draft project", "scheduled post"] as const) {
    test(`a ${kind} shows the 404 and carries no marker`, async ({ page, baseURL }) => {
      const m = manifest as Manifest;
      const path = m.notFound.find((p) =>
        kind === "draft project" ? p.startsWith("/work/") : p.startsWith("/writing/"),
      );
      expect(path, `the manifest has a ${kind}`).toBeTruthy();
      // As the host serves it (D83): vite preview would answer with another page's HTML.
      await serveLikeVercel(page, baseURL ?? "");
      const res = await page.goto(path as string);
      expect(found((await res?.text()) ?? "", m.markers), path).toEqual([]);
      await page.waitForTimeout(1_000);
      expect(found(await page.content(), m.markers), path).toEqual([]);
      if (kind === "draft project") test.fail(true, UNLISTED_1);
      // The unlisted shell asks pm-project before it shows the 404 state (C21), so allow for the call.
      const state = page.getByRole("heading", { level: 1, name: /doesn.t exist/i });
      await state.waitFor({ timeout: 20_000 }).catch(() => undefined);
      const shown = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300);
      expect(await state.count(), `${path as string} shows: ${shown}`).toBe(1);
    });
  }

  test("the unlisted project renders with noindex and isn't linked", async ({ page, baseURL }) => {
    const m = manifest as Manifest;
    expect(resolveLikeVercel(m.unlisted.path).headers["X-Robots-Tag"]).toContain("noindex");
    const linked = files("build/client")
      .filter((f) => /\.(html|xml)$/.test(f))
      .filter((f) => readFileSync(f, "utf8").includes(m.unlisted.path));
    expect(linked).toEqual([]);
    test.fail(true, UNLISTED_1);
    await serveLikeVercel(page, baseURL ?? "");
    await page.goto(m.unlisted.path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/, {
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { level: 1 })).not.toContainText("404");
  });

  test("a preview link is no-store and noindex, and 410 once revoked", async ({ request }) => {
    const m = manifest as Manifest;
    const url = `${supabaseUrl}/functions/v1/pm-preview?token=${encodeURIComponent(m.preview.token)}`;
    const live = await request.get(url);
    expect(live.status()).toBe(200);
    expect(live.headers()["cache-control"]).toContain("no-store");
    expect(live.headers()["x-robots-tag"] ?? "").toContain("noindex");
    expect(await live.text()).toContain(m.preview.marker);
    const revoked = await request.delete(m.preview.revokeUrl, { headers: m.preview.revokeHeaders });
    expect(revoked.ok()).toBe(true);
    expect((await request.get(url)).status()).toBe(410);
  });
});
