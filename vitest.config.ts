import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    exclude: ["**/node_modules/**", ".claude/**"],
    css: { modules: { classNameStrategy: "non-scoped" } },
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/components/**"],
      exclude: ["**/*.test.tsx"],
      thresholds: {
        "src/lib/**": { lines: 90, functions: 90, branches: 85, statements: 90 },
        "src/components/**": { lines: 80, functions: 80, branches: 70, statements: 80 },
      },
    },
  },
});
