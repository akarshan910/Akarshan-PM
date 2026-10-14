import { ProofStrip, type ProofItem } from "~/components/proof/ProofStrip";

import { cx } from "../cx";
import styles from "./Sections.module.css";
import { useSectionReveal } from "./reveal";
import type { SectionProps } from "./types";

/** Proof strip (03 · Proof strip, C12): the visible proof items in layout order, then the chips. */
export function Proof({ section, profile }: SectionProps) {
  const ref = useSectionReveal<HTMLElement>("ul > li, :scope > div > div");
  const byId = new Map(profile.proof.map((p) => [p.id, p]));
  const items: ProofItem[] = [];
  for (const { id } of section.items) {
    const p = byId.get(id);
    if (!p?.value) continue;
    items.push({
      id: p.id,
      value: p.value,
      label: p.label,
      ...(p.unit ? { unit: p.unit } : {}),
      ...(p.source ? { source: p.source } : {}),
    });
  }
  const showSpaces = section.items.some((i) => i.id === "spaces") && (profile.spaces?.items.length ?? 0) > 0;
  const spaces = showSpaces && profile.spaces ? profile.spaces : undefined;
  if (items.length === 0 && !spaces) return null;
  return (
    <section ref={ref} id={section.id} aria-label="Highlights" className={styles.proof}>
      <div className={cx(styles.wrap)}>
        <ProofStrip items={items} {...(spaces ? { spaces } : {})} />
      </div>
    </section>
  );
}
