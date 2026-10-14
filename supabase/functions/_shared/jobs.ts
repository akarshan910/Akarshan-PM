/**
 * The functions cron calls (06 · Cron), plus pm-project and pm-check-link, which are small.
 *
 * - pm-project: `GET ?slug=` → the published JSON of the project whose live address is `slug`, if
 *   it is published and not deleted (public or unlisted). 404 otherwise. For the unlisted shell.
 * - pm-check-link: the owner checks one link; cron (`{ nightly: true }`, service key) checks every
 *   link in published content. Results go to `pm.link_checks`.
 * - pm-post-scheduler: publishes posts whose `scheduled_for` has passed; a failure is kept in
 *   `schedule_error` for Studio and the post is no longer retried.
 * - pm-purge: removes soft-deleted rows and old preview links after 30 days, and files nothing uses.
 */
import { z } from "zod";

import { checkLink, publishedLinks } from "./check-link.ts";
import type { Deps } from "./deps.ts";
import { handle, HttpError, isService, json, readJson, requireOwner, requireService } from "./http.ts";
import { isHttpsUrl } from "./lib/schemas.ts";
import { publishedKeys } from "./media.ts";
import { deploy, publishPostRow } from "./publish.ts";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const PURGE_DAYS = 30;
const NIGHTLY_LIMIT = 200;

export const projectHandler = handle("pm-project", async (req, deps) => {
  if (req.method !== "GET") throw new HttpError(405, "method");
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!SLUG.test(slug) || slug.length > 80) throw new HttpError(404, "not-found");
  const [row] = await deps.sql.query<{ published: unknown; visibility: string; index_allowed: boolean }>(
    `select published, visibility, index_allowed from pm.projects
     where published_slug = $1 and published is not null and deleted_at is null`,
    [slug],
  );
  if (!row) throw new HttpError(404, "not-found");
  return json(
    req,
    deps,
    200,
    { slug, project: row.published, listed: row.visibility === "public" },
    // The unlisted shell is never indexed (06 · SEO); a public project's real page is the static one.
    { "X-Robots-Tag": "noindex" },
  );
});

const CheckBody = z.union([
  z.strictObject({
    url: z.string().max(2048).refine(isHttpsUrl),
    kind: z.enum(["video", "prototype", "prd"]),
  }),
  z.strictObject({ nightly: z.literal(true) }),
]);

async function record(deps: Deps, url: string, status: string, detail: string | undefined): Promise<void> {
  await deps.sql.query(
    `insert into pm.link_checks (url, status, detail, checked_at) values ($1, $2, $3, now())
     on conflict (url) do update set status = excluded.status, detail = excluded.detail, checked_at = now()`,
    [url, status, detail ?? null],
  );
}

export const checkLinkHandler = handle("pm-check-link", async (req, deps) => {
  if (req.method !== "POST") throw new HttpError(405, "method");
  const service = isService(req, deps);
  if (!service) await requireOwner(req, deps);
  const parsed = CheckBody.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, "bad-request");
  const options = { fetch: deps.fetch, siteOrigin: deps.env.siteUrl };

  if ("nightly" in parsed.data) {
    if (!service) throw new HttpError(403, "forbidden");
    const docs = await deps.sql.query<{ published: unknown }>(
      `select published from pm.projects where published is not null and deleted_at is null
       union all select published from pm.posts where published is not null and deleted_at is null
       union all select published from pm.profile where published is not null`,
    );
    const links = new Map(docs.flatMap((d) => publishedLinks(d.published)).map((l) => [l.url, l]));
    const failed: string[] = [];
    for (const link of [...links.values()].slice(0, NIGHTLY_LIMIT)) {
      const r = await checkLink(link.url, link.kind, options);
      await record(deps, link.url, r.status, r.detail);
      if (r.status !== "ok") failed.push(link.url);
    }
    return json(req, deps, 200, { checked: Math.min(links.size, NIGHTLY_LIMIT), failed: failed.length });
  }

  const r = await checkLink(parsed.data.url, parsed.data.kind, options);
  await record(deps, parsed.data.url, r.status, r.detail);
  return json(req, deps, 200, r);
});

export const schedulerHandler = handle("pm-post-scheduler", async (req, deps) => {
  if (req.method !== "POST") throw new HttpError(405, "method");
  requireService(req, deps);
  const due = await deps.sql.query<{ id: string }>(
    `select id::text from pm.posts where scheduled_for <= now() and deleted_at is null order by scheduled_for`,
  );
  let published = 0;
  for (const { id } of due) {
    try {
      await publishPostRow(deps, id);
      published++;
    } catch (error) {
      const issues =
        error instanceof HttpError && Array.isArray(error.extra.issues)
          ? (error.extra.issues as { message: string }[]).map((i) => i.message).join(" ")
          : "It couldn't be published. Open it and publish it by hand.";
      await deps.sql.query("update pm.posts set scheduled_for = null, schedule_error = $2 where id = $1", [
        id,
        issues.slice(0, 500),
      ]);
    }
  }
  const deployed = published > 0 ? await deploy(deps, "schedule") : false;
  return json(req, deps, 200, { due: due.length, published, deployed });
});

export const purgeHandler = handle("pm-purge", async (req, deps) => {
  if (req.method !== "POST") throw new HttpError(405, "method");
  requireService(req, deps);
  const rows = await deps.sql.transaction(async (tx) => {
    const projects = await tx.query(
      "delete from pm.projects where deleted_at < now() - make_interval(days => $1) returning id",
      [PURGE_DAYS],
    );
    const posts = await tx.query(
      "delete from pm.posts where deleted_at < now() - make_interval(days => $1) returning id",
      [PURGE_DAYS],
    );
    const previews = await tx.query(
      `delete from pm.preview_links where coalesce(revoked_at, expires_at) < now() - make_interval(days => $1)
       returning token_hash`,
      [PURGE_DAYS],
    );
    return { projects: projects.length, posts: posts.length, previews: previews.length };
  });

  // Files: the draft bucket keeps each media row's current revision; the public bucket keeps what
  // published content names. Everything else under a pm- bucket goes.
  const current = new Set(
    (await deps.sql.query<{ key: string }>("select key from pm.media")).map((r) => r.key),
  );
  const live = new Set<string>();
  const docs = await deps.sql.query<{ published: unknown }>(
    `select published from pm.projects where published is not null
     union all select published from pm.posts where published is not null
     union all select published from pm.profile where published is not null
     union all select published from pm.site_layout where published is not null`,
  );
  for (const d of docs) for (const k of publishedKeys(d.published)) live.add(k);
  const keyOf = (name: string) => /^([0-9a-f-]{36}\/r[0-9]+)\//.exec(name)?.[1] ?? "";

  const removed: Record<string, number> = {};
  for (const [bucket, keep] of [
    ["pm-media-draft", current],
    ["pm-media-public", live],
  ] as const) {
    const names = (await deps.storage.list(bucket, "")).filter((n) => !keep.has(keyOf(n)));
    for (let i = 0; i < names.length; i += 100) await deps.storage.remove(bucket, names.slice(i, i + 100));
    removed[bucket] = names.length;
  }
  await deps.sql.query("update pm.media set published = (key = any($1::text[]))", [[...live]]);
  return json(req, deps, 200, { ...rows, files: removed });
});
