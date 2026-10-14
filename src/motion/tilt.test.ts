// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { speed } from "./speed-lines";
import { attachTilt, FrameGuard, GUARD_FRAMES, heroLines, TILT_REST, tiltFromPointer } from "./tilt";

const rect = { left: 100, top: 50, width: 1000, height: 500 };

describe("tiltFromPointer", () => {
  it("maps the pointer to -1…1 and to the lines' focus in the 1200×680 viewBox", () => {
    expect(tiltFromPointer(rect, 100, 50)).toEqual({ mx: -1, my: -1, fx: 0, fy: 0 });
    expect(tiltFromPointer(rect, 600, 300)).toEqual({ mx: 0, my: 0, fx: 600, fy: 340 });
    expect(tiltFromPointer(rect, 1100, 550)).toEqual({ mx: 1, my: 1, fx: 1200, fy: 680 });
  });

  it("clamps outside the section and copes with an empty box", () => {
    expect(tiltFromPointer(rect, -500, 9999)).toEqual({ mx: -1, my: 1, fx: 0, fy: 680 });
    expect(tiltFromPointer({ left: 0, top: 0, width: 0, height: 0 }, 5, 5)).toEqual({
      mx: 0,
      my: 0,
      fx: 600,
      fy: 340,
    });
  });

  it("re-aims with the board's speed() arguments", () => {
    expect(heroLines(820, 230)).toBe(speed(820, 230, 130, 220, 360, 1600));
  });
});

describe("FrameGuard", () => {
  it("keeps going at 60fps", () => {
    const g = new FrameGuard();
    for (let i = 0; i < 200; i++) expect(g.frame(i * 16.7)).toBe(true);
  });

  it("trips for good once the last 60 intervals average under 45fps", () => {
    const g = new FrameGuard();
    let t = 0;
    for (let i = 0; i < GUARD_FRAMES; i++) g.frame((t += 16));
    // 16ms frames, then 30ms ones: the rolling average passes 22.2ms on the 27th slow frame.
    let slow = 0;
    while (g.frame((t += 30))) slow++;
    expect(slow).toBe(26);
    expect(g.tripped).toBe(true);
    expect(g.frame((t += 16))).toBe(false);
  });

  it("ignores pauses in the pointer's movement", () => {
    const g = new FrameGuard();
    let t = 0;
    for (let i = 0; i < 300; i++) {
      g.frame((t += 16));
      if (i % 10 === 0) t += 2000; // the pointer rests now and then
      if (i % 25 === 0) g.pause();
    }
    expect(g.tripped).toBe(false);
  });
});

describe("attachTilt", () => {
  function setup() {
    const section = document.createElement("section");
    section.getBoundingClientRect = () => ({
      ...rect,
      right: 1100,
      bottom: 550,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.appendChild(path);
    section.appendChild(svg);
    const queue: ((t: number) => void)[] = [];
    let now = 0;
    const frames = {
      request: (cb: (t: number) => void) => queue.push(cb),
      cancel: (id: number) => {
        queue[id - 1] = () => undefined;
      },
    };
    const flush = (dt = 16) => {
      const cbs = queue.splice(0);
      now += dt;
      for (const cb of cbs) cb(now);
    };
    const move = (x: number, y: number, pointerType = "mouse") => {
      const e = new Event("pointermove") as PointerEvent;
      Object.assign(e, { clientX: x, clientY: y, pointerType });
      section.dispatchEvent(e);
    };
    return { section, path, frames, flush, move, queue };
  }

  it("writes --mx and --my and re-aims the lines once per frame", () => {
    const { section, path, frames, flush, move, queue } = setup();
    attachTilt(section, path, frames);
    move(600, 300);
    move(1100, 550);
    expect(queue).toHaveLength(1);
    expect(section.style.getPropertyValue("--mx")).toBe("");
    flush();
    expect(section.style.getPropertyValue("--mx")).toBe("1.000");
    expect(section.style.getPropertyValue("--my")).toBe("1.000");
    expect(path.getAttribute("d")).toBe(heroLines(1200, 680));
  });

  it("ignores touch pointers", () => {
    const { section, path, frames, move, queue } = setup();
    attachTilt(section, path, frames);
    move(600, 300, "touch");
    expect(queue).toHaveLength(0);
  });

  it("returns to the rest pose on pointerleave and on detach", () => {
    const { section, path, frames, flush, move } = setup();
    const handle = attachTilt(section, path, frames);
    move(100, 50);
    flush();
    section.dispatchEvent(new Event("pointerleave"));
    expect(section.style.getPropertyValue("--mx")).toBe("");
    expect(path.getAttribute("d")).toBe(heroLines(TILT_REST.fx, TILT_REST.fy));
    move(100, 50);
    handle.detach();
    flush();
    expect(section.style.getPropertyValue("--mx")).toBe("");
  });

  it("stops re-aiming the lines when frames are slow, while the tilt carries on", () => {
    const { section, path, frames, flush, move } = setup();
    const handle = attachTilt(section, path, frames);
    for (let i = 0; i < GUARD_FRAMES + 2; i++) {
      move(600, 300);
      flush(40);
    }
    expect(handle.linesLive).toBe(false);
    const d = path.getAttribute("d");
    move(1100, 50);
    flush(40);
    expect(path.getAttribute("d")).toBe(d);
    expect(section.style.getPropertyValue("--mx")).toBe("1.000");
  });

  it("works without a lines path", () => {
    const { section, frames, flush, move } = setup();
    attachTilt(section, null, frames).detach();
    attachTilt(section, null, frames);
    move(600, 300);
    flush();
    expect(section.style.getPropertyValue("--mx")).toBe("0.000");
  });
});
