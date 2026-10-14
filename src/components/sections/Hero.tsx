/**
 * Hero (03 · Hero): the ink panel (C10) with the text column, the floating previews (C11) and the
 * availability chip (C6). Motion: M-HERO-RISE, M-HERO-BRUSH, M-HERO-TILT, M-HERO-DRIFT,
 * M-HERO-FLOATERS, M-AVAIL-PULSE, all paused off screen.
 */
import { type AnimationEvent, type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "~/components/buttons/Button";
import { cx } from "~/components/cx";
import { Brush } from "~/components/hero/Brush";
import { InkPanel } from "~/components/hero/InkPanel";
import { AvailabilityChip } from "~/components/labels/Tags";
import { RichText, hasRichText } from "~/components/rich/RichText";
import { ACCENT_COLOURS } from "~/lib/accents";
import { INTRO_KEY } from "~/lib/bootstrap";
import { formatVolume } from "~/lib/volumes";
import { watchVisibility } from "~/motion/pause";
import { useReducedMotion } from "~/motion/reduced-motion";
import { attachTilt } from "~/motion/tilt";

import { headlineOutcome } from "./cards";
import styles from "./Hero.module.css";
import { type FloaterCard, HeroFloaters } from "./HeroFloaters";
import type { SectionProps } from "./types";

const TILT_QUERY = "(hover: hover) and (pointer: fine)";

/** "01—05": from 01 to the number of published, listed volumes; empty without any. */
export function volumeRange(count: number): string {
  if (count <= 0) return "";
  return count === 1 ? "01" : `01—${formatVolume(count)}`;
}

/** The name on two lines: the first word, then the rest (03 · Hero). */
export function splitName(name: string): [string, string] {
  const trimmed = name.trim();
  const space = trimmed.search(/\s/);
  return space === -1 ? [trimmed, ""] : [trimmed.slice(0, space), trimmed.slice(space + 1).trim()];
}

/** Marks the entrance as played for this session, so it never replays (M-HERO-RISE). */
function markIntroPlayed() {
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* storage blocked: the entrance plays again next time, which is harmless */
  }
  document.documentElement.classList.add("no-intro");
}

export function Hero({ section, profile, projects }: SectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const linesRef = useRef<SVGPathElement>(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const parts = new Set(section.items.map((i) => i.id));
  const motion = section.hero?.motion ?? true;

  // M-HERO-TILT: pointer devices only, with motion allowed and the owner's switch on.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !motion || reduced || typeof matchMedia !== "function") return;
    const query = matchMedia(TILT_QUERY);
    let handle: ReturnType<typeof attachTilt> | null = null;
    const sync = () => {
      handle?.detach();
      handle = query.matches ? attachTilt(hero, linesRef.current) : null;
    };
    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      handle?.detach();
    };
  }, [motion, reduced]);

  // Pause off screen: drift, pulse and brush stop through `.paused` (04 · Ground rules 5).
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    return watchVisibility(hero, (visible) => {
      setPaused(!visible);
    });
  }, []);

  const name = splitName(profile.name);
  const showRow =
    (parts.has("availability") && profile.availability) || (parts.has("location") && profile.location);
  const showIntro = parts.has("intro") && hasRichText(profile.intro);
  const primary = parts.has("buttons") ? profile.heroButtons.primary : undefined;
  const resume =
    parts.has("buttons") && profile.heroButtons.resume && profile.contact.resume
      ? profile.contact.resume
      : undefined;

  // Each visible line rises 80ms after the one before; hidden lines are skipped.
  let line = 0;
  const rise = (): CSSProperties => ({ animationDelay: `${line++ * 80}ms` });

  const lines: ReactNode[] = [];
  if (showRow)
    lines.push(
      <div key="row" className={cx(styles.rise, styles.row)} style={rise()}>
        {parts.has("availability") ? <AvailabilityChip>{profile.availability}</AvailabilityChip> : null}
        {parts.has("location") && profile.location ? (
          <span className={styles.location}>{profile.location}</span>
        ) : null}
      </div>,
    );
  lines.push(
    <h1 key="name" className={cx(styles.rise, styles.name)} style={rise()}>
      {name[0]}
      {name[1] ? (
        <>
          <br />
          {name[1]}
        </>
      ) : null}
      <span className={styles.stop}>.</span>
    </h1>,
  );
  if (parts.has("brush")) lines.push(<Brush key="brush" />);
  lines.push(
    <p key="positioning" className={cx(styles.rise, styles.positioning)} style={rise()}>
      <RichText inline html={profile.positioning} />
    </p>,
  );
  if (showIntro) {
    lines.push(
      <p key="intro" className={cx(styles.rise, styles.intro)} style={rise()}>
        <RichText inline html={profile.intro ?? ""} />
      </p>,
    );
  }
  if (primary || resume) {
    lines.push(
      <div key="buttons" className={cx(styles.rise, styles.buttons)} style={rise()}>
        {primary ? (
          <Button href={primary.href} iconEnd={primary.href.startsWith("#") ? "arrow-down" : "arrow-right"}>
            {primary.label}
          </Button>
        ) : null}
        {resume ? (
          <Button variant="secondary" href={resume} icon="download">
            Résumé (PDF)
          </Button>
        ) : null}
      </div>,
    );
  }
  const riseCount = line;

  // The entrance is done once every line and the brush have finished.
  const ended = useRef(new Set<EventTarget>());
  const onAnimationEnd = (e: AnimationEvent) => {
    if (e.animationName !== "vaRise" && e.animationName !== "vaInkDraw") return;
    ended.current.add(e.target);
    if (ended.current.size >= riseCount + (parts.has("brush") ? 1 : 0)) markIntroPlayed();
  };

  const volumes = Object.values(projects).filter((p) => p.volume).length;
  const floaterCards: FloaterCard[] = [];
  for (const id of section.hero?.floaters.items ?? []) {
    const p = projects[id];
    if (!p?.volume) continue;
    const head = headlineOutcome(p);
    const kicker = p.project.overview.cardLabel || p.project.overview.company;
    floaterCards.push({
      volume: p.volume,
      accent: ACCENT_COLOURS[p.project.visuals.accent].accent,
      ...(kicker ? { kicker } : {}),
      title: p.project.overview.title,
      ...(head ? { value: head.value, result: head.type } : {}),
      href: `/work/${p.slug}`,
    });
  }

  return (
    <section
      ref={heroRef}
      id={section.id}
      aria-label="Introduction"
      className={cx(styles.hero, paused && "paused")}
      onAnimationEnd={onAnimationEnd}
    >
      <div className={styles.wrap}>
        <InkPanel
          volumeRange={volumeRange(volumes)}
          motion={motion}
          linesRef={linesRef}
          floaters={
            floaterCards.length > 0 ? (
              <HeroFloaters
                cards={floaterCards}
                atOnce={section.hero?.floaters.atOnce ?? 3}
                heroRef={heroRef}
              />
            ) : null
          }
        >
          {lines}
        </InkPanel>
      </div>
    </section>
  );
}
