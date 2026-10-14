import { VideoEmbed } from "~/components/media/VideoEmbed";
import type { BlockPublished } from "~/lib/published";

type Props = { block: Extract<BlockPublished, { type: "video" }> };

/** `video`: poster first; nothing loads from the host before the click (03 · Media). */
export function VideoBlock({ block }: Props) {
  return (
    <VideoEmbed
      url={block.url}
      {...(block.title ? { title: block.title } : {})}
      {...(block.duration ? { duration: block.duration } : {})}
      {...(block.poster ? { poster: block.poster } : {})}
    />
  );
}
