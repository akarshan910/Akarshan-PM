import { expect, test } from "@playwright/test";

test("the homepage is prerendered and sets the bootstrap classes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/\bjs\b/);
});

test("Studio is noindex", async ({ page }) => {
  await page.goto("/studio/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
