/**
 * The skills cloud's interleaved order (02 · C15). The DOM stays grouped; this computes each word's
 * visual position (its CSS `order`) so the groups spread evenly through one cloud:
 *
 * - every skill gets an even-spread key, `(index within group + 0.5) / group length`, and the skills
 *   are sorted by key, then by group index;
 * - group g's own word is then inserted before position `Math.round(g * n / G)` of that list
 *   (n = skill count, G = group count).
 *
 * Home.dc.html's `this.SKO` is this order for the V0 groups; the unit test checks against it.
 */

export interface SkillOrder {
  /** The visual position of each group's word, by group index. */
  groups: number[];
  /** The visual position of each skill, by group index, then index within the group. */
  items: number[][];
  /** The total number of words in the cloud: groups plus skills. */
  total: number;
}

/** Takes each group's skill count and returns every word's visual position. */
export function skillsOrder(counts: readonly number[]): SkillOrder {
  const G = counts.length;
  const skills: { g: number; i: number; key: number }[] = [];
  counts.forEach((len, g) => {
    for (let i = 0; i < len; i++) skills.push({ g, i, key: (i + 0.5) / len });
  });
  skills.sort((a, b) => a.key - b.key || a.g - b.g);
  const n = skills.length;

  const insertAt = counts.map((_, g) => Math.round((g * n) / G));
  const groups: number[] = Array.from({ length: G }, () => 0);
  const items: number[][] = counts.map((len) => Array.from({ length: len }, () => 0));
  let pos = 0;
  let g = 0;
  for (let k = 0; k <= n; k++) {
    while (g < G && insertAt[g] === k) groups[g++] = pos++;
    const s = skills[k];
    if (s) (items[s.g] as number[])[s.i] = pos++;
  }
  return { groups, items, total: pos };
}

/**
 * Which M words use the alternate face (`.alt`): every other M word in visual order, starting with
 * the second (02 · C15 · Sizes). Takes each skill's size, by group, and returns a flag per skill.
 */
export function altFaces(sizes: readonly (readonly string[])[], order: SkillOrder): boolean[][] {
  const ms: { g: number; i: number; pos: number }[] = [];
  sizes.forEach((group, g) => {
    group.forEach((size, i) => {
      if (size === "m") ms.push({ g, i, pos: order.items[g]?.[i] ?? 0 });
    });
  });
  ms.sort((a, b) => a.pos - b.pos);
  const alt = sizes.map((group) => group.map(() => false));
  ms.forEach((m, k) => {
    if (k % 2 === 1) (alt[m.g] as boolean[])[m.i] = true;
  });
  return alt;
}
