/**
 * Uploads files through the repo (06 · Storage › Upload pipeline), tracking each one's progress
 * and refusal so the Visuals gallery, the Media library and the phone upload sheet show the
 * StudioStates › Upload problems messages. Images are measured first; HEIC is converted to JPG
 * where the browser can decode it.
 */
import { useCallback, useState } from "react";

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
}

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

  const upload = useCallback(
    async (files: FileList | File[]): Promise<MediaRow[]> => {
      const done: MediaRow[] = [];
      const list = [...files];
      const start = list.map((f, n) => ({
        f,
        key: `${Date.now()}-${n}-${f.name}`,
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
            continue;
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
          patch(key, { state: "done", fraction: 1, row, ...(verdict.heic ? { converted: true } : {}) });
          done.push(row);
        } catch {
          patch(key, { state: "failed", message: "Paused. It resumes on its own when you’re back online." });
        }
      }
      return done;
    },
    [images, repo],
  );

  const dismiss = useCallback((key: string) => {
    setItems((list) => list.filter((i) => i.key !== key));
  }, []);

  return { items, upload, dismiss };
}
