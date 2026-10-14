import type { ReactNode } from "react";

export type OffDutyArt = "kunai" | "pencil" | "paddle" | "pan" | "plane" | "camera";

/** The six line-art presets, copied from Home.dc.html's `.op-ico` SVGs, in a `-80 -70 160 140` box. */
export const ART: Record<OffDutyArt, ReactNode> = {
  kunai: (
    <>
      <g transform="rotate(-28)">
        <path d="M0 -58 L13 -16 L0 -6 L-13 -16 Z" />
        <path d="M0 -6 V30" />
        <path d="M-6 4 L6 0 M-6 12 L6 8 M-6 20 L6 16 M-6 28 L6 24" />
        <circle cx="0" cy="40" r="9" />
      </g>
      <path
        d="M-58 -52 L-44 -42 M-26 -66 L-24 -52 M-64 -24 L-50 -24 M38 -56 L30 -44 M50 -28 L38 -26"
        style={{ strokeWidth: 2.4 }}
      />
      <circle cx="-36" cy="-36" r="18" style={{ strokeDasharray: "3 5", strokeOpacity: 0.6 }} />
    </>
  ),
  pencil: (
    <>
      <path d="M-46 34 L24 -36 L40 -20 L-30 50 Z" />
      <path d="M-46 34 L-54 58 L-30 50" />
      <path d="M24 -36 L32 -44 L48 -28 L40 -20" />
      <path d="M-14 2 L4 20" style={{ strokeOpacity: 0.5 }} />
      <path d="M-76 62 C -64 44, -50 70, -38 56 S -14 64, -4 52" style={{ strokeDasharray: "2 5" }} />
    </>
  ),
  paddle: (
    <>
      <ellipse cx="-12" cy="-8" rx="30" ry="34" style={{ fill: "currentColor", fillOpacity: 0.16 }} />
      <path d="M-34 -18 Q -12 -30 10 -18" style={{ strokeOpacity: 0.5 }} />
      <path d="M6 20 L26 44" style={{ strokeWidth: 10 }} />
      <path d="M-62 30 H60" style={{ strokeDasharray: "2 4", strokeOpacity: 0.5 }} />
      <path d="M-70 -48 Q -6 -96 46 -46" style={{ strokeDasharray: "4 6" }} />
      <circle cx="50" cy="-42" r="7" style={{ fill: "currentColor" }} />
    </>
  ),
  pan: (
    <>
      <path d="M-56 18 Q -56 46 -12 46 Q 32 46 32 18 Z" />
      <path d="M-62 18 H38" />
      <path d="M32 24 L76 32" style={{ strokeWidth: 6 }} />
      <path d="M-30 -4 C -38 -18, -22 -26, -30 -42 M-12 -6 C -20 -20, -4 -28, -12 -46 M6 -4 C -2 -18, 14 -26, 6 -42" />
    </>
  ),
  plane: (
    <>
      <path d="M-52 8 L54 -34 L12 42 L2 14 Z" />
      <path d="M2 14 L54 -34" />
      <path d="M-80 58 C -66 30, -44 64, -30 34" style={{ strokeDasharray: "3 6" }} />
      <circle cx="-80" cy="58" r="4" style={{ fill: "currentColor" }} />
    </>
  ),
  camera: (
    <>
      <rect x="-50" y="-26" width="100" height="66" rx="10" />
      <path d="M-22 -26 L-14 -40 H14 L22 -26" />
      <circle cx="0" cy="8" r="22" />
      <circle cx="0" cy="8" r="11" style={{ strokeOpacity: 0.55 }} />
      <path d="M30 -14 H40" />
      <path d="M-8 -2 L8 18 M8 -2 L-8 18" style={{ strokeOpacity: 0.35 }} />
    </>
  ),
};
