import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the component catalogue has no accessibility violations", async ({ page }) => {
  await page.goto("/dev/components");
  await expect(page.getByRole("heading", { level: 1, name: "Components" })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
});
