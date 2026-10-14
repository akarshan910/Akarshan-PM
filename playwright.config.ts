import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/** Cloud sessions ship Chromium at /opt/pw-browsers; never download browsers there. */
const preinstalled = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const launchOptions = existsSync(preinstalled) ? { executablePath: preinstalled } : {};

/**
 * Ports away from Vite's defaults, so another project's dev server on 4173/5173 is never
 * mistaken for ours. Parallel worktrees set PW_PORT_BASE to stay apart (preview on the base,
 * dev on base + 1). A running server is reused only when PW_REUSE=1 asks for it.
 */
const base = Number(process.env.PW_PORT_BASE ?? 4310);
const previewPort = base;
const devPort = base + 1;
const reuseExistingServer = process.env.PW_REUSE === "1";

const laptop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions };
const phone = { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, launchOptions };

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  projects: [
    // The static build, as visitors get it.
    {
      name: "laptop",
      testIgnore: /catalogue/,
      use: { ...laptop, baseURL: `http://localhost:${previewPort}` },
    },
    { name: "phone", testIgnore: /catalogue/, use: { ...phone, baseURL: `http://localhost:${previewPort}` } },
    // The dev-only component catalogue, served by the dev server.
    {
      name: "catalogue-laptop",
      testMatch: /catalogue/,
      use: { ...laptop, baseURL: `http://localhost:${devPort}` },
    },
    {
      name: "catalogue-phone",
      testMatch: /catalogue/,
      use: { ...phone, baseURL: `http://localhost:${devPort}` },
    },
  ],
  webServer: [
    {
      command: `npm run preview -- --port ${previewPort} --strictPort`,
      port: previewPort,
      reuseExistingServer,
    },
    {
      command: `npx react-router dev --port ${devPort} --strictPort`,
      port: devPort,
      reuseExistingServer,
    },
  ],
});
