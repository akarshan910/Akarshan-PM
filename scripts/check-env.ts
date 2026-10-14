/**
 * Build-time guard (10 · Security gates, 08 · Security checks):
 *  1. Only the three public VITE_ variables may be referenced in src/.
 *  2. No environment value may be a service-role JWT.
 *  3. The parity fixture can never feed a production build.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ALLOWED = new Set(["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_TURNSTILE_SITE_KEY"]);

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

export function findProblems(srcDir: string, env: NodeJS.ProcessEnv): string[] {
  const problems: string[] = [];
  for (const file of walk(srcDir)) {
    if (!/\.(ts|tsx|js|jsx|css)$/.test(file)) continue;
    for (const [name] of readFileSync(file, "utf8").matchAll(/\bVITE_[A-Z0-9_]+/g)) {
      if (!ALLOWED.has(name)) problems.push(`${file} reads ${name}, which isn't an allowed browser variable`);
    }
  }
  for (const [name, value] of Object.entries(env)) {
    if (value && jwtRole(value) === "service_role") {
      problems.push(`${name} holds a service-role key. It must never be present at build time`);
    }
  }
  if (env.CONTENT_SOURCE && env.VERCEL_ENV === "production") {
    problems.push("CONTENT_SOURCE is set in a production build");
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = findProblems("src", process.env);
  if (problems.length > 0) {
    console.error(["Environment check failed:", ...problems.map((p) => `  - ${p}`)].join("\n"));
    process.exit(1);
  }
}
