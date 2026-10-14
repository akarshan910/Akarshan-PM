/** Builds an in-memory repo from the V0 content with a fixed clock, for Studio's tests. */
import * as legacy from "../../legacy/content";
import { buildV0Documents } from "../v0";
import { MemoryRepo, type MemoryOptions } from "./memory";

export const T0 = Date.parse("2026-10-13T14:02:00.000Z");

export function testRepo(options: MemoryOptions & { at?: number } = {}): {
  repo: MemoryRepo;
  clock: { now: number };
} {
  const clock = { now: options.at ?? T0 };
  const repo = new MemoryRepo(buildV0Documents(legacy), { now: () => clock.now, signedIn: true, ...options });
  return { repo, clock };
}

/** The value, or a test failure: tests use it where a lookup must succeed. */
export function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error("Expected a value.");
  return value;
}
