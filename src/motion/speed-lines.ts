/**
 * Manga speed lines (04 · M-HERO-TILT), ported verbatim from Home.dc.html's `speed()`. Each line is
 * a thin triangle from an inner radius around the focus out to radius R. The pseudo-random spread
 * is deterministic, so the same arguments always give the same path, on the server and the client.
 */
export function speed(fx: number, fy: number, count: number, rMin: number, rMax: number, R: number): string {
  let d = "";
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const j = Math.sin(i * 12.9898) * 43758.5453;
    const rnd = j - Math.floor(j);
    const r0 = rMin + rnd * (rMax - rMin);
    const w = 0.006 + rnd * 0.012;
    const ax = fx + Math.cos(t) * r0,
      ay = fy + Math.sin(t) * r0;
    const bx = fx + Math.cos(t - w) * R,
      by = fy + Math.sin(t - w) * R;
    const cx = fx + Math.cos(t + w) * R,
      cy = fy + Math.sin(t + w) * R;
    d +=
      "M" +
      ax.toFixed(1) +
      " " +
      ay.toFixed(1) +
      "L" +
      bx.toFixed(1) +
      " " +
      by.toFixed(1) +
      "L" +
      cx.toFixed(1) +
      " " +
      cy.toFixed(1) +
      "Z";
  }
  return d;
}

/** The hero's rest pose and static paths (04 · M-HERO-TILT, M-HERO-DRIFT). */
export const HERO_SPEED = {
  /** Laptop, in a 1200×680 viewBox. M2's tilt re-aims it from here. */
  laptop: { viewBox: "0 0 1200 680", args: [820, 230, 130, 220, 360, 1600] },
  /** iPad, static, in a 786×700 viewBox. */
  ipad: { viewBox: "0 0 786 700", args: [600, 170, 120, 150, 260, 1100] },
  /** Phone, static, in a 362×540 viewBox. */
  phone: { viewBox: "0 0 362 540", args: [280, 110, 90, 90, 160, 760] },
} as const;

/** An Off duty panel's speed lines (02 · C17): 70 lines around the art's focus. */
export function offDutySpeed(w: number, h: number, fx: number, fy: number): string {
  const min = Math.min(w, h);
  return speed(fx, fy, 70, min * 0.18, min * 0.32, Math.max(w, h) * 1.6);
}
