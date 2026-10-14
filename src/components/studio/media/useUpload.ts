/**
 * Uploads files through the repo (06 · Storage › Upload pipeline), tracking each one's progress
 * and refusal so the Visuals gallery, the Media library and the phone upload sheet show the
 * StudioStates › Upload problems messages. Images are measured first; HEIC is converted to JPG
 * where the browser can decode it.
 */
import { useCallback, useRef, useState } from "react";

import { useRepo } from "../data";
import type { MediaRow } from "~/lib/studio/repo";
import { checkFile, formatBytes } from "~/lib/studio/upload";

export interface UploadItem {
  key: string;
  name: string;
  size: string;
  state: "uploading" | "done" | "failed";
  fraction: number;
  message?: string;
  /** "was converted to JPG so every browser can show it." */
  converted?: boolean;
  row?: MediaRow;
  /** The upload itself failed (not the file): Retry sends it again. */
  retry?: boolean;
}

type Verdict = Extract<ReturnType<typeof checkFile>, { ok: true }>;

const offlineNow = () => typeof navigator !== "undefined" && "onLine" in navigator && !navigator.onLine;

async function measure(file: Blob): Promise<{ width?: number; height?: number }> {
  if (typeof createImageBitmap !== "function") return {};
  try {
    const bmp = await createImageBitmap(file);
    const out = { width: bmp.width, height: bmp.height };
    bmp.close();
    return out;
  } catch {
    return {};
  }
}

async function heicToJpeg(file: File): Promise<Blob | null> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return null;
  try {
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    canvas.getContext("2d")?.drawImage(bmp, 0, 0);
    bmp.close();
    return await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });
  } catch {
    return null;
  }
}

export function useUpload(options: { images?: boolean } = {}) {
  const repo = useRepo();
  const [items, setItems] = useState<UploadItem[]>([]);
  const images = options.images ?? false;

  const patch = (key: string, p: Partial<UploadItem>) => {
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...p } : i)));
  };

  const failedFiles = useRef(new Map<string, { f: File; verdict: Verdict }>());

  /** Converts, measures and uploads one accepted file; the row, or null when it failed. */
  const send = useCallback(
    async (key: string, f: File, verdict: Verdict): Promise<MediaRow | null> => {
      let blob: Blob = f;
      let name = f.name;
      let mime = f.type;
      if (verdict.heic) {
        const jpg = await heicToJpeg(f);
        if (!jpg) {
          patch(key, {
            state: "failed",
            message: "This HEIC photo couldn’t be converted. Export it as JPG and try again.",
          });
          return null;
        }
        blob = jpg;
        name = name.replace(/\.hei[cf]$/i, ".jpg");
        mime = "image/jpeg";
      }
      const size = verdict.kind === "image" ? await measure(blob) : {};
      try {
        const row = await repo.media.upload(
          { file: blob, filename: name, kind: verdict.kind, mime, ...size },
          (fraction) => {
            patch(key, { fraction });
          },
        );
        failedFiles.current.delete(key);
        patch(key, {
          state: "done",
          fraction: 1,
          row,
          retry: false,
          ...(verdict.heic ? { converted: true } : {}),
        });
        return row;
      } catch (e) {
        failedFiles.current.set(key, { f, verdict });
        patch(key, {
          state: "failed",
          retry: true,
          message: offlineNow()
            ? "You’re offline. Retry once you’re back."
            : e instanceof Error && e.message
              ? e.message
              : "Couldn’t upload this file. Try again.",
        });
        return null;
      }
    },
    [repo],
  );

  const upload = useCallback(
    async (files: FileList | File[]): Promise<MediaRow[]> => {
      const done: MediaRow[] = [];
      const list = [...files];
      const start = list.map((f, n) => ({
        f,
        key: `${String(Date.now())}-${String(n)}-${f.name}`,
        verdict: checkFile(f, { images }),
      }));
      setItems((prev) => [
        ...prev,
        ...start.map(({ f, key, verdict }) => ({
          key,
          name: f.name,
          size: formatBytes(f.size),
          state: verdict.ok ? ("uploading" as const) : ("failed" as const),
          fraction: 0,
          ...(verdict.ok ? {} : { message: verdict.message }),
        })),
      ]);
      for (const { f, key, verdict } of start) {
        if (!verdict.ok) continue;
        const row = await send(key, f, verdict);
        if (row) done.push(row);
      }
      return done;
    },
    [images, send],
  );

  /** Sends a failed upload again; the rows that made it (none or one). */
  const retry = useCallback(
    async (key: string): Promise<MediaRow[]> => {
      const entry = failedFiles.current.get(key);
      if (!entry) return [];
      setItems((list) =>
        list.map((i) => {
          if (i.key !== key) return i;
          const { message: _m, ...rest } = i;
          return { ...rest, state: "uploading" as const, fraction: 0, retry: false };
        }),
      );
      const row = await send(key, entry.f, entry.verdict);
      return row ? [row] : [];
    },
    [send],
  );

  const dismiss = useCallback((key: string) => {
    failedFiles.current.delete(key);
    setItems((list) => list.filter((i) => i.key !== key));
  }, []);

  return { items, upload, retry, dismiss };
}
