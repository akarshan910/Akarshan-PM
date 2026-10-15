import { expect, test, type Page } from "@playwright/test";

/**
 * The prototype's device frame keeps its size when the poster doesn't load (QA, 15 Oct): it fills
 * its column instead of taking its width from the poster, so a missing file can't collapse the
 * case-study hero.
 */
test.use({ viewport: { width: 834, height: 1112 }, hasTouch: true });

async function frame(page: Page, blockMedia: boolean) {
  await page.unrouteAll();
  if (blockMedia) await page.route(/\/media\//, (route) => route.abort());
  await page.goto("/work/arcana-workspace/");
  await page.waitForLoadState("networkidle");
  const device = page.locator('section[aria-label="Interactive prototype"] [class*="_device_"]').first();
  await expect(device).toBeVisible();
  const column = await device.evaluate(
    (el) => el.closest('[class*="_frame_"]')?.getBoundingClientRect().width,
  );
  const box = await device.boundingBox();
  return {
    width: Math.round(box?.width ?? 0),
    height: Math.round(box?.height ?? 0),
    column: Math.round(column ?? 0),
  };
}

test("the iPad device frame is the same size with or without its poster", async ({ page }) => {
  test.skip(test.info().project.name !== "laptop", "sets its own viewport");
  const loaded = await frame(page, false);
  const failed = await frame(page, true);
  expect(failed).toEqual(loaded);
  expect(loaded.width).toBe(loaded.column);
  expect(loaded.width).toBeGreaterThan(200);
});
