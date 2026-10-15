import { expect, test, type Page } from "@playwright/test";

import { MEMORY_CODE } from "../../src/lib/studio/memory";
import { defineParity, type Section } from "./compare";

/**
 * Studio on phones against StudioMobile's three 390×844 frames (08 · What's compared: "iPad and phone
 * from StudioTablet and StudioMobile"). Studio's data is dev-only (src/lib/studio/client.ts), so
 * this signs in to the dev server (PW_PORT_BASE + 1, or STUDIO_URL) as the memory repo's test
 * owner, and skips when that server isn't running. The chrome is compared: app bars, the tab bar,
 * the editor's tab strip and publish bar. The boards' content is illustrative (09 · D75).
 */
const DEV = process.env.STUDIO_URL ?? `http://localhost:${Number(process.env.PW_PORT_BASE ?? 4310) + 1}`;
const CODE = process.env.STUDIO_CODE ?? MEMORY_CODE;

async function signIn(page: Page) {
  const up = await page.request
    .get(`${DEV}/studio/login`)
    .then((r) => r.ok())
    .catch(() => false);
  test.skip(!up, `Studio's dev server isn't running at ${DEV}`);
  await page.goto(`${DEV}/studio/login`);
  await page.getByLabel("Email").fill("owner@example.test");
  await page.getByRole("button", { name: "Email me a code" }).click();
  const code = page.getByRole("group", { name: /digit code/ });
  await expect(code).toBeVisible({ timeout: 15_000 });
  await code.locator("input").first().focus();
  await page.keyboard.type(CODE);
  await page.waitForURL(/\/studio\/?$/, { timeout: 15_000 });
}

/** StudioMobile draws each screen inside a phone mockup; its rounded corners and bezel aren't the UI. */
const NO_BEZEL =
  "document.querySelectorAll('.ph').forEach((e) => { e.style.borderRadius = '0'; e.style.boxShadow = 'none'; e.style.outline = 'none'; e.style.border = '0'; for (let a = e.parentElement; a && !a.classList.contains('st'); a = a.parentElement) { a.style.background = 'transparent'; a.style.boxShadow = 'none'; } })";

/** The nth phone frame on StudioMobile (1 Projects, 2 Editor · Story, 3 Upload sheet). */
const frame = (n: number) => `.st > div > div:nth-child(${n}) .ph`;

const projects: Section[] = [
  {
    name: "appbar",
    board: `${frame(1)} > header.appbar`,
    page: "header[class*='_appbar_']",
    boardScript: NO_BEZEL,
  },
  {
    name: "tabbar",
    board: `${frame(1)} > nav.tabbar`,
    page: "nav[aria-label='Studio'][class*='_tabbar_']",
    boardScript: NO_BEZEL,
  },
];

const editor: Section[] = [
  {
    name: "appbar",
    board: `${frame(2)} > header.appbar`,
    page: "header[class*='_tb_']",
    boardScript: NO_BEZEL,
  },
  {
    name: "tabs",
    board: `${frame(2)} > nav.tabs`,
    page: "nav[aria-label='Project sections']",
    boardScript: NO_BEZEL,
    // 09 · D75: the board's Story tab carries the unpublished-changes dot (board state); the test
    // project has no unpublished Story edits, so the dot is removed and the tabs compare in place.
    collapse: { board: [`${frame(2)} > nav.tabs .dot`] },
    note: "09 · D75: unpublished-changes dot removed from the board",
  },
  {
    name: "publish-bar",
    board: `${frame(2)} > div:last-child`,
    page: "[class*='_phoneFoot_']",
    // 09 · D75: the board draws Puja with unpublished edits ("Publish changes"); the memory repo's
    // Puja is live with none ("Published"). The primary button's label and state are masked.
    mask: {
      board: [`${frame(2)} > div:last-child > :last-child`],
      page: ["[class*='_phoneFoot_'] > :last-child"],
    },
    boardScript: NO_BEZEL,
    note: "09 · D75: publish button state masked",
  },
];

defineParity([
  {
    name: "studio-390-projects",
    board: "StudioMobile",
    boardWidth: 1440,
    width: 390,
    path: `${DEV}/studio/projects`,
    setup: signIn,
    sections: projects,
  },
  {
    name: "studio-390-editor",
    board: "StudioMobile",
    boardWidth: 1440,
    width: 390,
    path: `${DEV}/studio/projects/puja-engagement-platform/story`,
    setup: signIn,
    sections: editor,
  },
]);
