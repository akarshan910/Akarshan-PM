/**
 * The one icon set for the site and Studio (02 · Icons): 24px grid, stroke 1.75, round caps and
 * joins, no fill, currentColor. Path data is copied from the `icons` array in System.dc.html, plus
 * the extra icons the boards use. Size with the `.ico` class (18px) or the `size` prop.
 */
import type { SVGProps } from "react";

const PATHS = {
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-out": "M7 17L17 7M8 7h9v9",
  "arrow-down": "M12 5v14M6 13l6 6 6-6",
  "arrow-left": "M19 12H5M11 18l-6-6 6-6",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  play: "M8 5v14l11-7z",
  pause: "M8 5v14M16 5v14",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  menu: "M4 8h16M4 16h16",
  close: "M6 6l12 12M18 6L6 18",
  sun: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z",
  check: "M5 12l5 5 9-10",
  alert: "M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  "alert-circle": "M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v5M12 16h.01",
  info: "M12 11v6M12 7h.01M12 3a9 9 0 100 18 9 9 0 000-18z",
  upload: "M12 20V9M7 14l5-5 5 5M5 4h14",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01",
  "image-off": "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M3 3l18 18",
  video: "M3 6h13v12H3zM16 10l5-3v10l-5-3",
  prototype: "M5 3l14 8-6 2-2 6z",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  copy: "M8 8h12v12H8zM4 16V4h12",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  plus: "M12 5v14M5 12h14",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  "chevron-down": "M6 9l6 6 6-6",
  "chevron-left": "M15 6l-6 6 6 6",
  "chevron-right": "M9 6l6 6-6 6",
  clock: "M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z",
  rss: "M5 5a14 14 0 0114 14M5 11a8 8 0 018 8M6 18h.01",
} as const;

export type IconName = keyof typeof PATHS | "more";
export const ICON_NAMES = [...Object.keys(PATHS), "more"] as IconName[];

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Pixel size; omit to size with CSS (`.ico` is 18px). */
  size?: number;
  /** An accessible name. Without one the icon is decorative and hidden from assistive tech. */
  label?: string;
  /** The play icon on cover badges is filled (02 · Icons). */
  filled?: boolean;
}

export function Icon({ name, size, label, filled, className, ...rest }: IconProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "ico"}
      width={size}
      height={size}
      focusable="false"
      {...(filled ? { style: { fill: "currentColor" } } : {})}
      {...a11y}
      {...rest}
    >
      {name === "more" ? (
        [5, 12, 19].map((cx) => <circle key={cx} cx={cx} cy={12} r={1.2} fill="currentColor" stroke="none" />)
      ) : (
        <path d={PATHS[name]} />
      )}
    </svg>
  );
}
