import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { findProblems, jwtRole } from "../../scripts/check-env.ts";

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (role: string) => `${b64({ alg: "HS256" })}.${b64({ role })}.sig`;

function srcWith(code: string): string {
  const dir = mkdtempSync(join(tmpdir(), "check-env-"));
  mkdirSync(join(dir, "lib"));
  writeFileSync(join(dir, "lib", "a.ts"), code);
  return dir;
}

describe("check-env", () => {
  it("reads the role claim of a JWT and ignores other values", () => {
    expect(jwtRole(jwt("service_role"))).toBe("service_role");
    expect(jwtRole(jwt("anon"))).toBe("anon");
    expect(jwtRole("https://example.supabase.co")).toBeUndefined();
    expect(jwtRole("a.b.c")).toBeUndefined();
  });

  it("passes the three public variables and an anon key", () => {
    const src = srcWith("import.meta.env.VITE_SUPABASE_URL; import.meta.env.VITE_SUPABASE_ANON_KEY;");
    expect(findProblems(src, { VITE_SUPABASE_ANON_KEY: jwt("anon") })).toEqual([]);
  });

  it("fails on any other VITE_ variable", () => {
    expect(findProblems(srcWith("import.meta.env.VITE_SECRET"), {})).toHaveLength(1);
  });

  it("fails when a service-role key is in the environment", () => {
    expect(findProblems(srcWith(""), { SUPABASE_SERVICE_ROLE_KEY: jwt("service_role") })).toHaveLength(1);
  });

  it("fails when the fixture would feed production", () => {
    const env = { CONTENT_SOURCE: "fixture:boards", VERCEL_ENV: "production" };
    expect(findProblems(srcWith(""), env)).toHaveLength(1);
  });
});
