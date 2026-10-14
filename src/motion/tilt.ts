/**
 * M-HERO-TILT (04): the ink panel tilts toward the pointer and the speed lines re-aim at it.
 *
 * - The pointer is read once per frame, inside `requestAnimationFrame`, and written to `--mx` and
 *   `--my` on the hero section; the panel's CSS turns them into the tilt and the layer offsets.
 *   React re-renders nothing (04 · Ground rules 4).
 * - The speed-line path is rebuilt from the pointer each frame, until the frame-rate guard trips:
 *   a rolling average of the last 60 frame intervals above 22.2ms (under 45fps) stops the re-aim
 *   for the rest of the page view. Tilt and layers carry on (Ground rules 6).
 * - Leaving the hero returns everything to the rest pose (`--mx: .2; --my: -.1`, lines at 820, 230).
 *
 * Callers attach it only for a fine pointer that can hover, with motion allowed and the owner's
 * hero motion switch on.
 */
import { HERO_SPEED, speed } from "./speed-lines";

export const TILT_REST = { mx: 0.2, my: -0.1, fx: 820, fy: 230 } as const;
/** 45fps: an average frame interval above this stops the re-aim. */
export const GUARD_MS = 1000 / 45;
export const GUARD_FRAMES = 60;
/** Gaps longer than this are pauses in the pointer's movement, not slow frames. */
const PAUSE_MS = 100;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export interface TiltValues {
  mx: number;
  my: number;
  fx: number;
  fy: number;
}

/** The board's `heroMove` maths: pointer position → tilt (-1…1) and the lines' focus (1200×680). */
export function tiltFromPointer(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
): TiltValues {
  const rx = rect.width > 0 ? clamp01((clientX - rect.left) / rect.width) : 0.5;
  const ry = rect.height > 0 ? clamp01((clientY - rect.top) / rect.height) : 0.5;
  return { mx: rx * 2 - 1, my: ry * 2 - 1, fx: rx * 1200, fy: ry * 680 };
}

/** The laptop path for a focus point (04 · M-HERO-TILT). */
export function heroLines(fx: number, fy: number): string {
  const [, , count, rMin, rMax, R] = HERO_SPEED.laptop.args;
  return speed(fx, fy, count, rMin, rMax, R);
}

/** A rolling average of frame intervals; once tripped, it stays tripped. */
export class FrameGuard {
  private readonly samples: number[] = [];
  private sum = 0;
  private last: number | null = null;
  tripped = false;

  /** Records a frame at `t` (ms). Returns true while re-aiming is still allowed. */
  frame(t: number): boolean {
    if (this.tripped) return false;
    if (this.last !== null) {
      const dt = t - this.last;
      if (dt > 0 && dt < PAUSE_MS) {
        this.samples.push(dt);
        this.sum += dt;
        if (this.samples.length > GUARD_FRAMES) this.sum -= this.samples.shift() ?? 0;
        if (this.samples.length === GUARD_FRAMES && this.sum / GUARD_FRAMES > GUARD_MS) this.tripped = true;
      }
    }
    this.last = t;
    return !this.tripped;
  }

  /** A pause in movement: the next frame starts a new interval. */
  pause(): void {
    this.last = null;
  }
}

export interface TiltHandle {
  detach(): void;
  /** For tests and QA: whether the speed lines still re-aim. */
  readonly linesLive: boolean;
}

interface FrameApi {
  request(cb: (t: number) => void): number;
  cancel(id: number): void;
}

const browserFrames: FrameApi = {
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => {
    cancelAnimationFrame(id);
  },
};

/** Attaches the pointer tilt to the hero section. Returns a handle to detach it. */
export function attachTilt(
  section: HTMLElement,
  lines: SVGPathElement | null,
  frames: FrameApi = browserFrames,
): TiltHandle {
  const guard = new FrameGuard();
  let pointer: { x: number; y: number } | null = null;
  let frame = 0;

  const onFrame = (t: number) => {
    frame = 0;
    const live = guard.frame(t);
    if (!pointer) return;
    const v = tiltFromPointer(section.getBoundingClientRect(), pointer.x, pointer.y);
    pointer = null;
    section.style.setProperty("--mx", v.mx.toFixed(3));
    section.style.setProperty("--my", v.my.toFixed(3));
    if (live && lines) lines.setAttribute("d", heroLines(v.fx, v.fy));
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    pointer = { x: e.clientX, y: e.clientY };
    if (!frame) frame = frames.request(onFrame);
  };

  const onLeave = () => {
    if (frame) frames.cancel(frame);
    frame = 0;
    pointer = null;
    guard.pause();
    section.style.removeProperty("--mx");
    section.style.removeProperty("--my");
    if (lines) lines.setAttribute("d", heroLines(TILT_REST.fx, TILT_REST.fy));
  };

  section.addEventListener("pointermove", onMove);
  section.addEventListener("pointerleave", onLeave);

  return {
    detach() {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      onLeave();
    },
    get linesLive() {
      return !guard.tripped;
    },
  };
}
