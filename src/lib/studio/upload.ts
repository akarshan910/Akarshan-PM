/**
 * Which files Studio accepts (06 · Storage › Upload pipeline, 05 · Media; StudioStates › Upload
 * problems), and the messages for the ones it refuses. Pure, so the rules are tested; the browser
 * steps (HEIC conversion, measuring, resizing) live with the upload component.
 */

export const MAX_BYTES = 10 * 1024 * 1024;

const IMAGE = /^image\/(png|jpeg|webp|gif)$/;
const HEIC = /^image\/hei[cf]$/;
const PDF = "application/pdf";

export type Accepted = { ok: true; kind: "image" | "document"; heic: boolean };
export type Refused = { ok: false; reason: "too-large" | "video" | "prototype" | "type"; message: string };

/** "14.2 MB", "820 KB". */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function ext(name: string): string {
  return name.toLowerCase().split(".").pop() ?? "";
}

/**
 * Checks a file before upload. `images` restricts to images (the Visuals gallery and covers);
 * the Media library also takes PDFs.
 */
export function checkFile(
  file: { name: string; type: string; size: number },
  options: { images?: boolean } = {},
): Accepted | Refused {
  const e = ext(file.name);
  const type = file.type || (e === "heic" || e === "heif" ? "image/heic" : "");
  if (type.startsWith("video/") || ["mp4", "mov", "webm", "m4v"].includes(e))
    return {
      ok: false,
      reason: "video",
      message: "Video files aren’t uploaded. Paste a YouTube, Vimeo, Loom or Google Drive link in Visuals.",
    };
  if (["html", "htm", "zip"].includes(e) || type === "text/html")
    return {
      ok: false,
      reason: "prototype",
      message:
        "Prototypes are links now. Deploy it, for example on Vercel, and paste its address in a project’s Visuals tab.",
    };
  const image = IMAGE.test(type) || HEIC.test(type);
  const pdf = type === PDF && !options.images;
  if (!image && !pdf)
    return {
      ok: false,
      reason: "type",
      message: options.images
        ? "Use a PNG, JPG, WebP or GIF image."
        : "Use an image (PNG, JPG, WebP, GIF or HEIC) or a PDF.",
    };
  if (file.size > MAX_BYTES)
    return {
      ok: false,
      reason: "too-large",
      message: `${formatBytes(file.size)}. ${pdf ? "PDFs" : "Images"} can be up to 10 MB.`,
    };
  return { ok: true, kind: pdf ? "document" : "image", heic: HEIC.test(type) };
}
