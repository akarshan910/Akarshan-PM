/**
 * Media references → images (06 · Published shape, Storage). Drafts name media by id; published
 * documents carry a resolved `Img` whose paths are the site's own `/media/<key>/<variant>`, which
 * the build downloads from `pm-media-public` (visitors never load images from Supabase). Previews
 * get one-hour signed URLs to the draft bucket instead.
 */
import type { Img, ResolveImg } from "./lib/published.ts";
import type { MediaRef } from "./lib/types.ts";
import type { Sql, StoragePort } from "./deps.ts";

export interface MediaRow {
  id: string;
  key: string;
  kind: "image" | "document";
  mime: string;
  width: number | null;
  height: number | null;
  variants: number[];
  has_og: boolean;
  focal: { x: number; y: number } | null;
  alt: string | null;
  decorative: boolean;
  dominant: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DEFAULT_DOMINANT = "#1A1A1F";

/** Every `mediaId` a document refers to, in order, without duplicates or empty ids. */
export function mediaIds(doc: unknown): string[] {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (k === "mediaId" && typeof x === "string" && x !== "") out.add(x);
        else walk(x);
      }
    }
  };
  walk(doc);
  return [...out];
}

export async function loadMedia(sql: Sql, ids: string[]): Promise<Map<string, MediaRow>> {
  const valid = ids.filter((id) => UUID.test(id));
  if (valid.length === 0) return new Map();
  const rows = await sql.query<MediaRow>(
    `select id::text, key, kind, mime, width, height, variants, has_og, focal, alt, decorative, dominant
     from pm.media where id = any($1::uuid[])`,
    [valid],
  );
  return new Map(rows.map((r) => [r.id, r]));
}

function origName(row: MediaRow): string {
  if (row.kind === "document") return "orig.pdf";
  return row.mime === "image/gif" ? "orig.gif" : row.mime === "image/png" ? "orig.png" : "orig.jpg";
}

/** The file names an image or document uses, relative to its key. */
export function variantFiles(row: MediaRow): { src: string; srcset: [string, number][]; og?: string } {
  const widths = [...row.variants].sort((a, b) => a - b);
  const largest = widths[widths.length - 1];
  if (row.kind === "document" || largest === undefined) {
    return { src: origName(row), srcset: [], ...(row.has_og ? { og: "og.jpg" } : {}) };
  }
  return {
    src: `${largest}.webp`,
    srcset: widths.map((w): [string, number] => [`${w}.webp`, w]),
    ...(row.has_og ? { og: "og.jpg" } : {}),
  };
}

function toImg(row: MediaRow, url: (file: string) => string): Img {
  const files = variantFiles(row);
  return {
    src: url(files.src),
    srcset: files.srcset.map(([f, w]) => `${url(f)} ${w}w`).join(", "),
    width: row.width ?? 0,
    height: row.height ?? 0,
    alt: row.decorative ? "" : (row.alt ?? ""),
    dominant: row.dominant ?? DEFAULT_DOMINANT,
    ...(files.og ? { og: url(files.og) } : {}),
    ...(row.focal ? { focal: row.focal } : {}),
  };
}

/** The published resolver: site paths under /media. */
export function publicResolver(media: Map<string, MediaRow>): ResolveImg {
  return (ref: MediaRef) => {
    const row = media.get(ref.mediaId);
    return row ? toImg(row, (f) => `/media/${row.key}/${f}`) : undefined;
  };
}

/** The preview resolver: one-hour signed URLs for every file the images use. */
export async function previewResolver(
  media: Map<string, MediaRow>,
  storage: StoragePort,
): Promise<ResolveImg> {
  const signed = new Map<string, string>();
  for (const row of media.values()) {
    const files = variantFiles(row);
    for (const f of [files.src, ...files.srcset.map(([x]) => x), ...(files.og ? [files.og] : [])]) {
      const name = `${row.key}/${f}`;
      if (!signed.has(name)) signed.set(name, await storage.signedUrl(name, 3600));
    }
  }
  return (ref: MediaRef) => {
    const row = media.get(ref.mediaId);
    return row ? toImg(row, (f) => signed.get(`${row.key}/${f}`) ?? "") : undefined;
  };
}

/** Copies every file of these media rows into pm-media-public and marks them published. */
export async function publishMedia(sql: Sql, storage: StoragePort, rows: MediaRow[]): Promise<void> {
  for (const row of rows) {
    const names = await storage.list("pm-media-draft", `${row.key}/`);
    for (const name of names) await storage.publish(name);
  }
  if (rows.length > 0) {
    await sql.query("update pm.media set published = true where id = any($1::uuid[])", [
      rows.map((r) => r.id),
    ]);
  }
}

/** The media keys a published document's /media paths name. */
export function publishedKeys(doc: unknown): Set<string> {
  const keys = new Set<string>();
  const text = JSON.stringify(doc ?? null);
  for (const m of text.matchAll(/\/media\/([0-9a-f-]{36}\/r[0-9]+)\//g)) if (m[1]) keys.add(m[1]);
  return keys;
}
