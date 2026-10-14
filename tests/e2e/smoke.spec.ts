import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

test("the homepage is prerendered and sets the bootstrap classes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/\bjs\b/);
});

test("Studio is noindex", async ({ page }) => {
  await page.goto("/studio/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("the SPA fallback ships a title before JavaScript runs (WCAG 2.4.2)", () => {
  const html = readFileSync("build/client/__spa-fallback.html", "utf8");
  expect(html).toMatch(/<title>[^<\s][^<]*<\/title>/);
});

test("route titles replace the default", async ({ page }) => {
  await page.goto("/");
  await expect(page).not.toHaveTitle("Portfolio");
});
