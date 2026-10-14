import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { findProblems, isSecretKey, jwtRole } from "../../scripts/check-env.ts";

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (role: string) => `${b64({ alg: "HS256" })}.${b64({ role })}.sig`;

function project(code: string, files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "check-env-"));
  mkdirSync(join(dir, "src", "lib"), { recursive: true });
  writeFileSync(join(dir, "src", "lib", "a.ts"), code);
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
}

describe("check-env", () => {
  it("reads the role claim of a JWT and ignores other values", () => {
    expect(jwtRole(jwt("service_role"))).toBe("service_role");
    expect(jwtRole(jwt("anon"))).toBe("anon");
    expect(jwtRole("https://example.supabase.co")).toBeUndefined();
    expect(jwtRole("a.b.c")).toBeUndefined();
  });

  it("recognises both kinds of Supabase secret key", () => {
    expect(isSecretKey(jwt("service_role"))).toBe(true);
    expect(isSecretKey("sb_secret_abc123")).toBe(true);
    expect(isSecretKey("sb_publishable_abc123")).toBe(false);
    expect(isSecretKey(jwt("anon"))).toBe(false);
  });

  it("passes the three public variables and an anon key", () => {
    const dir = project(
      "import.meta.env.VITE_SUPABASE_URL; import.meta.env.VITE_SUPABASE_ANON_KEY; import.meta.env.DEV;",
    );
    expect(findProblems(dir, { VITE_SUPABASE_ANON_KEY: jwt("anon") })).toEqual([]);
  });

  it("fails on any other VITE_ variable", () => {
    expect(findProblems(project("import.meta.env.VITE_SECRET"), {})).toHaveLength(1);
  });

  it("fails on reading import.meta.env as a whole", () => {
    expect(findProblems(project("console.log(import.meta.env)"), {})).toHaveLength(1);
    expect(findProblems(project("const k = 'x'; import.meta.env[k];"), {})).toHaveLength(1);
  });

  it("fails when the build config widens envPrefix", () => {
    const dir = project("", { "vite.config.ts": "export default { envPrefix: ['VITE_', 'SUPABASE_'] }" });
    expect(findProblems(dir, {})).toHaveLength(1);
  });

  it("fails when a secret key is in the environment", () => {
    expect(findProblems(project(""), { VITE_SUPABASE_ANON_KEY: jwt("service_role") })).toHaveLength(1);
    expect(findProblems(project(""), { SUPABASE_SECRET: "sb_secret_x" })).toHaveLength(1);
  });

  it("fails when the dev catalogue would ship to production", () => {
    expect(findProblems(project(""), { CATALOGUE: "1", VERCEL_ENV: "production" })).toHaveLength(1);
    expect(findProblems(project(""), { CATALOGUE: "1" })).toEqual([]);
  });

  it("fails when the fixture would feed production", () => {
    const env = { CONTENT_SOURCE: "fixture:boards", VERCEL_ENV: "production" };
    expect(findProblems(project(""), env)).toHaveLength(1);
    expect(findProblems(project(""), { CONTENT_SOURCE: "fixture:boards", VERCEL_ENV: "preview" })).toHaveLength(1);
    expect(findProblems(project(""), { CONTENT_SOURCE: "fixture:boards" })).toEqual([]);
  });

  it("lets production read only Supabase once a source is named", () => {
    expect(findProblems(project(""), { CONTENT_SOURCE: "local-v0", VERCEL_ENV: "production" })).toHaveLength(1);
    expect(findProblems(project(""), { CONTENT_SOURCE: "supabase", VERCEL_ENV: "production" })).toEqual([]);
    expect(findProblems(project(""), { CONTENT_SOURCE: "local-v0", VERCEL_ENV: "preview" })).toEqual([]);
  });
});
