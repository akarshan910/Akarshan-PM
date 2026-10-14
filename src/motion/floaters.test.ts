import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  IPAD,
  LAPTOP,
  SHADOW,
  ipadFloaters,
  ipadRestPose,
  laptopFloaters,
  laptopRestPose,
  type FloaterPose,
} from "./floaters";

/** Tracks the last pose of every card, like the DOM would. */
function host() {
  const poses = new Map<number, FloaterPose>();
  return {
    poses,
    place: (item: number, pose: FloaterPose) => {
      poses.set(item, pose);
    },
    visible: () => [...poses.entries()].filter(([, p]) => p.op > 0).map(([i]) => i),
  };
}

/** A seeded generator, so runs are repeatable. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("laptopFloaters", () => {
  it("starts from the rest pose: N cards at their REST positions, the rest hidden", () => {
    const h = host();
    const s = laptopFloaters({ count: 5, slots: 3, place: h.place, random: seeded() });
    s.rest();
    expect(h.visible()).toEqual([0, 1, 2]);
    LAPTOP.REST.forEach(([x, y, r], i) => {
      expect(h.poses.get(i)).toMatchObject({ x, y, r, z: LAPTOP.ZONES[i]?.z, op: 1, tx: 0, ty: 0 });
    });
    expect(h.poses.get(3)?.op).toBe(0);
    expect(h.poses.get(4)?.op).toBe(0);
  });

  it("drifts from rest over 6s, then leaves slot i at 2600 + i × 1500ms", () => {
    const h = host();
    const s = laptopFloaters({ count: 5, slots: 3, place: h.place, random: seeded(7) });
    s.start();
    const first = h.poses.get(0);
    expect(first?.tr).toBe(`opacity .7s ease, transform 6000ms linear${SHADOW}`);
    const d = Math.hypot(first?.tx ?? 0, first?.ty ?? 0);
    expect(d).toBeGreaterThanOrEqual(10);
    expect(d).toBeLessThanOrEqual(18);
    vi.advanceTimersByTime(2599);
    expect(h.poses.get(0)?.op).toBe(1);
    vi.advanceTimersByTime(1);
    expect(h.poses.get(0)?.op).toBe(0);
    expect(h.poses.get(1)?.op).toBe(1);
    vi.advanceTimersByTime(1500);
    expect(h.poses.get(1)?.op).toBe(0);
  });

  it("never shows the same project in two slots, and spawns inside each zone", () => {
    const h = host();
    const shown: number[][] = [];
    const s = laptopFloaters({
      count: 4,
      slots: 3,
      random: seeded(3),
      place: (item, pose) => {
        h.place(item, pose);
        shown.push(h.visible());
      },
    });
    s.start();
    for (let t = 0; t < 120_000; t += 50) {
      vi.advanceTimersByTime(50);
      const v = h.visible();
      expect(new Set(v).size).toBe(v.length);
      expect(v.length).toBeLessThanOrEqual(3);
    }
    for (const p of h.poses.values()) {
      if (p.op === 0) continue;
      const zone = LAPTOP.ZONES.find((z) => z.z === p.z);
      expect(zone).toBeDefined();
    }
    expect(shown.length).toBeGreaterThan(20);
  });

  it("uses the spawn timings: 60ms in, a 4.8–6.8s dwell, a .7s fade and a .3–1.3s gap", () => {
    const h = host();
    const s = laptopFloaters({ count: 3, slots: 1, place: h.place, random: () => 0 });
    s.start();
    vi.advanceTimersByTime(2600); // first leave
    expect(h.poses.get(0)?.op).toBe(0);
    vi.advanceTimersByTime(700 + 300); // fade, then the shortest gap
    // spawned: item 1 (round-robin from N % count), invisible, no transition
    expect(h.poses.get(1)).toMatchObject({ op: 0, tx: 0, ty: 0, tr: "box-shadow .3s var(--eo)" });
    expect(h.poses.get(1)?.x).toBe(70);
    expect(h.poses.get(1)?.y).toBe(3);
    expect(h.poses.get(1)?.r).toBe(-2.5);
    vi.advanceTimersByTime(60);
    expect(h.poses.get(1)).toMatchObject({ op: 1, tr: `opacity .7s ease, transform 5500ms linear${SHADOW}` });
    vi.advanceTimersByTime(4799);
    expect(h.poses.get(1)?.op).toBe(1);
    vi.advanceTimersByTime(1);
    expect(h.poses.get(1)?.op).toBe(0);
  });

  it("holds a hovered card past its dwell, and lets it go 900ms after the pointer leaves", () => {
    const h = host();
    const s = laptopFloaters({ count: 5, slots: 3, place: h.place, random: seeded(11) });
    s.start();
    s.hold(0);
    vi.advanceTimersByTime(20_000);
    expect(h.poses.get(0)?.op).toBe(1);
    s.release(0);
    vi.advanceTimersByTime(899);
    expect(h.poses.get(0)?.op).toBe(1);
    vi.advanceTimersByTime(1);
    expect(h.poses.get(0)?.op).toBe(0);
  });

  it("releasing a card that was never held changes nothing", () => {
    const h = host();
    const s = laptopFloaters({ count: 5, slots: 3, place: h.place, random: seeded(2) });
    s.start();
    s.release(4);
    s.release(0);
    vi.advanceTimersByTime(2599);
    expect(h.poses.get(0)?.op).toBe(1);
  });

  it("caps the slots by the number of projects and does nothing without any", () => {
    const h = host();
    laptopFloaters({ count: 2, slots: 3, place: h.place }).rest();
    expect(h.visible()).toEqual([0, 1]);
    const none = host();
    const s = laptopFloaters({ count: 0, slots: 3, place: none.place });
    s.start();
    vi.advanceTimersByTime(10_000);
    expect(none.poses.size).toBe(0);
  });

  it("stop() clears every timer, so nothing moves afterwards", () => {
    const h = host();
    const s = laptopFloaters({ count: 5, slots: 3, place: h.place, random: seeded(5) });
    s.start();
    s.stop();
    const before = JSON.stringify([...h.poses]);
    vi.advanceTimersByTime(60_000);
    expect(JSON.stringify([...h.poses])).toBe(before);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("has a rest pose for prerendering", () => {
    expect(laptopRestPose(1, 3)).toMatchObject({ x: 71, y: 42, z: 150, r: -2, op: 1 });
    expect(laptopRestPose(2, 2).op).toBe(0);
  });
});

describe("ipadFloaters", () => {
  it("rests one card at 66%, 82%, 2°, then leaves at 3200ms", () => {
    const h = host();
    const s = ipadFloaters({ count: 3, place: h.place, random: seeded(4) });
    s.start();
    expect(h.visible()).toEqual([0]);
    expect(h.poses.get(0)).toMatchObject({ x: 66, y: 82, r: 2, z: IPAD.z });
    const d = Math.hypot(h.poses.get(0)?.tx ?? 0, h.poses.get(0)?.ty ?? 0);
    expect(d).toBeGreaterThanOrEqual(8);
    expect(d).toBeLessThanOrEqual(14);
    vi.advanceTimersByTime(3199);
    expect(h.poses.get(0)?.op).toBe(1);
    vi.advanceTimersByTime(1);
    expect(h.poses.get(0)?.op).toBe(0);
  });

  it("spawns round-robin from item 1, in one of its two areas, with its own timings", () => {
    const h = host();
    const s = ipadFloaters({ count: 3, place: h.place, random: () => 0.99 });
    s.start();
    vi.advanceTimersByTime(3200 + 700 + Math.round(500 + 0.99 * 900));
    const p = h.poses.get(1);
    expect(p?.op).toBe(0);
    expect(p?.x).toBeGreaterThanOrEqual(64);
    expect(p?.y).toBeGreaterThanOrEqual(79);
    vi.advanceTimersByTime(60);
    expect(h.poses.get(1)?.op).toBe(1);
    expect(h.poses.get(1)?.tr).toBe(
      `opacity .7s ease, transform ${Math.round(4800 + 0.99 * 1600) + 700}ms linear${SHADOW}`,
    );
    // and on to item 2, then back to 0
    vi.advanceTimersByTime(10_000);
    vi.advanceTimersByTime(10_000);
    expect(h.visible().length).toBeLessThanOrEqual(1);
  });

  it("has no hover hold, and stops cleanly", () => {
    const h = host();
    const s = ipadFloaters({ count: 2, place: h.place, random: seeded(9) });
    s.start();
    s.hold(0);
    vi.advanceTimersByTime(3200);
    expect(h.poses.get(0)?.op).toBe(0);
    s.release(0);
    s.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does nothing without projects, and rests item 0 visible", () => {
    const h = host();
    ipadFloaters({ count: 0, place: h.place }).start();
    expect(h.poses.size).toBe(0);
    expect(ipadRestPose(0).op).toBe(1);
    expect(ipadRestPose(1).op).toBe(0);
  });
});
