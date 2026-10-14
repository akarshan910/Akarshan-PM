import { expect, test, type Page } from "@playwright/test";

import { PAGES } from "./pages";

/** What the focused element looks like, read after its focus ring has finished animating in. */
async function focusState(page: Page) {
  await page.waitForTimeout(250); // the nav ring animates a registered property (04 · Ground rules 3)
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none";
    const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1);
    const y = Math.min(Math.max(r.top + Math.min(r.height / 2, 8), 1), innerHeight - 1);
    const top = document.elementFromPoint(x, y);
    const label = (el.getAttribute("aria-label") ?? el.textContent).trim().slice(0, 40);
    return {
      id: `${el.tagName.toLowerCase()} "${label}" ${el.getAttribute("href") ?? ""}`,
      ring,
      inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
      obscured: Boolean(top && !el.contains(top) && !top.contains(el)),
      size: r.width * r.height,
    };
  });
}

/**
 * 08 · Keyboard: every stop is visible (2.4.7), on screen and not hidden behind the sticky pill
 * or chapter bar (2.4.11), and Tab reaches the end of the page without a trap.
 */
for (const width of [1440, 834, 390]) {
  test.describe(`keyboard @${width}`, () => {
    test.use({
      viewport: { width, height: width < 768 ? 844 : 900 },
      contextOptions: { reducedMotion: "reduce" },
    });
    for (const p of PAGES.filter((p) => !p.placeholder)) {
      test(`${p.name}: every tab stop is visible`, async ({ page }) => {
        await page.goto(p.path);
        const problems: string[] = [];
        const seen = new Set<string>();
        for (let i = 0; i < 300; i++) {
          await page.keyboard.press("Tab");
          const s = await focusState(page);
          if (!s) {
            if (seen.size) break;
            continue;
          }
          if (seen.has(s.id) && i > 2) break; // wrapped round
          seen.add(s.id);
          if (!s.ring) problems.push(`no focus ring: ${s.id}`);
          if (!s.inView) problems.push(`off screen: ${s.id}`);
          else if (s.obscured) problems.push(`obscured: ${s.id}`);
          if (!s.size) problems.push(`zero size: ${s.id}`);
        }
        expect(seen.size).toBeGreaterThan(3);
        expect(problems).toEqual([]);
      });
    }
  });
}

test.describe("dialogs and disclosures by keyboard", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  // 03 · Phone menu: while open, focus cycles through the pill and the menu; the page is inert.
  test("phone menu: focus stays in the pill and menu, Esc closes and returns focus", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const button = page.getByRole("button", { name: "Open menu" });
    await button.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("dialog", { name: "Site menu" });
    await expect(menu).toBeVisible();
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() =>
        Boolean(document.activeElement?.closest("[role=dialog], nav[aria-label=Primary]")),
      );
      expect(inside, `Tab ${i + 1} left the menu`).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("/work filters sheet: focus starts inside, stays inside, Esc returns it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/work/");
    const button = page.getByRole("button", { name: /^Filters/ });
    await button.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Close filters" })).toBeFocused();
    const stops = await sheet.locator("button, input, select, a[href]").count();
    for (let i = 0; i < stops + 3; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest("[role=dialog]")))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("/work topic menu: a disclosure; Esc closes it and returns focus", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/work/");
    const topic = page.getByRole("button", { name: /^Topic/ });
    await topic.focus();
    await page.keyboard.press("Enter");
    await expect(topic).toHaveAttribute("aria-expanded", "true");
    const panel = page.locator(`[id="${await topic.getAttribute("aria-controls")}"]`);
    await expect(panel).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(panel.locator(":focus")).toHaveCount(1);
    await page.keyboard.press("Space");
    await expect(page).toHaveURL(/topic=/);
    await page.keyboard.press("Escape");
    await expect(topic).toHaveAttribute("aria-expanded", "false");
    await expect(topic).toBeFocused();
  });

  for (const width of [834, 390]) {
    test(`case study chapter sheet @${width}: opens, Esc closes and returns focus`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/work/puja-engagement-platform/");
      await page.evaluate(() => {
        scrollTo(0, 2500);
      });
      const bar = page.getByRole("button", { name: "Jump to chapter" });
      await expect(bar).toBeVisible();
      await bar.focus();
      await page.keyboard.press("Enter");
      await expect(bar).toHaveAttribute("aria-expanded", "true");
      const sheet = page.getByRole("navigation", { name: "Chapters" }).last();
      await expect(sheet).toBeVisible();
      await expect(sheet.locator("[aria-current=true]")).toHaveCount(1);
      await page.keyboard.press("Tab");
      await expect(sheet.locator(":focus")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(bar).toBeFocused();
    });
  }

  test("testimonials page by keyboard and announce the new range", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const section = page.locator("#testimonials");
    const counter = section.locator("[aria-live=polite]");
    const before = await counter.textContent();
    await section.getByRole("button", { name: "Next testimonials" }).focus();
    await page.keyboard.press("Enter");
    await expect(counter).not.toHaveText(before ?? "");
    await expect(section.getByRole("button", { name: "Previous testimonials" })).toBeEnabled();
  });
});
