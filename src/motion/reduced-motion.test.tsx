// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { prefersReducedMotion, REDUCED_MOTION_QUERY, useReducedMotion } from "./reduced-motion";

/** A matchMedia double whose `matches` can change and notify its listeners. */
function fakeQuery(initial: boolean) {
  const listeners = new Set<() => void>();
  const mq = {
    matches: initial,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  const matchMedia = vi.fn((q: string) => {
    expect(q).toBe(REDUCED_MOTION_QUERY);
    return mq;
  });
  vi.stubGlobal("matchMedia", matchMedia);
  return {
    listeners,
    set(value: boolean) {
      mq.matches = value;
      for (const fn of listeners) fn();
    },
  };
}

function Probe() {
  return <p>{useReducedMotion() ? "still" : "moving"}</p>;
}

afterEach(() => {
  document.documentElement.classList.remove("still");
  vi.unstubAllGlobals();
});

describe("prefersReducedMotion", () => {
  it("reads the setting, and the still class wins", () => {
    fakeQuery(false);
    expect(prefersReducedMotion()).toBe(false);
    document.documentElement.classList.add("still");
    expect(prefersReducedMotion()).toBe(true);
  });

  it("is true when the media query matches, and false without matchMedia", () => {
    fakeQuery(true);
    expect(prefersReducedMotion()).toBe(true);
    vi.stubGlobal("matchMedia", undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("useReducedMotion", () => {
  it("updates live when the setting changes, and keeps html.still in step", () => {
    const q = fakeQuery(false);
    const { unmount } = render(<Probe />);
    expect(screen.getByText("moving")).toBeInTheDocument();
    act(() => {
      q.set(true);
    });
    expect(screen.getByText("still")).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("still");
    act(() => {
      q.set(false);
    });
    expect(screen.getByText("moving")).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass("still");
    unmount();
    expect(q.listeners.size).toBe(0);
  });

  it("follows the still class, even when matchMedia can't notify", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );
    render(<Probe />);
    expect(screen.getByText("moving")).toBeInTheDocument();
    await act(async () => {
      document.documentElement.classList.add("still");
      await Promise.resolve();
    });
    expect(screen.getByText("still")).toBeInTheDocument();
  });
});
