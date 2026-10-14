/**
 * The hero's floating previews (C11, M-HERO-FLOATERS). Every floating project gets one card per
 * layout: the laptop set (up to three slots) and the iPad set (one slot); CSS shows the set for the
 * width, and phones show none. The static HTML holds each set's rest pose, and the scheduler for
 * the active layout then writes poses straight onto the cards: React never re-renders for motion.
 */
import { type RefObject, useEffect, useRef } from "react";

import { FloatingPreview } from "~/components/hero/FloatingPreview";
import { isQa } from "~/lib/qa";
import {
  ipadFloaters,
  ipadRestPose,
  laptopFloaters,
  laptopRestPose,
  type FloaterPose,
  type Scheduler,
} from "~/motion/floaters";
import { watchVisibility } from "~/motion/pause";
import { useReducedMotion } from "~/motion/reduced-motion";
import type { ResultType } from "~/lib/types";

import styles from "./Hero.module.css";

export interface FloaterCard {
  volume: string;
  accent: string;
  kicker?: string;
  title: string;
  value?: string;
  result?: ResultType;
  href: string;
}

const LAPTOP_QUERY = "(min-width: 1280px)";
const IPAD_QUERY = "(min-width: 768px) and (max-width: 1279px)";

type Mode = "laptop" | "ipad" | "none";

function currentMode(): Mode {
  if (typeof matchMedia !== "function") return "none";
  if (matchMedia(LAPTOP_QUERY).matches) return "laptop";
  if (matchMedia(IPAD_QUERY).matches) return "ipad";
  return "none";
}

/** Writes a pose onto a card (`.tz`) and its layer (`.fl`). */
export function applyPose(card: HTMLElement | null | undefined, pose: FloaterPose): void {
  if (!card) return;
  const fl = card.parentElement;
  if (fl) {
    fl.style.left = `${pose.x.toFixed(2)}%`;
    fl.style.top = `${pose.y.toFixed(2)}%`;
    fl.style.transform = `translateZ(${pose.z}px) rotate(${pose.r.toFixed(2)}deg)`;
  }
  card.style.transition = pose.tr;
  card.style.setProperty("--tx", `${pose.tx.toFixed(1)}px`);
  card.style.setProperty("--ty", `${pose.ty.toFixed(1)}px`);
  card.style.opacity = String(pose.op);
  card.style.pointerEvents = pose.op > 0 ? "auto" : "none";
}

const restStyle = (pose: FloaterPose) => ({
  opacity: pose.op,
  transition: pose.tr,
  pointerEvents: pose.op > 0 ? ("auto" as const) : ("none" as const),
});

interface HeroFloatersProps {
  cards: FloaterCard[];
  /** Studio's "On screen at once": 1–3 on laptop. */
  atOnce: number;
  /** The hero section, watched to pause off screen. */
  heroRef: RefObject<HTMLElement | null>;
}

export function HeroFloaters({ cards, atOnce, heroRef }: HeroFloatersProps) {
  const reduced = useReducedMotion();
  const lap = useRef<(HTMLAnchorElement | null)[]>([]);
  const pad = useRef<(HTMLAnchorElement | null)[]>([]);
  const scheduler = useRef<Scheduler | null>(null);
  const count = cards.length;
  const slots = Math.min(atOnce, 3, count);

  useEffect(() => {
    const hero = heroRef.current;
    if (count === 0 || !hero) return;
    const frozen = reduced || isQa();
    let mode: Mode = "none";
    let visible = true;

    const build = (m: Mode): Scheduler | null => {
      if (m === "laptop")
        return laptopFloaters({
          count,
          slots,
          place: (i, pose) => {
            applyPose(lap.current[i], pose);
          },
        });
      if (m === "ipad")
        return ipadFloaters({
          count,
          place: (i, pose) => {
            applyPose(pad.current[i], pose);
          },
        });
      return null;
    };

    /** Restart from the rest pose (04 · Ground rules 5), or hold it when frozen or off screen. */
    const restart = () => {
      scheduler.current?.stop();
      scheduler.current = build(mode);
      scheduler.current?.rest();
      if (!frozen && visible) scheduler.current?.start();
    };

    const onMode = () => {
      const m = currentMode();
      if (m === mode) return;
      mode = m;
      restart();
    };
    onMode();

    const queries =
      typeof matchMedia === "function" ? [matchMedia(LAPTOP_QUERY), matchMedia(IPAD_QUERY)] : [];
    for (const q of queries) q.addEventListener("change", onMode);
    const unwatch = watchVisibility(hero, (v) => {
      if (v === visible) return;
      visible = v;
      if (v) restart();
      else scheduler.current?.stop();
    });

    return () => {
      for (const q of queries) q.removeEventListener("change", onMode);
      unwatch();
      scheduler.current?.stop();
      scheduler.current = null;
    };
  }, [count, slots, reduced, heroRef]);

  if (count === 0) return null;

  return (
    <>
      <div className={styles.flLaptop}>
        {cards.map((c, i) => {
          const pose = laptopRestPose(i, slots);
          return (
            <FloatingPreview
              key={c.href}
              {...c}
              x={pose.x}
              y={pose.y}
              z={pose.z}
              r={pose.r}
              cardRef={(el) => {
                lap.current[i] = el;
              }}
              cardStyle={restStyle(pose)}
              onMouseEnter={() => scheduler.current?.hold(i)}
              onMouseLeave={() => scheduler.current?.release(i)}
            />
          );
        })}
      </div>
      <div className={styles.flIpad}>
        {cards.map((c, i) => {
          const pose = ipadRestPose(i);
          return (
            <FloatingPreview
              key={c.href}
              {...c}
              x={pose.x}
              y={pose.y}
              z={pose.z}
              r={pose.r}
              cardRef={(el) => {
                pad.current[i] = el;
              }}
              cardStyle={restStyle(pose)}
            />
          );
        })}
      </div>
    </>
  );
}
