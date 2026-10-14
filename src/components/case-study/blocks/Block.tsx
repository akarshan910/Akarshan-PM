import type { BlockGroup } from "~/lib/case-study";

import { BoxesBlock } from "./BoxesBlock";
import { CalloutBlock } from "./CalloutBlock";
import { CardsBlock } from "./CardsBlock";
import { DividerBlock } from "./DividerBlock";
import { HeadingBlock } from "./HeadingBlock";
import { JourneyBlock } from "./JourneyBlock";
import { ListBlock } from "./ListBlock";
import { MediaBlock } from "./MediaBlock";
import { MetricsBlock } from "./MetricsBlock";
import { OwnershipBlock } from "./OwnershipBlock";
import { PrototypeBlock } from "./PrototypeBlock";
import { QuoteBlock } from "./QuoteBlock";
import { TableBlock } from "./TableBlock";
import { TextBlock } from "./TextBlock";
import { VideoBlock } from "./VideoBlock";

/** One block, or one group of boxed lists, from a chapter (03 · Blocks). */
export function Block({ group }: { group: BlockGroup }) {
  if (group.kind === "boxes") return <BoxesBlock group={group} />;
  const { block } = group;
  switch (block.type) {
    case "text":
      return <TextBlock block={block} />;
    case "heading":
      return <HeadingBlock block={block} />;
    case "list":
      return <ListBlock block={block} />;
    case "quote":
      return <QuoteBlock block={block} />;
    case "callout":
      return <CalloutBlock block={block} />;
    case "metrics":
      return <MetricsBlock block={block} />;
    case "table":
      return <TableBlock block={block} />;
    case "image":
    case "gallery":
    case "beforeafter":
      return <MediaBlock block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    case "prototype":
      return <PrototypeBlock block={block} />;
    case "journey":
      return <JourneyBlock block={block} />;
    case "ownership":
      return <OwnershipBlock block={block} />;
    case "cards":
      return <CardsBlock block={block} />;
    case "divider":
      return <DividerBlock />;
  }
}
