import { afterEach, describe, expect, it, vi } from "vitest";

import {
  averageColour,
  cropOg,
  hex,
  ogRect,
  origName,
  runPipeline,
  variantFile,
  variantWidths,
} from "./media-pipeline";

describe("media pipeline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("names files and picks widths as pm-publish expects", () => {
    expect(variantWidths(4000)).toEqual([480, 960, 1600]);
    expect(variantWidths(1000)).toEqual([480, 960, 1000]);
    expect(variantWidths(300)).toEqual([300]);
    expect(origName("application/pdf")).toBe("orig.pdf");
    expect(origName("image/gif")).toBe("orig.gif");
    expect(origName("image/png")).toBe("orig.png");
    expect(origName("image/jpeg")).toBe("orig.jpg");
    const img = { kind: "image", mime: "image/jpeg", variants: [1600, 480, 960] };
    expect(variantFile(img, "960")).toBe("960.webp");
    expect(variantFile(img, "1600")).toBe("1600.webp");
    expect(variantFile({ ...img, variants: [480, 700] }, "960")).toBe("700.webp");
    expect(variantFile(img, "orig")).toBe("orig.jpg");
    expect(variantFile({ kind: "image", mime: "image/png", variants: null }, "480")).toBe("orig.png");
    expect(variantFile({ kind: "document", mime: "application/pdf" }, "960")).toBe("orig.pdf");
    expect(hex(255, 0, 300)).toBe("#FF00FF");
    expect(averageColour(new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255, 9, 9, 9, 0]))).toBe(
      "#800080",
    );
    expect(averageColour(new Uint8ClampedArray([1, 2, 3, 0]))).toBe("#1A1A1F");
  });

  it("passes PDFs through", async () => {
    const pdf = new Blob(["%PDF-1.7"], { type: "application/pdf" });
    const out = await runPipeline(pdf, "application/pdf");
    expect(out).toMatchObject({
      kind: "document",
      mime: "application/pdf",
      variants: [],
      files: [{ name: "orig.pdf" }],
    });
  });

  it("resizes images, re-encodes the original, and explains files it can't read", async () => {
    const drawn: number[] = [];
    class Canvas {
      constructor(
        public width: number,
        public height: number,
      ) {}
      getContext() {
        return {
          drawImage: (_b: unknown, _x: number, _y: number, w: number) => drawn.push(w),
          getImageData: () => ({ data: new Uint8ClampedArray([10, 20, 30, 255]) }),
        };
      }
      convertToBlob(o: { type: string }) {
        return Promise.resolve(new Blob([`${o.type}:${String(this.width)}`], { type: o.type }));
      }
    }
    vi.stubGlobal("OffscreenCanvas", Canvas);
    vi.stubGlobal("createImageBitmap", () =>
      Promise.resolve({ width: 2000, height: 1000, close: () => undefined }),
    );
    const jpg = await runPipeline(new Blob(["x"], { type: "image/webp" }), "image/webp");
    expect(jpg).toMatchObject({
      kind: "image",
      mime: "image/jpeg",
      width: 2000,
      height: 1000,
      variants: [480, 960, 1600],
      dominant: "#0A141E",
    });
    expect(jpg.files.map((f) => f.name)).toEqual(["480.webp", "960.webp", "1600.webp", "orig.jpg"]);
    expect(drawn).toEqual([16, 480, 960, 1600, 2000]);
    const png = await runPipeline(new Blob(["x"]), "image/png");
    expect(png.mime).toBe("image/png");
    expect(png.files.at(-1)?.name).toBe("orig.png");
    const gifFile = new Blob(["GIF89a"], { type: "image/gif" });
    const gif = await runPipeline(gifFile, "image/gif");
    expect(gif.files.at(-1)).toEqual({ name: "orig.gif", blob: gifFile, type: "image/gif" });

    vi.stubGlobal("createImageBitmap", () => Promise.reject(new Error("decode")));
    await expect(runPipeline(new Blob(["x"]), "image/heic")).rejects.toThrow(/HEIC/);
    await expect(runPipeline(new Blob(["x"]), "image/jpeg")).rejects.toThrow(/Couldn’t read this image/);
  });

  it("crops the link preview around the focal point", async () => {
    expect(ogRect(2400, 1260, null)).toEqual({ x: 0, y: 0, width: 2400, height: 1260 });
    // A tall image: full width, the band around the focal point.
    expect(ogRect(1200, 2000, { x: 0.5, y: 0.1 })).toEqual({ x: 0, y: 0, width: 1200, height: 630 });
    expect(ogRect(1200, 2000, { x: 0.5, y: 0.5 })).toEqual({ x: 0, y: 685, width: 1200, height: 630 });
    expect(ogRect(1200, 2000, { x: 0.5, y: 1 })).toEqual({ x: 0, y: 1370, width: 1200, height: 630 });
    // A wide image: full height, slid towards the focal point.
    expect(ogRect(4000, 1050, { x: 0.9, y: 0.5 })).toEqual({ x: 2000, y: 0, width: 2000, height: 1050 });

    const drawn: number[][] = [];
    class Canvas {
      constructor(
        public width: number,
        public height: number,
      ) {}
      getContext() {
        return { drawImage: (...a: unknown[]) => drawn.push(a.slice(1) as number[]) };
      }
      convertToBlob(o: { type: string }) {
        return Promise.resolve(new Blob(["og"], { type: o.type }));
      }
    }
    vi.stubGlobal("OffscreenCanvas", Canvas);
    vi.stubGlobal("createImageBitmap", () =>
      Promise.resolve({ width: 1200, height: 2000, close: () => undefined }),
    );
    const og = await cropOg(new Blob(["x"]), { x: 0.5, y: 0.5 });
    expect(og.type).toBe("image/jpeg");
    expect(drawn[0]).toEqual([0, 685, 1200, 630, 0, 0, 1200, 630]);
  });
});
