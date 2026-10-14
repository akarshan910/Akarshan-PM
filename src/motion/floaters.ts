/**
 * M-HERO-FLOATERS (04): the floating-preview schedulers, ported from `Home.dc.html` (laptop:
 * `startFloat`, `spawn`, `leave`, `pick`, `hold`, `release`) and `HomeTablet.dc.html` (iPad: one
 * slot, its own areas and timings).
 *
 * The schedulers are plain objects with no React: they decide where each card is and hand every
 * change to `place(item, pose)`, which writes styles straight onto the card's elements. Each item
 * has its own card, so a slot "shows" an item by placing that item's card; cards not in a slot rest
 * invisible. Timers and randomness are injectable for tests.
 */

export interface FloaterPose {
  /** Position in % of the ink panel, depth in px and rotation in degrees (`.fl`). */
  x: number;
  y: number;
  z: number;
  r: number;
  /** The drift (`.tz` translate), in px. */
  tx: number;
  ty: number;
  /** 0 or 1. Pointer events follow: only a visible card takes the pointer. */
  op: number;
  /** The per-phase `transition`, with the hover shadow's appended (04 · M-HERO-FLOATERS). */
  tr: string;
}

export interface Clock {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
}

export interface SchedulerOptions {
  /** How many projects float. */
  count: number;
  /** Writes one card's pose. */
  place: (item: number, pose: FloaterPose) => void;
  random?: () => number;
  clock?: Clock;
}

export interface Scheduler {
  /** Puts every card at its rest pose: the first slots' items visible, the rest hidden. */
  rest(): void;
  /** Starts the rotation from the rest pose. */
  start(): void;
  /** Clears every timer; the cards stay where they are. */
  stop(): void;
  /** Hover on a visible card (laptop only). */
  hold(item: number): void;
  release(item: number): void;
}

/** The hover shadow keeps its own transition in every phase (04 · M-HERO-FLOATERS · Hover). */
export const SHADOW = ", box-shadow .3s var(--eo)";
/** "No transition" for position and opacity: only the hover shadow keeps one. */
const NONE = "box-shadow .3s var(--eo)";

const realClock: Clock = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => {
    globalThis.clearTimeout(id as ReturnType<typeof setTimeout>);
  },
};

// ---------------------------------------------------------------------------------------------
// Laptop
// ---------------------------------------------------------------------------------------------

export const LAPTOP = {
  ZONES: [
    { x: [70, 80], y: [3, 15], z: 200 },
    { x: [66, 76], y: [37, 47], z: 150 },
    { x: [70, 80], y: [69, 77], z: 180 },
  ],
  /** x%, y%, rotate° at rest. */
  REST: [
    [76, 9, 2],
    [71, 42, -2],
    [76, 73, 1.5],
  ],
  drift: [10, 18],
  dwell: [4800, 6800],
  gap: [300, 1300],
  firstLeave: 2600,
  firstLeaveStep: 1500,
  restDrift: 6000,
  fade: 700,
  spawnDelay: 60,
  releaseDelay: 900,
} as const;

type Phase = "rest" | "pre" | "in" | "out" | "gap" | "held";

interface Slot {
  item: number;
  x: number;
  y: number;
  z: number;
  r: number;
  ph: Phase;
}

/** A hidden card: no slot, invisible, parked at the first rest position. */
function hidden(z: number): FloaterPose {
  const [x, y, r] = LAPTOP.REST[0];
  return { x, y, z, r, tx: 0, ty: 0, op: 0, tr: NONE };
}

/**
 * The laptop scheduler. `slots` is Studio's "On screen at once" (1–3), capped by the number of
 * projects so a project never shows twice.
 */
export function laptopFloaters(options: SchedulerOptions & { slots: number }): Scheduler {
  const { count, place } = options;
  const random = options.random ?? Math.random;
  const clock = options.clock ?? realClock;
  const n = Math.max(0, Math.min(options.slots, LAPTOP.ZONES.length, count));
  const rand = (a: number, b: number) => a + random() * (b - a);
  const timers: unknown[] = [];
  const held: boolean[] = [];
  let slots: Slot[] = [];
  let next = 0;

  const restSlots = (): Slot[] =>
    Array.from({ length: n }, (_, i) => {
      const [x, y, r] = LAPTOP.REST[i] ?? LAPTOP.REST[0];
      return { item: i % count, x, y, z: LAPTOP.ZONES[i]?.z ?? 0, r, ph: "rest" };
    });

  const show = (s: Slot, pose: Partial<FloaterPose>) => {
    place(s.item, { x: s.x, y: s.y, z: s.z, r: s.r, tx: 0, ty: 0, op: 1, tr: NONE, ...pose });
  };
  const drift = (): { tx: number; ty: number } => {
    const a = rand(0, Math.PI * 2);
    const d = rand(LAPTOP.drift[0], LAPTOP.drift[1]);
    return { tx: Math.cos(a) * d, ty: Math.sin(a) * d };
  };
  /** The last pose written per item, so a fade keeps the card where it is. */
  const poses = new Map<number, FloaterPose>();
  const write = (item: number, pose: FloaterPose) => {
    poses.set(item, pose);
    place(item, pose);
  };

  const pick = (i: number): number => {
    const shown = slots.filter((s, j) => j !== i && s.ph !== "gap").map((s) => s.item);
    for (let k = 0; k < count; k++) {
      const it = (next + k) % count;
      if (!shown.includes(it)) {
        next = it + 1;
        return it;
      }
    }
    /* c8 ignore next 2 -- unreachable: slots never outnumber the projects */
    return next++ % count;
  };

  const leave = (i: number) => {
    const s = slots[i];
    if (!s) return;
    if (held[i]) {
      s.ph = "held";
      return;
    }
    s.ph = "out";
    const last = poses.get(s.item);
    if (last) write(s.item, { ...last, op: 0 });
    timers[i] = clock.setTimeout(() => {
      s.ph = "gap";
      timers[i] = clock.setTimeout(
        () => {
          spawn(i);
        },
        Math.round(rand(LAPTOP.gap[0], LAPTOP.gap[1])),
      );
    }, LAPTOP.fade);
  };

  const spawn = (i: number) => {
    const s = slots[i];
    const zone = LAPTOP.ZONES[i];
    if (!s || !zone) return;
    const { tx, ty } = drift();
    const dwell = Math.round(rand(LAPTOP.dwell[0], LAPTOP.dwell[1]));
    s.item = pick(i);
    s.x = rand(zone.x[0], zone.x[1]);
    s.y = rand(zone.y[0], zone.y[1]);
    s.r = rand(-2.5, 2.5);
    s.ph = "pre";
    const base = { x: s.x, y: s.y, z: s.z, r: s.r };
    write(s.item, { ...base, tx: 0, ty: 0, op: 0, tr: NONE });
    timers[i] = clock.setTimeout(() => {
      s.ph = "in";
      write(s.item, {
        ...base,
        tx,
        ty,
        op: 1,
        tr: `opacity .7s ease, transform ${dwell + 700}ms linear${SHADOW}`,
      });
      timers[i] = clock.setTimeout(() => {
        leave(i);
      }, dwell);
    }, LAPTOP.spawnDelay);
  };

  const scheduler: Scheduler = {
    rest() {
      slots = restSlots();
      const inSlot = new Set(slots.map((s) => s.item));
      for (let item = 0; item < count; item++) if (!inSlot.has(item)) write(item, hidden(0));
      for (const s of slots) {
        show(s, {});
        poses.set(s.item, { x: s.x, y: s.y, z: s.z, r: s.r, tx: 0, ty: 0, op: 1, tr: NONE });
      }
    },
    start() {
      scheduler.stop();
      if (n === 0) return;
      scheduler.rest();
      slots.forEach((s) => {
        s.ph = "in";
        write(s.item, {
          x: s.x,
          y: s.y,
          z: s.z,
          r: s.r,
          ...drift(),
          op: 1,
          tr: `opacity .7s ease, transform ${LAPTOP.restDrift}ms linear${SHADOW}`,
        });
      });
      next = n % count;
      slots.forEach((_, i) => {
        timers[i] = clock.setTimeout(
          () => {
            leave(i);
          },
          LAPTOP.firstLeave + i * LAPTOP.firstLeaveStep,
        );
      });
    },
    stop() {
      timers.forEach((t) => {
        clock.clearTimeout(t);
      });
      timers.length = 0;
      held.length = 0;
    },
    hold(item) {
      const i = slots.findIndex((s) => s.item === item && (s.ph === "in" || s.ph === "rest"));
      if (i !== -1) held[i] = true;
    },
    release(item) {
      const i = slots.findIndex((s) => s.item === item);
      if (i === -1) return;
      held[i] = false;
      const s = slots[i];
      if (s?.ph === "held") {
        clock.clearTimeout(timers[i]);
        timers[i] = clock.setTimeout(() => {
          leave(i);
        }, LAPTOP.releaseDelay);
      }
    },
  };
  return scheduler;
}

// ---------------------------------------------------------------------------------------------
// iPad
// ---------------------------------------------------------------------------------------------

export const IPAD = {
  AREAS: [
    { x: [60, 66], y: [3, 9] },
    { x: [64, 68], y: [79, 84] },
  ],
  REST: { x: 66, y: 82, r: 2 },
  z: 90,
  drift: [8, 14],
  dwell: [4800, 6400],
  gap: [500, 1400],
  firstLeave: 3200,
  restDrift: 6000,
  fade: 700,
  spawnDelay: 60,
} as const;

/** The iPad scheduler: one card at a time, in one of two areas, round-robin from item 1, no hold. */
export function ipadFloaters(options: SchedulerOptions): Scheduler {
  const { count, place } = options;
  const random = options.random ?? Math.random;
  const clock = options.clock ?? realClock;
  const rand = (a: number, b: number) => a + random() * (b - a);
  let timer: unknown;
  let item = 0;
  let next = 1;
  let pose: FloaterPose = { ...IPAD.REST, z: IPAD.z, tx: 0, ty: 0, op: 1, tr: NONE };
  const write = (p: FloaterPose) => {
    pose = p;
    place(item, p);
  };
  const drift = () => {
    const a = rand(0, Math.PI * 2);
    const d = rand(IPAD.drift[0], IPAD.drift[1]);
    return { tx: Math.cos(a) * d, ty: Math.sin(a) * d };
  };

  const leave = () => {
    write({ ...pose, op: 0 });
    timer = clock.setTimeout(spawn, IPAD.fade + Math.round(rand(IPAD.gap[0], IPAD.gap[1])));
  };
  const spawn = () => {
    const area = IPAD.AREAS[Math.floor(random() * IPAD.AREAS.length)] ?? IPAD.AREAS[0];
    const { tx, ty } = drift();
    const dwell = Math.round(rand(IPAD.dwell[0], IPAD.dwell[1]));
    item = next % count;
    next += 1;
    const base = {
      x: rand(area.x[0], area.x[1]),
      y: rand(area.y[0], area.y[1]),
      z: IPAD.z,
      r: rand(-2.5, 2.5),
    };
    write({ ...base, tx: 0, ty: 0, op: 0, tr: NONE });
    timer = clock.setTimeout(() => {
      write({ ...base, tx, ty, op: 1, tr: `opacity .7s ease, transform ${dwell + 700}ms linear${SHADOW}` });
      timer = clock.setTimeout(leave, dwell);
    }, IPAD.spawnDelay);
  };

  const scheduler: Scheduler = {
    rest() {
      for (let i = 1; i < count; i++) place(i, { ...IPAD.REST, z: IPAD.z, tx: 0, ty: 0, op: 0, tr: NONE });
      item = 0;
      next = 1;
      write({ ...IPAD.REST, z: IPAD.z, tx: 0, ty: 0, op: 1, tr: NONE });
    },
    start() {
      scheduler.stop();
      if (count === 0) return;
      scheduler.rest();
      write({
        ...pose,
        ...drift(),
        tr: `opacity .7s ease, transform ${IPAD.restDrift}ms linear${SHADOW}`,
      });
      timer = clock.setTimeout(leave, IPAD.firstLeave);
    },
    stop() {
      clock.clearTimeout(timer);
    },
    hold() {
      /* iPad has no hover hold (04 · M-HERO-FLOATERS) */
    },
    release() {
      /* no hold, so nothing to release */
    },
  };
  return scheduler;
}

/** The laptop rest pose of item `i` when it's in slot `i`, for the prerendered HTML. */
export function laptopRestPose(i: number, slots: number): FloaterPose {
  const rest = LAPTOP.REST[i];
  const zone = LAPTOP.ZONES[i];
  if (i >= slots || !rest || !zone) return hidden(0);
  return { x: rest[0], y: rest[1], z: zone.z, r: rest[2], tx: 0, ty: 0, op: 1, tr: NONE };
}

/** The iPad rest pose of item `i`: item 0 shows, the rest wait hidden. */
export function ipadRestPose(i: number): FloaterPose {
  return { ...IPAD.REST, z: IPAD.z, tx: 0, ty: 0, op: i === 0 ? 1 : 0, tr: NONE };
}
