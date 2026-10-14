// @vitest-environment jsdom
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildHomeView } from "~/lib/site";
import { loadLocalV0 } from "~/lib/sources/local-v0";

import { Hero } from "./Hero";
import { applyPose } from "./HeroFloaters";

const home = buildHomeView(loadLocalV0(new Date("2026-10-13T12:30:00Z")));
const hero = home.sections.find((s) => s.kind === "hero");
if (!hero) throw new Error("no hero");

let matching: string[] = [];
let ioCallbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];

beforeEach(() => {
  matching = ["(min-width: 1280px)", "(hover: hover) and (pointer: fine)"];
  ioCallbacks = [];
  vi.useFakeTimers();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((q: string) => ({
      matches: matching.includes(q),
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        ioCallbacks.push(cb);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) =>
    setTimeout(() => {
      cb(performance.now());
    }, 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    clearTimeout(id);
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("still", "no-intro");
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
});

const renderHero = () =>
  render(<Hero section={hero} profile={home.profile} projects={home.projects} posts={home.posts} />);
const laptopCards = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>(".flLaptop a")];
const visible = (cards: HTMLElement[]) => cards.filter((a) => a.style.opacity === "1").length;

describe("Hero motion", () => {
  it("runs the laptop floaters: the first card leaves at 2.6s and another takes its place", () => {
    const { container } = renderHero();
    const cards = laptopCards(container);
    expect(visible(cards)).toBe(3);
    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(cards[0]?.style.opacity).toBe("0");
    act(() => {
      vi.advanceTimersByTime(700 + 1300 + 60); // the longest gap, then the fade in
    });
    expect(cards[3]?.style.opacity).toBe("1"); // round-robin: item 3 is next
    expect(visible(cards)).toBeLessThanOrEqual(3);
  });

  it("holds a hovered card", () => {
    const { container } = renderHero();
    const cards = laptopCards(container);
    if (!cards[0]) throw new Error("no card");
    fireEvent.mouseEnter(cards[0]);
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(cards[0].style.opacity).toBe("1");
    fireEvent.mouseLeave(cards[0]);
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(cards[0].style.opacity).toBe("0");
  });

  it("pauses off screen and restarts from the rest pose", () => {
    const { container } = renderHero();
    const section = container.querySelector("section");
    act(() => {
      for (const cb of ioCallbacks) cb([{ isIntersecting: false }]);
    });
    expect(section).toHaveClass("paused");
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    const cards = laptopCards(container);
    expect(cards[0]?.style.opacity).toBe("1"); // nothing moved while paused
    act(() => {
      for (const cb of ioCallbacks) cb([{ isIntersecting: true }]);
    });
    expect(section).not.toHaveClass("paused");
    expect(visible(cards)).toBe(3);
  });

  it("schedules nothing under reduced motion or ?qa=1, and holds the rest pose", () => {
    document.documentElement.classList.add("still");
    const reduced = renderHero();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(visible(laptopCards(reduced.container))).toBe(3);
    expect(laptopCards(reduced.container)[0]?.style.opacity).toBe("1");
    reduced.unmount();
    document.documentElement.classList.remove("still");

    window.history.replaceState(null, "", "/?qa=1");
    const qa = renderHero();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(laptopCards(qa.container)[0]?.style.opacity).toBe("1");
  });

  it("runs the single iPad floater at iPad widths", () => {
    matching = ["(min-width: 768px) and (max-width: 1279px)"];
    const { container } = renderHero();
    const pad = [...container.querySelectorAll<HTMLElement>(".flIpad a")];
    expect(visible(pad)).toBe(1);
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    expect(pad[0]?.style.opacity).toBe("0");
  });

  it("tilts toward the pointer on fine pointers, and not with hero motion off", () => {
    const { container, unmount } = renderHero();
    const section = container.querySelector("section");
    if (!section) throw new Error("no section");
    const move = new Event("pointermove") as PointerEvent;
    Object.assign(move, { clientX: 0, clientY: 0, pointerType: "mouse" });
    section.dispatchEvent(move);
    act(() => {
      vi.advanceTimersByTime(20);
    });
    // jsdom lays nothing out, so the pointer reads as the middle of an empty box.
    expect(section.style.getPropertyValue("--mx")).toBe("0.000");
    unmount();

    const off = {
      ...hero,
      hero: { motion: false, floaters: hero.hero?.floaters ?? { items: [], atOnce: 3 as const } },
    };
    const flat = render(
      <Hero section={off} profile={home.profile} projects={home.projects} posts={home.posts} />,
    );
    const s2 = flat.container.querySelector("section");
    s2?.dispatchEvent(move);
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(s2?.style.getPropertyValue("--mx")).toBe("");
  });

  it("marks the entrance as played once every line and the brush have finished", () => {
    const { container } = renderHero();
    const section = container.querySelector("section");
    if (!section) throw new Error("no section");
    const lines = [...container.querySelectorAll(".rise")];
    // jsdom has no AnimationEvent, so React listens for the prefixed name there.
    const end = (el: Element, animationName: string) => {
      const e = new Event("webkitAnimationEnd", { bubbles: true });
      Object.assign(e, { animationName });
      el.dispatchEvent(e);
    };
    end(section, "vaPulse");
    for (const l of lines) end(l, "vaRise");
    expect(sessionStorage.getItem("va:intro")).toBeNull();
    end(container.querySelector("path[d^='M6 24']") ?? section, "vaInkDraw");
    expect(sessionStorage.getItem("va:intro")).toBe("1");
    expect(document.documentElement).toHaveClass("no-intro");
  });

  it("doesn't wait for a line that's hidden, which never fires animationend", () => {
    sessionStorage.clear();
    document.documentElement.classList.remove("no-intro");
    const { container } = renderHero();
    const section = container.querySelector("section");
    if (!section) throw new Error("no section");
    const end = (el: Element, animationName: string) => {
      const e = new Event("webkitAnimationEnd", { bubbles: true });
      Object.assign(e, { animationName });
      el.dispatchEvent(e);
    };
    const intro = container.querySelector<HTMLElement>(".intro");
    if (intro) intro.style.display = "none"; // as the phone layout does
    for (const l of container.querySelectorAll(".rise")) if (l !== intro) end(l, "vaRise");
    end(container.querySelector("path[d^='M6 24']") ?? section, "vaInkDraw");
    expect(sessionStorage.getItem("va:intro")).toBe("1");
  });

  it("applyPose ignores a missing card", () => {
    expect(() => {
      applyPose(null, { x: 0, y: 0, z: 0, r: 0, tx: 0, ty: 0, op: 0, tr: "" });
    }).not.toThrow();
  });
});
