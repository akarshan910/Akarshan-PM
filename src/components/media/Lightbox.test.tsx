// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Lightbox, type LightboxItem } from "./Lightbox";

const image = (n: number) => ({ src: `/media/${n}.webp`, width: 800, height: 600, alt: `Screen ${n}` });
const ITEMS: LightboxItem[] = [
  { image: image(1), caption: "Home" },
  { image: image(2) },
  { image: image(3), caption: "Booking" },
];

function Demo({ items = ITEMS }: { items?: LightboxItem[] }) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIndex(2);
        }}
      >
        Thumbnail
      </button>
      <Lightbox
        items={items}
        index={index}
        onIndexChange={setIndex}
        onClose={() => {
          setIndex(null);
        }}
      />
    </>
  );
}

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("still");
  vi.useRealTimers();
});

describe("Lightbox", () => {
  it("renders nothing while closed", () => {
    render(<Demo />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens as a modal with the count and caption, focused on ✕", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Thumbnail" }));
    const dialog = screen.getByRole("dialog", { name: "Enlarged image" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("3 / 3 · Booking")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Screen 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("moves with the arrow buttons and keys, wrapping round", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Thumbnail" }));
    await user.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByText("1 / 3 · Home")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous image" }));
    expect(screen.getByText("3 / 3 · Booking")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("3 / 3 · Booking")).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(screen.getByText("1 / 3 · Home")).toBeInTheDocument();
    await user.keyboard("{End}");
    expect(screen.getByText("3 / 3 · Booking")).toBeInTheDocument();
    await user.keyboard("a");
    expect(screen.getByText("3 / 3 · Booking")).toBeInTheDocument();
  });

  it("moves with a horizontal swipe, not a vertical one", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Thumbnail" }));
    const stage = document.querySelector(".stage") as HTMLElement;
    fireEvent.pointerDown(stage, { clientX: 300, clientY: 100 });
    fireEvent.pointerUp(stage, { clientX: 200, clientY: 110 });
    expect(screen.getByText("1 / 3 · Home")).toBeInTheDocument();
    fireEvent.pointerDown(stage, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(stage, { clientX: 200, clientY: 100 });
    expect(screen.getByText("3 / 3 · Booking")).toBeInTheDocument();
    fireEvent.pointerDown(stage, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(stage, { clientX: 150, clientY: 300 });
    expect(screen.getByText("3 / 3 · Booking")).toBeInTheDocument();
    fireEvent.pointerUp(stage, { clientX: 0, clientY: 0 });
    expect(screen.getByText("3 / 3 · Booking")).toBeInTheDocument();
  });

  it("keeps Tab inside the dialog", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Thumbnail" }));
    const close = screen.getByRole("button", { name: "Close" });
    const next = screen.getByRole("button", { name: "Next image" });
    next.focus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(next).toHaveFocus();
  });

  it("closes on Esc after the 200ms fade and returns focus to the thumbnail", () => {
    vi.useFakeTimers();
    render(<Demo />);
    const thumb = screen.getByRole("button", { name: "Thumbnail" });
    thumb.focus();
    fireEvent.click(thumb);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.querySelector(".closing")).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(thumb).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes instantly under reduced motion, from ✕ or the backdrop", async () => {
    document.documentElement.classList.add("still");
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Thumbnail" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Thumbnail" }));
    fireEvent.click(document.querySelector(".backdrop") as HTMLElement);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no arrows or count for a single image", async () => {
    const user = userEvent.setup();
    function One() {
      const [index, setIndex] = useState<number | null>(0);
      return (
        <Lightbox
          items={[ITEMS[0] as LightboxItem]}
          index={index}
          onIndexChange={setIndex}
          onClose={() => {
            setIndex(null);
          }}
        />
      );
    }
    render(<One />);
    expect(screen.queryByRole("button", { name: "Next image" })).toBeNull();
    expect(screen.getByText("Home")).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("Home")).toBeInTheDocument();
    const stage = document.querySelector(".stage") as HTMLElement;
    fireEvent.pointerDown(stage, { clientX: 300, clientY: 100 });
    fireEvent.pointerUp(stage, { clientX: 100, clientY: 100 });
    expect(screen.getByText("Home")).toBeInTheDocument();
  });
});
