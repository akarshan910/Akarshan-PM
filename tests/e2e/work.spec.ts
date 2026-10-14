import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

const rows = (page: Page) => page.locator("main ul li a[href^='/work/']");

test.describe("/work", () => {
  test("lists every listed project, prerendered, and passes axe", async ({ page }) => {
    await page.goto("/work/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      isPhone(page) ? "ALL WORK · 5" : "5 VOLUMES",
      { useInnerText: true },
    );
    await expect(rows(page)).toHaveCount(5);
    await expect(rows(page).first()).toHaveAttribute("href", "/work/puja-engagement-platform");
    await expect(page.getByText("Showing 5 of 5")).toBeVisible();
    if (!isPhone(page)) {
      await expect(
        page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Work" }),
      ).toHaveAttribute("aria-current", "true");
    }
    expect(await axe(page)).toEqual([]);
  });

  test("renders the rows without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/work/");
    await expect(rows(page)).toHaveCount(5);
    await context.close();
  });

  test("filters by shelf, searches, sorts and keeps the state in the address", async ({ page }) => {
    test.skip(isPhone(page), "Phones filter in the sheet");
    await page.goto("/work/");
    const all = page.getByRole("button", { name: "All 5" });
    const shelf = page.getByRole("button", { name: "Strategy & prototypes 5" });
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await shelf.click();
    await expect(shelf).toHaveAttribute("aria-pressed", "true");
    await expect(all).toHaveAttribute("aria-pressed", "false");
    await expect(page).toHaveURL(/shelf=strategy/);

    await page.getByRole("searchbox", { name: "Search work" }).fill("games");
    await expect(rows(page)).toHaveCount(2);
    await expect(page).toHaveURL(/q=games/);
    await expect(page.getByText("Showing 2 of 2")).toBeVisible();

    await page.getByRole("combobox", { name: "Sort" }).selectOption("az");
    await expect(rows(page).first()).toContainText("Revenue growth strategy");
    await expect(page).toHaveURL(/sort=az/);

    // The topic dropdown: a disclosure with checkboxes; Esc closes it.
    await page.getByRole("searchbox", { name: "Search work" }).fill("");
    const topic = page.getByRole("button", { name: /^Topic/ });
    await topic.click();
    await expect(topic).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("checkbox", { name: "Fintech" }).check();
    await expect(rows(page)).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(topic).toHaveAttribute("aria-expanded", "false");
    await expect(topic).toBeFocused();
  });

  test("deep links restore the filters, and no results offers a way back", async ({ page }) => {
    test.skip(isPhone(page), "Laptop controls");
    await page.goto("/work/?shelf=strategy&q=roadmap");
    await expect(page.getByRole("heading", { name: "No projects match." })).toBeVisible();
    await expect(page.getByText("Nothing in Strategy & prototypes mentions “roadmap”.")).toBeVisible();
    await page.getByRole("button", { name: "Keep the search, clear the rest" }).click();
    await expect(page).not.toHaveURL(/shelf=/);
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(rows(page)).toHaveCount(5);
    await expect(page).not.toHaveURL(/q=/);
  });

  test("the moved note shows above the list and can be dismissed", async ({ page }) => {
    await page.goto("/work/?moved=1");
    await expect(page.getByText("That project isn’t available any more.")).toBeVisible();
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(page.getByText("That project isn’t available any more.")).toBeHidden();
    await expect(page).not.toHaveURL(/moved/);
  });

  test("phones filter in a bottom sheet", async ({ page }) => {
    test.skip(!isPhone(page), "Phones only");
    await page.goto("/work/");
    const open = page.getByRole("button", { name: "Filters (0)" });
    await open.click();
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("checkbox", { name: "Games" }).check();
    await expect(rows(page)).toHaveCount(2);
    await sheet.getByRole("button", { name: "Clear filters" }).click();
    await expect(rows(page)).toHaveCount(5);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: "Filters (0)" })).toBeFocused();
    expect(await axe(page)).toEqual([]);
  });
});
