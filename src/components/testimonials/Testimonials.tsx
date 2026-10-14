import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { Icon } from "~/components/icons";

import { type Testimonial, TestimonialCard } from "./TestimonialCard";
import styles from "./Testimonials.module.css";
import { cx } from "../cx";

const PAGE = 3;
/** M-TESTI-PAGE: the cards fade out over 200ms before the page changes. */
const OUT_MS = 200;

interface TestimonialsProps {
  /** The section header (C4), on the left of the header row. */
  heading: ReactNode;
  /** Every visible testimonial (09, D14). */
  items: Testimonial[];
  /** The iPad hint beside the title. */
  swipeHint?: string;
}

function still(): boolean {
  if (typeof document === "undefined") return true;
  return (
    document.documentElement.classList.contains("still") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** "1–3 of 7", or "7 of 7" for a single card. */
export function counterText(page: number, total: number): string {
  const start = page * PAGE + 1;
  const end = Math.min(total, start + PAGE - 1);
  return start === end ? `${start} of ${total}` : `${start}–${end} of ${total}`;
}

/**
 * C16 · The testimonials carousel. Laptop pages through three at a time with "Previous testimonials"
 * and "Next testimonials" and a polite "1–3 of 7" counter; iPad and phones scroll a snapping rail with
 * dot buttons, "Show testimonial N of M", the current one `aria-current` (02 · C16, 03 · Testimonials).
 */
export function Testimonials({ heading, items, swipeHint = "Swipe →" }: TestimonialsProps) {
  const [page, setPage] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [current, setCurrent] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pages = Math.ceil(items.length / PAGE);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  if (items.length === 0) return null;

  const go = (next: number) => {
    if (next < 0 || next >= pages || next === page) return;
    clearTimeout(timer.current);
    if (still()) {
      setPage(next);
      setPhase("idle");
      return;
    }
    setPhase("out");
    timer.current = setTimeout(() => {
      setPage(next);
      setPhase("in");
    }, OUT_MS);
  };

  const cards = () => [...(rail.current?.children ?? [])] as HTMLElement[];
  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const distance = cards().map((c) => Math.abs(c.offsetLeft - el.offsetLeft - el.scrollLeft));
    setCurrent(distance.indexOf(Math.min(...distance)));
  };
  const show = (i: number) => {
    const el = rail.current;
    const card = cards()[i];
    setCurrent(i);
    if (el && card)
      el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: still() ? "auto" : "smooth" });
  };

  const track = cx(styles.track, phase === "out" && styles.out, phase === "in" && styles.in);

  return (
    <>
      <div className={styles.head}>
        <div>{heading}</div>
        {pages > 1 ? (
          <div className={styles.controls}>
            <span className={styles.counter} aria-live="polite">
              {counterText(page, items.length)}
            </span>
            <button
              type="button"
              className={styles.nav}
              aria-label="Previous testimonials"
              disabled={page === 0}
              onClick={() => {
                go(page - 1);
              }}
            >
              <Icon name="arrow-left" />
            </button>
            <button
              type="button"
              className={styles.nav}
              aria-label="Next testimonials"
              disabled={page === pages - 1}
              onClick={() => {
                go(page + 1);
              }}
            >
              <Icon name="arrow-right" />
            </button>
          </div>
        ) : null}
        {items.length > 1 && swipeHint ? (
          <span className={styles.swipe} aria-hidden="true">
            {swipeHint}
          </span>
        ) : null}
      </div>
      {/* Focusable so keyboard users can scroll the rail on touch layouts (WCAG 2.1.1). */}
      <div
        ref={rail}
        className={track}
        onScroll={onScroll}
        role="region"
        aria-label="Testimonials"
        // A scrollable region must take focus (axe scrollable-region-focusable).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        {items.map((t, i) => {
          const onPage = Math.floor(i / PAGE) === page;
          return (
            <TestimonialCard
              key={t.id}
              {...t}
              className={onPage ? undefined : styles.off}
              style={{ "--k": i % PAGE } as CSSProperties}
            />
          );
        })}
      </div>
      {items.length > 1 ? (
        <div className={styles.dots}>
          {items.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={styles.dot}
              aria-label={`Show testimonial ${i + 1} of ${items.length}`}
              aria-current={i === current ? "true" : undefined}
              onClick={() => {
                show(i);
              }}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
