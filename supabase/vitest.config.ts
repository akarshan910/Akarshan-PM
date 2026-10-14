import { defineConfig } from "vitest/config";

/** The database tests (06 · Tests): `vitest run -c supabase/vitest.config.ts`. */
export default defineConfig({
  test: {
    include: ["supabase/tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
