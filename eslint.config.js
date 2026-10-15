import js from "@eslint/js";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importX from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".claude/",
      "build/",
      "build-parity*/",
      ".vercel/",
      "dist/",
      "coverage/",
      ".react-router/",
      "design/",
      "public/",
      "tests/fixtures/",
      "supabase/functions/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    settings: { "import-x/resolver-next": [createTypeScriptImportResolver()] },
    plugins: { "import-x": importX, "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      // 10 · Code architecture: dependencies point one way.
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/lib",
              from: ["./src/components", "./src/routes", "./src/motion"],
              message: "src/lib is plain TypeScript and never imports UI.",
            },
            {
              target: ["./src/components", "./src/routes", "./src/motion"],
              from: ["./src/components/studio", "./src/routes/studio"],
              except: [],
              message: "Public code never imports Studio.",
            },
          ],
        },
      ],
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "react", message: "Allowed only outside src/lib." }] },
      ],
    },
  },
  {
    // React is fine everywhere except src/lib.
    files: ["src/components/**", "src/routes/**", "src/motion/**", "src/root.tsx"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Studio may import its own modules; the dev-only catalogue shows every component.
    files: ["src/components/studio/**", "src/routes/studio/**", "src/routes/dev/**"],
    rules: { "import-x/no-restricted-paths": "off" },
  },
  {
    files: ["**/*.js", "*.config.ts", "scripts/**"],
    ...tseslint.configs.disableTypeChecked,
  },
);
