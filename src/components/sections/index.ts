/**
 * The homepage section registry (03 · Home): one component per section kind. Each takes
 * `{ section, profile, projects, posts }` and returns null when it has nothing to show.
 */
import type { ReactElement } from "react";

import type { Section } from "~/lib/types";

import { About } from "./About";
import { Contact } from "./Contact";
import { Experience } from "./Experience";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { OffDuty } from "./OffDuty";
import { Proof } from "./Proof";
import { ShelfSection } from "./ShelfSection";
import { Skills } from "./Skills";
import { Testimonials } from "./Testimonials";
import { TextSection } from "./TextSection";
import type { SectionProps } from "./types";
import { WritingSection } from "./WritingSection";

export type SectionComponent = (props: SectionProps) => ReactElement | null;

export const SECTIONS: Record<Section["kind"], SectionComponent> = {
  hero: Hero,
  proof: Proof,
  shelf: ShelfSection,
  writing: WritingSection,
  about: About,
  experience: Experience,
  skills: Skills,
  testimonials: Testimonials,
  offduty: OffDuty,
  contact: Contact,
  text: TextSection,
  footer: Footer,
};

/**
 * The live site's anchors that the new ids don't keep (07 · Legacy links): `#exp` in Experience,
 * `#testi` in Testimonials, `#work` on the first visible shelf. An anchor is skipped when a section
 * already uses that id, so ids stay unique.
 */
export function legacyAnchors(sections: readonly Pick<Section, "id" | "kind">[]): Map<string, string> {
  const ids = new Set(sections.map((s) => s.id));
  const out = new Map<string, string>();
  const add = (kind: Section["kind"], anchor: string) => {
    const section = sections.find((s) => s.kind === kind);
    if (section && !ids.has(anchor)) out.set(section.id, anchor);
  };
  add("shelf", "work");
  add("experience", "exp");
  add("testimonials", "testi");
  return out;
}

export { HomeContext, type HomeContextValue } from "./context";
export type { SectionProps } from "./types";
