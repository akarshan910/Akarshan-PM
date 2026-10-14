import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

const notFound = (page: Page) => page.getByRole("heading", { level: 1, name: "This page doesn’t exist." });

test.describe("page states", () => {
  test("/404 keeps the nav and footer, offers the ways on, and passes axe", async ({ page }) => {
    await page.goto("/404/");
    await expect(notFound(page)).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeAttached();
    await expect(page.locator("main + footer")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "See all work" })).toHaveAttribute("href", "/work");
    await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    // V0 has no posts, so Writing isn't offered (D19).
    await expect(page.locator("main").getByRole("link", { name: "Writing" })).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    expect(await axe(page)).toEqual([]);
  });

  test("/writing is the 404 page while there are no posts", async ({ page }) => {
    await page.goto("/writing/");
    await expect(notFound(page)).toBeVisible();
  });

  test("the 404 page reads without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/404/");
    await expect(notFound(page)).toBeVisible();
    await context.close();
  });

  // HANDOFF Next item 7 (M5): unprerendered /work/<slug> needs the unlisted shell and the host's
  // rewrites; until then it hydrates another page's HTML and shows the error state.
  test.fixme("an unknown case study shows the 404 page", async ({ page }) => {
    await page.goto("/work/not-a-project/");
    await expect(notFound(page)).toBeVisible();
  });

  test("a failed load shows the error state", async ({ page }) => {
    await page.route("**/work/broken.data**", (route) => route.fulfill({ status: 500, body: "" }));
    await page.goto("/work/");
    await page.evaluate(() => {
      window.history.pushState({}, "", "/work/broken");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(page.getByRole("heading", { level: 1, name: "Something went wrong." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });

  test("an unknown path inside the site shows the 404 page", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      window.history.pushState({}, "", "/no-such-page");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(notFound(page)).toBeVisible();
  });
});

test.describe("legacy links (07)", () => {
  for (const [query, slug] of [
    ["open=1", "puja-engagement-platform"],
    ["openCase=3", "arcana-workspace"],
    ["open_case=5", "revenue-growth-strategy"],
  ] as const) {
    test(`/?${query} goes to /work/${slug}`, async ({ page }) => {
      await page.goto(`/?${query}`);
      await expect(page).toHaveURL(new RegExp(`/work/${slug}/?$`));
      await expect(page.locator("h1")).toHaveCount(1);
    });
  }

  test("an unknown id stays on Home", async ({ page }) => {
    await page.goto("/?open=9");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Akarshan");
    await expect(page).toHaveURL(/\?open=9$/);
  });
});
