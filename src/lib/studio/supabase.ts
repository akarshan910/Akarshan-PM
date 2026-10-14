/**
 * The Supabase repo (06 · Client code, Tables, Autosave, Edge Functions, Storage): `StudioRepo`
 * over the `pm` schema with the owner's session. The browser gets only the URL and anon key; RLS
 * and column grants decide what the session may write (security's reply, 20261015-1300):
 *
 * - drafts and versions are written directly, with the optimistic version check;
 * - publishing, visibility, deletes, restores and schedules go through `pm-publish`;
 * - preview links through `pm-preview`, link checks through `pm-check-link`;
 * - media files go to `pm-media-draft` only, keyed `<id>/r<rev>/<file>`.
 *
 * Nothing here names the owner's address: sign-in takes whatever the form sends.
 */
import { createClient, type AuthError } from "@supabase/supabase-js";

import type { Post, Profile, Project, SiteLayout } from "../types";
import type { PostPublished, ProfilePublished, ProjectPublished } from "../published";
import { runPipeline, variantFile, type PipelineResult } from "./media-pipeline";
import type {
  CheckCodeResult,
  DocRow,
  LinkStatus,
  MediaRow,
  MediaUse,
  PostRow,
  PreviewLink,
  ProjectRow,
  PublishRequest,
  PublishResult,
  SaveResult,
  SendCodeResult,
  Session,
  StudioRepo,
  UploadInput,
} from "./repo";
import { mediaUses } from "./usage";

const DRAFT_BUCKET = "pm-media-draft";
/** The shared project's storage quota (free plan), used by lumina too. */
const QUOTA = 1024 * 1024 * 1024;
const SIGNED_FOR = 3600;

// ---- errors

const isOffline = (e: unknown) =>
  (typeof navigator !== "undefined" && "onLine" in navigator && !navigator.onLine) ||
  /fetch|network|load failed/i.test(errorText(e));

function failed<R>(e: unknown): SaveResult<R> {
  return isOffline(e)
    ? { ok: false, reason: "offline" }
    : { ok: false, reason: "error", message: errorText(e) };
}

function errorText(e: unknown): string {
  const m = (e as { message?: unknown } | null)?.message;
  return typeof m === "string" ? m : "Something went wrong.";
}

function must<T>(r: { data: T | null; error: unknown }): T {
  if (r.error) throw r.error instanceof Error ? r.error : new Error(errorText(r.error));
  if (r.data === null) throw new Error("No data.");
  return r.data;
}

// ---- row mapping (snake_case columns → the repo's shapes)

interface DocCols<D, P> {
  draft: D;
  published: P | null;
  published_at: string | null;
  version: number;
  updated_at: string;
}
const doc = <D, P>(r: DocCols<D, P>): DocRow<D, P> => ({
  draft: r.draft,
  published: r.published ?? null,
  publishedAt: r.published_at ?? null,
  version: r.version,
  updatedAt: r.updated_at,
});

interface ProjectCols extends DocCols<Project, ProjectPublished> {
  id: string;
  slug: string;
  published_slug: string | null;
  visibility: "public" | "unlisted";
  index_allowed: boolean;
  first_published_at: string | null;
  deleted_at: string | null;
}
const project = (r: ProjectCols): ProjectRow => ({
  ...doc(r),
  id: r.id,
  slug: r.slug,
  publishedSlug: r.published_slug ?? null,
  visibility: r.visibility,
  indexAllowed: r.index_allowed,
  firstPublishedAt: r.first_published_at ?? null,
  deletedAt: r.deleted_at ?? null,
});

interface PostCols extends DocCols<Post, PostPublished> {
  id: string;
  slug: string;
  published_slug: string | null;
  scheduled_for: string | null;
  schedule_error: string | null;
  deleted_at: string | null;
}
const post = (r: PostCols): PostRow => ({
  ...doc(r),
  id: r.id,
  slug: r.slug,
  publishedSlug: r.published_slug ?? null,
  scheduledFor: r.scheduled_for ?? null,
  scheduleError: r.schedule_error ?? null,
  deletedAt: r.deleted_at ?? null,
});

interface MediaCols {
  id: string;
  rev: number;
  key: string;
  kind: "image" | "document";
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  variants: number[] | null;
  focal: { x: number; y: number } | null;
  alt: string | null;
  decorative: boolean;
  dominant: string | null;
  filename: string;
  published: boolean;
  created_at: string;
}
const media = (r: MediaCols): MediaRow & { variants: number[] } => ({
  id: r.id,
  rev: r.rev,
  key: r.key,
  kind: r.kind,
  mime: r.mime,
  bytes: r.bytes,
  width: r.width,
  height: r.height,
  focal: r.focal,
  alt: r.alt,
  decorative: r.decorative,
  dominant: r.dominant,
  filename: r.filename,
  published: r.published,
  createdAt: r.created_at,
  variants: r.variants ?? [],
});

const PROJECT_COLS =
  "id, slug, published_slug, visibility, index_allowed, draft, published, published_at, first_published_at, version, updated_at, deleted_at";
const POST_COLS =
  "id, slug, published_slug, draft, published, published_at, scheduled_for, schedule_error, version, updated_at, deleted_at";
const DOC_COLS = "draft, published, published_at, version, updated_at";
const MEDIA_COLS =
  "id, rev, key, kind, mime, bytes, width, height, variants, focal, alt, decorative, dominant, filename, published, created_at";

// ---- auth (06 · Client code)

function classify(e: AuthError | null): "rate" | "captcha" | "offline" | "unknown" {
  if (!e) return "unknown";
  if (e.status === 429 || /rate/i.test(e.code ?? "")) return "rate";
  if (/captcha/i.test(e.code ?? e.message)) return "captcha";
  if (e.name === "AuthRetryableFetchError" || isOffline(e)) return "offline";
  return "unknown";
}

/** "Signups not allowed": the address has no account. Never told apart from "sent". */
const isUserNotFound = (e: AuthError) =>
  /otp_disabled|user_not_found/i.test(e.code ?? "") || /signups not allowed/i.test(e.message);

export function supabaseRepo(url: string, anonKey: string): StudioRepo {
  const sb = createClient(url, anonKey, {
    db: { schema: "pm" },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  const signed = new Map<string, { url: string; until: number }>();

  async function ownerSession(): Promise<Session | null> {
    const { data } = await sb.auth.getSession();
    const s = data.session;
    if (!s) return null;
    const check = await sb.rpc("is_owner");
    if (check.error) throw check.error;
    const owner: unknown = check.data;
    if (owner !== true) {
      await sb.auth.signOut({ scope: "local" });
      return null;
    }
    return { email: s.user.email ?? "", userId: s.user.id };
  }

  // ---- the two singleton documents (id = 1)
  function singleton<D, P>(table: "profile" | "site_layout") {
    const get = async (): Promise<DocRow<D, P>> =>
      doc(must(await sb.from(table).select(DOC_COLS).eq("id", 1).single<DocCols<D, P>>()));
    return {
      get,
      save: async (draft: D, seen: number): Promise<SaveResult<DocRow<D, P>>> => {
        try {
          const r = await sb
            .from(table)
            .update({ draft, version: seen + 1 })
            .eq("id", 1)
            .eq("version", seen)
            .select(DOC_COLS)
            .maybeSingle<DocCols<D, P>>();
          if (r.error) return failed(r.error);
          if (!r.data) return { ok: false, reason: "conflict", latest: await get() };
          return { ok: true, row: doc(r.data) };
        } catch (e) {
          return failed(e);
        }
      },
    };
  }

  // ---- projects and posts share their shape
  function documents<D, R extends { id: string }>(
    table: "projects" | "posts",
    cols: string,
    map: (c: unknown) => R,
  ) {
    const get = async (id: string): Promise<R | null> => {
      const r = await sb.from(table).select(cols).eq("id", id).is("deleted_at", null).maybeSingle();
      if (r.error) throw r.error;
      return r.data ? map(r.data) : null;
    };
    const slugOwner = async (slug: string, exceptId?: string) => {
      const both = await sb
        .from(table)
        .select("id, slug, published_slug, draft")
        .or(`slug.eq.${slug},published_slug.eq.${slug}`);
      if (both.error) throw both.error;
      const hit = (
        both.data as { id: string; draft: { overview?: { title?: string }; title?: string } }[]
      ).find((x) => x.id !== exceptId);
      if (hit) return { id: hit.id, title: hit.draft.overview?.title ?? hit.draft.title ?? slug };
      const prefix = table === "projects" ? "/work/" : "/writing/";
      const red = await sb
        .from("slug_redirects")
        .select("old_path, project_id, post_id")
        .eq("old_path", `${prefix}${slug}`)
        .maybeSingle<{ project_id: string | null; post_id: string | null }>();
      if (red.error) throw red.error;
      const by = red.data?.project_id ?? red.data?.post_id;
      if (red.data && by !== exceptId) return { id: by ?? "", title: "an earlier address" };
      return null;
    };
    const versioned = async (
      id: string,
      patch: Record<string, unknown>,
      seen: number,
    ): Promise<SaveResult<R>> => {
      try {
        const r = await sb
          .from(table)
          .update({ ...patch, version: seen + 1 })
          .eq("id", id)
          .eq("version", seen)
          .select(cols)
          .maybeSingle();
        if (r.error) return failed(r.error);
        if (!r.data) {
          const latest = await get(id);
          return latest
            ? { ok: false, reason: "conflict", latest }
            : { ok: false, reason: "error", message: "Not found." };
        }
        return { ok: true, row: map(r.data) };
      } catch (e) {
        return failed(e);
      }
    };
    return {
      list: async (): Promise<R[]> => {
        const r = await sb
          .from(table)
          .select(cols)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false });
        return (must(r) as unknown[]).map(map);
      },
      get,
      create: async (draft: D, slug: string): Promise<R> =>
        map(must(await sb.from(table).insert({ slug, draft }).select(cols).single())),
      save: (id: string, draft: D, seen: number) => versioned(id, { draft }, seen),
      setSlug: async (id: string, slug: string, seen: number) => {
        const owner = await slugOwner(slug, id);
        if (owner) return { ok: false as const, reason: "taken" as const, by: owner.title };
        return versioned(id, { slug }, seen);
      },
      slugOwner,
    };
  }

  const projects = documents<Project, ProjectRow>("projects", PROJECT_COLS, (c) => project(c as ProjectCols));
  const posts = documents<Post, PostRow>("posts", POST_COLS, (c) => post(c as PostCols));
  const profile = singleton<Profile, ProfilePublished>("profile");
  const layout = singleton<SiteLayout, SiteLayout>("site_layout");

  // ---- media
  const mediaGet = async (id: string) =>
    media(must(await sb.from("media").select(MEDIA_COLS).eq("id", id).single<MediaCols>()));

  async function store(key: string, out: PipelineResult, onProgress?: (f: number) => void) {
    let done = 0;
    for (const f of out.files) {
      const { error } = await sb.storage
        .from(DRAFT_BUCKET)
        .upload(`${key}/${f.name}`, f.blob, { contentType: f.type, upsert: true, cacheControl: "3600" });
      if (error) throw error;
      done++;
      onProgress?.(done / out.files.length);
    }
  }

  async function docsForUses() {
    const [p, ps, pos] = await Promise.all([profile.get(), projects.list(), posts.list()]);
    return {
      docs: {
        profile: p.draft,
        projects: ps.map((r) => ({ id: r.id, draft: r.draft })),
        posts: pos.map((r) => ({ id: r.id, draft: r.draft })),
      },
      published: [p.published, ...ps.map((r) => r.published), ...pos.map((r) => r.published)],
    };
  }

  // ---- functions
  async function invoke(
    name: string,
    body: unknown,
    method: "POST" | "DELETE" = "POST",
  ): Promise<{ status: number; data: unknown; offline: boolean }> {
    const { data: s } = await sb.auth.getSession();
    try {
      const res = await fetch(`${url}/functions/v1/${name}`, {
        method,
        headers: {
          "content-type": "application/json",
          apikey: anonKey,
          ...(s.session ? { authorization: `Bearer ${s.session.access_token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      return { status: res.status, data: text ? (JSON.parse(text) as unknown) : null, offline: false };
    } catch {
      return { status: 0, data: null, offline: true };
    }
  }

  return {
    auth: {
      session: ownerSession,
      sendCode: async (email: string, captchaToken?: string): Promise<SendCodeResult> => {
        try {
          const { error } = await sb.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: { shouldCreateUser: false, ...(captchaToken ? { captchaToken } : {}) },
          });
          if (error && !isUserNotFound(error)) return classify(error);
          return "sent";
        } catch (e) {
          return isOffline(e) ? "offline" : "unknown";
        }
      },
      checkCode: async (
        email: string,
        token: string,
        sentAt: number,
        captchaToken?: string,
      ): Promise<CheckCodeResult> => {
        try {
          const { error } = await sb.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token,
            type: "email",
            ...(captchaToken ? { options: { captchaToken } } : {}),
          });
          if (error) {
            const c = classify(error);
            if (c === "rate" || c === "offline") return c;
            return Date.now() - sentAt > 10 * 60_000 ? "expired" : "wrong";
          }
          const check = await sb.rpc("is_owner");
          const owner: unknown = check.data;
          if (owner !== true) {
            await sb.auth.signOut({ scope: "local" });
            return "not-owner";
          }
          return "signed-in";
        } catch (e) {
          return isOffline(e) ? "offline" : "unknown";
        }
      },
      signOut: async (scope) => {
        await sb.auth.signOut({ scope });
        signed.clear();
      },
      onChange: (listener) => {
        const { data } = sb.auth.onAuthStateChange((event, s) => {
          if (event === "INITIAL_SESSION") return;
          if (!s) {
            listener(null);
            return;
          }
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED")
            listener({ email: s.user.email ?? "", userId: s.user.id });
        });
        return () => {
          data.subscription.unsubscribe();
        };
      },
    },
    profile,
    layout,
    projects,
    posts,
    media: {
      list: async () =>
        (
          must(
            await sb.from("media").select(MEDIA_COLS).order("created_at", { ascending: false }),
          ) as unknown as MediaCols[]
        ).map(media),
      upload: async (input: UploadInput, onProgress) => {
        const out = await runPipeline(input.file, input.mime);
        const id = crypto.randomUUID();
        const key = `${id}/r1`;
        await store(key, out, onProgress);
        const row = {
          id,
          rev: 1,
          key,
          kind: out.kind,
          mime: out.mime,
          bytes: out.bytes,
          width: out.width,
          height: out.height,
          variants: out.variants,
          has_og: false,
          dominant: out.dominant,
          filename: input.filename.slice(0, 255),
        };
        return media(must(await sb.from("media").insert(row).select(MEDIA_COLS).single<MediaCols>()));
      },
      update: async (id, patch) => {
        const cols: Record<string, unknown> = {};
        if (patch.alt !== undefined) cols.alt = patch.alt;
        if (patch.decorative !== undefined) cols.decorative = patch.decorative;
        if (patch.focal !== undefined) cols.focal = patch.focal;
        if (patch.filename !== undefined) cols.filename = patch.filename.slice(0, 255);
        return media(
          must(await sb.from("media").update(cols).eq("id", id).select(MEDIA_COLS).single<MediaCols>()),
        );
      },
      replace: async (id, input) => {
        const current = await mediaGet(id);
        const out = await runPipeline(input.file, input.mime);
        const rev = current.rev + 1;
        const key = `${id}/r${String(rev)}`;
        await store(key, out);
        return media(
          must(
            await sb
              .from("media")
              .update({
                rev,
                key,
                mime: out.mime,
                bytes: out.bytes,
                width: out.width,
                height: out.height,
                variants: out.variants,
                has_og: false,
                dominant: out.dominant,
                filename: input.filename.slice(0, 255),
              })
              .eq("id", id)
              .select(MEDIA_COLS)
              .single<MediaCols>(),
          ),
        );
      },
      remove: async (id) => {
        const { docs, published } = await docsForUses();
        const uses: MediaUse[] = mediaUses(id, docs);
        if (!uses.length && published.some((p) => p && JSON.stringify(p).includes(id)))
          uses.push({ kind: "project", title: "A published page", where: "Live", href: "/studio/projects" });
        if (uses.length) return { ok: false, uses };
        const { error } = await sb.from("media").delete().eq("id", id);
        if (error) throw error;
        return { ok: true };
      },
      uses: async (id) => mediaUses(id, (await docsForUses()).docs),
      url: async (row, variant = "960") => {
        const variants = (row as MediaRow & { variants?: number[] }).variants;
        const path = `${row.key}/${variantFile({ kind: row.kind, mime: row.mime, variants: variants ?? null }, variant)}`;
        const hit = signed.get(path);
        if (hit && hit.until > Date.now()) return hit.url;
        const { data, error } = await sb.storage.from(DRAFT_BUCKET).createSignedUrl(path, SIGNED_FOR);
        if (error) throw error;
        signed.set(path, { url: data.signedUrl, until: Date.now() + (SIGNED_FOR - 300) * 1000 });
        return data.signedUrl;
      },
      storageUsed: async () => {
        const rows = must<{ bytes: number }[]>(await sb.from("media").select("bytes"));
        return { used: rows.reduce((n, r) => n + r.bytes, 0), quota: QUOTA };
      },
    },
    previews: {
      create: async (kind, id) => {
        const r = await invoke("pm-preview", {
          kind,
          ...(id ? { id } : {}),
        });
        if (!r.data || r.status >= 300)
          throw new Error(r.offline ? "offline" : "Couldn’t create a preview link.");
        return r.data as { url: string; link: PreviewLink };
      },
      list: async (kind, id) => {
        let q = sb
          .from("preview_links")
          .select("token_hash, created_at, expires_at, revoked_at")
          .eq("kind", kind);
        if (kind === "project" && id) q = q.eq("project_id", id);
        if (kind === "post" && id) q = q.eq("post_id", id);
        const rows = must(await q.is("revoked_at", null).order("created_at", { ascending: false })) as {
          token_hash: string;
          created_at: string;
          expires_at: string;
          revoked_at: string | null;
        }[];
        return rows.map((r) => ({
          tokenHash: r.token_hash,
          createdAt: r.created_at,
          expiresAt: r.expires_at,
          revokedAt: r.revoked_at,
        }));
      },
      revoke: async (tokenHash) => {
        const r = await invoke("pm-preview", { tokenHash }, "DELETE");
        if (r.status >= 300 || r.offline) throw new Error("Couldn’t revoke the link.");
      },
    },
    topics: async (kind) => {
      const rows = must(await sb.rpc("topic_counts", { kind })) as { topic: string; uses: number }[];
      return rows;
    },
    publish: async (request: PublishRequest): Promise<PublishResult> => {
      const r = await invoke("pm-publish", request);
      if (r.offline) return { ok: false, reason: "offline" };
      const body = r.data as (PublishResult & { error?: string }) | null;
      if (body && "ok" in body && (r.status === 200 || r.status === 409 || r.status === 422)) return body;
      return { ok: false, reason: "error", message: body?.error ?? "Couldn’t publish." };
    },
    checkLink: async (link, kind) => {
      const r = await invoke("pm-check-link", { url: link, kind });
      if (!r.data || r.status >= 300)
        return { status: "error", detail: r.offline ? "Offline." : "Couldn’t check the link." };
      return r.data as { status: LinkStatus; detail?: string };
    },
    linkChecks: async () => {
      const rows = must<
        {
          url: string;
          status: LinkStatus;
          detail: string | null;
          checked_at: string;
        }[]
      >(await sb.from("link_checks").select("url, status, detail, checked_at"));
      return rows.map((r) => ({ url: r.url, status: r.status, detail: r.detail, checkedAt: r.checked_at }));
    },
  };
}
