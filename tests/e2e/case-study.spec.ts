import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Every V0 project, in Your order (07 · Projects). */
const SLUGS = [
  "puja-engagement-platform",
  "word-games-monetisation-strategy",
  "arcana-workspace",
  "glp-1-digital-scaffold",
  "revenue-growth-strategy",
];

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

const chapters = (page: Page) => page.locator("main article > section[aria-labelledby]");

test.describe("/work/:slug", () => {
  for (const slug of SLUGS) {
    test(`${slug} renders, with one h1 and its chapters`, async ({ page }) => {
      await page.goto(`/work/${slug}/`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(chapters(page).first()).toBeVisible();
      await expect(page.getByRole("navigation", { name: "More volumes" }).first()).toBeAttached();
    });
  }

  // The project's own size (laptop or phone) plus iPad portrait, which has no project of its own.
  for (const width of [undefined, 834]) {
    test(`passes axe${width ? ` at ${width}` : ""}`, async ({ page }) => {
      test.skip(width !== undefined && isPhone(page), "iPad runs once, from the laptop project");
      if (width) await page.setViewportSize({ width, height: 1112 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const slug of SLUGS) {
        await page.goto(`/work/${slug}/`);
        expect(await axe(page), slug).toEqual([]);
      }
    });
  }

  test("the laptop rail follows the chapter on screen", async ({ page }) => {
    test.skip(isPhone(page), "Laptop only");
    await page.goto(`/work/${SLUGS[0]}/`);
    const rail = page.getByRole("navigation", { name: "Chapters" });
    await expect(rail).toBeVisible();
    const links = rail.getByRole("link");
    await expect(links).toHaveCount(await chapters(page).count());
    await chapters(page)
      .nth(2)
      .evaluate((el) => {
        el.scrollIntoView({ behavior: "instant" });
      });
    await expect(links.nth(2)).toHaveAttribute("aria-current", "true");
  });

  test("on iPad and phones the chapter sheet opens, jumps and closes", async ({ page }) => {
    if (!isPhone(page)) await page.setViewportSize({ width: 834, height: 1112 });
    await page.goto(`/work/${SLUGS[0]}/`);
    const bar = page.getByRole("button", { name: "Jump to chapter" });
    await expect(bar).toHaveAttribute("aria-expanded", "false");
    await bar.click();
    await expect(bar).toHaveAttribute("aria-expanded", "true");
    const sheet = page.getByRole("navigation", { name: "Chapters" });
    await expect(sheet).toBeVisible();

    // Esc closes it and gives focus back to the bar.
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(bar).toBeFocused();

    // Choosing a chapter closes the sheet and scrolls there.
    await bar.click();
    const third = await chapters(page).nth(2).getAttribute("id");
    await sheet.getByRole("link").nth(2).click();
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`#${third}$`));
    await expect
      .poll(() =>
        chapters(page)
          .nth(2)
          .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
      )
      .toBeLessThan(400);
    await expect(bar).toContainText("03 /");

    // A click outside closes it too.
    await bar.click();
    await expect(sheet).toBeVisible();
    await page.locator("h1").click();
    await expect(sheet).toBeHidden();
  });

  test("reads without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    for (const slug of SLUGS) {
      await page.goto(`/work/${slug}/`);
      await expect(page.locator("h1")).not.toBeEmpty();
      await expect(chapters(page).first().locator("h2")).toBeVisible();
      // The chapters' text is in the HTML, not added later.
      const text = await chapters(page).first().innerText();
      expect(text.length, slug).toBeGreaterThan(40);
    }
    await context.close();
  });
});
