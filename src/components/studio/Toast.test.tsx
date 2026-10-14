// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Toast, TOAST_DURATION, ToastProvider, useToast, type ToastOptions } from "./Toast";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function Trigger({ toast }: { toast: ToastOptions }) {
  const api = useToast();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          api.show(toast);
        }}
      >
        Go
      </button>
      <button type="button" onClick={api.dismiss}>
        Clear
      </button>
    </>
  );
}

const live = () => document.querySelector('[aria-live="polite"]');

describe("Toast", () => {
  it("draws each tone with its icon and action", () => {
    const undo = vi.fn();
    render(
      <>
        <Toast message="Published. Live within a minute." link={{ label: "View ↗", href: "/" }} />
        <Toast message="Block deleted." tone="neutral" action={{ label: "Undo", onAction: undo }} />
        <Toast message="Couldn’t publish. Your draft is safe." tone="error" />
      </>,
    );
    expect(screen.getByRole("link", { name: "View ↗" })).toHaveAttribute("href", "/");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalled();
    expect(screen.getByText("Couldn’t publish. Your draft is safe.").parentElement).toHaveClass("error");
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
  });

  it("shows one at a time, announces politely and leaves after 7 seconds", () => {
    render(
      <ToastProvider>
        <Trigger toast={{ message: "Preview link copied." }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(live()).toHaveTextContent("Preview link copied.");
    expect(screen.getAllByText("Preview link copied.")).toHaveLength(2);
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION - 1);
    });
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
    expect(live()).toHaveTextContent("");
  });

  it("Undo runs its action and closes the toast", () => {
    const undo = vi.fn();
    render(
      <ToastProvider>
        <Trigger
          toast={{
            message: "Deleted “Arcana Workspace”.",
            tone: "neutral",
            action: { label: "Undo", onAction: undo },
          }}
        />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("pauses while hovered or focused, then finishes its time", () => {
    render(
      <ToastProvider>
        <Trigger toast={{ message: "Block deleted.", duration: 1000 }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    const dismiss = screen.getByRole("button", { name: "Dismiss" });
    fireEvent.mouseEnter(dismiss.parentElement?.parentElement as Element);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    fireEvent.mouseLeave(dismiss.parentElement?.parentElement as Element);
    fireEvent.focus(dismiss);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    fireEvent.blur(dismiss);
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
  });

  it("a new toast replaces the old one with a full 7 seconds", () => {
    render(
      <ToastProvider>
        <Trigger toast={{ message: "Saved." }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
  });

  it("dismiss() clears it, and useToast needs the provider", () => {
    render(
      <ToastProvider>
        <Trigger toast={{ message: "Saved." }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
    cleanup();
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Trigger toast={{ message: "x" }} />)).toThrow(/ToastProvider/);
    err.mockRestore();
  });
});
