import { describe, expect, it } from "vitest";

import {
  FRAME_HOSTS,
  isAllowedFrameUrl,
  isCrossOriginHttps,
  prototypeUrl,
  toEmbedUrl,
  toFigmaEmbedUrl,
  toVideoEmbedUrl,
  videoHost,
  videoHostLabel,
} from "./links";

describe("videoHost", () => {
  it.each([
    ["https://www.youtube.com/watch?v=abc123", "youtube"],
    ["https://youtu.be/abc123", "youtube"],
    ["https://m.youtube.com/watch?v=abc123", "youtube"],
    ["https://vimeo.com/123456", "vimeo"],
    ["https://player.vimeo.com/video/123456", "vimeo"],
    ["https://www.loom.com/share/abcdef", "loom"],
    ["https://drive.google.com/file/d/xyz/view", "drive"],
  ] as const)("%s is %s", (url, host) => {
    expect(videoHost(url)).toBe(host);
  });

  it.each([
    "http://www.youtube.com/watch?v=abc",
    "https://cdn.example.com/walkthrough.mp4",
    "javascript:alert(1)",
    "//youtu.be/abc",
    "",
    "https://user:pass@youtu.be/abc",
  ])("rejects %s", (url) => {
    expect(videoHost(url)).toBeNull();
  });

  it("labels each host", () => {
    expect(videoHostLabel("youtube")).toBe("YouTube");
    expect(videoHostLabel("vimeo")).toBe("Vimeo");
    expect(videoHostLabel("loom")).toBe("Loom");
    expect(videoHostLabel("drive")).toBe("Google Drive");
  });
});

describe("toVideoEmbedUrl", () => {
  it("always uses youtube-nocookie for YouTube", () => {
    expect(toVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    );
    expect(toVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    );
    expect(toVideoEmbedUrl("https://www.youtube.com/shorts/abc_DEF-1")).toContain("/embed/abc_DEF-1?");
    expect(toVideoEmbedUrl("https://www.youtube.com/embed/abc")).toContain("youtube-nocookie.com/embed/abc");
    expect(toVideoEmbedUrl("https://www.youtube.com/live/abc")).toContain("/embed/abc?");
  });

  it("keeps a YouTube start time", () => {
    expect(toVideoEmbedUrl("https://youtu.be/abc?t=90")).toContain("start=90");
    expect(toVideoEmbedUrl("https://youtu.be/abc?t=90s")).toContain("start=90");
    expect(toVideoEmbedUrl("https://youtu.be/abc?t=1h2m3s")).toContain("start=3723");
    expect(toVideoEmbedUrl("https://www.youtube.com/watch?v=abc&start=12")).toContain("start=12");
    expect(toVideoEmbedUrl("https://youtu.be/abc?t=soon")).not.toContain("start=");
    expect(toVideoEmbedUrl("https://youtu.be/abc?t=0")).not.toContain("start=");
  });

  it("rejects YouTube links without a usable id", () => {
    expect(toVideoEmbedUrl("https://www.youtube.com/channel/xyz")).toBeNull();
    expect(toVideoEmbedUrl("https://www.youtube.com/watch")).toBeNull();
    expect(toVideoEmbedUrl("https://youtu.be/")).toBeNull();
    expect(toVideoEmbedUrl("https://www.youtube.com/watch?v=a%22b")).toBeNull();
    expect(toVideoEmbedUrl("https://www.youtube.com/embed/")).toBeNull();
  });

  it("builds Vimeo's player with Do Not Track", () => {
    expect(toVideoEmbedUrl("https://vimeo.com/123456")).toBe(
      "https://player.vimeo.com/video/123456?autoplay=1&dnt=1",
    );
    expect(toVideoEmbedUrl("https://vimeo.com/123456/abcdef12")).toBe(
      "https://player.vimeo.com/video/123456?autoplay=1&dnt=1&h=abcdef12",
    );
    expect(toVideoEmbedUrl("https://player.vimeo.com/video/123456?h=ff")).toBe(
      "https://player.vimeo.com/video/123456?autoplay=1&dnt=1&h=ff",
    );
    expect(toVideoEmbedUrl("https://vimeo.com/channels/staffpicks")).toBeNull();
    expect(toVideoEmbedUrl("https://vimeo.com/123/not-hex")).toBe(
      "https://player.vimeo.com/video/123?autoplay=1&dnt=1",
    );
  });

  it("builds Loom's embed", () => {
    expect(toVideoEmbedUrl("https://www.loom.com/share/abc123")).toBe(
      "https://www.loom.com/embed/abc123?autoplay=1",
    );
    expect(toVideoEmbedUrl("https://www.loom.com/embed/abc123")).toBe(
      "https://www.loom.com/embed/abc123?autoplay=1",
    );
    expect(toVideoEmbedUrl("https://www.loom.com/looms/videos")).toBeNull();
  });

  it("builds Drive's preview player", () => {
    expect(toVideoEmbedUrl("https://drive.google.com/file/d/1AbC-d_E/view?usp=sharing")).toBe(
      "https://drive.google.com/file/d/1AbC-d_E/preview",
    );
    expect(toVideoEmbedUrl("https://drive.google.com/drive/folders/xyz")).toBeNull();
  });

  it("returns null for other hosts and schemes", () => {
    expect(toVideoEmbedUrl("https://example.com/video")).toBeNull();
    expect(toVideoEmbedUrl("http://youtu.be/abc")).toBeNull();
  });

  it("only ever returns addresses on the allowed frame hosts", () => {
    const links = [
      "https://youtu.be/abc",
      "https://vimeo.com/1",
      "https://www.loom.com/share/a",
      "https://drive.google.com/file/d/a/view",
    ];
    for (const link of links) {
      const embed = toVideoEmbedUrl(link);
      expect(embed && isAllowedFrameUrl(embed)).toBe(true);
    }
  });
});

describe("Figma and generic embeds", () => {
  it("wraps Figma links in Figma's embed", () => {
    const link = "https://www.figma.com/proto/AbC123/Sri-Mandir?node-id=1-2";
    expect(toFigmaEmbedUrl(link)).toBe(
      `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(link)}`,
    );
    expect(toFigmaEmbedUrl("https://www.figma.com/login")).toBeNull();
    expect(toFigmaEmbedUrl("https://evil.example/proto/abc")).toBeNull();
  });

  it("picks the right converter", () => {
    expect(toEmbedUrl("https://youtu.be/abc")).toContain("youtube-nocookie");
    expect(toEmbedUrl("https://www.figma.com/design/abc/x")).toContain("figma.com/embed");
    expect(toEmbedUrl("https://example.com")).toBeNull();
  });
});

describe("isAllowedFrameUrl", () => {
  it("allows the fixed hosts over https only", () => {
    for (const origin of FRAME_HOSTS) expect(isAllowedFrameUrl(`${origin}/x`)).toBe(true);
    expect(isAllowedFrameUrl("http://www.youtube-nocookie.com/embed/x")).toBe(false);
    expect(isAllowedFrameUrl("https://www.youtube.com/embed/x")).toBe(false);
    expect(isAllowedFrameUrl("https://youtube-nocookie.com.evil.example/embed/x")).toBe(false);
  });

  it("adds the prototype origins the caller passes", () => {
    expect(isAllowedFrameUrl("https://protos.vercel.app/sri", ["https://protos.vercel.app"])).toBe(true);
    expect(isAllowedFrameUrl("https://other.vercel.app/sri", ["https://protos.vercel.app"])).toBe(false);
  });
});

describe("isCrossOriginHttps", () => {
  it("needs https on another origin", () => {
    expect(isCrossOriginHttps("https://protos.vercel.app/a", "https://site.example")).toBe(true);
    expect(isCrossOriginHttps("https://site.example/proto.html", "https://site.example")).toBe(false);
    expect(isCrossOriginHttps("http://protos.vercel.app/a", "https://site.example")).toBe(false);
  });
});

describe("prototypeUrl", () => {
  it("returns the base unchanged without a start path", () => {
    expect(prototypeUrl("https://protos.vercel.app/sri-mandir")).toBe("https://protos.vercel.app/sri-mandir");
  });

  it("joins a relative start path under the base", () => {
    expect(prototypeUrl("https://protos.vercel.app/sri-mandir", "booking")).toBe(
      "https://protos.vercel.app/sri-mandir/booking",
    );
    expect(prototypeUrl("https://protos.vercel.app/sri-mandir/", "/booking?step=2")).toBe(
      "https://protos.vercel.app/sri-mandir/booking?step=2",
    );
    expect(prototypeUrl("https://protos.vercel.app/app", "#/calendar")).toBe(
      "https://protos.vercel.app/app/#/calendar",
    );
  });

  it("never leaves the prototype's origin", () => {
    expect(prototypeUrl("https://protos.vercel.app/a", "//evil.example/x")).toBeNull();
    expect(prototypeUrl("https://protos.vercel.app/a", "javascript:alert(1)")).toBeNull();
    expect(prototypeUrl("https://protos.vercel.app/a", "https://evil.example")).toBeNull();
  });

  it("rejects a base that isn't https", () => {
    expect(prototypeUrl("http://protos.vercel.app/a")).toBeNull();
    expect(prototypeUrl("")).toBeNull();
  });
});
