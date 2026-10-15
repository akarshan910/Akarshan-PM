/**
 * pm-publish (06 · pm-publish). The only writer of every published column, revision, redirect and
 * deploy row: the owner's session can't write them directly (0001's column grants). Owner only.
 *
 * Responses are Studio's `PublishResult` as JSON:
 *   200 { ok: true, publishedAt, deployed }
 *   422 { ok: false, reason: 'blocked', issues: [{ field, message }] }
 *   409 { ok: false, reason: 'needs-confirm', unconfirmed: [...] }
 */
import { z } from "zod";

import { checkLink } from "./check-link.ts";
import { postChecks, projectChecks, type Issue } from "./checks.ts";
import type { Deps, Sql } from "./deps.ts";
import { handle, HttpError, json, readJson, requireOwner } from "./http.ts";
import { publishProfile, publishProject } from "./lib/published.ts";
import { Post, Profile, Project, SiteLayout } from "./lib/schemas.ts";
import type { SiteLayout as Layout } from "./lib/types.ts";
import { loadMedia, mediaIds, publicResolver, publishedKeys, publishMedia, type MediaRow } from "./media.ts";
import { publishPostDoc } from "./post.ts";
import { addVideoPosters } from "./poster.ts";
import { sanitizeLayout, sanitizePost, sanitizeProfile, sanitizeProject } from "./sanitize.ts";
import { layoutChanges, placeProject, publishableLayout, pruneProfile, visibleUnconfirmed } from "./site.ts";

export const PublishBody = z.strictObject({
  action: z.enum(["publish", "unpublish", "delete", "restore", "settings", "deploy"]),
  kind: z.enum(["site", "project", "post"]),
  id: z.uuid().optional(),
  confirmUnconfirmed: z.boolean().optional(),
  visibility: z.enum(["public", "unlisted"]).optional(),
  indexAllowed: z.boolean().optional(),
  scheduleFor: z.iso.datetime({ offset: true }).nullable().optional(),
});
export type PublishBody = z.infer<typeof PublishBody>;

const blocked = (issues: Issue[]) => new HttpError(422, "blocked", { ok: false, reason: "blocked", issues });
const notFound = () => new HttpError(404, "not-found");

/** Calls the Vercel deploy hook and records it. A failed hook never undoes a publish. */
export async function deploy(deps: Deps, reason: string): Promise<boolean> {
  const hook = deps.env.deployHookUrl;
  if (!hook) return false;
  try {
    const res = await deps.fetch(hook, { method: "POST", signal: AbortSignal.timeout(10_000) });
    await res.body?.cancel();
    if (!res.ok) return false;
    await deps.sql.query("insert into pm.deploys (reason) values ($1)", [reason.slice(0, 120)]);
    return true;
  } catch {
    return false;
  }
}

/** Media rows the published document actually uses (hidden parts' images stay private). */
function usedMedia(media: Map<string, MediaRow>, published: unknown): MediaRow[] {
  const keys = publishedKeys(published);
  return [...media.values()].filter((m) => keys.has(m.key));
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) {
    throw blocked([
      { field: "draft", message: "Studio can't read part of this draft. Reload Studio, then publish again." },
    ]);
  }
  return r.data;
}

async function liveProjectIds(sql: Sql): Promise<Set<string>> {
  const rows = await sql.query<{ id: string }>("select id::text from pm.projects where deleted_at is null");
  return new Set(rows.map((r) => r.id));
}

export async function publishSite(
  deps: Deps,
  body: Pick<PublishBody, "confirmUnconfirmed">,
  options: Pick<SeedOptions, "deploy"> = {},
): Promise<Record<string, unknown>> {
  const [profileRow] = await deps.sql.query<{ draft: unknown }>("select draft from pm.profile where id = 1");
  const [layoutRow] = await deps.sql.query<{ draft: unknown; published: Layout | null }>(
    "select draft, published from pm.site_layout where id = 1",
  );
  if (!profileRow || !layoutRow) throw notFound();
  const profile = parse(Profile, profileRow.draft);
  const draftLayout = parse(SiteLayout, layoutRow.draft);

  const layout = sanitizeLayout(publishableLayout(draftLayout, profile, await liveProjectIds(deps.sql)));
  const unconfirmed = visibleUnconfirmed(profile, layout);
  if (unconfirmed.length > 0 && body.confirmUnconfirmed !== true) {
    throw new HttpError(409, "needs-confirm", { ok: false, reason: "needs-confirm", unconfirmed });
  }

  const media = await loadMedia(deps.sql, mediaIds(profile));
  const missing = mediaIds(profile).filter((id) => !media.has(id));
  if (missing.length > 0)
    throw blocked([{ field: "profile", message: "An image or file in Profile & facts is missing." }]);
  const published = sanitizeProfile(pruneProfile(publishProfile(profile, publicResolver(media)), layout));
  await publishMedia(deps.sql, deps.storage, usedMedia(media, published));
  const changes = layoutChanges(layoutRow.published, layout);

  const at = await deps.sql.transaction(async (tx) => {
    const [row] = await tx.query<{ at: string }>(
      "update pm.profile set published = $1, published_at = now() where id = 1 returning published_at::text as at",
      [published],
    );
    await tx.query("update pm.site_layout set published = $1, published_at = now() where id = 1", [layout]);
    await tx.query("insert into pm.site_revisions (profile, layout, changes) values ($1, $2, $3)", [
      published,
      layout,
      changes,
    ]);
    return row?.at ?? deps.now().toISOString();
  });
  const deployed = options.deploy === false ? false : await deploy(deps, "site");
  return { ok: true, publishedAt: at, deployed, changes };
}

interface ProjectRow {
  id: string;
  slug: string;
  published_slug: string | null;
  draft: unknown;
  published: unknown;
  first_published_at: string | null;
  deleted_at: string | null;
}

async function loadProject(sql: Sql, id: string): Promise<ProjectRow> {
  const [row] = await sql.query<ProjectRow>(
    `select id::text, slug, published_slug, draft, published, first_published_at::text, deleted_at::text
     from pm.projects where id = $1`,
    [id],
  );
  if (!row) throw notFound();
  return row;
}

/** Options only the V0 seed passes: the two checks it may skip (07 · Extraction). */
export interface SeedOptions {
  allow?: ReadonlySet<NonNullable<Issue["code"]>>;
  /** Skip the deploy hook: the owner deploys once the seed is done. */
  deploy?: boolean;
}

export async function publishProjectRow(
  deps: Deps,
  id: string,
  options: SeedOptions = {},
): Promise<Record<string, unknown>> {
  const row = await loadProject(deps.sql, id);
  if (row.deleted_at) throw notFound();
  const draft = parse(Project, row.draft);
  const media = await loadMedia(deps.sql, mediaIds(draft));
  const issues = await projectChecks(draft, row.slug, media, (url, kind) =>
    checkLink(url, kind, { fetch: deps.fetch, siteOrigin: deps.env.siteUrl, resolve: deps.resolveHost }),
  );
  const [taken] = await deps.sql.query<{ id: string }>(
    "select id::text from pm.projects where published_slug = $1 and id <> $2",
    [row.slug, id],
  );
  if (taken) issues.push({ field: "seo.slug", message: "Another project already uses this address." });
  // A flagged RICE row is a warning, as on the EditorCaseStudy and EditorOverview boards.
  const warnings = issues.filter((i) => i.code === "rice-row");
  const blocking = issues.filter((i) => i.code !== "rice-row" && !(i.code && options.allow?.has(i.code)));
  if (blocking.length > 0) throw blocked(blocking);

  const withPosters = await addVideoPosters(
    deps,
    sanitizeProject(publishProject(draft, publicResolver(media))),
  );
  const published = withPosters.project;
  for (const row of withPosters.rows) media.set(row.id, row);
  await publishMedia(deps.sql, deps.storage, usedMedia(media, published));

  const done = await deps.sql.transaction(async (tx) => {
    const [cur] = await tx.query<{ published_slug: string | null; first: string | null }>(
      "select published_slug, first_published_at::text as first from pm.projects where id = $1 for update",
      [id],
    );
    const old = cur?.published_slug ?? null;
    if (old && old !== row.slug && draft.settings.redirectOldSlug) {
      await tx.query(
        `insert into pm.slug_redirects (old_path, project_id) values ($1, $2)
         on conflict (old_path) do update set project_id = excluded.project_id, post_id = null`,
        [`/work/${old}`, id],
      );
    }
    // The live address never redirects away from itself.
    await tx.query("delete from pm.slug_redirects where old_path = $1", [`/work/${row.slug}`]);
    const [saved] = await tx.query<{ at: string }>(
      `update pm.projects set published = $2, published_at = now(), published_slug = slug,
         first_published_at = coalesce(first_published_at, now())
       where id = $1 returning published_at::text as at`,
      [id, published],
    );
    await tx.query("insert into pm.project_revisions (project_id, published) values ($1, $2)", [
      id,
      published,
    ]);

    let version: number | undefined;
    if (!cur?.first) {
      // D40: "Redirect the old address here" is on once the project has been published. The draft
      // changes, so its version moves too; Studio adopts the returned version instead of conflicting.
      const [v] = await tx.query<{ version: number }>(
        `update pm.projects set draft = jsonb_set(draft, '{settings,redirectOldSlug}', 'true'::jsonb, true),
           version = version + 1
         where id = $1 returning version`,
        [id],
      );
      version = v?.version;
      const [site] = await tx.query<{ draft: Layout; published: Layout | null; profile: unknown }>(
        "select l.draft, l.published, p.published as profile from pm.site_layout l, pm.profile p where l.id = 1 and p.id = 1",
      );
      const placed = site?.published ? placeProject(site.published, site.draft, id) : null;
      if (placed && site?.profile) {
        await tx.query("update pm.site_layout set published = $1 where id = 1", [placed]);
        await tx.query("insert into pm.site_revisions (profile, layout, changes) values ($1, $2, $3)", [
          site.profile,
          placed,
          [`Added ${draft.overview.title} to the homepage`],
        ]);
      }
    }
    return { at: saved?.at ?? deps.now().toISOString(), version };
  });
  const deployed = options.deploy === false ? false : await deploy(deps, `project:${row.slug}`);
  return {
    ok: true,
    publishedAt: done.at,
    deployed,
    ...(done.version !== undefined ? { version: done.version } : {}),
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

interface PostRow {
  id: string;
  slug: string;
  published_slug: string | null;
  draft: unknown;
  published: unknown;
  deleted_at: string | null;
}

async function loadPost(sql: Sql, id: string): Promise<PostRow> {
  const [row] = await sql.query<PostRow>(
    "select id::text, slug, published_slug, draft, published, deleted_at::text from pm.posts where id = $1",
    [id],
  );
  if (!row) throw notFound();
  return row;
}

/** Validates a post for publishing now or later; returns what to write. */
async function preparePost(deps: Deps, row: PostRow) {
  const draft = parse(Post, row.draft);
  const media = await loadMedia(deps.sql, mediaIds(draft));
  const issues = postChecks(draft, row.slug, media);
  const [taken] = await deps.sql.query<{ id: string }>(
    "select id::text from pm.posts where published_slug = $1 and id <> $2",
    [row.slug, row.id],
  );
  if (taken) issues.push({ field: "seo.slug", message: "Another post already uses this address." });
  if (issues.length > 0) throw blocked(issues);
  const published = sanitizePost(publishPostDoc(draft, publicResolver(media), deps.now()));
  return { published, media: usedMedia(media, published) };
}

/** Publishes one post in its own transaction. Used by pm-publish and pm-post-scheduler. */
export async function publishPostRow(deps: Deps, id: string): Promise<{ publishedAt: string; slug: string }> {
  const row = await loadPost(deps.sql, id);
  if (row.deleted_at) throw notFound();
  const { published, media } = await preparePost(deps, row);
  await publishMedia(deps.sql, deps.storage, media);
  const at = await deps.sql.transaction(async (tx) => {
    const [cur] = await tx.query<{ published_slug: string | null }>(
      "select published_slug from pm.posts where id = $1 for update",
      [id],
    );
    const old = cur?.published_slug ?? null;
    if (old && old !== row.slug) {
      await tx.query(
        `insert into pm.slug_redirects (old_path, post_id) values ($1, $2)
         on conflict (old_path) do update set post_id = excluded.post_id, project_id = null`,
        [`/writing/${old}`, id],
      );
    }
    await tx.query("delete from pm.slug_redirects where old_path = $1", [`/writing/${row.slug}`]);
    const [saved] = await tx.query<{ at: string }>(
      `update pm.posts set published = $2, published_at = coalesce(published_at, now()), published_slug = slug,
         scheduled_for = null, schedule_error = null
       where id = $1 returning published_at::text as at`,
      [id, published],
    );
    await tx.query("insert into pm.post_revisions (post_id, published) values ($1, $2)", [id, published]);
    return saved?.at ?? deps.now().toISOString();
  });
  return { publishedAt: at, slug: row.slug };
}

async function schedulePost(deps: Deps, id: string, when: string | null): Promise<Record<string, unknown>> {
  const row = await loadPost(deps.sql, id);
  if (row.deleted_at) throw notFound();
  if (when === null) {
    await deps.sql.query("update pm.posts set scheduled_for = null, schedule_error = null where id = $1", [
      id,
    ]);
    return { ok: true, publishedAt: null, deployed: false };
  }
  if (new Date(when).getTime() <= deps.now().getTime()) {
    throw blocked([{ field: "schedule", message: "Pick a time in the future." }]);
  }
  await preparePost(deps, row); // the checks run now, so a scheduled post can't fail them later
  await deps.sql.query("update pm.posts set scheduled_for = $2, schedule_error = null where id = $1", [
    id,
    when,
  ]);
  return { ok: true, publishedAt: when, deployed: false };
}

/** unpublish, delete, restore and settings: one column each, then a rebuild if anything live changed. */
async function changeState(deps: Deps, body: PublishBody & { id: string }): Promise<Record<string, unknown>> {
  const table = body.kind === "project" ? "pm.projects" : "pm.posts";
  const now = deps.now().toISOString();
  let rows: { slug: string; live: boolean }[] = [];
  switch (body.action) {
    case "unpublish":
      rows = await deps.sql.query(
        `update ${table} set published = null where id = $1 and published is not null returning slug, true as live`,
        [body.id],
      );
      break;
    case "delete":
      rows = await deps.sql.query(
        `update ${table} set deleted_at = now() where id = $1 and deleted_at is null
         returning slug, published is not null as live`,
        [body.id],
      );
      break;
    case "restore": {
      // Undo of Delete: back from the bin. Undo of Unpublish: the last live version goes back up,
      // with no checks, since it was live moments ago (05 · Projects).
      rows = await deps.sql.query(
        `update ${table} set deleted_at = null where id = $1 and deleted_at is not null
         returning slug, published is not null as live`,
        [body.id],
      );
      if (rows.length === 0) {
        const revisions = body.kind === "project" ? "pm.project_revisions" : "pm.post_revisions";
        const key = body.kind === "project" ? "project_id" : "post_id";
        rows = await deps.sql.query(
          `update ${table} t set published = r.published, published_at = coalesce(t.published_at, now())
           from (select published from ${revisions} where ${key} = $1 order by id desc limit 1) r
           where t.id = $1 and t.published is null and t.deleted_at is null and t.published_slug is not null
           returning t.slug, true as live`,
          [body.id],
        );
      }
      break;
    }
    case "settings": {
      if (body.kind !== "project") throw new HttpError(400, "bad-request");
      if (body.visibility === undefined && body.indexAllowed === undefined)
        throw new HttpError(400, "bad-request");
      rows = await deps.sql.query(
        `update pm.projects set visibility = coalesce($2, visibility), index_allowed = coalesce($3, index_allowed)
         where id = $1 and deleted_at is null returning slug, published is not null as live`,
        [body.id, body.visibility ?? null, body.indexAllowed ?? null],
      );
      break;
    }
    case "publish":
    case "deploy":
      throw new HttpError(400, "bad-request");
  }
  if (rows.length === 0) {
    const [exists] = await deps.sql.query(`select 1 from ${table} where id = $1`, [body.id]);
    if (!exists) throw notFound();
    return { ok: true, publishedAt: now, deployed: false }; // already in that state
  }
  const live = rows[0]?.live ?? false;
  const reason =
    body.action === "unpublish" || body.action === "delete"
      ? "unpublish"
      : `${body.kind}:${rows[0]?.slug ?? ""}`;
  return { ok: true, publishedAt: now, deployed: live ? await deploy(deps, reason) : false };
}

export const publishHandler = handle("pm-publish", async (req, deps) => {
  if (req.method !== "POST") throw new HttpError(405, "method");
  await requireOwner(req, deps);
  const parsed = PublishBody.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, "bad-request");
  const body = parsed.data;

  // "Try again" after a failed deploy hook (06 · pm-publish step 5): rebuild, publish nothing.
  if (body.action === "deploy") {
    if (body.kind !== "site" || body.id) throw new HttpError(400, "bad-request");
    return json(req, deps, 200, {
      ok: true,
      publishedAt: deps.now().toISOString(),
      deployed: await deploy(deps, "retry"),
    });
  }
  if (body.kind === "site") {
    if (body.action !== "publish") throw new HttpError(400, "bad-request");
    return json(req, deps, 200, await publishSite(deps, body));
  }
  if (!body.id) throw new HttpError(400, "bad-request");
  const id = body.id;

  if (body.action === "publish") {
    if (body.kind === "project") return json(req, deps, 200, await publishProjectRow(deps, id));
    if (body.scheduleFor !== undefined)
      return json(req, deps, 200, await schedulePost(deps, id, body.scheduleFor));
    const r = await publishPostRow(deps, id);
    return json(req, deps, 200, {
      ok: true,
      publishedAt: r.publishedAt,
      deployed: await deploy(deps, `post:${r.slug}`),
    });
  }
  return json(req, deps, 200, await changeState(deps, { ...body, id }));
});
