import { expect, test } from "@playwright/test";

import { serveLikeVercel } from "./vercel-routing";

/**
 * What a visitor gets at an address with no prerendered page, served as the host serves it (D83):
 * an unlisted /work/<slug> gets the SPA fallback, anything else 404.html with status 404, hydrating
 * at the unknown address. Both keep the nav and footer (C21) and show the 404 state, never the
 * error state, and neither is indexed. Review's UNLISTED-1 and NOTFOUND-1 (no-leaks.spec.ts covers
 * the same with posts published, on the local Supabase stack).
 */
for (const path of [
  "/work/no-such-project",
  "/no-such-page",
  "/writing/no-such-post",
  "/studio/no-such-screen",
]) {
  test(`${path}: the 404 inside the nav and footer, noindex`, async ({ page, baseURL }) => {
    test.skip(test.info().project.name !== "laptop", "the same document at every width");
    await serveLikeVercel(page, baseURL ?? "");
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1, name: /doesn.t exist/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}

test("the build writes the layout's chrome for the SPA fallback, published content only", async ({
  request,
}) => {
  test.skip(test.info().project.name !== "laptop", "one build");
  const res = await request.get("/layout.json");
  expect(res.ok()).toBe(true);
  const data = (await res.json()) as { chrome: { nav: unknown[]; footer: { name: string } } };
  expect(data.chrome.nav.length).toBeGreaterThan(0);
  expect(data.chrome.footer.name).toBe("Akarshan Kumar");
});
