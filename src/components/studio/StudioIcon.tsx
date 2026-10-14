/**
 * Studio's navigation and tool glyphs, copied from the Studio boards' inline SVGs (same 24px
 * grid and stroke as the shared set in `components/icons.tsx`, which holds everything else).
 */
import type { CSSProperties } from "react";

const STUDIO_PATHS = {
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  website: "M3 4h18v16H3zM3 9h18M9 9v11",
  projects: "M4 5h16v14H4zM4 9h16",
  writing: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  media: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4",
  live: "M7 17L17 7M8 7h9v9",
  plus: "M12 5v14M5 12h14",
  upload: "M12 20V9M7 14l5-5 5 5M5 4h14",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  alert: "M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  back: "M15 6l-6 6 6 6",
  chevron: "M6 9l6 6 6-6",
  search: "M20 20l-4-4M11 4.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z",
  user: "M12 4a4 4 0 100 8 4 4 0 000-8zM4 20c1.5-4 4.5-6 8-6s6.5 2 8 6",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z",
  tick: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6L6 18",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 9.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z",
  file: "M6 3h8l4 4v14H6zM14 3v4h4",
} as const;

export type StudioIconName = keyof typeof STUDIO_PATHS;

export function StudioIcon({
  name,
  size,
  label,
  style,
  className,
}: {
  name: StudioIconName;
  size?: number;
  label?: string;
  style?: CSSProperties;
  className?: string;
}) {
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "ico"}
      focusable="false"
      style={size ? { width: size, height: size, ...style } : style}
      {...a11y}
    >
      <path d={STUDIO_PATHS[name]} />
    </svg>
  );
}
