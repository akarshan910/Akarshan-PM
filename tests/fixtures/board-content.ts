/**
 * The boards' illustrative content as published documents (08 · Pixel parity), so pages can be
 * compared with their boards. Never used in production: check-env fails a production build with
 * CONTENT_SOURCE set. Filled in during M2 (WP2.4).
 */
import type { ContentSource } from "../../src/lib/content-source";

export const boardsFixture: ContentSource = {
  name: "fixture:boards",
  load: () => Promise.reject(new Error("The boards fixture is filled in during M2 (WP2.4).")),
};
