/**
 * The in-memory `StudioRepo`: every Studio screen works against it until the Supabase repo (M3)
 * exists, and tests use it with a fixed clock. It's seeded from the V0 documents (07), with the
 * five live projects published and the SugarFit drafts as drafts, exactly as `npm run seed:v0`
 * will leave the `pm` schema.
 *
 * It behaves like the database where Studio can tell: versions and conflicts, unique slugs,
 * soft deletes, the publish checks, and preview links that are listed by hash only. It never
 * leaves the browser and is never used in a production build (see `client.ts`).
 */
import { ACCENT_COLOURS } from "../accents";
import { publishPost } from "./publish-post";
import { publishProfile, publishProject, type Img, type ResolveImg } from "../published";
import {
  Post as PostSchema,
  Profile as ProfileSchema,
  Project as ProjectSchema,
  SiteLayout as LayoutSchema,
} from "../schemas";
import type { Post, Profile, Project, SiteLayout } from "../types";
import type { V0Documents } from "../v0";
import { postIssues, projectIssues, siteNeedsConfirm } from "./checks";
import type {
  AuthPort,
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

/** The code the in-memory auth accepts. Real codes come from Supabase Auth (06 · Auth). */
export const MEMORY_CODE = "123456";
/** The address the in-memory auth treats as the owner. Never the real sign-in address. */
export const MEMORY_OWNER = "owner@example.test";
const CODE_TTL = 10 * 60_000;

export interface MemoryOptions {
  /** The clock, so tests can move time. */
  now?: () => number;
  /** Simulated network latency in ms (0 in tests). */
  latency?: number;
  owner?: string;
  /** Starts signed in, as the owner. */
  signedIn?: boolean;
}

const clone = <T>(value: T): T => structuredClone(value);

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export class MemoryRepo implements StudioRepo {
  private readonly now: () => number;
  private readonly latency: number;
  private readonly owner: string;

  private profileRow: DocRow<Profile, ReturnType<typeof publishProfile>>;
  private layoutRow: DocRow<SiteLayout>;
  private readonly projectRows = new Map<string, ProjectRow>();
  private readonly postRows = new Map<string, PostRow>();
  private readonly mediaRows = new Map<string, MediaRow>();
  private readonly mediaUrls = new Map<string, string>();
  private readonly redirects = new Map<string, string>();
  private readonly previewRows: (PreviewLink & { kind: string; id?: string | undefined })[] = [];
  private readonly checks = new Map<
    string,
    { status: LinkStatus; detail: string | null; checkedAt: string }
  >();
  private session: Session | null;
  private readonly listeners = new Set<(s: Session | null) => void>();
  /** Set by tests and the dev toolbar to simulate a dropped connection. */
  offline = false;
  /** Makes the next save fail once, for the "Couldn't save" state. */
  failNextSave = false;

  constructor(v0: V0Documents, options: MemoryOptions = {}) {
    this.now = options.now ?? (() => Date.now());
    this.latency = options.latency ?? 0;
    this.owner = options.owner ?? MEMORY_OWNER;
    this.session = options.signedIn ? { email: this.owner, userId: "owner" } : null;
    const at = this.iso();

    for (const cover of v0.covers) {
      const id = `cover-${cover.slug}`;
      this.mediaRows.set(id, {
        id,
        rev: 1,
        key: `${id}/r1`,
        kind: "image",
        mime: "image/webp",
        bytes: 0,
        width: 1600,
        height: 1000,
        focal: { x: 0.5, y: 0.5 },
        alt: cover.alt,
        decorative: false,
        dominant: null,
        filename: `${cover.slug}.webp`,
        published: true,
        createdAt: at,
      });
      this.mediaUrls.set(id, `/media/v0/${cover.slug}.webp`);
    }

    const resolve = this.resolver();
    for (const p of v0.projects) {
      const id = p.slug;
      this.projectRows.set(id, {
        id,
        slug: p.slug,
        publishedSlug: p.publish ? p.slug : null,
        visibility: "public",
        indexAllowed: true,
        draft: clone(p.document),
        published: p.publish ? publishProject(p.document, resolve) : null,
        publishedAt: p.publish ? at : null,
        firstPublishedAt: p.publish ? at : null,
        version: 1,
        updatedAt: at,
        deletedAt: null,
      });
    }
    this.profileRow = {
      draft: clone(v0.profile),
      published: publishProfile(v0.profile, resolve),
      publishedAt: at,
      version: 1,
      updatedAt: at,
    };
    this.layoutRow = {
      draft: clone(v0.layout),
      published: clone(v0.layout),
      publishedAt: at,
      version: 1,
      updatedAt: at,
    };
  }

  // -------------------------------------------------------------------------------------------
  // Plumbing
  // -------------------------------------------------------------------------------------------

  private iso(): string {
    return new Date(this.now()).toISOString();
  }

  private async tick(): Promise<void> {
    if (this.latency > 0) await new Promise((r) => setTimeout(r, this.latency));
  }

  private async net(): Promise<boolean> {
    await this.tick();
    return !this.offline;
  }

  private resolver(): ResolveImg {
    return (ref) => {
      const row = this.mediaRows.get(ref.mediaId);
      if (!row || row.kind !== "image") return undefined;
      return this.img(row);
    };
  }

  /** A media row as an `Img`, for previews rendered with the public components. */
  img(row: MediaRow): Img {
    const src = this.mediaUrls.get(row.id) ?? "";
    const width = row.width ?? 1600;
    const height = row.height ?? 1000;
    return {
      src,
      srcset: `${src} ${width}w`,
      width,
      height,
      alt: row.decorative ? "" : (row.alt ?? ""),
      dominant: row.dominant ?? ACCENT_COLOURS.slate.ground,
      ...(row.focal ? { focal: row.focal } : {}),
    };
  }

  private bump<R extends { version: number; updatedAt: string }>(row: R): R {
    row.version += 1;
    row.updatedAt = this.iso();
    return row;
  }

  private async saveRow<R extends { version: number; updatedAt: string; draft: unknown }>(
    row: R | undefined,
    draft: R["draft"],
    seen: number,
    validate: (d: unknown) => unknown,
  ): Promise<SaveResult<R>> {
    if (!(await this.net())) return { ok: false, reason: "offline" };
    if (this.failNextSave) {
      this.failNextSave = false;
      return { ok: false, reason: "error", message: "The save didn't reach the database." };
    }
    if (!row) return { ok: false, reason: "error", message: "Not found." };
    if (row.version !== seen) return { ok: false, reason: "conflict", latest: clone(row) };
    validate(draft);
    row.draft = clone(draft);
    return { ok: true, row: clone(this.bump(row)) };
  }

  /** Every address in use: draft slugs, live slugs and redirects, for one kind. */
  private slugUser(
    kind: "work" | "writing",
    slug: string,
    exceptId?: string,
  ): { id: string; title: string } | null {
    const rows = kind === "work" ? [...this.projectRows.values()] : [...this.postRows.values()];
    for (const r of rows) {
      if (r.id === exceptId || r.deletedAt) continue;
      if (r.slug === slug || r.publishedSlug === slug) {
        const title = "overview" in r.draft ? r.draft.overview.title : r.draft.title;
        return { id: r.id, title: title || "Untitled" };
      }
    }
    const target = this.redirects.get(`/${kind}/${slug}`);
    if (target && target !== exceptId) {
      const r = kind === "work" ? this.projectRows.get(target) : this.postRows.get(target);
      if (r) {
        const title = "overview" in r.draft ? r.draft.overview.title : r.draft.title;
        return { id: r.id, title: title || "Untitled" };
      }
    }
    return null;
  }

  // -------------------------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------------------------

  readonly auth: AuthPort = {
    session: async () => {
      await this.tick();
      return this.session ? { ...this.session } : null;
    },
    sendCode: async (_email): Promise<SendCodeResult> => {
      if (!(await this.net())) return "offline";
      return "sent";
    },
    checkCode: async (email, code, sentAt): Promise<CheckCodeResult> => {
      if (!(await this.net())) return "offline";
      if (code !== MEMORY_CODE) return this.now() - sentAt > CODE_TTL ? "expired" : "wrong";
      if (this.now() - sentAt > CODE_TTL) return "expired";
      if (email.trim().toLowerCase() !== this.owner) return "not-owner";
      this.setSession({ email: this.owner, userId: "owner" });
      return "signed-in";
    },
    signOut: async () => {
      await this.tick();
      this.setSession(null);
    },
    onChange: (listener) => {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    },
  };

  /** Ends or starts the session, as a revocation elsewhere would. */
  setSession(session: Session | null): void {
    this.session = session;
    for (const l of this.listeners) l(session ? { ...session } : null);
  }

  // -------------------------------------------------------------------------------------------
  // Documents
  // -------------------------------------------------------------------------------------------

  readonly profile = {
    get: async () => {
      await this.tick();
      return clone(this.profileRow);
    },
    save: (draft: Profile, seen: number) =>
      this.saveRow(this.profileRow, draft, seen, (d) => ProfileSchema.parse(d)),
  };

  readonly layout = {
    get: async () => {
      await this.tick();
      return clone(this.layoutRow);
    },
    save: (draft: SiteLayout, seen: number) =>
      this.saveRow(this.layoutRow, draft, seen, (d) => LayoutSchema.parse(d)),
  };

  readonly projects = {
    list: async () => {
      await this.tick();
      return [...this.projectRows.values()].filter((r) => !r.deletedAt).map(clone);
    },
    get: async (id: string) => {
      await this.tick();
      const row = this.projectRows.get(id);
      return row && !row.deletedAt ? clone(row) : null;
    },
    create: async (draft: Project, slug: string) => {
      await this.tick();
      ProjectSchema.parse(draft);
      const at = this.iso();
      const row: ProjectRow = {
        id: crypto.randomUUID(),
        slug,
        publishedSlug: null,
        visibility: "public",
        indexAllowed: true,
        draft: clone(draft),
        published: null,
        publishedAt: null,
        firstPublishedAt: null,
        version: 1,
        updatedAt: at,
        deletedAt: null,
      };
      this.projectRows.set(row.id, row);
      return clone(row);
    },
    save: (id: string, draft: Project, seen: number) =>
      this.saveRow(this.projectRows.get(id), draft, seen, (d) => ProjectSchema.parse(d)),
    setSlug: async (id: string, slug: string, seen: number) => {
      if (!(await this.net())) return { ok: false as const, reason: "offline" as const };
      const row = this.projectRows.get(id);
      if (!row) return { ok: false as const, reason: "error" as const };
      const by = this.slugUser("work", slug, id);
      if (by) return { ok: false as const, reason: "taken" as const, by: by.title };
      if (row.version !== seen)
        return { ok: false as const, reason: "conflict" as const, latest: clone(row) };
      row.slug = slug;
      return { ok: true as const, row: clone(this.bump(row)) };
    },
    slugOwner: async (slug: string, exceptId?: string) => {
      await this.tick();
      return this.slugUser("work", slug, exceptId);
    },
  };

  readonly posts = {
    list: async () => {
      await this.tick();
      return [...this.postRows.values()].filter((r) => !r.deletedAt).map(clone);
    },
    get: async (id: string) => {
      await this.tick();
      const row = this.postRows.get(id);
      return row && !row.deletedAt ? clone(row) : null;
    },
    create: async (draft: Post, slug: string) => {
      await this.tick();
      PostSchema.parse(draft);
      const row: PostRow = {
        id: crypto.randomUUID(),
        slug,
        publishedSlug: null,
        draft: clone(draft),
        published: null,
        publishedAt: null,
        scheduledFor: null,
        scheduleError: null,
        version: 1,
        updatedAt: this.iso(),
        deletedAt: null,
      };
      this.postRows.set(row.id, row);
      return clone(row);
    },
    save: (id: string, draft: Post, seen: number) =>
      this.saveRow(this.postRows.get(id), draft, seen, (d) => PostSchema.parse(d)),
    setSlug: async (id: string, slug: string, seen: number) => {
      if (!(await this.net())) return { ok: false as const, reason: "offline" as const };
      const row = this.postRows.get(id);
      if (!row) return { ok: false as const, reason: "error" as const };
      const by = this.slugUser("writing", slug, id);
      if (by) return { ok: false as const, reason: "taken" as const, by: by.title };
      if (row.version !== seen)
        return { ok: false as const, reason: "conflict" as const, latest: clone(row) };
      row.slug = slug;
      return { ok: true as const, row: clone(this.bump(row)) };
    },
    slugOwner: async (slug: string, exceptId?: string) => {
      await this.tick();
      return this.slugUser("writing", slug, exceptId);
    },
  };

  // -------------------------------------------------------------------------------------------
  // Media
  // -------------------------------------------------------------------------------------------

  private documents() {
    return {
      profile: this.profileRow.draft,
      projects: [...this.projectRows.values()].filter((r) => !r.deletedAt),
      posts: [...this.postRows.values()].filter((r) => !r.deletedAt),
    };
  }

  readonly media = {
    list: async () => {
      await this.tick();
      return [...this.mediaRows.values()].map(clone).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    upload: async (input: UploadInput, onProgress?: (f: number) => void) => {
      if (!(await this.net())) throw new Error("offline");
      onProgress?.(1);
      const id = crypto.randomUUID();
      const row: MediaRow = {
        id,
        rev: 1,
        key: `${id}/r1`,
        kind: input.kind,
        mime: input.mime,
        bytes: input.file.size,
        width: input.width ?? null,
        height: input.height ?? null,
        focal: input.kind === "image" ? { x: 0.5, y: 0.5 } : null,
        alt: null,
        decorative: false,
        dominant: input.dominant ?? null,
        filename: input.filename,
        published: false,
        createdAt: this.iso(),
      };
      this.mediaRows.set(id, row);
      if (typeof URL.createObjectURL === "function") this.mediaUrls.set(id, URL.createObjectURL(input.file));
      return clone(row);
    },
    update: async (
      id: string,
      patch: Partial<Pick<MediaRow, "alt" | "decorative" | "focal" | "filename">>,
    ) => {
      await this.tick();
      const row = this.mediaRows.get(id);
      if (!row) throw new Error("Not found.");
      Object.assign(row, patch);
      return clone(row);
    },
    replace: async (id: string, input: UploadInput) => {
      await this.tick();
      const row = this.mediaRows.get(id);
      if (!row) throw new Error("Not found.");
      row.rev += 1;
      row.key = `${id}/r${row.rev}`;
      row.bytes = input.file.size;
      row.mime = input.mime;
      row.width = input.width ?? row.width;
      row.height = input.height ?? row.height;
      row.filename = input.filename;
      if (typeof URL.createObjectURL === "function") this.mediaUrls.set(id, URL.createObjectURL(input.file));
      return clone(row);
    },
    remove: async (id: string): Promise<{ ok: true } | { ok: false; uses: MediaUse[] }> => {
      await this.tick();
      const uses = mediaUses(id, this.documents());
      if (uses.length > 0) return { ok: false, uses };
      this.mediaRows.delete(id);
      return { ok: true };
    },
    uses: async (id: string) => {
      await this.tick();
      return mediaUses(id, this.documents());
    },
    url: async (row: MediaRow) => {
      await this.tick();
      return this.mediaUrls.get(row.id) ?? "";
    },
    storageUsed: async () => {
      await this.tick();
      let used = 0;
      for (const r of this.mediaRows.values()) used += r.bytes;
      return { used, quota: 1024 ** 3 };
    },
  };

  // -------------------------------------------------------------------------------------------
  // Previews, topics, links
  // -------------------------------------------------------------------------------------------

  readonly previews = {
    create: async (kind: "site" | "project" | "post", id?: string) => {
      if (!(await this.net())) throw new Error("offline");
      const token = crypto.getRandomValues(new Uint8Array(32));
      const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", token));
      const created = this.now();
      const link: PreviewLink = {
        tokenHash: hex(digest),
        createdAt: new Date(created).toISOString(),
        expiresAt: new Date(created + 7 * 86_400_000).toISOString(),
        revokedAt: null,
      };
      this.previewRows.push({ ...link, kind, id });
      const b64 = btoa(String.fromCharCode(...token))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      return { url: `${typeof location === "undefined" ? "" : location.origin}/preview/${b64}`, link };
    },
    list: async (kind: "site" | "project" | "post", id?: string) => {
      await this.tick();
      const now = this.now();
      return this.previewRows
        .filter((p) => p.kind === kind && p.id === id && !p.revokedAt && Date.parse(p.expiresAt) > now)
        .map(({ tokenHash, createdAt, expiresAt, revokedAt }) => ({
          tokenHash,
          createdAt,
          expiresAt,
          revokedAt,
        }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    revoke: async (tokenHash: string) => {
      await this.tick();
      const row = this.previewRows.find((p) => p.tokenHash === tokenHash);
      if (row) row.revokedAt = this.iso();
    },
  };

  async topics(kind: "post" | "project") {
    await this.tick();
    const counts = new Map<string, { topic: string; uses: number }>();
    const lists =
      kind === "post"
        ? [...this.postRows.values()].filter((r) => !r.deletedAt).map((r) => r.draft.topics)
        : [...this.projectRows.values()].filter((r) => !r.deletedAt).map((r) => r.draft.overview.topics);
    for (const list of lists)
      for (const t of list) {
        const key = t.toLowerCase();
        const entry = counts.get(key);
        if (entry) entry.uses += 1;
        else counts.set(key, { topic: t, uses: 1 });
      }
    return [...counts.values()].sort((a, b) => a.topic.toLowerCase().localeCompare(b.topic.toLowerCase()));
  }

  async checkLink(url: string, kind: "video" | "prototype" | "prd") {
    await this.tick();
    let status: LinkStatus = "ok";
    let detail: string | undefined;
    if (!url.startsWith("https://")) status = "error";
    else if (kind === "prototype" && /\.vercel\.app\b/.test(url) && /-git-|-[a-z0-9]{9}-/.test(url))
      status = "login";
    else if (kind === "prototype" && /figma\.com/.test(url)) detail = "figma";
    this.checks.set(url, { status, detail: detail ?? null, checkedAt: this.iso() });
    return detail ? { status, detail } : { status };
  }

  /** Records a link check result, as the nightly cron would. */
  setLinkCheck(url: string, status: LinkStatus, detail: string | null = null): void {
    this.checks.set(url, { status, detail, checkedAt: this.iso() });
  }

  async linkChecks() {
    await this.tick();
    return [...this.checks.entries()].map(([url, c]) => ({ url, ...c }));
  }

  // -------------------------------------------------------------------------------------------
  // Publishing (pm-publish)
  // -------------------------------------------------------------------------------------------

  async publish(req: PublishRequest): Promise<PublishResult> {
    if (!(await this.net())) return { ok: false, reason: "offline" };
    const at = this.iso();
    const resolve = this.resolver();

    if (req.kind === "site") {
      const unconfirmed = siteNeedsConfirm(this.profileRow.draft, this.layoutRow.draft);
      if (unconfirmed.length > 0 && !req.confirmUnconfirmed)
        return { ok: false, reason: "needs-confirm", unconfirmed };
      this.profileRow.published = publishProfile(this.profileRow.draft, resolve);
      this.profileRow.publishedAt = at;
      this.layoutRow.published = clone(this.layoutRow.draft);
      this.layoutRow.publishedAt = at;
      return { ok: true, publishedAt: at, deployed: true };
    }

    if (req.kind === "project") {
      const row = req.id ? this.projectRows.get(req.id) : undefined;
      if (!row) return { ok: false, reason: "error", message: "Not found." };
      switch (req.action) {
        case "publish": {
          const issues = projectIssues(row.draft, { slug: row.slug, media: (id) => this.mediaRows.get(id) });
          if (issues.length > 0) return { ok: false, reason: "blocked", issues };
          if (row.publishedSlug && row.publishedSlug !== row.slug && row.draft.settings.redirectOldSlug)
            this.redirects.set(`/work/${row.publishedSlug}`, row.id);
          row.published = publishProject(row.draft, resolve);
          row.publishedSlug = row.slug;
          row.publishedAt = at;
          row.firstPublishedAt ??= at;
          if (!row.draft.settings.redirectOldSlug && row.firstPublishedAt === at) {
            row.draft.settings.redirectOldSlug = true;
          }
          row.updatedAt = at;
          return { ok: true, publishedAt: at, deployed: true };
        }
        case "unpublish":
          row.published = null;
          row.publishedAt = null;
          return { ok: true, publishedAt: at, deployed: true };
        case "delete":
          row.deletedAt = at;
          return { ok: true, publishedAt: at, deployed: true };
        case "restore":
          row.deletedAt = null;
          return { ok: true, publishedAt: at, deployed: true };
        case "settings":
          if (req.visibility) row.visibility = req.visibility;
          if (req.indexAllowed !== undefined) row.indexAllowed = req.indexAllowed;
          return { ok: true, publishedAt: at, deployed: true };
      }
    }

    const row = req.id ? this.postRows.get(req.id) : undefined;
    if (!row) return { ok: false, reason: "error", message: "Not found." };
    switch (req.action) {
      case "publish": {
        const issues = postIssues(row.draft, { media: (id) => this.mediaRows.get(id) });
        if (issues.length > 0) return { ok: false, reason: "blocked", issues };
        if (req.scheduleFor !== undefined) {
          row.scheduledFor = req.scheduleFor;
          row.scheduleError = null;
          return { ok: true, publishedAt: at, deployed: false };
        }
        if (row.publishedSlug && row.publishedSlug !== row.slug)
          this.redirects.set(`/writing/${row.publishedSlug}`, row.id);
        row.published = publishPost(row.draft, resolve, at);
        row.publishedSlug = row.slug;
        row.publishedAt ??= at;
        row.scheduledFor = null;
        row.updatedAt = at;
        return { ok: true, publishedAt: at, deployed: true };
      }
      case "unpublish":
        row.published = null;
        row.scheduledFor = null;
        return { ok: true, publishedAt: at, deployed: true };
      case "delete":
        row.deletedAt = at;
        return { ok: true, publishedAt: at, deployed: true };
      case "restore":
        row.deletedAt = null;
        return { ok: true, publishedAt: at, deployed: true };
      default:
        return { ok: false, reason: "error", message: "Not supported for posts." };
    }
  }

  /** Hard delete: URL & SEO's "Delete forever". */
  purgeProject(id: string): void {
    this.projectRows.delete(id);
  }
}
