/**
 * The V0 seed's logic, shared by `npm run seed:v0` (scripts/seed-v0.ts) and the leak-marker seed.
 *
 * `npm run seed:v0` (07 · Extraction, 10 · WP3.4): the launch content, published once into an empty
 * `pm` schema with the same Zod schemas and the same publish code as Studio's pm-publish.
 *
 * - The documents come from `buildV0Documents()`, the covers from `design/covers/*.webp`, and the
 *   deployed prototype addresses from `scripts/v0-prototypes.json` when it exists.
 * - Two checks are skipped, only here: Arcana's 143-character summary (D51) and Sri Mandir's
 *   flagged RICE row. Both stay in the project's `todo`, so Studio lists them under "Needs input".
 * - Covers are uploaded as their 1600-wide WebP (they're 10–30 KB). Studio's "Replace file" makes the
 *   other widths and the Open Graph crop whenever the owner wants them.
 * - Every database write is one transaction: a failure leaves the schema empty. A second run stops
 *   before writing anything, because the schema isn't empty.
 *
 * Runs in the owner's shell with the values set for this one command, never from a file:
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… PM_DATABASE_URL=… npm run seed:v0
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import * as legacy from "../src/legacy/content";
import { ACCENT_COLOURS } from "../src/lib/accents";
import { buildV0Documents } from "../src/lib/v0";
import type { Deps, Sql } from "../supabase/functions/_shared/deps.ts";
import { publishProjectRow, publishSite } from "../supabase/functions/_shared/publish.ts";

/** A failure's whole story: a blocked publish carries its issues (field and message), not just "blocked". */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const extra = (error as { extra?: unknown }).extra;
  return extra && typeof extra === "object" && Object.keys(extra).length > 0
    ? `${error.message}: ${JSON.stringify(extra)}`
    : error.message;
}

/** Runs one seed step, naming it in any error. */
export async function step<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw new Error(`${name} failed: ${describeError(error)}`, { cause: error });
  }
}

export const COVER_SIZE = { width: 1600, height: 1000 };

export interface SeedInputs {
  /** Reads a cover file (design/covers/<slug>.webp). */
  readCover(path: string): Uint8Array;
  /** Uploads one file into pm-media-draft. */
  upload(name: string, bytes: Uint8Array, contentType: string): Promise<void>;
  prototypes: Record<string, string>;
  uuid(): string;
}

export interface SeedResult {
  projects: number;
  published: string[];
  drafts: string[];
}

/** Seeds an empty `pm` schema. `deps.sql` must already be inside one transaction. */
export async function seedV0(deps: Deps, inputs: SeedInputs): Promise<SeedResult> {
  const [state] = await deps.sql.query<{ n: number }>(
    `select ((select count(*) from pm.profile) + (select count(*) from pm.site_layout)
      + (select count(*) from pm.projects) + (select count(*) from pm.posts) + (select count(*) from pm.media))::int as n`,
  );
  if ((state?.n ?? 0) > 0)
    throw new Error("The pm schema already has content. The seed runs once, on an empty schema.");

  const ids = new Map<string, string>();
  const covers = new Map<string, string>();
  const id = (slug: string, map: Map<string, string>) => {
    let v = map.get(slug);
    if (!v) map.set(slug, (v = inputs.uuid()));
    return v;
  };
  const v0 = buildV0Documents(legacy, {
    prototypes: inputs.prototypes,
    projectId: (slug) => id(slug, ids),
    coverMediaId: (slug) => id(slug, covers),
  });

  for (const c of v0.covers) {
    const mediaId = id(c.slug, covers);
    const key = `${mediaId}/r1`;
    const bytes = inputs.readCover(c.file);
    await inputs.upload(`${key}/1600.webp`, bytes, "image/webp");
    const accent = v0.projects.find((p) => p.slug === c.slug)?.document.visuals.accent ?? "slate";
    await deps.sql.query(
      `insert into pm.media (id, rev, key, kind, mime, bytes, width, height, variants, alt, dominant, filename)
       values ($1, 1, $2, 'image', 'image/webp', $3, $4, $5, '{1600}', $6, $7, $8)`,
      [
        mediaId,
        key,
        bytes.byteLength,
        COVER_SIZE.width,
        COVER_SIZE.height,
        c.alt,
        ACCENT_COLOURS[accent].ground,
        `${c.slug}.webp`,
      ],
    );
  }

  await deps.sql.query("insert into pm.profile (id, draft) values (1, $1)", [v0.profile]);
  await deps.sql.query("insert into pm.site_layout (id, draft) values (1, $1)", [v0.layout]);
  for (const p of v0.projects) {
    await deps.sql.query("insert into pm.projects (id, slug, draft) values ($1, $2, $3)", [
      id(p.slug, ids),
      p.slug,
      p.document,
    ]);
  }

  const allow = new Set(["summary-long", "rice-row"] as const);
  const published: string[] = [];
  for (const p of v0.projects.filter((x) => x.publish)) {
    await step(`publishing project ${p.slug}`, () =>
      publishProjectRow(deps, id(p.slug, ids), { allow, deploy: false }),
    );
    published.push(p.slug);
  }
  // The live site already shows every "Worth a check" fact; the owner confirms them in Studio.
  await step("publishing the website", () =>
    publishSite(deps, { confirmUnconfirmed: true }, { deploy: false }),
  );
  return {
    projects: v0.projects.length,
    published,
    drafts: v0.projects.filter((x) => !x.publish).map((x) => x.slug),
  };
}

/** All the scripts need from a service-role supabase-js client: Storage. */
type SupabaseAdmin = { storage: SupabaseClient["storage"] };

/** The functions' ports for a Node script: SQL inside the caller's transaction, Storage through supabase-js. */
export function nodeDeps(
  sql: Sql,
  admin: SupabaseAdmin,
  siteUrl: string,
  owner?: { token: string; userId: string },
): Deps {
  return {
    sql,
    env: { siteUrl, allowedOrigins: [], serviceRoleKey: "" },
    auth: { userId: (jwt) => Promise.resolve(owner && jwt === owner.token ? owner.userId : null) },
    storage: {
      async list(bucket, prefix) {
        const rows = await sql.query<{ name: string }>(
          "select name from storage.objects where bucket_id = $1 and starts_with(name, $2)",
          [bucket, prefix],
        );
        return rows.map((r) => r.name);
      },
      async publish(name) {
        const { error } = await admin.storage
          .from("pm-media-draft")
          .copy(name, name, { destinationBucket: "pm-media-public" });
        if (error) throw new Error("Couldn't copy a file to pm-media-public.");
      },
      remove: () => Promise.resolve(),
      async upload(name, bytes, contentType) {
        const { error } = await admin.storage
          .from("pm-media-draft")
          .upload(name, bytes, { contentType, upsert: true });
        if (error) throw new Error("Couldn't store a file in pm-media-draft.");
      },
      signedUrl: () => Promise.resolve(""),
    },
    fetch,
    async resolveHost(host) {
      const { lookup } = await import("node:dns/promises");
      return (await lookup(host, { all: true })).map((a) => a.address);
    },
    now: () => new Date(),
    randomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
  };
}

/**
 * Parameters for postgres.js: native values, never pre-encoded JSON. postgres.js reads each
 * parameter's type from the server and encodes jsonb itself; a JSON string would be stored as a jsonb
 * string, not an object (the bug the first CI no-leaks run caught).
 */
export function pgParam(v: unknown): unknown {
  return v ?? null;
}

/** Cover uploads for seedV0, through supabase-js. */
export function coverUploader(admin: SupabaseAdmin): SeedInputs["upload"] {
  return async (name, bytes, contentType) => {
    const { error } = await admin.storage
      .from("pm-media-draft")
      .upload(name, bytes, { contentType, upsert: false });
    if (error) throw new Error("Couldn't upload a cover to pm-media-draft.");
  };
}
