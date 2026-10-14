/**
 * "Worth a check" facts (07 · Worth a check): keys such as `proof.p-users.value` or
 * `experience.e-sugarfit.highlights.h1.items.i4.text` address a value in the profile. A segment
 * after an array is the id of an element in it.
 */
import type { Profile } from "../types";

type Node = unknown;

function step(node: Node, seg: string): Node {
  if (Array.isArray(node)) return node.find((x: unknown) => (x as { id?: string } | null)?.id === seg);
  if (node && typeof node === "object") return (node as Record<string, unknown>)[seg];
  return undefined;
}

/** The fact's current value in the profile, or undefined when the key doesn't resolve. */
export function factValue(profile: Profile, key: string): string | undefined {
  let node: Node = profile;
  for (const seg of key.split(".")) node = step(node, seg);
  return typeof node === "string" ? node : undefined;
}

/** A copy of the profile with the fact set to `value`. */
export function setFact(profile: Profile, key: string, value: string): Profile {
  const next = structuredClone(profile);
  const segs = key.split(".");
  const last = segs.pop();
  let node: Node = next;
  for (const seg of segs) node = step(node, seg);
  if (last && node && typeof node === "object" && !Array.isArray(node))
    (node as Record<string, unknown>)[last] = value;
  return next;
}

/** Marks a fact confirmed: it leaves `unconfirmed`, and its source becomes the one picked. */
export function confirmFact(profile: Profile, key: string, source?: "current-site" | "resume"): Profile {
  const next = structuredClone(profile);
  next.unconfirmed = next.unconfirmed.filter((k) => k !== key);
  const fact = next.facts[key];
  if (fact && source) fact.source = source;
  return next;
}

/** The owner-facing name of a fact. */
export function factLabel(key: string): string {
  if (key === "title") return "Job title";
  if (key === "availability") return "Availability";
  if (key.startsWith("proof.")) return "Proof strip";
  if (key.startsWith("experience.")) return "Experience";
  return key;
}
