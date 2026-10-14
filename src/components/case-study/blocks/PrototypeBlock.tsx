import { PrototypeEmbed } from "~/components/media/PrototypeEmbed";
import type { BlockPublished } from "~/lib/published";

import { useCaseStudy } from "../context";

type Props = { block: Extract<BlockPublished, { type: "prototype" }> };

/** `prototype`: the project's prototype, opening on the block's `startPath` (chapter 05). */
export function PrototypeBlock({ block }: Props) {
  const { project } = useCaseStudy();
  const { hero, cover } = project.visuals;
  if (hero.type !== "prototype" || !hero.url) return null;
  const poster = hero.poster ?? cover;
  return (
    <PrototypeEmbed
      url={hero.url}
      name={`${project.overview.title} prototype`}
      frame={hero.frame}
      {...(block.startPath ? { startPath: block.startPath } : {})}
      {...(poster ? { poster } : {})}
      {...(hero.note ? { note: hero.note } : {})}
    />
  );
}
