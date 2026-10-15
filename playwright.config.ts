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
/** WebKit and Firefox run in CI; locally only with PW_ALL_BROWSERS=1 (they're a separate download). */
const allBrowsers = Boolean(process.env.CI) || process.env.PW_ALL_BROWSERS === "1";
const preview = `http://localhost:${previewPort}`;
/**
 * Pixel parity (08 · Pixel parity) runs only through `npm run parity`: it needs its own build with the
 * boards' content (CONTENT_SOURCE=fixture:boards, in build-parity/), served on base + 2.
 */
const parity = process.env.PW_PARITY === "1";
/**
 * The boards condense their copy per device, so each width gets its own parity build: the fixture reads
 * PM_FIXTURE_WIDTH to pick that width's variant (D70). Ports: base + 2, 3 and 4.
 */
const parityWidths = [
  { name: "laptop", width: 1440, height: 900, touch: false },
  { name: "ipad", width: 834, height: 1112, touch: true },
  { name: "phone", width: 390, height: 844, touch: true },
].map((w, i) => ({ ...w, port: base + 2 + i, dir: `build-parity-${w.width}` }));

const laptop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions };
const phone = { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, launchOptions };

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  projects: parity
    ? parityWidths.map((w) => ({
        name: `parity-${w.name}`,
        testDir: "tests/parity",
        use: {
          ...devices["Desktop Chrome"],
          launchOptions,
          baseURL: `http://localhost:${w.port}`,
          viewport: { width: w.width, height: w.height },
          hasTouch: w.touch,
          contextOptions: { reducedMotion: "reduce" as const },
        },
      }))
    : [
        // The static build, as visitors get it.
        {
          name: "laptop",
          testIgnore: /catalogue|\/a11y\/|\/devices\//,
          use: { ...laptop, baseURL: `http://localhost:${previewPort}` },
        },
        {
          name: "phone",
          // no-leaks checks the build and the database, not a layout: once, on laptop.
          testIgnore: /catalogue|no-leaks|\/a11y\/|\/devices\//,
          use: { ...phone, baseURL: `http://localhost:${previewPort}` },
        },
        // QA's sweeps set their own viewport, touch and motion, so they run once each (08 · QA).
        {
          name: "a11y",
          testMatch: /\/a11y\/.*\.spec\.ts/,
          use: { ...devices["Desktop Chrome"], launchOptions, baseURL: preview },
        },
        {
          name: "devices-chromium",
          testMatch: /\/devices\/.*\.spec\.ts/,
          use: { ...devices["Desktop Chrome"], launchOptions, baseURL: preview },
        },
        ...(allBrowsers
          ? [
              {
                name: "devices-webkit",
                testMatch: /\/devices\/overflow\.spec\.ts/,
                use: { ...devices["Desktop Safari"], baseURL: preview },
              },
              {
                name: "devices-firefox",
                testMatch: /\/devices\/overflow\.spec\.ts/,
                use: { ...devices["Desktop Firefox"], baseURL: preview },
              },
            ]
          : []),
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
  webServer: parity
    ? [
        // Studio's parity cases need its dev-only data, so the dev server runs too (base + 1).
        {
          command: `npx react-router dev --port ${devPort} --strictPort`,
          port: devPort,
          reuseExistingServer,
        },
        ...parityWidths.map((w) => ({
          command: `npx react-router build && npx vite preview --outDir ${w.dir}/client --port ${w.port} --strictPort`,
          // Both commands need these: vite preview reads buildDirectory from react-router.config.ts.
          env: { PM_BUILD_DIR: w.dir, CONTENT_SOURCE: "fixture:boards", PM_FIXTURE_WIDTH: String(w.width) },
          port: w.port,
          reuseExistingServer,
          timeout: 300_000,
        })),
      ]
    : [
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
