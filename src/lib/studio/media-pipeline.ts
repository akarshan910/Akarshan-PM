/**
 * The upload pipeline (06 · Storage), run in the browser before anything leaves the device:
 * measure, take the dominant colour from a 16×16 downscale, resize to 480, 960 and 1600 wide
 * (never upscaled) as WebP at 0.82, and re-encode the original (which drops EXIF, including
 * location). GIFs keep their original file and get WebP posters. PDFs go up as they are.
 *
 * Files are keyed `<media id>/r<rev>/<name>`: `orig.jpg|png|gif|pdf` and `<width>.webp`, the
 * names pm-publish copies (supabase/functions/_shared/media.ts).
 */

import { formatBytes, MAX_BYTES } from "./upload";

export const WIDTHS = [480, 960, 1600] as const;

export interface PipelineFile {
  name: string;
  blob: Blob;
  type: string;
}

export interface PipelineResult {
  kind: "image" | "document";
  /** The stored mime: what `orig.*` is. */
  mime: "image/png" | "image/jpeg" | "image/gif" | "application/pdf";
  bytes: number;
  width: number | null;
  height: number | null;
  variants: number[];
  dominant: string | null;
  files: PipelineFile[];
}

/** The widths to make for an image `width` wide: never wider than the original. */
export function variantWidths(width: number): number[] {
  return [...new Set(WIDTHS.map((w) => Math.min(w, Math.max(1, Math.round(width)))))];
}

/** `orig.*` for a stored mime, as pm-publish names it. */
export function origName(mime: string): string {
  if (mime === "application/pdf") return "orig.pdf";
  if (mime === "image/gif") return "orig.gif";
  if (mime === "image/png") return "orig.png";
  return "orig.jpg";
}

/** The file a Studio view shows for a variant: a WebP width, or the original. */
export function variantFile(
  row: { kind: string; mime: string; variants?: number[] | null },
  variant: "480" | "960" | "1600" | "orig",
): string {
  const widths = [...(row.variants ?? [])].sort((a, b) => a - b);
  if (row.kind === "document" || variant === "orig" || widths.length === 0) return origName(row.mime);
  const want = Number(variant);
  const pick = widths.find((w) => w >= want) ?? widths[widths.length - 1];
  return `${String(pick)}.webp`;
}

export function hex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

/** The average colour of RGBA pixels, ignoring fully transparent ones. */
export function averageColour(data: Uint8ClampedArray): string {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if ((data[i + 3] ?? 0) === 0) continue;
    r += data[i] ?? 0;
    g += data[i + 1] ?? 0;
    b += data[i + 2] ?? 0;
    n++;
  }
  return n ? hex(r / n, g / n, b / n) : "#1A1A1F";
}

type Canvas = OffscreenCanvas | HTMLCanvasElement;

function canvas(w: number, h: number): Canvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function context(c: Canvas): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("This browser can’t resize images.");
  return ctx;
}

async function encode(c: Canvas, type: string, quality: number): Promise<Blob> {
  if ("convertToBlob" in c) return c.convertToBlob({ type, quality });
  return new Promise((resolve, reject) => {
    c.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Couldn’t encode the image."));
      },
      type,
      quality,
    );
  });
}

async function draw(bitmap: ImageBitmap, width: number, type: string, quality: number): Promise<Blob> {
  const height = Math.max(1, Math.round((bitmap.height * width) / bitmap.width));
  const c = canvas(width, height);
  context(c).drawImage(bitmap, 0, 0, width, height);
  return encode(c, type, quality);
}

/** Images bigger than this aren't drawn to a canvas (memory); 06's 10 MB files stay well under it. */
export const MAX_PIXELS = 40_000_000;

/** What the file's first bytes say it is, whatever its name or `type` claim. */
export async function sniff(file: Blob): Promise<string | null> {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const at = (i: number, ...v: number[]) => v.every((x, j) => b[i + j] === x);
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  if (at(0, 0x25, 0x50, 0x44, 0x46)) return "application/pdf";
  if (
    at(4, 0x66, 0x74, 0x79, 0x70) &&
    /^(heic|heix|heim|heis|hevc|mif1|msf1)$/.test(String.fromCharCode(...b.slice(8, 12)))
  )
    return "image/heic";
  return null;
}

/** Runs the pipeline. Throws with a message for the owner when the file can't be read. */
export async function runPipeline(file: Blob, claimed: string): Promise<PipelineResult> {
  const mime = (await sniff(file)) ?? "";
  if (!mime || (mime === "application/pdf") !== (claimed === "application/pdf"))
    throw new Error("This file isn’t the image or PDF its name says. Export it again and upload that.");
  if (mime === "application/pdf") {
    return {
      kind: "document",
      mime: "application/pdf",
      bytes: file.size,
      width: null,
      height: null,
      variants: [],
      dominant: null,
      files: [{ name: "orig.pdf", blob: file, type: "application/pdf" }],
    };
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      mime === "image/heic" || mime === "image/heif"
        ? "This browser can’t read HEIC photos yet. Export it as JPG and upload that."
        : "Couldn’t read this image. Try exporting it again as JPG or PNG.",
    );
  }
  const { width, height } = bitmap;
  if (width * height > MAX_PIXELS) {
    bitmap.close();
    throw new Error("This image is over 40 megapixels. Export it smaller and upload that.");
  }
  const tiny = canvas(16, 16);
  const tctx = context(tiny);
  tctx.drawImage(bitmap, 0, 0, 16, 16);
  const dominant = averageColour(tctx.getImageData(0, 0, 16, 16).data);

  const widths = variantWidths(width);
  const files: PipelineFile[] = [];
  for (const w of widths)
    files.push({
      name: `${String(w)}.webp`,
      blob: await draw(bitmap, w, "image/webp", 0.82),
      type: "image/webp",
    });

  let stored: PipelineResult["mime"];
  if (mime === "image/gif") {
    stored = "image/gif";
    files.push({ name: "orig.gif", blob: file, type: "image/gif" });
  } else if (mime === "image/png") {
    stored = "image/png";
    files.push({ name: "orig.png", blob: await draw(bitmap, width, "image/png", 1), type: "image/png" });
  } else {
    stored = "image/jpeg";
    files.push({ name: "orig.jpg", blob: await draw(bitmap, width, "image/jpeg", 0.9), type: "image/jpeg" });
  }
  bitmap.close();
  const orig = files[files.length - 1];
  // Re-encoding can make a file bigger (a PNG at full quality): check before anything uploads.
  const big = files.find((f) => f.blob.size > MAX_BYTES);
  if (big)
    throw new Error(
      `After converting, it’s ${formatBytes(big.blob.size)}. Images can be up to 10 MB. Resize it and upload again.`,
    );
  return {
    kind: "image",
    mime: stored,
    bytes: orig?.blob.size ?? file.size,
    width,
    height,
    variants: widths,
    dominant,
    files,
  };
}

// ---- the Open Graph image (06 · Storage, step 5)

export const OG = { width: 1200, height: 630 } as const;

/** The largest 1200:630 rectangle of a `w`×`h` image, centred on the focal point where it fits. */
export function ogRect(w: number, h: number, focal: { x: number; y: number } | null) {
  const ratio = OG.width / OG.height;
  const cw = Math.min(w, h * ratio);
  const ch = cw / ratio;
  const f = focal ?? { x: 0.5, y: 0.5 };
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);
  return {
    x: Math.round(clamp(f.x * w - cw / 2, w - cw)),
    y: Math.round(clamp(f.y * h - ch / 2, h - ch)),
    width: Math.round(cw),
    height: Math.round(ch),
  };
}

/** `og.jpg`: the image cropped around its focal point to 1200×630, JPG at 0.85. */
export async function cropOg(file: Blob, focal: { x: number; y: number } | null): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const r = ogRect(bitmap.width, bitmap.height, focal);
  const c = canvas(OG.width, OG.height);
  context(c).drawImage(bitmap, r.x, r.y, r.width, r.height, 0, 0, OG.width, OG.height);
  bitmap.close();
  return encode(c, "image/jpeg", 0.85);
}
