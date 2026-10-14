import { type CSSProperties, useId, useRef, useState } from "react";

import { ART, type OffDutyArt } from "./art";
import {
  ipadPlacement,
  ipadRows,
  laptopPlacement,
  laptopRows,
  SLOT_LINES,
  slotLines,
  SPINE_COLOURS,
  SPINE_LIFTS,
} from "./layout";
import styles from "./OffDutyPage.module.css";
import { cx } from "../cx";

export interface OffDutyItem {
  id: string;
  /** The mono label, e.g. "Passion". */
  label: string;
  title: string;
  text: string;
  /** The tag with the accent dot. Empty hides it. */
  tag?: string;
  /** The item's accent and its cover ground (02 · Project accents): spread `ACCENT_COLOURS[name]`. */
  accent: string;
  ground: string;
  art: OffDutyArt;
  /** Favourites, shown as volume spines on the first item. */
  picks?: { id: string; title: string; note?: string }[];
}

interface OffDutyPageProps {
  /** The visible items, in order. */
  items: OffDutyItem[];
  /** The shelf's fixed label (03 · Off duty). */
  shelfLabel?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function Spines({ picks }: { picks: NonNullable<OffDutyItem["picks"]> }) {
  return (
    <ol className={styles.spines} aria-label="All-time favourites">
      {picks.map((p, i) => (
        <li
          key={p.id}
          className={styles.sp}
          style={
            {
              "--sh": SPINE_COLOURS[i % SPINE_COLOURS.length],
              paddingTop: SPINE_LIFTS[i % SPINE_LIFTS.length],
            } as CSSProperties
          }
        >
          <span className={styles.spN}>{pad(i + 1)}</span>
          <span className={styles.spV}>
            <span className={styles.spT}>{p.title}</span>
            {p.note ? <span className={styles.spG}>{p.note}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Lines({
  className,
  g,
  accent,
}: {
  className: string;
  g: { w: number; h: number; fx: number; fy: number };
  accent: string;
}) {
  const { viewBox, d } = slotLines(g);
  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} fill={accent} fillOpacity=".14" />
    </svg>
  );
}

/**
 * C17 · The Off duty manga page: ink panels with screentone, speed lines, an outlined number, one of
 * six line-art presets and a caption box; the first item's picks as volume spines. Laptop and iPad
 * lay the panels on the boards' grids; phones get a 300px rail with the shelf after it (02 · C17).
 */
export function OffDutyPage({
  items,
  shelfLabel = "Currently watching / all-time favourites",
}: OffDutyPageProps) {
  const uid = useId();
  const rail = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  if (items.length === 0) return null;
  const n = items.length;
  const picks = items[0]?.picks ?? [];

  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const panels = [...el.children] as HTMLElement[];
    const distance = panels.map((p) => Math.abs(p.offsetLeft - el.offsetLeft - el.scrollLeft));
    setCurrent(distance.indexOf(Math.min(...distance)));
  };

  return (
    <>
      <div
        ref={rail}
        className={styles.page}
        style={{ "--lrows": laptopRows(n), "--irows": ipadRows(n) } as CSSProperties}
        onScroll={onScroll}
        role="region"
        aria-label="Off duty"
        // The phone rail scrolls, so keyboard users must be able to focus it (axe scrollable-region-focusable).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        {items.map((item, i) => {
          const l = laptopPlacement(i, n);
          const ip = ipadPlacement(i, n);
          const titleId = `${uid}-t${i}`;
          return (
            <article
              key={item.id}
              className={styles.op}
              aria-labelledby={titleId}
              data-l={l.slot}
              data-i={ip.slot}
              style={
                {
                  "--pa": item.accent,
                  "--pg": item.ground,
                  "--lc": l.column,
                  "--lr": l.row,
                  "--ic": ip.column,
                  "--ir": ip.row,
                } as CSSProperties
              }
            >
              <div className={styles.art}>
                <div className={styles.tone} aria-hidden="true" />
                <Lines
                  className={cx(styles.sl, styles.slL)}
                  g={SLOT_LINES.laptop[l.slot]}
                  accent={item.accent}
                />
                <Lines
                  className={cx(styles.sl, styles.slI)}
                  g={SLOT_LINES.ipad[ip.slot]}
                  accent={item.accent}
                />
                <Lines className={cx(styles.sl, styles.slP)} g={SLOT_LINES.phone} accent={item.accent} />
                <div className={styles.num} aria-hidden="true">
                  {pad(i + 1)}
                </div>
                <svg className={styles.ico} viewBox="-80 -70 160 140" aria-hidden="true" focusable="false">
                  {ART[item.art]}
                </svg>
              </div>
              <div className={styles.cap}>
                <div className={styles.k}>{item.label}</div>
                <h3 id={titleId} className={styles.t}>
                  {item.title}
                </h3>
                <p className={styles.d}>{item.text}</p>
                {item.tag ? <span className={styles.tag}>{item.tag}</span> : null}
              </div>
              {i === 0 && picks.length > 0 ? (
                <div className={styles.shelf}>
                  <div className={styles.sk}>{shelfLabel}</div>
                  <Spines picks={picks} />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {n > 1 ? (
        <div className={styles.dots} aria-hidden="true">
          {items.map((item, i) => (
            <span key={item.id} className={i === current ? cx(styles.dot, styles.dotOn) : styles.dot} />
          ))}
        </div>
      ) : null}
      {picks.length > 0 ? (
        <div
          className={styles.shelfPhone}
          role="region"
          aria-label={shelfLabel}
          // The shelf scrolls sideways on phones (axe scrollable-region-focusable).
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
        >
          <div className={styles.sk}>{shelfLabel}</div>
          <Spines picks={picks} />
        </div>
      ) : null}
    </>
  );
}
