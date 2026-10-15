// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Image } from "./Image";

const IMG = {
  src: "/media/a/r1/960.webp",
  width: 1600,
  height: 1000,
  alt: "Booking screen",
  dominant: "#2A1316",
};

describe("Image", () => {
  it("holds the exact box in the dominant colour with a sheen while loading", () => {
    const { container } = render(<Image image={IMG} sizes="100vw" />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.dataset.state).toBe("loading");
    expect(box.style.aspectRatio).toBe("1600 / 1000");
    expect(box.style.backgroundColor).toBe("rgb(42, 19, 22)");
    const img = screen.getByRole("img", { name: "Booking screen" });
    expect(img).toHaveAttribute("width", "1600");
    expect(img).toHaveAttribute("height", "1000");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("sizes", "100vw");
    expect(container.querySelector(".shim")).not.toBeNull();
  });

  it("fades in once loaded", () => {
    const { container } = render(<Image image={IMG} priority />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("loading", "eager");
    fireEvent.load(img);
    expect((container.firstElementChild as HTMLElement).dataset.state).toBe("loaded");
    expect(container.querySelector(".shim")).toBeNull();
    expect(container.querySelector(".instant")).toBeNull();
  });

  it("loads the page's largest image first and never gates it on hydration (lcp)", () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(<Image image={IMG} lcp />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img).toHaveAttribute("loading", "eager");
    expect(img).toHaveAttribute("decoding", "auto");
    expect((container.firstElementChild as HTMLElement).dataset.lcp).toBe("");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    render(<Image image={IMG} priority />);
    expect(screen.getAllByRole("img")[1]).not.toHaveAttribute("fetchpriority");
  });

  it("shows the alt text in place when the file fails, never a broken image", () => {
    const { container } = render(<Image image={IMG} />);
    fireEvent.error(screen.getByRole("img"));
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Booking screen")).toBeInTheDocument();
    expect((container.firstElementChild as HTMLElement).dataset.state).toBe("failed");
  });

  it("shows only the icon for a decorative image that fails", () => {
    const { container } = render(<Image image={{ ...IMG, alt: "" }} state="failed" />);
    expect(container.querySelector(".alt")).toBeNull();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("skips the fade for an image already complete at hydration", () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    const width = vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(1600);
    const { container } = render(<Image image={IMG} fit="contain" className="extra" />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.dataset.state).toBe("loaded");
    expect(box.className).toContain("instant");
    expect(box.className).toContain("extra");
    expect(screen.getByRole("img").style.objectFit).toBe("contain");
    complete.mockRestore();
    width.mockRestore();
  });

  it("treats a complete image with no pixels as failed", () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    const width = vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(0);
    const { container } = render(<Image image={IMG} />);
    expect((container.firstElementChild as HTMLElement).dataset.state).toBe("failed");
    complete.mockRestore();
    width.mockRestore();
  });

  it("starts loading again when the image changes", () => {
    const { container, rerender } = render(<Image image={IMG} />);
    fireEvent.load(screen.getByRole("img"));
    rerender(<Image image={{ ...IMG, src: "/media/b/r1/960.webp" }} />);
    expect((container.firstElementChild as HTMLElement).dataset.state).toBe("loading");
  });

  it("can show the loading state without requesting the file", () => {
    const { container } = render(<Image image={IMG} state="loading" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".shim")).not.toBeNull();
  });
});
