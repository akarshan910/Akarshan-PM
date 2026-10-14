import { expect, test } from "@playwright/test";

const SITE = "https://akarshan-pm.vercel.app";

/** 06 · SEO and 01 · Routes, on the built site. */
test.describe("metadata and feeds", () => {
  test("Home has its canonical, Open Graph and Person JSON-LD", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}/`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${SITE}/og-default.png`,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Akarshan Kumar/);
    const ld = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
    ) as {
      "@type"?: string;
    };
    expect(ld["@type"]).toBe("Person");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test("a case study and /work have their own canonical", async ({ page }) => {
    await page.goto("/work/arcana-workspace/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}/work/arcana-workspace`,
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    await page.goto("/work/");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Every project, with labelled results.",
    );
  });

  test("the share image exists at 1200×630", async ({ request }) => {
    const res = await request.get("/og-default.png");
    expect(res.status()).toBe(200);
    const png = await res.body();
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });

  test("robots.txt and sitemap.xml are built; Studio and drafts stay out", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /studio");
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`<loc>${SITE}/work/puja-engagement-platform</loc>`);
    expect(sitemap).not.toContain("/studio");
    expect(sitemap).not.toContain("/writing"); // V0 has no posts
  });

  test("previews and Studio are noindex", async ({ page }) => {
    await page.goto("/studio/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});
