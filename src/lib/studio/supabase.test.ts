import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as Pipeline from "./media-pipeline";
import type { PipelineResult } from "./media-pipeline";
import { must, testRepo } from "./test-helpers";

// ---- a small in-memory stand-in for supabase-js: tables, filters, auth, storage, rpc.
type Row = Record<string, unknown>;
const db: Record<string, Row[]> = {};
const files = new Map<string, Blob>();
const auth = {
  session: null as null | { user: { id: string; email: string }; access_token: string },
  owner: true,
  otpError: null as null | { status?: number; code?: string; message: string; name?: string },
  verifyError: null as null | { status?: number; code?: string; message: string; name?: string },
  listeners: [] as ((e: string, s: unknown) => void)[],
};
let failNext: { message: string } | null = null;

class Query implements PromiseLike<{ data: unknown; error: unknown }> {
  private filters: ((r: Row) => boolean)[] = [];
  private op: "select" | "update" | "insert" | "delete" = "select";
  private patch: Row = {};
  private mode: "many" | "single" | "maybe" = "many";
  constructor(private table: string) {}
  select() {
    return this;
  }
  order() {
    return this;
  }
  eq(col: string, v: unknown) {
    this.filters.push((r) => r[col] === v);
    return this;
  }
  is(col: string, v: unknown) {
    this.filters.push((r) => (r[col] ?? null) === v);
    return this;
  }
  or(expr: string) {
    const parts = expr.split(",").map((p) => p.split(".eq."));
    this.filters.push((r) => parts.some(([c, v]) => r[c ?? ""] === v));
    return this;
  }
  update(patch: Row) {
    this.op = "update";
    this.patch = patch;
    return this;
  }
  insert(row: Row) {
    this.op = "insert";
    this.patch = row;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  single() {
    this.mode = "single";
    return this;
  }
  maybeSingle() {
    this.mode = "maybe";
    return this;
  }
  private run(): { data: unknown; error: unknown } {
    if (failNext) {
      const error = failNext;
      failNext = null;
      return { data: null, error };
    }
    const rows = (db[this.table] ??= []);
    let out: Row[];
    if (this.op === "insert") {
      const row = {
        id: crypto.randomUUID(),
        version: 1,
        updated_at: "2026-10-15T00:00:00Z",
        deleted_at: null,
        published: null,
        published_at: null,
        created_at: "2026-10-15T00:00:00Z",
        ...this.patch,
      };
      rows.push(row);
      out = [row];
    } else {
      const hit = rows.filter((r) => this.filters.every((f) => f(r)));
      if (this.op === "update") hit.forEach((r) => Object.assign(r, this.patch));
      if (this.op === "delete") db[this.table] = rows.filter((r) => !hit.includes(r));
      out = hit;
    }
    if (this.mode === "many") return { data: out.map((r) => ({ ...r })), error: null };
    const first = out[0];
    if (this.mode === "single" && !first) return { data: null, error: { message: "No rows" } };
    return { data: first ? { ...first } : null, error: null };
  }
  then<A, B>(
    ok?: ((v: { data: unknown; error: unknown }) => A | PromiseLike<A>) | null,
    no?: ((e: unknown) => B | PromiseLike<B>) | null,
  ) {
    return Promise.resolve(this.run()).then(ok, no);
  }
}

const fake = {
  from: (t: string) => new Query(t),
  rpc: (name: string, args?: { kind?: string }) => {
    if (name === "is_owner") return Promise.resolve({ data: auth.owner, error: null });
    if (name === "topic_counts")
      return Promise.resolve({ data: [{ topic: `t-${args?.kind ?? ""}`, uses: 2 }], error: null });
    return Promise.resolve({ data: null, error: { message: "nope" } });
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: auth.session } }),
    signInWithOtp: () => Promise.resolve({ error: auth.otpError }),
    verifyOtp: () => {
      if (!auth.verifyError)
        auth.session = { user: { id: "u1", email: "owner@example.test" }, access_token: "tok" };
      return Promise.resolve({ error: auth.verifyError });
    },
    signOut: () => {
      auth.session = null;
      return Promise.resolve({ error: null });
    },
    onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
      auth.listeners.push(cb);
      return {
        data: {
          subscription: { unsubscribe: () => (auth.listeners = auth.listeners.filter((l) => l !== cb)) },
        },
      };
    },
  },
  storage: {
    from: () => ({
      upload: (path: string, blob: Blob) => {
        files.set(path, blob);
        return Promise.resolve({ error: null });
      },
      download: (path: string) => {
        const blob = files.get(path);
        return Promise.resolve(
          blob ? { data: blob, error: null } : { data: null, error: { message: "Object not found" } },
        );
      },
      createSignedUrl: (path: string) =>
        Promise.resolve({ data: { signedUrl: `https://signed.example/${path}` }, error: null }),
    }),
  },
};

vi.mock("@supabase/supabase-js", () => ({ createClient: () => fake }));

// tus-js-client: records each upload and plays back what the test asks for.
const tus = {
  mode: "ok" as "ok" | "offline-once" | "fail",
  previous: false,
  started: 0,
  resumed: 0,
  options: [] as {
    endpoint?: string;
    chunkSize?: number;
    headers?: Record<string, string>;
    metadata?: Record<string, string>;
  }[],
};
vi.mock("tus-js-client", () => ({
  Upload: class {
    private failedOnce = false;
    constructor(
      private file: Blob,
      private o: {
        endpoint?: string;
        chunkSize?: number;
        headers?: Record<string, string>;
        metadata: Record<string, string>;
        onProgress?: (sent: number, total: number) => void;
        onSuccess?: () => void;
        onError?: (e: Error) => void;
      },
    ) {
      tus.options.push(o);
    }
    findPreviousUploads() {
      return Promise.resolve(tus.previous ? [{ uploadUrl: "u" }] : []);
    }
    resumeFromPreviousUpload() {
      tus.resumed++;
    }
    start() {
      tus.started++;
      if (tus.mode === "fail") {
        this.o.onError?.(new Error("tus: unexpected response 413"));
        return;
      }
      if (tus.mode === "offline-once" && !this.failedOnce) {
        this.failedOnce = true;
        this.o.onError?.(new Error("tus: failed to fetch"));
        return;
      }
      this.o.onProgress?.(this.file.size, this.file.size);
      files.set(this.o.metadata.objectName ?? "", this.file);
      this.o.onSuccess?.();
    }
  },
}));
vi.mock("./media-pipeline", async (orig) => {
  const real = await orig<typeof Pipeline>();
  return {
    ...real,
    cropOg: () => Promise.resolve(new Blob(["og"], { type: "image/jpeg" })),
    runPipeline: (file: Blob, mime: string): Promise<PipelineResult> =>
      Promise.resolve(
        mime === "application/pdf"
          ? {
              kind: "document",
              mime: "application/pdf",
              bytes: file.size,
              width: null,
              height: null,
              variants: [],
              dominant: null,
              files: [{ name: "orig.pdf", blob: file, type: mime }],
            }
          : {
              kind: "image",
              mime: "image/jpeg",
              bytes: file.size,
              width: 1200,
              height: 800,
              variants: [480, 960, 1200],
              dominant: "#112233",
              files: [
                { name: "480.webp", blob: file, type: "image/webp" },
                { name: "orig.jpg", blob: file, type: "image/jpeg" },
              ],
            },
      ),
  };
});

const { supabaseRepo } = await import("./supabase");

async function seed() {
  const { repo } = testRepo();
  const [p, l, ps] = await Promise.all([repo.profile.get(), repo.layout.get(), repo.projects.list()]);
  for (const k of Object.keys(db)) Reflect.deleteProperty(db, k);
  files.clear();
  db.profile = [
    {
      id: 1,
      draft: p.draft,
      published: p.published,
      published_at: p.publishedAt,
      version: 3,
      updated_at: "x",
    },
  ];
  db.site_layout = [
    {
      id: 1,
      draft: l.draft,
      published: l.published,
      published_at: l.publishedAt,
      version: 1,
      updated_at: "x",
    },
  ];
  db.projects = ps.slice(0, 3).map((r) => ({
    id: r.id,
    slug: r.slug,
    published_slug: r.publishedSlug,
    visibility: r.visibility,
    index_allowed: r.indexAllowed,
    draft: r.draft,
    published: r.published,
    published_at: r.publishedAt,
    first_published_at: r.firstPublishedAt,
    version: 1,
    updated_at: "x",
    deleted_at: null,
  }));
  db.posts = [];
  db.media = [];
  db.slug_redirects = [{ old_path: "/work/old-arcana", project_id: must(ps[2]).id, post_id: null }];
  db.preview_links = [
    {
      token_hash: "a".repeat(64),
      kind: "project",
      project_id: must(ps[0]).id,
      post_id: null,
      created_at: "c",
      expires_at: "e",
      revoked_at: null,
    },
  ];
  db.link_checks = [{ url: "https://x.example", status: "gone", detail: "404", checked_at: "t" }];
  auth.session = { user: { id: "u1", email: "owner@example.test" }, access_token: "tok" };
  auth.owner = true;
  auth.otpError = null;
  auth.verifyError = null;
  return supabaseRepo("https://project.example", "anon-key");
}

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});
const reply = (status: number, body?: unknown) =>
  Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe("supabaseRepo", () => {
  it("signs in by code, checks the owner, and follows the session", async () => {
    const repo = await seed();
    expect(await repo.auth.session()).toEqual({ email: "owner@example.test", userId: "u1" });
    expect(await repo.auth.sendCode(" Owner@Example.test ", "cap")).toBe("sent");
    auth.otpError = { message: "Signups not allowed for otp", code: "otp_disabled" };
    expect(await repo.auth.sendCode("nobody@example.test")).toBe("sent");
    auth.otpError = { message: "Too many", status: 429 };
    expect(await repo.auth.sendCode("x@example.test")).toBe("rate");
    auth.otpError = { message: "captcha protection: request disallowed", code: "captcha_failed" };
    expect(await repo.auth.sendCode("x@example.test")).toBe("captcha");
    auth.otpError = { message: "Failed to fetch", name: "AuthRetryableFetchError" };
    expect(await repo.auth.sendCode("x@example.test")).toBe("offline");
    auth.otpError = { message: "weird" };
    expect(await repo.auth.sendCode("x@example.test")).toBe("unknown");

    auth.session = null;
    expect(await repo.auth.session()).toBeNull();
    expect(await repo.auth.checkCode("owner@example.test", "12345678", Date.now(), "cap")).toBe("signed-in");
    auth.verifyError = { message: "Token has expired or is invalid", code: "otp_expired" };
    expect(await repo.auth.checkCode("owner@example.test", "1", Date.now())).toBe("wrong");
    expect(await repo.auth.checkCode("owner@example.test", "1", Date.now() - 11 * 60_000)).toBe("expired");
    auth.verifyError = { message: "slow down", status: 429 };
    expect(await repo.auth.checkCode("owner@example.test", "1", Date.now())).toBe("rate");
    auth.verifyError = null;
    auth.owner = false;
    expect(await repo.auth.checkCode("someone@example.test", "1", Date.now())).toBe("not-owner");
    expect(auth.session).toBeNull();
    auth.session = { user: { id: "u2", email: "someone@example.test" }, access_token: "t" };
    expect(await repo.auth.session()).toBeNull();

    const seen: unknown[] = [];
    const off = repo.auth.onChange((s) => seen.push(s));
    for (const l of auth.listeners) {
      l("INITIAL_SESSION", null);
      l("SIGNED_IN", { user: { id: "u1", email: "owner@example.test" } });
      l("SIGNED_OUT", null);
      l("PASSWORD_RECOVERY", { user: { id: "u1" } });
    }
    expect(seen).toEqual([{ email: "owner@example.test", userId: "u1" }, null]);
    off();
    expect(auth.listeners).toHaveLength(0);
    await repo.auth.signOut("global");
  });

  it("reads and autosaves documents with the version check", async () => {
    const repo = await seed();
    const p = await repo.profile.get();
    expect(p.version).toBe(3);
    const saved = await repo.profile.save({ ...p.draft, name: "New" }, 3);
    expect(saved.ok && saved.row.version).toBe(4);
    const stale = await repo.profile.save(p.draft, 3);
    expect(stale.ok ? null : stale.reason).toBe("conflict");
    const lay = (await repo.layout.get()).draft;
    failNext = { message: "Failed to fetch" };
    const off = await repo.layout.save(lay, 1);
    expect(off.ok ? null : off.reason).toBe("offline");
    failNext = { message: "permission denied" };
    const err = await repo.layout.save(lay, 1);
    expect(err).toEqual({ ok: false, reason: "error", message: "permission denied" });

    const list = await repo.projects.list();
    expect(list).toHaveLength(3);
    const first = must(list[0]);
    expect(await repo.projects.get(first.id)).toMatchObject({ id: first.id, slug: first.slug });
    expect(await repo.projects.get("nope")).toBeNull();
    const ok = await repo.projects.save(first.id, first.draft, 1);
    expect(ok.ok).toBe(true);
    expect((await repo.projects.save(first.id, first.draft, 1)).ok).toBe(false);
    expect(await repo.projects.save("nope", first.draft, 1)).toEqual({
      ok: false,
      reason: "error",
      message: "Not found.",
    });

    // Addresses: another project's, a redirect, or free.
    const second = must(list[1]);
    expect(await repo.projects.slugOwner(second.slug, first.id)).toMatchObject({ id: second.id });
    expect(await repo.projects.slugOwner("old-arcana")).toMatchObject({ title: "an earlier address" });
    expect(await repo.projects.slugOwner("free-one")).toBeNull();
    // Never into the filter: "a,id.neq.x" would widen the query.
    expect(await repo.projects.slugOwner("a,id.neq.x")).toEqual({ id: "", title: "an invalid address" });
    expect(await repo.projects.slugOwner("a".repeat(81))).toEqual({ id: "", title: "an invalid address" });
    expect(await repo.projects.setSlug(first.id, "Bad Slug", 2)).toEqual({
      ok: false,
      reason: "error",
      message: "Not a valid address.",
    });
    expect(await repo.projects.setSlug(first.id, second.slug, 2)).toMatchObject({
      ok: false,
      reason: "taken",
    });
    const moved = await repo.projects.setSlug(first.id, "brand-new", 2);
    expect(moved.ok && moved.row.slug).toBe("brand-new");

    const created = await repo.posts.create(
      { ...(await import("../defaults")).newPost(), title: "Hi" },
      "hi",
    );
    expect(created).toMatchObject({ slug: "hi", scheduledFor: null });
    expect(await repo.posts.list()).toHaveLength(1);
  });

  it("uploads, edits, replaces and deletes media in the draft bucket", async () => {
    const repo = await seed();
    const progress: number[] = [];
    const row = await repo.media.upload(
      {
        file: new Blob(["img"], { type: "image/png" }),
        filename: "screen.png",
        kind: "image",
        mime: "image/png",
      },
      (f) => progress.push(f),
    );
    expect(row.key).toBe(`${row.id}/r1`);
    expect(progress.at(-1)).toBe(1);
    const o = must(tus.options[0]);
    expect(o.endpoint).toBe("https://project.example/storage/v1/upload/resumable");
    expect(o.chunkSize).toBe(6 * 1024 * 1024);
    expect(o.headers?.authorization).toBe("Bearer tok");
    expect(o.metadata).toMatchObject({ bucketName: "pm-media-draft", objectName: `${row.id}/r1/480.webp` });
    expect([...files.keys()]).toEqual([`${row.id}/r1/480.webp`, `${row.id}/r1/orig.jpg`]);
    expect(await repo.media.url(row, "480")).toBe(`https://signed.example/${row.id}/r1/480.webp`);
    expect(await repo.media.url(row, "480")).toBe(`https://signed.example/${row.id}/r1/480.webp`);
    expect(await repo.media.url(row, "orig")).toBe(`https://signed.example/${row.id}/r1/orig.jpg`);
    const edited = await repo.media.update(row.id, {
      alt: "A screen",
      decorative: false,
      focal: { x: 0.2, y: 0.4 },
      filename: "s.png",
    });
    expect(edited).toMatchObject({ alt: "A screen", filename: "s.png", focal: { x: 0.2, y: 0.4 } });
    const withOg = await repo.media.makeOg(row.id);
    expect(withOg.hasOg).toBe(true);
    expect(files.has(`${row.id}/r1/og.jpg`)).toBe(true);
    const replaced = await repo.media.replace(row.id, {
      file: new Blob(["x"]),
      filename: "new.png",
      kind: "image",
      mime: "image/png",
    });
    expect(replaced).toMatchObject({ rev: 2, key: `${row.id}/r2`, filename: "new.png" });
    const pdf = await repo.media.upload({
      file: new Blob(["%PDF"]),
      filename: "cv.pdf",
      kind: "document",
      mime: "application/pdf",
    });
    expect((await repo.media.makeOg(pdf.id)).hasOg).toBe(false);
    files.delete(`${replaced.key}/orig.jpg`);
    await expect(repo.media.makeOg(replaced.id)).rejects.toMatchObject({ message: "Object not found" });
    expect(await repo.media.url(pdf)).toBe(`https://signed.example/${pdf.id}/r1/orig.pdf`);
    expect((await repo.media.list()).map((m) => m.filename).sort()).toEqual(["cv.pdf", "new.png"]);
    expect((await repo.media.storageUsed()).used).toBeGreaterThan(0);

    // In use by a draft: refused, with where.
    const proj = must(db.projects?.[0]);
    (proj.draft as { visuals: { cover?: unknown } }).visuals.cover = { mediaId: row.id };
    expect(await repo.media.uses(row.id)).toEqual([
      expect.objectContaining({ kind: "project", where: "Cover" }),
    ]);
    expect(await repo.media.remove(row.id)).toMatchObject({ ok: false });
    // Only on a live page: still refused.
    (proj.draft as { visuals: { cover?: unknown } }).visuals.cover = undefined;
    proj.published = { visuals: { cover: { src: `/media/${row.id}/r2/960.webp` } } };
    expect(await repo.media.remove(row.id)).toMatchObject({
      ok: false,
      uses: [expect.objectContaining({ where: "Live" })],
    });
    expect(await repo.media.remove(pdf.id)).toEqual({ ok: true });
  });

  it("calls the pm- functions with the session, and maps their answers", async () => {
    const repo = await seed();
    fetchMock.mockImplementationOnce(() => reply(200, { ok: true, publishedAt: "now", deployed: true }));
    expect(await repo.publish({ action: "publish", kind: "site" })).toEqual({
      ok: true,
      publishedAt: "now",
      deployed: true,
    });
    const [url, init] = must(fetchMock.mock.calls[0]);
    expect(url).toBe("https://project.example/functions/v1/pm-publish");
    expect((init?.headers as Record<string, string>).authorization).toBe("Bearer tok");
    fetchMock.mockImplementationOnce(() =>
      reply(409, { ok: false, reason: "needs-confirm", unconfirmed: ["title"] }),
    );
    expect(await repo.publish({ action: "publish", kind: "site" })).toMatchObject({
      reason: "needs-confirm",
    });
    fetchMock.mockImplementationOnce(() => reply(422, { ok: false, reason: "blocked", issues: [] }));
    expect(await repo.publish({ action: "publish", kind: "project", id: "x" })).toMatchObject({
      reason: "blocked",
    });
    fetchMock.mockImplementationOnce(() => reply(403, { error: "forbidden" }));
    expect(await repo.publish({ action: "publish", kind: "site" })).toEqual({
      ok: false,
      reason: "error",
      message: "forbidden",
    });
    fetchMock.mockImplementationOnce(() => reply(500));
    expect(await repo.publish({ action: "publish", kind: "site" })).toEqual({
      ok: false,
      reason: "error",
      message: "Couldn’t publish.",
    });
    fetchMock.mockImplementationOnce(() => Promise.reject(new TypeError("Failed to fetch")));
    expect(await repo.publish({ action: "publish", kind: "site" })).toEqual({ ok: false, reason: "offline" });
    // A gateway's HTML error page is an error, not "offline".
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(new Response("<html>Bad gateway</html>", { status: 502 })),
    );
    expect(await repo.publish({ action: "publish", kind: "site" })).toEqual({
      ok: false,
      reason: "error",
      message: "Couldn’t publish.",
    });
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(new Response("<html>ok?</html>", { status: 200 })),
    );
    expect(await repo.publish({ action: "publish", kind: "site" })).toMatchObject({
      ok: false,
      reason: "error",
    });

    const link = { tokenHash: "b".repeat(64), createdAt: "c", expiresAt: "e", revokedAt: null };
    fetchMock.mockImplementationOnce(() => reply(200, { url: "https://site.example/preview/tok", link }));
    expect(await repo.previews.create("project", "p1")).toEqual({
      url: "https://site.example/preview/tok",
      link,
    });
    fetchMock.mockImplementationOnce(() => reply(500, { error: "x" }));
    await expect(repo.previews.create("site")).rejects.toThrow("Couldn’t create a preview link.");
    const projectId = must(db.projects?.[0]).id as string;
    expect(await repo.previews.list("project", projectId)).toEqual([
      { tokenHash: "a".repeat(64), createdAt: "c", expiresAt: "e", revokedAt: null },
    ]);
    expect(await repo.previews.list("post", "none")).toEqual([]);
    fetchMock.mockImplementationOnce(() => reply(204));
    await repo.previews.revoke("a".repeat(64));
    fetchMock.mockImplementationOnce(() => reply(500));
    await expect(repo.previews.revoke("a".repeat(64))).rejects.toThrow();

    fetchMock.mockImplementationOnce(() => reply(200, { status: "login", detail: "Sign-in wall" }));
    expect(await repo.checkLink("https://figma.example", "prototype")).toEqual({
      status: "login",
      detail: "Sign-in wall",
    });
    fetchMock.mockImplementationOnce(() => Promise.reject(new TypeError("Failed to fetch")));
    expect(await repo.checkLink("https://figma.example", "prototype")).toEqual({
      status: "error",
      detail: "Offline.",
    });
    fetchMock.mockImplementationOnce(() => reply(500));
    expect(await repo.checkLink("https://figma.example", "prototype")).toEqual({
      status: "error",
      detail: "Couldn’t check the link.",
    });

    expect(await repo.linkChecks()).toEqual([
      { url: "https://x.example", status: "gone", detail: "404", checkedAt: "t" },
    ]);
    expect(await repo.topics("post")).toEqual([{ topic: "t-post", uses: 2 }]);
  });

  it("resumes uploads, waits out a lost connection, and reports real failures", async () => {
    const repo = await seed();
    const img = {
      file: new Blob(["img"], { type: "image/png" }),
      filename: "a.png",
      kind: "image" as const,
      mime: "image/png",
    };
    tus.previous = true;
    tus.resumed = 0;
    await repo.media.upload(img);
    expect(tus.resumed).toBeGreaterThan(0);
    tus.previous = false;

    // Offline mid-upload: it pauses, then carries on when the browser is back online.
    tus.mode = "offline-once";
    vi.stubGlobal("navigator", { onLine: false });
    vi.stubGlobal("window", Object.assign(new EventTarget(), {}));
    const pending = repo.media.upload(img);
    await new Promise((r) => setTimeout(r, 0));
    vi.stubGlobal("navigator", { onLine: true });
    tus.mode = "ok";
    (globalThis.window as unknown as EventTarget).dispatchEvent(new Event("online"));
    await expect(pending).resolves.toMatchObject({ filename: "a.png" });

    tus.mode = "fail";
    await expect(repo.media.upload(img)).rejects.toThrow("413");
    tus.mode = "ok";

    auth.session = null;
    await expect(repo.media.upload(img)).rejects.toThrow("signed out");
  });
});
