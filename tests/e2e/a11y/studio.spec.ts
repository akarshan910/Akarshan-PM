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

const PROJECT = "/studio/projects/3d-body-scan-for-glp-1-users";
const SCREENS = [
  { name: "dashboard", path: "/studio", title: /Dashboard · Studio/ },
  { name: "projects", path: "/studio/projects", title: /Projects · Studio/ },
  { name: "editor overview", path: `${PROJECT}/overview`, title: /3D body scan.* · Overview · Studio/ },
  { name: "editor visuals", path: `${PROJECT}/visuals`, title: /· Visuals · Studio/ },
  { name: "editor story", path: `${PROJECT}/story`, title: /· Story · Studio/ },
  { name: "editor outcomes", path: `${PROJECT}/outcomes`, title: /· Outcomes · Studio/ },
  { name: "editor url-seo", path: `${PROJECT}/settings`, title: /· URL & SEO · Studio/ },
  { name: "writing", path: "/studio/writing", title: /Writing · Studio/ },
  { name: "media", path: "/studio/media", title: /Media · Studio/ },
  { name: "website", path: "/studio/website", title: /Website · Studio/ },
  { name: "profile", path: "/studio/website/profile", title: /Profile & facts · Studio/ },
  {
    name: "preview",
    path: "/studio/preview/project/3d-body-scan-for-glp-1-users",
    title: /Draft preview · Studio/,
  },
];

/** The 08 widths for Studio: laptop, iPad landscape and portrait, phone, and 400% zoom. */
const WIDTHS = [1440, 1024, 834, 390, 320];
const heightOf = (w: number) => (w <= 320 ? 640 : w < 768 ? 844 : w === 1024 ? 768 : 900);

/** Marks a test as an expected failure when it hits a filed defect (known-defects.ts). */
function expectKnown(key: string, width: number) {
  const known = knownDefect(key, width);
  test.fail(Boolean(known), known ? `${known.id}: ${known.note}` : "");
}

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

/**
 * Controls whose hit area is under 44px, hit-tested outwards from the centre (so `.t44` / `::after`
 * areas count), excluding links in running text and the skip link (shown only on focus).
 */
async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const sel = "a[href], button, input:not([type=hidden]), select, textarea, [role=button], [tabindex='0']";
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      const cs = getComputedStyle(el);
      const r0 = el.getBoundingClientRect();
      if (!r0.width || !r0.height || cs.visibility === "hidden") continue;
      if (el.closest("[hidden], [inert], .sr-only") && !el.closest("label")) continue;
      if (/^Skip to/.test(el.textContent.trim())) continue;
      if (
        el.tagName === "A" &&
        cs.display === "inline" &&
        el.parentElement &&
        el.parentElement.textContent.trim() !== el.textContent.trim()
      )
        continue;
      const hit = el.closest("label") ?? el;
      let r = hit.getBoundingClientRect();
      if (r.width >= 44 && r.height >= 44) continue;
      hit.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      r = hit.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const ours = (x: number, y: number) => {
        const at = document.elementFromPoint(x, y);
        return Boolean(at && (at === hit || hit.contains(at)));
      };
      const reach = (dx: number, dy: number) => {
        let d = 0;
        while (d < 40 && ours(cx + dx * (d + 1), cy + dy * (d + 1))) d++;
        return d;
      };
      const w = Math.max(r.width, reach(-1, 0) + reach(1, 0) + 1);
      const h = Math.max(r.height, reach(0, -1) + reach(0, 1) + 1);
      if (w >= 44 && h >= 44) continue;
      const label = (el.getAttribute("aria-label") ?? el.textContent).trim().replace(/\s+/g, " ");
      out.push(`"${label.slice(0, 40)}" ${Math.round(w)}×${Math.round(h)}`);
    }
    return out;
  });
}

/** Opens a screen and waits for its heading (the SPA renders after the repo loads). */
async function open(page: Page, path: string) {
  await page.goto(`${DEV}${path}`);
  // The editor's h1 sits in its page header, outside main; that's fine.
  await expect(page.locator("h1").filter({ visible: true }).first()).toBeVisible({ timeout: 20_000 });
}

for (const width of WIDTHS) {
  test.describe(`Studio @${width}`, () => {
    test.use({
      viewport: { width, height: heightOf(width) },
      hasTouch: width < 1280,
      contextOptions: { reducedMotion: "reduce" },
    });

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
      test.skip(!(await studioBuilt(page)), "Studio's sign-in isn't on this branch yet");
      await expect(page.locator("h1").filter({ visible: true })).toHaveCount(1);
    });

    for (const s of SCREENS) {
      test(`${s.name}: axe and one visible h1`, async ({ page }) => {
        expectKnown(`studio ${s.name} axe`, width);
        test.skip(!(await studioBuilt(page)), "Studio isn't on this branch yet");
        await signIn(page);
        await open(page, s.path);
        await expect(page).toHaveTitle(/Studio/);
        expect(await axe(page)).toEqual([]);
        await expect(page.locator("h1").filter({ visible: true })).toHaveCount(1);
      });

      test(`${s.name}: no horizontal scroll (1.4.10)`, async ({ page }) => {
        expectKnown(`studio ${s.name} overflow`, width);
        test.skip(!(await studioBuilt(page)), "Studio isn't on this branch yet");
        await signIn(page);
        await open(page, s.path);
        await page.waitForTimeout(300);
        const o = await overflowing(page);
        expect(o.offenders).toEqual([]);
        expect(o.scrollWidth).toBeLessThanOrEqual(o.clientWidth);
      });

      test(`${s.name}: 44×44 targets on touch layouts (08)`, async ({ page }) => {
        test.skip(width >= 1280, "Pointer layout: axe's target-size covers 24px");
        expectKnown(`studio ${s.name} targets`, width);
        test.skip(!(await studioBuilt(page)), "Studio isn't on this branch yet");
        await signIn(page);
        await open(page, s.path);
        // Some controls (the topic picker) render and size after the data loads; let the screen
        // settle. (networkidle never comes: the builder and preview keep iframes loading.)
        await page.waitForTimeout(1000);
        expect(await smallTargets(page)).toEqual([]);
      });

      test(`${s.name}: the title names the screen (2.4.2)`, async ({ page }) => {
        test.skip(!(await studioBuilt(page)), "Studio isn't on this branch yet");
        await signIn(page);
        await open(page, s.path);
        await expect(page).not.toHaveTitle(/^Studio$/);
        await expect(page).toHaveTitle(s.title);
      });

      test(`${s.name}: every tab stop is visible and never fully covered (2.4.7, 2.4.11)`, async ({
        page,
      }) => {
        expectKnown(`studio ${s.name} focus`, width);
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
            // A ring on the element, or the field patterns Studio uses: an editable area whose border
            // turns opaque on focus (RichArea), or a wrapper ring via :focus-within (URL & SEO).
            const wrap = el.parentElement;
            const editable = el.isContentEditable || /^(INPUT|TEXTAREA)$/.test(el.tagName);
            const ring =
              (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
              cs.boxShadow !== "none" ||
              (editable &&
                parseFloat(cs.borderTopWidth) > 0 &&
                !/rgba\(.*, 0\)|transparent/.test(cs.borderTopColor)) ||
              Boolean(wrap?.matches(":focus-within") && getComputedStyle(wrap).boxShadow !== "none");
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

/** StudioMobile › Upload sheet: a dialog; Esc closes it and focus returns to Upload (2.4.3). */
for (const width of [390, 320]) {
  test.describe(`Studio upload sheet @${width}`, () => {
    test.use({ viewport: { width, height: heightOf(width) }, hasTouch: true });
    test("focus moves in, cycles, and returns to Upload on Esc", async ({ page }) => {
      expectKnown("studio media upload sheet", width);
      test.skip(!(await studioBuilt(page)), "Studio isn't on this branch yet");
      await signIn(page);
      await open(page, "/studio/media");
      const upload = page.getByRole("button", { name: "Upload" }).filter({ visible: true }).first();
      await upload.focus();
      await page.keyboard.press("Enter");
      const sheet = page.getByRole("dialog").filter({ hasText: /Photo library/ });
      await expect(sheet).toHaveCount(1);
      for (let i = 0; i < 6; i++) {
        expect(await page.evaluate(() => Boolean(document.activeElement?.closest("[role=dialog]")))).toBe(
          true,
        );
        await page.keyboard.press("Tab");
      }
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
      await expect(upload).toBeFocused();
    });
  });
}

/**
 * Wider text, narrow screens. Text metrics differ by platform (Linux renders a little wider than
 * macOS), so a layout that fits with 0px to spare on one machine scrolls sideways on another (CI run
 * 38682699085: the editor's tab strip at 320). With every glyph widened by .03em, nothing may scroll
 * sideways and no tab stop may end up fully covered.
 */
const WIDER_TEXT = "*, *::before, *::after { letter-spacing: 0.03em !important; }";
for (const width of [390, 320]) {
  test.describe(`Studio with wider text @${width}`, () => {
    test.use({ viewport: { width, height: heightOf(width) }, hasTouch: true });
    for (const s of SCREENS) {
      test(`${s.name}: no horizontal scroll, tabs reachable`, async ({ page }) => {
        expectKnown(`studio ${s.name} wider text`, width);
        test.skip(!(await studioBuilt(page)), "Studio isn't on this branch yet");
        await signIn(page);
        await open(page, s.path);
        await page.addStyleTag({ content: WIDER_TEXT });
        await page.waitForTimeout(400);
        const o = await overflowing(page);
        expect(o.offenders).toEqual([]);
        expect(o.scrollWidth).toBeLessThanOrEqual(o.clientWidth);
        // Every tab stop scrolls into view when focused (a strip that clips must scroll itself).
        const covered: string[] = [];
        const seen = new Set<string>();
        for (let i = 0; i < 80; i++) {
          await page.keyboard.press("Tab");
          await page.waitForTimeout(60);
          const f = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement | null;
            if (!el || el === document.body) return null;
            // Fully covered (2.4.11) = none of five probe points lands on the control.
            const r = el.getBoundingClientRect();
            const control = el.closest("label") ?? el;
            const clampX = (x: number) => Math.min(Math.max(x, 1), innerWidth - 1);
            const clampY = (y: number) => Math.min(Math.max(y, 1), innerHeight - 1);
            const pts: [number, number][] = [
              [r.left + 3, r.top + 3],
              [r.right - 3, r.top + 3],
              [r.left + 3, r.bottom - 3],
              [r.right - 3, r.bottom - 3],
              [r.left + r.width / 2, r.top + r.height / 2],
            ];
            const hit = pts.some(([x, y]) => {
              const at = document.elementFromPoint(clampX(x), clampY(y));
              return Boolean(at && (at === control || control.contains(at)));
            });
            const visible = r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
            return {
              id: `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") ?? el.textContent).trim().slice(0, 30)}"`,
              ok: visible && hit,
            };
          });
          if (!f) {
            if (seen.size) break;
            continue;
          }
          if (seen.has(f.id) && i > 2) break;
          seen.add(f.id);
          if (!f.ok) covered.push(f.id);
        }
        expect(covered).toEqual([]);
      });
    }
  });
}
