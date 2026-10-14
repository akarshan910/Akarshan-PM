import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the component catalogue has no accessibility violations", async ({ page }) => {
  // Entrances (popover fades, menus) would let axe measure contrast mid-fade; check the settled page.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/components");
  // The dev server compiles the catalogue on its first visit, which can take longer than 5s in CI.
  await expect(page.getByRole("heading", { level: 1, name: "Components" })).toBeVisible({ timeout: 30_000 });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
});
