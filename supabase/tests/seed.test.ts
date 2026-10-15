/**
 * `npm run seed:v0` against an empty schema (07 · Extraction, 10 · WP3.4), and `setup:owner`'s helpers.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadMigrations } from "../../scripts/migrate.ts";
import { describeError, pgParam, seedV0, step, type SeedInputs } from "../../scripts/seed-v0-core.ts";
import { isLocal } from "../../scripts/seed-leak-markers.ts";
import { maskEmail, normaliseEmail } from "../../scripts/setup-owner.ts";
import type { Deps, Sql } from "../functions/_shared/deps.ts";
import { DEPLOY_HOOK, fakeWorld } from "./fakes.ts";
import { as, freshProject, type Db } from "./harness.ts";

let db: Db;
let n = 0;

function inputs(world: ReturnType<typeof fakeWorld>, fail = false): SeedInputs {
  return {
    readCover: () => new Uint8Array(1234),
    upload(name) {
      if (fail) return Promise.reject(new Error("upload failed"));
      world.files["pm-media-draft"].add(name);
      return Promise.resolve();
    },
    prototypes: {},
    uuid: () => `40000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
  };
}

/** Runs the seed the way the script does: every write inside one transaction. */
async function seedInTransaction(fail = false) {
  const world = fakeWorld(db);
  return db.transaction(async (tx) => {
    const sql: Sql = {
      query: async <T>(text: string, params: unknown[] = []) => (await tx.query<T>(text, params)).rows,
      transaction: (fn) => fn(sql),
    };
    const deps: Deps = { ...world.deps, sql };
    return { result: await seedV0(deps, inputs(world, fail)), world };
  });
}

beforeAll(async () => {
  db = await freshProject(loadMigrations());
});

afterAll(async () => {
  await db.close();
});

describe("seed:v0", () => {
  it("leaves the schema empty when anything fails", async () => {
    await expect(seedInTransaction(true)).rejects.toThrow(/upload failed/);
    expect((await db.query("select count(*)::int as c from pm.projects")).rows).toEqual([{ c: 0 }]);
  });

  it("publishes the five live projects and the site, and keeps the SugarFit four as drafts", async () => {
    const { result, world } = await seedInTransaction();
    expect(result.published).toHaveLength(5);
    expect(result.drafts).toHaveLength(4);
    const live = await as(db, { role: "anon" }, () =>
      db.query<{ published_slug: string }>("select published_slug from pm.projects order by 1"),
    );
    expect(live.rows.map((r) => r.published_slug).sort()).toEqual([...result.published].sort());
    expect(
      (
        await as(db, { role: "anon" }, () =>
          db.query("select published from pm.site_layout where published is not null"),
        )
      ).rows,
    ).toHaveLength(1);

    // Arcana keeps its 143-character summary (D51), and the RICE row stays unreviewed.
    const [arcana] = (
      await db.query<{ s: string }>(
        "select published -> 'overview' ->> 'summary' as s from pm.projects where slug = 'arcana-workspace'",
      )
    ).rows;
    expect(arcana?.s.length).toBe(143);

    const text = JSON.stringify(
      (await db.query("select published from pm.projects union all select published from pm.profile")).rows,
    );
    expect(text).not.toMatch(/"(evidence|todo|facts|unconfirmed|prompts|reviewed)"/);
    expect([...world.files["pm-media-public"]]).toHaveLength(5);
    // Only the prototype login check goes out; the seed never calls the deploy hook.
    expect(world.calls.map((c) => c.url)).not.toContain(DEPLOY_HOOK);
  });

  it("refuses a second run", async () => {
    await expect(seedInTransaction()).rejects.toThrow(/already has content/);
  });
});

describe("seed:leaks", () => {
  it("runs only against this machine", () => {
    expect(isLocal("http://127.0.0.1:54321")).toBe(true);
    expect(isLocal("postgresql://postgres:postgres@localhost:54322/postgres")).toBe(true);
    expect(isLocal("https://abcdefghijkl.supabase.co")).toBe(false);
    expect(isLocal("postgresql://postgres.ref:pw@aws-0-eu-west-1.pooler.supabase.com:5432/postgres")).toBe(
      false,
    );
    expect(isLocal("not a url")).toBe(false);
  });
});

describe("script parameters", () => {
  it("go to postgres.js as native values, so jsonb is encoded once, by the driver", () => {
    const doc = { a: 1 };
    expect(pgParam(doc)).toBe(doc);
    expect(pgParam(["x", "y"])).toEqual(["x", "y"]);
    expect(pgParam(undefined)).toBeNull();
  });

  it("name the failing step and a blocked publish's issues", async () => {
    const blocked = Object.assign(new Error("blocked"), {
      extra: { issues: [{ field: "f", message: "m" }] },
    });
    await expect(step("publishing x", () => Promise.reject(blocked))).rejects.toThrow(
      'publishing x failed: blocked: {"issues":[{"field":"f","message":"m"}]}',
    );
    expect(describeError(new Error("plain"))).toBe("plain");
  });
});

describe("setup:owner", () => {
  it("masks the address and normalises it", () => {
    expect(maskEmail("owner@example.test")).toBe("o•••r@example.test");
    expect(normaliseEmail("  Owner@Example.TEST ")).toBe("owner@example.test");
    expect(normaliseEmail("not an email")).toBeNull();
  });
});
