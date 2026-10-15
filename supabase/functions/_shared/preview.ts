/**
 * pm-preview (06 · pm-preview).
 *
 * - `POST { kind, id? }` (owner): makes 32 random bytes, stores only their SHA-256, and returns the
 *   link once: `<PM_SITE_URL>/preview/<base64url token>`. The token is never stored or logged.
 * - `GET ?token=` (anyone holding the link): 404 for an unknown token, 410 once expired or revoked,
 *   otherwise the draft in its published shape, with one-hour signed URLs for draft images.
 *   Always `no-store`, `noindex` and `no-referrer`.
 * - `DELETE { tokenHash }` (owner): revokes.
 */
import { z } from "zod";

import type { Deps } from "./deps.ts";
import { handle, HttpError, json, readJson, requireOwner } from "./http.ts";
import { publishProfile, publishProject } from "./lib/published.ts";
import { Post, Profile, Project, SiteLayout } from "./lib/schemas.ts";
import { loadMedia, mediaIds, previewResolver } from "./media.ts";
import { publishPostDoc } from "./post.ts";
import { sanitizeLayout, sanitizePost, sanitizeProfile, sanitizeProject } from "./sanitize.ts";
import { publishableLayout, pruneProfile } from "./site.ts";

export const PREVIEW_DAYS = 7;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const PREVIEW_HEADERS = { "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };

const CreateBody = z.strictObject({ kind: z.enum(["site", "project", "post"]), id: z.uuid().optional() });
const RevokeBody = z.strictObject({ tokenHash: z.string().regex(/^[0-9a-f]{64}$/) });

export function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function create(req: Request, deps: Deps): Promise<Response> {
  await requireOwner(req, deps);
  const parsed = CreateBody.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, "bad-request");
  const { kind, id } = parsed.data;
  if (kind !== "site") {
    if (!id) throw new HttpError(400, "bad-request");
    const table = kind === "project" ? "pm.projects" : "pm.posts";
    const [row] = await deps.sql.query(`select 1 from ${table} where id = $1 and deleted_at is null`, [id]);
    if (!row) throw new HttpError(404, "not-found");
  }
  const token = base64url(deps.randomBytes(32));
  const tokenHash = await sha256Hex(token);
  const [link] = await deps.sql.query<{ created_at: string; expires_at: string }>(
    `insert into pm.preview_links (token_hash, kind, project_id, post_id, expires_at)
     values ($1, $2, $3, $4, now() + make_interval(days => $5))
     returning created_at::text, expires_at::text`,
    [tokenHash, kind, kind === "project" ? id : null, kind === "post" ? id : null, PREVIEW_DAYS],
  );
  const url = `${deps.env.siteUrl.replace(/\/$/, "")}/preview/${token}`;
  return json(req, deps, 200, {
    url,
    link: { tokenHash, createdAt: link?.created_at, expiresAt: link?.expires_at, revokedAt: null },
  });
}

async function revoke(req: Request, deps: Deps): Promise<Response> {
  await requireOwner(req, deps);
  // `{ tokenHash }` as JSON, or `?tokenHash=` for clients that can't send a DELETE body.
  const fromQuery = new URL(req.url).searchParams.get("tokenHash");
  const parsed = RevokeBody.safeParse(fromQuery !== null ? { tokenHash: fromQuery } : await readJson(req));
  if (!parsed.success) throw new HttpError(400, "bad-request");
  await deps.sql.query(
    "update pm.preview_links set revoked_at = now() where token_hash = $1 and revoked_at is null",
    [parsed.data.tokenHash],
  );
  return json(req, deps, 204, null);
}

interface Link {
  kind: "site" | "project" | "post";
  project_id: string | null;
  post_id: string | null;
  live: boolean;
}

async function read(req: Request, deps: Deps): Promise<Response> {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!TOKEN.test(token)) throw new HttpError(404, "not-found");
  const [link] = await deps.sql.query<Link>(
    `select kind, project_id::text, post_id::text, (revoked_at is null and expires_at > now()) as live
     from pm.preview_links where token_hash = $1`,
    [await sha256Hex(token)],
  );
  if (!link) return json(req, deps, 404, { error: "not-found" }, PREVIEW_HEADERS);
  if (!link.live) return json(req, deps, 410, { error: "expired" }, PREVIEW_HEADERS);

  const invalid = () => json(req, deps, 422, { error: "invalid-draft" }, PREVIEW_HEADERS);

  if (link.kind === "project" || link.kind === "post") {
    const table = link.kind === "project" ? "pm.projects" : "pm.posts";
    const [row] = await deps.sql.query<{ draft: unknown; slug: string }>(
      `select draft, slug from ${table} where id = $1 and deleted_at is null`,
      [link.kind === "project" ? link.project_id : link.post_id],
    );
    if (!row) return json(req, deps, 410, { error: "expired" }, PREVIEW_HEADERS);
    if (link.kind === "project") {
      const draft = Project.safeParse(row.draft);
      if (!draft.success) return invalid();
      const resolve = await previewResolver(await loadMedia(deps.sql, mediaIds(draft.data)), deps.storage);
      return json(
        req,
        deps,
        200,
        { kind: "project", slug: row.slug, project: sanitizeProject(publishProject(draft.data, resolve)) },
        PREVIEW_HEADERS,
      );
    }
    const draft = Post.safeParse(row.draft);
    if (!draft.success) return invalid();
    const resolve = await previewResolver(await loadMedia(deps.sql, mediaIds(draft.data)), deps.storage);
    return json(
      req,
      deps,
      200,
      { kind: "post", slug: row.slug, post: sanitizePost(publishPostDoc(draft.data, resolve, deps.now())) },
      PREVIEW_HEADERS,
    );
  }

  // A site preview: the draft profile and layout, with published projects and posts only.
  const [p] = await deps.sql.query<{ draft: unknown }>("select draft from pm.profile where id = 1");
  const [l] = await deps.sql.query<{ draft: unknown }>("select draft from pm.site_layout where id = 1");
  const profile = Profile.safeParse(p?.draft);
  const layoutDraft = SiteLayout.safeParse(l?.draft);
  if (!profile.success || !layoutDraft.success) return invalid();
  const projects = await deps.sql.query<{
    id: string;
    slug: string;
    published: unknown;
    published_at: string;
    first_published_at: string;
  }>(
    `select id::text, published_slug as slug, published, published_at::text, first_published_at::text
     from pm.projects where published is not null and deleted_at is null and visibility = 'public'`,
  );
  const posts = await deps.sql.query<{ id: string; slug: string; published: unknown; published_at: string }>(
    `select id::text, published_slug as slug, published, published_at::text
     from pm.posts where published is not null and deleted_at is null`,
  );
  const layout = sanitizeLayout(
    publishableLayout(layoutDraft.data, profile.data, new Set(projects.map((x) => x.id))),
  );
  const resolve = await previewResolver(await loadMedia(deps.sql, mediaIds(profile.data)), deps.storage);
  return json(
    req,
    deps,
    200,
    {
      kind: "site",
      profile: sanitizeProfile(pruneProfile(publishProfile(profile.data, resolve), layout)),
      layout,
      projects,
      posts,
    },
    PREVIEW_HEADERS,
  );
}

export const previewHandler = handle("pm-preview", async (req, deps) => {
  switch (req.method) {
    case "GET":
      return read(req, deps);
    case "POST":
      return create(req, deps);
    case "DELETE":
      return revoke(req, deps);
    default:
      throw new HttpError(405, "method");
  }
});
