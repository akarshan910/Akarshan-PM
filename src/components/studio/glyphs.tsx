/**
 * Studio-only glyphs the Studio boards draw that the shared set in `src/components/icons.tsx` doesn't
 * have yet (or draws differently). Path data is copied from the boards. Same 24px grid and `.ico`
 * stroke rules as `Icon`. These belong in `icons.tsx`; they live here until that shared file can change.
 */
import type { CSSProperties } from "react";

const GLYPHS = {
  /** Studio's tick: StudioStates, StudioDashboard and every editor (not icons.tsx's `check`). */
  tick: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  /** Offline (cloud with a slash): save status and banners. */
  "cloud-off": (
    <path d="M3 3l18 18M8.5 8.6A6 6 0 006 13.5 4.5 4.5 0 0010.5 18H17M14 6.3A6 6 0 0118 11.5a4 4 0 012.6 5.6" />
  ),
  /** Couldn't save, failed toast: a circle with an exclamation mark. */
  "alert-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
  /** Publish blocked: a circle with a cross. */
  "x-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </>
  ),
  /** Session expired (StudioStates). */
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  /** Too many tries, not the owner (StudioLogin). */
  padlock: <path d="M6 10h12v10H6zM8 10V7a4 4 0 018 0v3" />,
  /** Offline on the sign-in page (StudioLogin). */
  wifi: <path d="M2 8.8a15 15 0 0120 0M5 12.2a10 10 0 0114 0M8.5 15.6a5 5 0 017 0M12 19h.01" />,
  /** Resend wait (StudioStates banner). */
  "clock-sm": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
} as const;

export type GlyphName = keyof typeof GLYPHS;

interface GlyphProps {
  name: GlyphName;
  /** Pixel size; omit for the `.ico` 18px. */
  size?: number | undefined;
  className?: string | undefined;
  style?: CSSProperties;
}

/** A decorative Studio glyph, always hidden from assistive tech. */
export function Glyph({ name, size, className, style }: GlyphProps) {
  const sized = size ? { width: size, height: size } : {};
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ? `ico ${className}` : "ico"}
      style={{ ...sized, ...style }}
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  );
}
