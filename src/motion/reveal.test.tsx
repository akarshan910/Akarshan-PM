// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { watchVisibility } from "./pause";
import { REVEAL_MARGIN, revealStep, RUN_CLASS, setupReveal, useReveal, WAIT_CLASS } from "./reveal";

type Callback = (entries: { isIntersecting: boolean }[]) => void;
let observers: { cb: Callback; options: IntersectionObserverInit | undefined; disconnect: () => void }[] = [];
let reduced = false;

beforeEach(() => {
  observers = [];
  reduced = false;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      disconnected = false;
      constructor(cb: Callback, options?: IntersectionObserverInit) {
        observers.push({
          cb,
          options,
          disconnect: () => {
            this.disconnected = true;
          },
        });
      }
      observe() {}
      disconnect() {
        const o = observers.find((x) => x.cb === this.cb);
        o?.disconnect();
      }
      get cb() {
        return observers[observers.length - 1]?.cb;
      }
    },
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduced })),
  );
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("still");
});

/** A section at `top` px, with `n` laid-out blocks. */
function section(top: number, n = 7) {
  const el = document.createElement("section");
  el.getBoundingClientRect = () => ({ top }) as DOMRect;
  for (let i = 0; i < n; i++) {
    const child = document.createElement("div");
    child.getClientRects = () => ({ length: i === 2 ? 0 : 1 }) as DOMRectList; // block 2 is hidden
    el.appendChild(child);
  }
  document.body.appendChild(el);
  return el;
}

describe("revealStep", () => {
  it("staggers at most five steps", () => {
    expect([0, 1, 2, 3, 4, 5, 9, -1].map(revealStep)).toEqual([0, 1, 2, 3, 4, 4, 4, 0]);
  });
});

describe("setupReveal", () => {
  it("hides a section below the fold, then reveals it once with the stagger", () => {
    const el = section(2000);
    const onReveal = vi.fn();
    const onWait = vi.fn();
    setupReveal(el, { onReveal, onWait });
    expect(el.classList.contains(WAIT_CLASS)).toBe(true);
    expect(onWait).toHaveBeenCalledOnce();
    const steps = [...el.children].map((c) => (c as HTMLElement).dataset.revealStep);
    expect(steps).toEqual(["0", "1", undefined, "2", "3", "4", "4"]);
    expect(observers[0]?.options?.rootMargin).toBe(REVEAL_MARGIN);

    observers[0]?.cb([{ isIntersecting: false }]);
    expect(el.classList.contains(WAIT_CLASS)).toBe(true);
    observers[0]?.cb([{ isIntersecting: true }]);
    expect(el.classList.contains(WAIT_CLASS)).toBe(false);
    expect(el.classList.contains(RUN_CLASS)).toBe(true);
    expect(onReveal).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1000);
    expect(el.classList.contains(RUN_CLASS)).toBe(false);
    expect((el.children[0] as HTMLElement).dataset.revealStep).toBeUndefined();
  });

  it("leaves a section that's already on screen alone", () => {
    const el = section(100);
    const onReveal = vi.fn();
    setupReveal(el, { onReveal });
    expect(el.className).toBe("");
    expect(onReveal).toHaveBeenCalledOnce();
    expect(observers).toHaveLength(0);
  });

  it("does nothing under reduced motion", () => {
    reduced = true;
    const el = section(2000);
    setupReveal(el);
    expect(el.className).toBe("");
    document.documentElement.classList.add("still");
    reduced = false;
    setupReveal(el);
    expect(el.className).toBe("");
  });

  it("selects blocks and cleans up", () => {
    const el = section(2000, 3);
    const cleanup = setupReveal(el, { blocks: ":scope > div:first-child" });
    expect((el.children[0] as HTMLElement).dataset.revealStep).toBe("0");
    expect((el.children[1] as HTMLElement).dataset.revealStep).toBeUndefined();
    cleanup();
    expect(el.className).toBe("");
    expect((el.children[0] as HTMLElement).dataset.revealStep).toBeUndefined();
  });
});

describe("useReveal", () => {
  it("prepares the element after mount", () => {
    function Probe() {
      const ref = useReveal<HTMLDivElement>({ blocks: "p" });
      return (
        <div ref={ref}>
          <p>a</p>
        </div>
      );
    }
    // jsdom lays nothing out: getClientRects is empty and the top is 0, so it's "on screen".
    const { container } = render(<Probe />);
    expect(container.firstElementChild?.className).toBe("");
  });
});

describe("watchVisibility", () => {
  it("reports off screen and hidden tabs, once per change", () => {
    const el = document.createElement("div");
    const seen: boolean[] = [];
    const stop = watchVisibility(el, (v) => seen.push(v));
    expect(seen).toEqual([true]);
    observers[0]?.cb([{ isIntersecting: false }]);
    observers[0]?.cb([{ isIntersecting: false }]);
    observers[0]?.cb([{ isIntersecting: true }]);
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(seen).toEqual([true, false, true, false, true]);
    stop();
    document.dispatchEvent(new Event("visibilitychange"));
    expect(seen).toHaveLength(5);
  });
});
