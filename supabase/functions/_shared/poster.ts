/**
 * Video posters at publish (06 · Published shape): a video hero or `video` block gets
 * `poster: Img`, the host's thumbnail stored as a media row so the build serves it from /media like
 * any image, and `duration` ("3:24") when the host's oEmbed gives one. Google Drive has no public
 * thumbnail, so its poster is the project's cover.
 *
 * Only fixed oEmbed endpoints and the hosts' own thumbnail CDNs are fetched, with a timeout and a
 * size cap. A poster is reused across publishes (keyed by the video address), and anything that
 * fails just leaves the video without a poster: the player still works.
 */
import type { Deps } from "./deps.ts";
import { videoHost } from "./lib/links.ts";
import type { BlockPublished, Img, ProjectPublished } from "./lib/published.ts";
import { loadMedia, publicResolver, type MediaRow } from "./media.ts";
import { sha256Hex } from "./preview.ts";

const THUMB_HOSTS = new Set(["i.ytimg.com", "i.vimeocdn.com", "cdn.loom.com"]);
const MAX_THUMB_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 10_000;

export function oembedUrl(video: string): string | null {
  const q = encodeURIComponent(video);
  switch (videoHost(video)) {
    case "youtube":
      return `https://www.youtube.com/oembed?format=json&url=${q}`;
    case "vimeo":
      return `https://vimeo.com/api/oembed.json?url=${q}`;
    case "loom":
      return `https://www.loom.com/v1/oembed?url=${q}`;
    default:
      return null;
  }
}

/** "3:24", or "1:02:03" past an hour. */
export function formatDuration(seconds: number): string | undefined {
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function isThumbUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && THUMB_HOSTS.has(u.hostname) && !u.username && !u.port;
  } catch {
    return false;
  }
}

function uuidFrom(bytes: Uint8Array): string {
  const b = [...bytes.slice(0, 16)];
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
  const h = b.map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

async function readCapped(res: Response, max: number): Promise<Uint8Array | null> {
  const reader = res.body?.getReader();
  if (!reader) return null;
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.byteLength;
  }
  return out;
}

interface Meta {
  thumb?: { url: string; width: number; height: number };
  duration?: string;
}

async function videoMeta(deps: Deps, video: string): Promise<Meta> {
  const endpoint = oembedUrl(video);
  if (!endpoint) return {};
  try {
    const res = await deps.fetch(endpoint, { redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      await res.body?.cancel();
      return {};
    }
    const bytes = await readCapped(res, 64 * 1024);
    if (!bytes) return {};
    const o = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const duration = typeof o.duration === "number" ? formatDuration(o.duration) : undefined;
    const thumb = isThumbUrl(o.thumbnail_url)
      ? {
          url: o.thumbnail_url,
          width: Number(o.thumbnail_width) || 1280,
          height: Number(o.thumbnail_height) || 720,
        }
      : undefined;
    return { ...(thumb ? { thumb } : {}), ...(duration ? { duration } : {}) };
  } catch {
    return {};
  }
}

/** The media row holding a video's poster: reused if it exists, otherwise downloaded and stored. */
async function posterRow(
  deps: Deps,
  video: string,
  thumb: NonNullable<Meta["thumb"]>,
): Promise<MediaRow | null> {
  const filename = `poster-${(await sha256Hex(video)).slice(0, 32)}.jpg`;
  const [existing] = await deps.sql.query<{ id: string }>(
    "select id::text from pm.media where filename = $1 limit 1",
    [filename],
  );
  if (existing) return (await loadMedia(deps.sql, [existing.id])).get(existing.id) ?? null;
  try {
    const res = await deps.fetch(thumb.url, { redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS) });
    const type = (res.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase();
    if (!res.ok || (type !== "image/jpeg" && type !== "image/png")) {
      await res.body?.cancel();
      return null;
    }
    const bytes = await readCapped(res, MAX_THUMB_BYTES);
    if (!bytes || bytes.byteLength === 0) return null;
    const id = uuidFrom(deps.randomBytes(16));
    const key = `${id}/r1`;
    await deps.storage.upload(`${key}/${type === "image/png" ? "orig.png" : "orig.jpg"}`, bytes, type);
    await deps.sql.query(
      `insert into pm.media (id, rev, key, kind, mime, bytes, width, height, variants, decorative, filename)
       values ($1, 1, $2, 'image', $3, $4, $5, $6, '{}', true, $7)`,
      [id, key, type, bytes.byteLength, thumb.width, thumb.height, filename],
    );
    return (await loadMedia(deps.sql, [id])).get(id) ?? null;
  } catch {
    return null;
  }
}

/** Adds posters and durations to a published project's videos. Returns the poster rows to publish. */
export async function addVideoPosters(
  deps: Deps,
  project: ProjectPublished,
): Promise<{ project: ProjectPublished; rows: MediaRow[] }> {
  const rows = new Map<string, MediaRow>();
  const cache = new Map<string, { poster?: Img; duration?: string }>();
  const enrich = async (url: string): Promise<{ poster?: Img; duration?: string }> => {
    const hit = cache.get(url);
    if (hit) return hit;
    let out: { poster?: Img; duration?: string } = {};
    if (videoHost(url) === "drive") {
      out = project.visuals.cover ? { poster: project.visuals.cover } : {};
    } else {
      const meta = await videoMeta(deps, url);
      const row = meta.thumb ? await posterRow(deps, url, meta.thumb) : null;
      const poster = row ? publicResolver(new Map([[row.id, row]]))({ mediaId: row.id }) : undefined;
      if (row) rows.set(row.id, row);
      out = { ...(poster ? { poster } : {}), ...(meta.duration ? { duration: meta.duration } : {}) };
    }
    cache.set(url, out);
    return out;
  };

  let hero = project.visuals.hero;
  if (hero.type === "video") hero = { ...hero, ...(await enrich(hero.url)) };
  const story = [];
  for (const c of project.story) {
    const blocks: BlockPublished[] = [];
    for (const b of c.blocks)
      blocks.push(b.type === "video" && b.url ? { ...b, ...(await enrich(b.url)) } : b);
    story.push({ ...c, blocks });
  }
  return { project: { ...project, visuals: { ...project.visuals, hero }, story }, rows: [...rows.values()] };
}
