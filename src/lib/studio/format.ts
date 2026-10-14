/**
 * Studio's wording helpers: dates and relative times as the boards write them ("Tuesday, 13 Oct",
 * "Today, 14:02", "12 min ago"), counts in words ("Four drafts"), and the thumbnail gradients the
 * Studio boards draw for each accent.
 */
import type { Accent } from "../types";

/** `linear-gradient(135deg, g1, g2)` behind each thumbnail (StudioProjects, StudioDashboard). */
export const THUMB: Record<Accent, [string, string]> = {
  teal: ["#2DD4BF", "#0D6B60"],
  amber: ["#F5A524", "#8A5A0B"],
  sky: ["#38BDF8", "#0B5A80"],
  violet: ["#A78BFA", "#4C2F9E"],
  coral: ["#FF5A67", "#7F1D2A"],
  slate: ["#94A3B8", "#1E293B"],
  green: ["#4ADE80", "#14532D"],
  yellow: ["#FACC15", "#713F12"],
  lime: ["#A3E635", "#365314"],
};

export function thumbBackground(accent: Accent): string {
  const [a, b] = THUMB[accent];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

const WORDS = [
  "No",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
];

/** "Four", capitalised, up to twelve; digits after that. */
export function countWord(n: number): string {
  return WORDS[n] ?? String(n);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}

const pad = (n: number) => String(n).padStart(2, "0");
const time = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Tuesday, 13 Oct" (StudioDashboard). */
export function longDate(d: Date): string {
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  return `${weekday}, ${d.getDate()} ${month}`;
}

/** "Good morning" before 12, "Good afternoon" before 18, then "Good evening". */
export function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** "Today, 14:02", "Yesterday, 09:10" or "13 Oct, 14:02". */
export function dayAndTime(iso: string, now: Date): string {
  const d = new Date(iso);
  if (sameDay(d, now)) return `Today, ${time(d)}`;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return `Yesterday, ${time(d)}`;
  return `${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })}, ${time(d)}`;
}

/** "Just now", "12 min ago", "1 h ago", "Yesterday", "2 days ago", then "13 Oct". */
export function relative(iso: string, now: Date): string {
  const d = new Date(iso);
  const mins = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24 && sameDay(d, now)) return `${hours} h ago`;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "Yesterday";
  const days = Math.max(2, Math.round((now.getTime() - d.getTime()) / 86_400_000));
  if (days < 7) return `${days} days ago`;
  return `${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })}`;
}

/** The first word of the profile's name, for the greeting. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}
