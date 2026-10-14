import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** The V0 layout's visible sections, in page order (07 · Layout). */
const ORDER = [
  "hero",
  "proof",
  "strategy",
  "about",
  "experience",
  "skills",
  "testimonials",
  "offduty",
  "contact",
];

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test.describe("Home", () => {
  test("renders every section in the layout's order, with the footer after <main>", async ({ page }) => {
    await page.goto("/");
    const ids = await page.locator("main [id]").evaluateAll((els) => els.map((e) => e.id));
    expect(ids.filter((id) => ORDER.includes(id))).toEqual(ORDER);
    // The legacy anchors sit at the start of their sections (07 · Legacy links).
    expect(ids.indexOf("work")).toBe(ids.indexOf("strategy") - 1);
    expect(ids.indexOf("exp")).toBe(ids.indexOf("experience") + 1);
    expect(ids.indexOf("testi")).toBe(ids.indexOf("testimonials") + 1);
    await expect(page.locator("main + footer")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle("Akarshan Kumar · Senior Product Manager");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /8 years experience/);
  });

  test("renders content without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Akarshan");
    await expect(page.locator("#offduty article").first()).toBeVisible();
    await context.close();
  });

  test("the nav's scroll-spy marks the section on screen", async ({ page }) => {
    test.skip(isPhone(page), "Phones show Menu instead of the links");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await page.locator("#experience").evaluate((el) => {
      el.scrollIntoView({ behavior: "instant" });
    });
    await expect(nav.getByRole("link", { name: "Exp" })).toHaveAttribute("aria-current", "true");
    await page.locator("#skills").evaluate((el) => {
      el.scrollIntoView({ behavior: "instant" });
    });
    await expect(nav.getByRole("link", { name: "Skills" })).toHaveAttribute("aria-current", "true");
    await expect(nav.getByRole("link", { name: "Exp" })).not.toHaveAttribute("aria-current", "true");
  });

  test("the phone menu opens and closes", async ({ page }) => {
    test.skip(!isPhone(page), "Phones only");
    await page.goto("/");
    const button = page.getByRole("button", { name: "Open menu" });
    await button.click();
    const menu = page.getByRole("dialog", { name: "Site menu" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("navigation", { name: "Sections" }).getByRole("link")).toHaveCount(5);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    // Choosing a link closes the menu, then scrolls.
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("dialog", { name: "Site menu" })
      .getByRole("link", { name: /Skills/ })
      .click();
    await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
    await expect
      .poll(() => page.locator("#skills").evaluate((el) => Math.round(el.getBoundingClientRect().top)))
      .toBeLessThan(200);
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    expect(await axe(page)).toEqual([]);
  });

  test("reveals sections below the fold as they scroll in", async ({ page }) => {
    await page.goto("/");
    const about = page.locator("#about");
    await expect(about).toHaveClass(/rv-wait/);
    await about.scrollIntoViewIfNeeded();
    await expect(about).not.toHaveClass(/rv-wait/);
    // Once revealed, the blocks lose their step markers and sit fully visible.
    await expect(about.locator("[data-reveal-step]")).toHaveCount(0);
    await expect(about.locator("h2").locator("..").locator("..")).toHaveCSS("opacity", "1");
  });

  test("under reduced motion nothing moves", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.install();
    await page.goto("/");
    await page.clock.runFor(500); // let React hydrate under the fake clock
    await expect(page.locator("html")).toHaveClass(/\bstill\b/);
    const hero = page.locator("#hero");
    const ink = hero.locator("[data-ink]");
    const identity = (m: string) => m === "none" || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(m);
    expect(identity(await ink.evaluate((el) => getComputedStyle(el).transform))).toBe(true);
    expect(await ink.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    for (const el of await hero.locator("h1, p").all()) {
      expect(await el.evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
    }
    // No tilt on the pointer, and the floaters hold their rest pose.
    await page.mouse.move(200, 300);
    await page.mouse.move(900, 500);
    await page.clock.runFor(10_000);
    expect(await hero.evaluate((el) => el.style.getPropertyValue("--mx"))).toBe("");
    if (!isPhone(page)) {
      const opacities = await page
        .locator("[class*='flLaptop'] a")
        .evaluateAll((els) => els.map((e) => (e as HTMLElement).style.opacity));
      expect(opacities).toEqual(["1", "1", "1", "0", "0"]);
    }
    // Sections below the fold are never hidden.
    await expect(page.locator("#about")).not.toHaveClass(/rv-wait/);
  });

  test("the hero tilts toward the pointer and the floaters rotate", async ({ page }) => {
    test.skip(isPhone(page), "Phones drift instead, with no floaters");
    await page.clock.install();
    await page.goto("/");
    const hero = page.locator("#hero");
    // Hydration finishes in real time; keep nudging the pointer until the tilt is attached.
    let x = 100;
    await expect
      .poll(async () => {
        await page.mouse.move((x += 2), 140);
        await page.clock.runFor(50); // the fake clock drives requestAnimationFrame too
        return hero.evaluate((el) => el.style.getPropertyValue("--mx"));
      })
      .not.toBe("");
    const mx = Number(await hero.evaluate((el) => el.style.getPropertyValue("--mx")));
    expect(mx).toBeLessThan(0);
    await page.mouse.move(700, 880); // off the hero, below it
    await page.mouse.move(700, 895);
    const cards = page.locator("[class*='flLaptop'] a");
    await page.clock.runFor(2600);
    await expect(cards.first()).toHaveCSS("opacity", "0");
    await page.clock.runFor(700 + 1300 + 60);
    await expect.poll(() => cards.nth(3).evaluate((e) => (e as HTMLElement).style.opacity)).toBe("1");
  });
});
