/**
 * C8 · The shelf's cap logic, copied from `WorkScale.dc.html`'s renderVals (02 · C8).
 *
 * Laptop shows the lead card plus `rows` rows of three. Past the cap, the last cell becomes
 * "See all N"; otherwise a gap in the last row gets the "All work" tile, spanning the gap. iPad
 * shows the same projects two up and recomputes the tile for two columns. Phones show the same
 * projects as compact rows, then the closing row when there's overflow or a laptop gap.
 */

export type ShelfRows = 1 | 2 | 3;

export type ClosingTile = { kind: "see-all" } | { kind: "all-work"; span: number } | null;

export interface ShelfPlan {
  /** How many projects show, the lead included. The same on every device. */
  shown: number;
  /** More projects than the cap: the last cell is "See all N". */
  overflow: boolean;
  /** Projects past the cap, for "K more on the work page…". */
  more: number;
  laptop: ClosingTile;
  ipad: ClosingTile;
  phone: ClosingTile;
}

export function planShelf(count: number, rows: ShelfRows): ShelfPlan {
  const cap = 1 + 3 * rows;
  const overflow = count > cap;
  const shown = overflow ? cap - 1 : count;
  const more = count - shown;
  if (count <= 0) return { shown: 0, overflow: false, more: 0, laptop: null, ipad: null, phone: null };
  if (overflow) {
    const seeAll = { kind: "see-all" } as const;
    return { shown, overflow, more, laptop: seeAll, ipad: seeAll, phone: seeAll };
  }
  // The lead takes the full width, so the grid holds shown - 1 cards.
  const gap = (3 - ((shown - 1) % 3)) % 3;
  const gap2 = (2 - ((shown - 1) % 2)) % 2;
  return {
    shown,
    overflow,
    more,
    laptop: gap > 0 ? { kind: "all-work", span: gap } : null,
    ipad: gap2 > 0 ? { kind: "all-work", span: gap2 } : null,
    phone: gap > 0 ? { kind: "all-work", span: 1 } : null,
  };
}
