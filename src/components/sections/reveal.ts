import { useReveal, type RevealOptions } from "~/motion/reveal";

/**
 * M-REVEAL for a homepage section: `blocks` selects the header and each card, row, entry or item
 * inside the section, in DOM order (04 · M-REVEAL).
 */
export function useSectionReveal<T extends HTMLElement>(
  blocks: string,
  options: Omit<RevealOptions, "blocks"> = {},
) {
  return useReveal<T>({ ...options, blocks });
}
