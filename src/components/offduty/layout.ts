/**
 * C17 · Where each Off duty panel sits, and the geometry of its speed lines, per device. Values are
 * from Home.dc.html (laptop), HomeTablet.dc.html (iPad) and HomeMobile.dc.html (phone); the speed
 * lines on every board are `speed()` around these focus points (02 · C17), checked in the tests.
 */
import { offDutySpeed } from "~/motion/speed-lines";

export type LaptopSlot = "big" | "side" | "bottom";
export type IpadSlot = "big" | "half" | "third";

export interface Placement<Slot> {
  slot: Slot;
  column: string;
  row: string;
}

/** Each slot's panel size on its board and the speed lines' focus, in that panel's pixels. */
export const SLOT_LINES = {
  laptop: {
    big: { w: 695, h: 568, fx: 540, fy: 120 },
    side: { w: 493, h: 278, fx: 400, fy: 110 },
    bottom: { w: 392, h: 340, fx: 300, fy: 70 },
  },
  ipad: {
    big: { w: 770, h: 560, fx: 640, fy: 100 },
    half: { w: 380, h: 300, fx: 318, fy: 70 },
    third: { w: 250, h: 450, fx: 190, fy: 60 },
  },
  phone: { w: 300, h: 170, fx: 230, fy: 70 },
} as const;

export interface SpeedLines {
  viewBox: string;
  d: string;
}

const cache = new Map<string, SpeedLines>();
/** The speed-line path for a slot, computed once per slot. */
export function slotLines(g: { w: number; h: number; fx: number; fy: number }): SpeedLines {
  const key = `${g.w}x${g.h}`;
  let lines = cache.get(key);
  if (!lines) {
    lines = { viewBox: `0 0 ${g.w} ${g.h}`, d: offDutySpeed(g.w, g.h, g.fx, g.fy) };
    cache.set(key, lines);
  }
  return lines;
}

/** A row of `count` panels across `columns` columns, stretched to fill (02 · C17 · Fewer than six). */
function across(k: number, count: number, columns: number): string {
  const span = columns / count;
  return `${1 + k * span} / ${1 + (k + 1) * span}`;
}

/**
 * Laptop: 12 columns. Item 1 is the big panel (columns 1–7, rows 1–2), items 2–3 the side stack,
 * then rows of three at the bottom-row size. Short rows stretch: 2 → 6 + 6, 1 → 12.
 */
export function laptopPlacement(i: number, n: number): Placement<LaptopSlot> {
  if (i === 0) return { slot: "big", column: n === 1 ? "1 / 13" : "1 / 8", row: "1 / 3" };
  if (i <= 2) return { slot: "side", column: "8 / 13", row: n === 2 ? "1 / 3" : String(i) };
  const g = Math.floor((i - 3) / 3);
  const count = Math.min(3, n - 3 - g * 3);
  return { slot: "bottom", column: across((i - 3) % 3, count, 12), row: String(3 + g) };
}

export function laptopRows(n: number): string {
  const bottom = Math.ceil(Math.max(0, n - 3) / 3);
  return ["278px", "278px", ...Array.from({ length: bottom }, () => "340px")].join(" ");
}

/**
 * iPad: 6 columns. Item 1 full width, items 2–3 three columns each, items 4–6 two columns each, then
 * rows of two. Short rows stretch to fill.
 */
export function ipadPlacement(i: number, n: number): Placement<IpadSlot> {
  if (i === 0) return { slot: "big", column: "1 / 7", row: "1" };
  if (i <= 2) return { slot: "half", column: across(i - 1, Math.min(2, n - 1), 6), row: "2" };
  if (i <= 5) return { slot: "third", column: across(i - 3, Math.min(3, n - 3), 6), row: "3" };
  const g = Math.floor((i - 6) / 2);
  return { slot: "third", column: across((i - 6) % 2, Math.min(2, n - 6 - g * 2), 6), row: String(4 + g) };
}

export function ipadRows(n: number): string {
  const rows = ["560px"];
  if (n > 1) rows.push("300px");
  if (n > 3) rows.push("450px");
  for (let k = 0; k < Math.ceil(Math.max(0, n - 6) / 2); k++) rows.push("450px");
  return rows.join(" ");
}

/** The spine colours cycle Coral, Amber, Sky, Violet, Teal, Yellow, Green, Slate (02 · C17). */
export const SPINE_COLOURS = [
  "#FF5A67",
  "#F5A524",
  "#38BDF8",
  "#A78BFA",
  "#2DD4BF",
  "#FACC15",
  "#4ADE80",
  "#94A3B8",
] as const;
/** Each spine's deterministic lift. */
export const SPINE_LIFTS = [6, 18, 0, 22, 10, 4, 16, 8] as const;
