import { describe, expect, it } from "vitest";

import { readRedirects, vercelRedirects } from "~/lib/redirects";
import type { PublicReader } from "~/lib/sources/supabase";

describe("redirects (01 · Old links)", () => {
  it("sends the live site's ?open= links to the case studies, under all three keys", () => {
    const rules = vercelRedirects([]);
    expect(rules).toHaveLength(15);
    expect(rules[0]).toEqual({
      source: "/",
      has: [{ type: "query", key: "open", value: "1" }],
      destination: "/work/puja-engagement-platform",
      permanent: true,
    });
    expect(rules.map((r) => r.has?.[0]?.key)).toContain("open_case");
  });

  it("renames are permanent, moved pages aren't, and bad rows are dropped", () => {
    const rules = vercelRedirects([
      { old_path: "/work/old-name", new_path: "/work/new-name" },
      { old_path: "/writing/gone", new_path: "/writing?moved=1" },
      { old_path: "/work/old-name", new_path: "/work/other" }, // duplicate source
      { old_path: "/work/same", new_path: "/work/same" },
      { old_path: "/studio", new_path: "/work/x" },
      { old_path: "/work/x", new_path: "https://evil.test/" },
      { old_path: "/work/../x", new_path: "/work/y" },
    ]).slice(15);
    expect(rules).toEqual([
      { source: "/work/old-name", destination: "/work/new-name", permanent: true },
      { source: "/writing/gone", destination: "/writing?moved=1", permanent: false },
    ]);
  });

  it("reads pm.public_redirects() and fails the build on an error", async () => {
    const reader = (result: Awaited<ReturnType<NonNullable<PublicReader["redirects"]>>>): PublicReader => ({
      select: () => Promise.resolve({ data: [], error: null }),
      redirects: () => Promise.resolve(result),
    });
    const row = { old_path: "/work/a", new_path: "/work/b" };
    expect(await readRedirects(reader({ data: [row], error: null }))).toEqual([row]);
    expect(await readRedirects(reader({ data: null, error: null }))).toEqual([]);
    await expect(readRedirects(reader({ data: null, error: { message: "denied" } }))).rejects.toThrow(
      /denied/,
    );
    expect(await readRedirects({ select: () => Promise.resolve({ data: [], error: null }) })).toEqual([]);
  });
});
