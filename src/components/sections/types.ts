import type { HomeView } from "~/lib/site";
import type { Section } from "~/lib/types";

/** Every homepage section component takes the same props and returns null when it has nothing to show (03 · Home). */
export interface SectionProps {
  section: Section;
  profile: HomeView["profile"];
  projects: HomeView["projects"];
  posts: HomeView["posts"];
}
