import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/** Cloud sessions ship Chromium at /opt/pw-browsers; never download browsers there. */
const preinstalled = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const launchOptions = existsSync(preinstalled) ? { executablePath: preinstalled } : {};

const laptop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions };
const phone = { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, launchOptions };

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  projects: [
    // The static build, as visitors get it.
    { name: "laptop", testIgnore: /catalogue/, use: { ...laptop, baseURL: "http://localhost:4173" } },
    { name: "phone", testIgnore: /catalogue/, use: { ...phone, baseURL: "http://localhost:4173" } },
    // The dev-only component catalogue, served by the dev server.
    {
      name: "catalogue-laptop",
      testMatch: /catalogue/,
      use: { ...laptop, baseURL: "http://localhost:5173" },
    },
    { name: "catalogue-phone", testMatch: /catalogue/, use: { ...phone, baseURL: "http://localhost:5173" } },
  ],
  webServer: [
    { command: "npm run preview -- --port 4173", port: 4173, reuseExistingServer: !process.env.CI },
    {
      command: "npx react-router dev --port 5173 --strictPort",
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
