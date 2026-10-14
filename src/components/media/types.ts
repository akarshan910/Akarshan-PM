/**
 * The published image shape (06 · Schema, `Img`): every MediaRef becomes one of these at publish.
 * `dominant` is the colour that holds the image's box while it loads (M-IMG-FADE).
 */
export interface ImageData {
  src: string;
  srcset?: string;
  width: number;
  height: number;
  /** Empty for a decorative image. */
  alt: string;
  dominant?: string;
}
