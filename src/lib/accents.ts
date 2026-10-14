/**
 * The nine project accents (02 · Project accents): the accent itself and its cover ground, the
 * dark background behind a cover's artwork and the placeholder colour while a cover loads.
 * Text on an accent fill is always #0B0B0E (D13).
 */
import type { Accent } from "./types";

export interface AccentColours {
  /** `--pa`: covers, volume tags, chapter and step numbers. Never body text. */
  accent: string;
  /** `--pg`: the cover ground. */
  ground: string;
}

export const ACCENT_COLOURS: Record<Accent, AccentColours> = {
  teal: { accent: "#2DD4BF", ground: "#0D1918" },
  amber: { accent: "#F5A524", ground: "#1A140A" },
  sky: { accent: "#38BDF8", ground: "#0A1620" },
  violet: { accent: "#A78BFA", ground: "#130F1F" },
  coral: { accent: "#FF5A67", ground: "#1C0C0F" },
  slate: { accent: "#94A3B8", ground: "#121826" },
  green: { accent: "#4ADE80", ground: "#0E1F14" },
  yellow: { accent: "#FACC15", ground: "#1F1A06" },
  lime: { accent: "#A3E635", ground: "#141F06" },
};

/** The ink used on every accent fill (02, D13). */
export const ON_ACCENT = "#0B0B0E";
