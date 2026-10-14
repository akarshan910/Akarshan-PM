import { expect, test, type Page } from "@playwright/test";

import { MEMORY_CODE } from "../../../src/lib/studio/memory";
import { knownDefect } from "../devices/known-defects";
import { axe, overflowing } from "./pages";

/**
 * Studio, every built screen (08 · Accessibility: "on every page and Studio screen"). Studio is a
 * client-only SPA whose in-memory repo exists only in development (src/lib/studio/client.ts), so
 * this runs against the dev server the config starts on PW_PORT_BASE + 1. The sign-in uses the
 * memory repo's test owner (`owner@example.test`, code from MEMORY_CODE); never a real address.
 */
const DEV = process.env.STUDIO_URL ?? `http://localhost:${Number(process.env.PW_PORT_BASE ?? 4310) + 1}`;
const OWNER = "owner@example.test";
/** STUDIO_CODE overrides it when STUDIO_URL points at another branch's dev server. */
const CODE = process.env.STUDIO_CODE ?? MEMORY_CODE;

const SCREENS = [
  { name: "dashboard", path: "/studio", title: /dashboard|studio/i },
  { name: "projects", path: "/studio/projects", title: /projects/i },
  {
    name: "editor overview",
    path: "/studio/projects/3d-body-scan-for-glp-1-users/overview",
    title: /3D body scan/i,
  },
];

/** Whether this branch has Studio's sign-in yet; probed once per worker. */
let built: boolean | undefined;
async function studioBuilt(page: Page) {
  await page.goto(`${DEV}/studio/login`);
  built ??= await page
    .getByRole("button", { name: "Email me a code" })
    .waitFor({ timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  return built;
}

async function signIn(page: Page) {
  await page.getByLabel("Email").fill(OWNER);
  await page.getByRole("button", { name: "Email me a code" }).click();
  const code = page.getByRole("group", { name: /digit code/ });
  await expect(code).toBeVisible({ timeout: 15_000 });
  await code.locator("input").first().focus();
  await page.keyboard.type(CODE);
  await page.waitForURL(/\/studio\/?$/, { timeout: 15_000 });
}

/** Opens a screen and waits for its heading (the SPA renders after the repo loads). */
async function open(page: Page, path: string) {
  await page.goto(`${DEV}${path}`);
  // The editor's h1 sits in its page header, outside main; that's fine.
  await expect(page.locator("h1").filter({ visible: true }).first()).toBeVisible({ timeout: 20_000 });
}

for (const width of [1440, 834, 390]) {
  test.describe(`Studio @${width}`, () => {
    test.use({
      viewport: { width, height: width < 768 ? 844 : 900 },
      hasTouch: width < 1280,
      contextOptions: { reducedMotion: "reduce" },
    });
    test.describe.configure({ mode: "serial" });

    test("sign-in: axe, no overflow, one h1, titled", async ({ page }) => {
      test.skip(!(await studioBuilt(page)), "Studio's sign-in isn't on this branch yet");
      // Settle first: the SPA sets <title> on the client, and axe checks it (CI race, review 2200).
      await expect(page).toHaveTitle(/sign in/i);
      // The form title is h2 on wide screens and h1 on phones (S3); either way it's rendered.
      await expect(page.getByRole("heading", { name: "Sign in to Studio" })).toBeVisible();
      expect(await axe(page)).toEqual([]);
      expect((await overflowing(page)).offenders).toEqual([]);
    });

    test("sign-in: a visible h1", async ({ page }) => {
      const known = knownDefect("studio sign-in h1", width);
      test.fail(Boolean(known), known ? `${known.id}: ${known.note}` : "");
      test.skip(!(await studioBuilt(page)), "Studio's sign-in isn't on this branch yet");
      await expect(page.locator("h1").filter({ visible: true })).toHaveCount(1);
    });

    for (const s of SCREENS) {
      test(`${s.name}: axe, no overflow, one visible h1`, async ({ page }) => {
        test.skip(!(await studioBuilt(page)), "Studio isn't on this branch yet");
        await signIn(page);
        await open(page, s.path);
        await expect(page).toHaveTitle(/Studio/);
        expect(await axe(page)).toEqual([]);
        expect((await overflowing(page)).offenders).toEqual([]);
        await expect(page.locator("h1").filter({ visible: true })).toHaveCount(1);
      });

      test(`${s.name}: the title names the screen (2.4.2)`, async ({ page }) => {
        const known = knownDefect("studio titles", width);
        test.fail(Boolean(known), known ? `${known.id}: ${known.note}` : "");
        test.skip(!(await studioBuilt(page)), "Studio isn't on this branch yet");
        await signIn(page);
        await open(page, s.path);
        await expect(page).not.toHaveTitle(/^Studio$/);
        await expect(page).toHaveTitle(s.title);
      });

      test(`${s.name}: every tab stop is visible and never fully covered (2.4.7, 2.4.11)`, async ({
        page,
      }) => {
        const known = knownDefect(`studio ${s.name} focus`, width);
        test.fail(Boolean(known), known ? `${known.id}: ${known.note}` : "");
        test.skip(!(await studioBuilt(page)), "Studio isn't on this branch yet");
        await signIn(page);
        await open(page, s.path);
        const problems: string[] = [];
        const seen = new Set<string>();
        for (let i = 0; i < 150; i++) {
          await page.keyboard.press("Tab");
          await page.waitForTimeout(120);
          const f = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement | null;
            if (!el || el === document.body) return null;
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            const ring =
              (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none";
            // Fully covered = every probe point lands on something else (sticky bars).
            const pts = [
              [r.left + 3, r.top + 3],
              [r.right - 3, r.top + 3],
              [r.left + 3, r.bottom - 3],
              [r.right - 3, r.bottom - 3],
              [r.left + r.width / 2, r.top + r.height / 2],
            ];
            // A wrapping <label> is part of the control: its hit area (`.t44` ::after) may sit on top.
            const control = el.closest("label") ?? el;
            const covered = pts.every(([x = 0, y = 0]) => {
              const at = document.elementFromPoint(x, y);
              return !at || (at !== control && !control.contains(at));
            });
            const label = (el.getAttribute("aria-label") ?? el.textContent).trim().slice(0, 40);
            return { id: `${el.tagName.toLowerCase()} "${label}"`, ring, covered };
          });
          if (!f) {
            if (seen.size) break;
            continue;
          }
          if (seen.has(f.id) && i > 2) break;
          seen.add(f.id);
          if (!f.ring) problems.push(`no focus ring: ${f.id}`);
          if (f.covered) problems.push(`fully covered: ${f.id}`);
        }
        expect(seen.size).toBeGreaterThan(3);
        expect(problems).toEqual([]);
      });
    }
  });
}
