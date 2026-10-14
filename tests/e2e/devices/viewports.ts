/**
 * Viewports for the device sweeps (08 · Browsers and devices, 02 · Layout). Portrait and landscape
 * for phones and iPads, plus the in-between widths. `touch` follows the device, not the width
 * (04 · Ground rules 8): a 1024 iPad is touch, a 1280 laptop is a pointer.
 */
export type Viewport = { name: string; width: number; height: number; touch: boolean };

export const VIEWPORTS: Viewport[] = [
  { name: "phone-se 320", width: 320, height: 568, touch: true },
  { name: "phone 375", width: 375, height: 812, touch: true },
  { name: "phone 390", width: 390, height: 844, touch: true },
  { name: "phone 414", width: 414, height: 896, touch: true },
  { name: "phone landscape 844", width: 844, height: 390, touch: true },
  { name: "phone landscape 932", width: 932, height: 430, touch: true },
  { name: "ipad portrait 768", width: 768, height: 1024, touch: true },
  { name: "ipad portrait 834", width: 834, height: 1194, touch: true },
  { name: "ipad landscape 1024", width: 1024, height: 768, touch: true },
  { name: "ipad landscape 1194", width: 1194, height: 834, touch: true },
  { name: "laptop 1280", width: 1280, height: 800, touch: false },
  { name: "laptop 1440", width: 1440, height: 900, touch: false },
  { name: "desktop 1920", width: 1920, height: 1080, touch: false },
];
