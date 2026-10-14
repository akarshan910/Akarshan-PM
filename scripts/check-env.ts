/**
 * Build-time guard (10 · Security gates, 08 · Security checks):
 *  1. Only the three public VITE_ variables may reach the browser: src/ may name no others,
 *     may not read import.meta.env as a whole, and the build config may not widen envPrefix.
 *  2. No environment value, from the shell or any .env file Vite loads, may be a Supabase secret
 *     key: a JWT whose role is service_role, or a new-style sb_secret_ key.
 *  3. The parity fixture can never feed a production build, and the dev catalogue never ships.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";

const ALLOWED = new Set(["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_TURNSTILE_SITE_KEY"]);
const CONFIG_FILES = ["vite.config.ts", "react-router.config.ts"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** The `role` claim of a JWT, or undefined if the value isn't one. */
export function jwtRole(value: string): string | undefined {
  const parts = value.split(".");
  if (parts.length !== 3 || !parts[1]) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : undefined;
  } catch {
    return undefined;
  }
}

export function isSecretKey(value: string): boolean {
  const v = value.trim();
  return v.startsWith("sb_secret_") || jwtRole(v) === "service_role";
}

export function findProblems(root: string, env: Record<string, string | undefined>): string[] {
  const problems: string[] = [];
  const src = join(root, "src");
  for (const file of existsSync(src) ? walk(src) : []) {
    if (!/\.(ts|tsx|js|jsx|mts|css)$/.test(file)) continue;
    const code = readFileSync(file, "utf8");
    for (const [name] of code.matchAll(/\bVITE_[A-Z0-9_]+/g)) {
      if (!ALLOWED.has(name)) problems.push(`${file} reads ${name}, which isn't an allowed browser variable`);
    }
    if (/import\.meta\.env(?!\.VITE_[A-Z0-9_]+\b|\.(MODE|DEV|PROD|SSR|BASE_URL)\b)/.test(code)) {
      problems.push(`${file} reads import.meta.env as a whole, which would inline every VITE_ variable`);
    }
  }
  for (const name of CONFIG_FILES) {
    const file = join(root, name);
    if (existsSync(file) && /\benvPrefix\b/.test(readFileSync(file, "utf8"))) {
      problems.push(`${name} sets envPrefix; only the default VITE_ prefix is allowed`);
    }
  }
  for (const [name, value] of Object.entries(env)) {
    if (value && isSecretKey(value)) {
      problems.push(`${name} holds a Supabase secret key. It must never be present at build time`);
    }
  }
  if (env.CONTENT_SOURCE && env.VERCEL_ENV === "production") {
    problems.push("CONTENT_SOURCE is set in a production build");
  }
  if (env.CATALOGUE && env.VERCEL_ENV === "production") {
    problems.push("CATALOGUE is set in a production build, which would ship the dev component catalogue");
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Everything Vite would load for either mode, plus the shell, so a key in .env.local is caught too.
  const env = {
    ...loadEnv("development", process.cwd(), ""),
    ...loadEnv("production", process.cwd(), ""),
    ...process.env,
  };
  const problems = findProblems(process.cwd(), env);
  if (problems.length > 0) {
    console.error(["Environment check failed:", ...problems.map((p) => `  - ${p}`)].join("\n"));
    process.exit(1);
  }
}
