import { type CSSProperties, useId, useMemo, useState } from "react";

import { altFaces, skillsOrder } from "~/lib/skills-order";

import styles from "./SkillsCloud.module.css";

export type SkillSize = "xl" | "l" | "m" | "s";

export interface SkillGroup {
  id: string;
  /** The group word, e.g. "Product". */
  title: string;
  /** The mono line above it, e.g. "Strategy & execution". Empty hides it. */
  subtitle?: string;
  items: { id: string; text: string; size: SkillSize }[];
}

interface SkillsCloudProps {
  /** The visible groups, in layout order. */
  groups: SkillGroup[];
  /**
   * M-SKILLS-REVEAL, driven by M2's observer: "pending" hides the words (with JavaScript, and
   * without reduced motion), "go" plays the entrance. Omit it to show the cloud at rest.
   */
  reveal?: "pending" | "go";
}

/**
 * C15 · Skills cloud: grouped in the DOM, interleaved visually (`order` from skills-order.ts), in
 * five tiers. Hovering or focusing a group word previews its group; clicking or tapping pins it
 * (`aria-pressed`), and a second click clears it (02 · C15, 04 · M-SKILLS-FOCUS).
 */
export function SkillsCloud({ groups, reveal }: SkillsCloudProps) {
  const uid = useId();
  const [pin, setPin] = useState(-1);
  const [hover, setHover] = useState(-1);
  const active = pin > -1 ? pin : hover;

  const order = useMemo(() => skillsOrder(groups.map((g) => g.items.length)), [groups]);
  const alt = useMemo(
    () =>
      altFaces(
        groups.map((g) => g.items.map((i) => i.size)),
        order,
      ),
    [groups, order],
  );

  if (groups.length === 0) return null;
  const skills = groups.reduce((n, g) => n + g.items.length, 0);
  const counts = `${skills} skill${skills === 1 ? "" : "s"} in ${groups.length} group${groups.length === 1 ? "" : "s"}`;
  const pos = (p: number) => ({ order: p, "--i5": p % 5 }) as CSSProperties;
  const cloud = [styles.cloud, active > -1 && styles.lit, reveal && styles[reveal]].filter(Boolean).join(" ");

  return (
    <>
      <div className={cloud}>
        {groups.map((g, gi) => {
          const on = active === gi;
          const id = `${uid}-g${gi}`;
          return (
            <div key={g.id} className={styles.cg} role="group" aria-labelledby={id}>
              <h3
                className={[styles.cw, styles.g, on && styles.on].filter(Boolean).join(" ")}
                style={pos(order.groups[gi] ?? 0)}
              >
                {g.subtitle ? <span className={styles.sub}>{g.subtitle}</span> : null}
                <button
                  id={id}
                  type="button"
                  aria-pressed={pin === gi}
                  onClick={() => {
                    setPin((p) => (p === gi ? -1 : gi));
                  }}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") setHover(gi);
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === "mouse") setHover(-1);
                  }}
                  onFocus={() => {
                    setHover(gi);
                  }}
                  onBlur={() => {
                    setHover(-1);
                  }}
                >
                  {g.title}
                </button>
              </h3>
              {/* The explicit roles stay: some browsers drop list semantics from display: contents. */}
              {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
              <ul role="list">
                {g.items.map((w, wi) => (
                  // eslint-disable-next-line jsx-a11y/no-redundant-roles
                  <li
                    key={w.id}
                    role="listitem"
                    className={[styles.cw, styles[w.size], alt[gi]?.[wi] && styles.alt, on && styles.on]
                      .filter(Boolean)
                      .join(" ")}
                    style={pos(order.items[gi]?.[wi] ?? 0)}
                  >
                    {w.text}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className={styles.hint}>
        <span className={styles.hintLaptop}>Hover or click a group to light up its skills · {counts}</span>
        <span className={styles.hintIpad}>Tap a group to light up its skills · {counts}</span>
        <span className={styles.hintPhone}>Tap a group to light it up</span>
      </p>
    </>
  );
}
