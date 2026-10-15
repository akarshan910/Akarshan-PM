/**
 * Studio's data-access interface. Every Studio screen reads and writes through a `StudioRepo`, so
 * the screens never touch supabase-js directly (06 · Client code). Two implementations:
 *
 * - `memory.ts`: an in-memory repo seeded from the V0 documents, used until M3 lands, in tests
 *   and in the dev catalogue;
 * - the Supabase repo (M3), which maps each method onto the `pm` tables, RPCs and `pm-*` functions
 *   named in the comments below.
 *
 * The shapes mirror the `pm` rows in 06 · Tables: a draft document, its published copy, and the
 * `version` that autosave checks. Nothing here imports React.
 */
import type { PostPublished, ProfilePublished, ProjectPublished } from "../published";
import type { Post, Profile, Project, SiteLayout } from "../types";

// ---------------------------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------------------------

/** A singleton row: `pm.profile` or `pm.site_layout`. `P` is the published shape (06). */
export interface DocRow<D, P = D> {
  draft: D;
  /** The last published document, in its published shape, or null before the first publish. */
  published: P | null;
  publishedAt: string | null;
  /** Bumped by every save; the autosave's optimistic-lock token. */
  version: number;
  updatedAt: string;
}

/** `pm.projects`, minus `deleted_at` rows unless asked for. */
export interface ProjectRow extends DocRow<Project, ProjectPublished> {
  id: string;
  /** The draft address (URL & SEO). */
  slug: string;
  /** The live address, written only by publishing. */
  publishedSlug: string | null;
  visibility: "public" | "unlisted";
  indexAllowed: boolean;
  firstPublishedAt: string | null;
  deletedAt: string | null;
}

/** `pm.posts`. */
export interface PostRow extends DocRow<Post, PostPublished> {
  id: string;
  slug: string;
  publishedSlug: string | null;
  scheduledFor: string | null;
  scheduleError: string | null;
  deletedAt: string | null;
}

/** `pm.media`. */
export interface MediaRow {
  id: string;
  rev: number;
  key: string;
  kind: "image" | "document";
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  focal: { x: number; y: number } | null;
  alt: string | null;
  decorative: boolean;
  dominant: string | null;
  filename: string;
  published: boolean;
  createdAt: string;
  /** `og.jpg` exists: the 1200×630 crop around the focal point, made for covers. */
  hasOg?: boolean;
}

/** Where a media row is used, for "Used in" and the delete check (06 · Storage). */
export interface MediaUse {
  kind: "project" | "post" | "profile";
  /** Project or post id; absent for the profile. */
  id?: string;
  title: string;
  /** Where in the document: "Cover", "Gallery", "Story · The bet", "About photo". */
  where: string;
  /** A Studio path that opens the field, e.g. `/studio/projects/<id>/visuals`. */
  href: string;
}

/** A preview link as listed in Studio: never the token (05 · URL & SEO). */
export interface PreviewLink {
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export type LinkStatus = "ok" | "login" | "no-frame" | "not-shared" | "gone" | "error";

// ---------------------------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------------------------

/**
 * The autosave result (06 · Autosave): `update … where id = $id and version = $seen returning
 * version`. Zero rows is a conflict, and the repo returns the latest row so the conflict dialog
 * can name what changed.
 */
export type SaveResult<R> =
  | { ok: true; row: R }
  | { ok: false; reason: "conflict"; latest: R }
  | { ok: false; reason: "offline" | "error"; message?: string };

/** One failed publish check, with the field it links to (06 · pm-publish, step 2). */
export interface PublishIssue {
  field: string;
  message: string;
}

export type PublishKind = "site" | "project" | "post";
/** `deploy` (site only): rebuild after a failed deploy hook, publishing nothing. */
export type PublishAction = "publish" | "unpublish" | "delete" | "restore" | "settings" | "deploy";

/** The `pm-publish` request body, exactly as 06 · Edge Functions types it. */
export interface PublishRequest {
  action: PublishAction;
  kind: PublishKind;
  id?: string;
  confirmUnconfirmed?: boolean;
  visibility?: "public" | "unlisted";
  indexAllowed?: boolean;
  /** Posts only: schedule instead of publishing now (writes `scheduled_for`). */
  scheduleFor?: string | null;
}

export type PublishResult =
  | {
      ok: true;
      publishedAt: string;
      deployed: boolean;
      /** Things to fix that don't block, e.g. a RICE row whose score doesn't match its inputs. */
      warnings?: { field: string; message: string; code: string }[];
      /**
       * A project's first publish turns on "Redirect the old address" in the draft (D40), which
       * bumps the row: the new version. Absent when the draft wasn't touched.
       */
      version?: number;
    }
  | { ok: false; reason: "blocked"; issues: PublishIssue[] }
  | { ok: false; reason: "needs-confirm"; unconfirmed: string[] }
  | { ok: false; reason: "offline" | "error"; message?: string };

// ---------------------------------------------------------------------------------------------
// Auth (06 · Client code; src/lib/auth.ts in M3)
// ---------------------------------------------------------------------------------------------

export type SendCodeResult = "sent" | "rate" | "captcha" | "offline" | "unknown";
export type CheckCodeResult =
  "signed-in" | "wrong" | "expired" | "rate" | "not-owner" | "offline" | "unknown";

export interface Session {
  email: string;
  userId: string;
}

export interface AuthPort {
  /** The current session after the owner check, or null. */
  session(): Promise<Session | null>;
  sendCode(email: string, captchaToken?: string): Promise<SendCodeResult>;
  checkCode(email: string, code: string, sentAt: number, captchaToken?: string): Promise<CheckCodeResult>;
  signOut(scope: "local" | "global"): Promise<void>;
  /** Fires on sign-in, sign-out, token refresh failure and revocation elsewhere. Returns unsubscribe. */
  onChange(listener: (session: Session | null) => void): () => void;
}

// ---------------------------------------------------------------------------------------------
// The repo
// ---------------------------------------------------------------------------------------------

export interface SingletonPort<D, P = D> {
  get(): Promise<DocRow<D, P>>;
  save(draft: D, seenVersion: number): Promise<SaveResult<DocRow<D, P>>>;
}

export interface ProjectsPort {
  /** Every row that isn't soft-deleted. */
  list(): Promise<ProjectRow[]>;
  get(id: string): Promise<ProjectRow | null>;
  /** Inserts a draft at `slug`. The caller builds the document with `defaults.ts`. */
  create(draft: Project, slug: string): Promise<ProjectRow>;
  save(id: string, draft: Project, seenVersion: number): Promise<SaveResult<ProjectRow>>;
  /** Writes the draft address. Fails with "taken" when another row (or a redirect) uses it. */
  setSlug(
    id: string,
    slug: string,
    seenVersion: number,
  ): Promise<SaveResult<ProjectRow> | { ok: false; reason: "taken"; by: string }>;
  /** Who uses `slug`, if anyone (live address, draft address or redirect), for "Already used by". */
  slugOwner(slug: string, exceptId?: string): Promise<{ id: string; title: string } | null>;
}

export interface PostsPort {
  list(): Promise<PostRow[]>;
  get(id: string): Promise<PostRow | null>;
  create(draft: Post, slug: string): Promise<PostRow>;
  save(id: string, draft: Post, seenVersion: number): Promise<SaveResult<PostRow>>;
  setSlug(
    id: string,
    slug: string,
    seenVersion: number,
  ): Promise<SaveResult<PostRow> | { ok: false; reason: "taken"; by: string }>;
  slugOwner(slug: string, exceptId?: string): Promise<{ id: string; title: string } | null>;
}

export interface UploadInput {
  file: Blob;
  filename: string;
  kind: "image" | "document";
  mime: string;
  width?: number;
  height?: number;
  dominant?: string;
}

export interface MediaPort {
  list(): Promise<MediaRow[]>;
  /** Runs the upload pipeline (06 · Storage) and inserts the row. `onProgress` gets 0–1. */
  upload(input: UploadInput, onProgress?: (fraction: number) => void): Promise<MediaRow>;
  update(
    id: string,
    patch: Partial<Pick<MediaRow, "alt" | "decorative" | "focal" | "filename">>,
  ): Promise<MediaRow>;
  /** Uploads a new revision under the same id and bumps `rev` (D41). */
  replace(id: string, input: UploadInput): Promise<MediaRow>;
  /**
   * Makes (or remakes) `og.jpg`, the 1200×630 crop around the focal point: when an image becomes
   * a cover, and again whenever its focal point moves (06 · Storage, step 5).
   */
  makeOg(id: string): Promise<MediaRow>;
  /** Refuses (returns the uses) while any draft or published document uses it. */
  remove(id: string): Promise<{ ok: true } | { ok: false; uses: MediaUse[] }>;
  uses(id: string): Promise<MediaUse[]>;
  /** A URL Studio can show: a signed URL (1 hour) in Supabase, an object URL in memory. */
  url(row: MediaRow, variant?: "480" | "960" | "1600" | "orig"): Promise<string>;
  /** Bytes used in the storage quota, shared with lumina (05 · Media › Storage meter). */
  storageUsed(): Promise<{ used: number; quota: number }>;
}

export interface PreviewsPort {
  /** `pm-preview` POST: the URL holding the token, shown once. */
  create(kind: PublishKind, id?: string): Promise<{ url: string; link: PreviewLink }>;
  list(kind: PublishKind, id?: string): Promise<PreviewLink[]>;
  revoke(tokenHash: string): Promise<void>;
}

export interface StudioRepo {
  auth: AuthPort;
  profile: SingletonPort<Profile, ProfilePublished>;
  layout: SingletonPort<SiteLayout>;
  projects: ProjectsPort;
  posts: PostsPort;
  media: MediaPort;
  previews: PreviewsPort;
  /** `pm.topic_counts(kind)`. */
  topics(kind: "post" | "project"): Promise<{ topic: string; uses: number }[]>;
  /** `pm-publish`. */
  publish(request: PublishRequest): Promise<PublishResult>;
  /** `pm-check-link`. */
  checkLink(
    url: string,
    kind: "video" | "prototype" | "prd",
  ): Promise<{ status: LinkStatus; detail?: string }>;
  /** The latest `pm.link_checks` rows, for the dashboard's failed link checks. */
  linkChecks(): Promise<{ url: string; status: LinkStatus; detail: string | null; checkedAt: string }[]>;
}
