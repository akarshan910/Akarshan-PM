import { useCallback, useMemo, useState } from "react";

import { Button } from "~/components/buttons/Button";
import { Cover, type CoverImage } from "~/components/cards/Cover";
import { PrototypeEmbed, type PrototypeState } from "~/components/media/PrototypeEmbed";
import { VideoEmbed } from "~/components/media/VideoEmbed";
import type { CaseStudyView } from "~/lib/case-study";
import { isCrossOriginHttps, prototypeUrl } from "~/lib/links";
import type { Img, ProjectHeroPublished } from "~/lib/published";

import { cx } from "../cx";
import { Icon } from "../icons";
import styles from "./CaseStudy.module.css";

type PrototypeHero = Extract<ProjectHeroPublished, { type: "prototype" }>;

const COVER_SIZES = "(max-width: 767px) 100vw, (max-width: 1279px) 770px, 1200px";

function coverImage(img: Img | undefined): CoverImage | undefined {
  return img
    ? {
        src: img.src,
        srcSet: img.srcset,
        sizes: COVER_SIZES,
        alt: img.alt,
        width: img.width,
        height: img.height,
        focal: img.focal,
      }
    : undefined;
}

/** The case study's hero media (03 · Case study): the prototype heading, a video, or the cover. */
export function CaseStudyHero({ view }: { view: CaseStudyView }) {
  const { hero, cover } = view.project.visuals;
  if (hero.type === "prototype" && hero.url) return <PrototypeHeading view={view} hero={hero} />;
  if (hero.type === "video" && hero.url) {
    const poster = hero.poster ?? cover;
    return (
      <section className={cx("wrap", styles.wrapped, styles.hero)} aria-label="Video">
        <VideoEmbed
          url={hero.url}
          {...(hero.title ? { title: hero.title } : {})}
          {...(hero.duration ? { duration: hero.duration } : {})}
          {...(poster ? { poster } : {})}
        />
      </section>
    );
  }
  // The cover always exists: generated when none was uploaded.
  return (
    <div className={cx("wrap", styles.wrapped, styles.hero)}>
      <Cover
        image={coverImage(cover)}
        accent={view.accent}
        ground={view.ground}
        number={view.volume}
        lazy={false}
        className={styles.heroCover}
      />
    </div>
  );
}

/** The ten speed lines behind the laptop's prototype heading (CaseStudy.dc.html). */
const LINES = [
  [-20, -20],
  [-20, 100],
  [-20, 220],
  [-20, 340],
  [-20, 460],
  [-20, 580],
  [-20, 680],
  [1220, 0],
  [1220, 320],
  [1220, 640],
] as const;

/**
 * The prototype heading, per device (03 · Case study). Laptop: the kicker (the "Live" chip while
 * it runs), the title, the screens as shortcuts, Explore / Exit / New tab and the frame beside.
 * iPad: the frame first, the screens as one line, full-width buttons. Phones: a card whose
 * "Try the prototype" opens the full-screen sheet. Nothing loads until the visitor explores.
 */
function PrototypeHeading({ view, hero }: { view: CaseStudyView; hero: PrototypeHero }) {
  const { project } = view;
  const [state, setState] = useState<PrototypeState>("poster");
  const [screen, setScreen] = useState(0);
  const screens = useMemo(() => hero.screens ?? [], [hero.screens]);
  const startPath = screens[screen]?.startPath;
  const src = prototypeUrl(hero.url, startPath) ?? hero.url;
  const name = `${project.overview.title} prototype`;
  const poster = hero.poster ?? project.visuals.cover;
  const count = screens.length;
  const countLabel = count > 0 ? ` · ${count} ${count === 1 ? "screen" : "screens"}` : "";

  const explore = useCallback(
    (at?: number) => {
      const path = at === undefined ? startPath : screens[at]?.startPath;
      const target = prototypeUrl(hero.url, path);
      if (!target) return;
      if (at !== undefined) setScreen(at);
      // Only ever framed from another origin (03 · Media); anything else opens in a new tab.
      if (!isCrossOriginHttps(target, window.location.origin)) {
        window.open(target, "_blank", "noopener,noreferrer");
        return;
      }
      setState("loading");
    },
    [hero.url, screens, startPath],
  );
  const exit = useCallback(() => {
    setState("poster");
  }, []);
  const live = state !== "poster";

  const title = hero.title ? <h2 className={styles.protoTitle}>{hero.title}</h2> : null;
  const newTab = (label: string, block: boolean) => (
    <Button variant="secondary" href={src} newTab iconEnd="arrow-out" block={block} className={styles.onDark}>
      {label}
    </Button>
  );

  return (
    <section className={cx("wrap", styles.wrapped, styles.hero)} aria-label="Interactive prototype">
      <div className={cx(styles.proto, styles.notPhone)}>
        <svg
          className={styles.lines}
          viewBox="0 0 1200 640"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {LINES.map(([x, y]) => (
            <line key={`${x}-${y}`} x1="760" y1="320" x2={x} y2={y} />
          ))}
        </svg>
        <div className={styles.protoInner}>
          <div className={styles.protoText}>
            {/* Laptop */}
            <div className={styles.notIpad}>
              {state === "running" ? (
                <div className={styles.live}>Live — tap through the screens</div>
              ) : (
                <div className={cx(styles.mono, styles.kicker)}>Interactive prototype</div>
              )}
              {title}
              {count > 0 ? (
                <ol className={styles.screens} aria-label="Screens">
                  {screens.map((s, i) => (
                    <li key={s.startPath + s.label}>
                      <button
                        type="button"
                        className={styles.screen}
                        aria-current={i === screen ? "true" : undefined}
                        onClick={() => {
                          explore(i);
                        }}
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ol>
              ) : null}
              <div className={styles.protoButtons}>
                {live ? (
                  <Button variant="secondary" icon="close" onClick={exit} className={styles.onDark}>
                    Exit prototype
                  </Button>
                ) : (
                  <Button
                    icon="play"
                    onClick={() => {
                      explore();
                    }}
                  >
                    Explore the prototype
                  </Button>
                )}
                {newTab("New tab", false)}
              </div>
              <p className={styles.fixed}>Nothing loads until you choose to explore. Press Esc to leave.</p>
            </div>
            {/* iPad */}
            <div className={styles.notLaptop}>
              <div className={cx(styles.mono, styles.kicker)}>Interactive prototype{countLabel}</div>
              {title}
              {count > 0 ? (
                <p className={styles.screenLine}>{screens.map((s) => s.label).join(", ")}</p>
              ) : null}
              <div className={styles.protoButtons}>
                {live ? (
                  <Button variant="secondary" icon="close" onClick={exit} block className={styles.onDark}>
                    Exit prototype
                  </Button>
                ) : (
                  <Button
                    icon="play"
                    block
                    onClick={() => {
                      explore();
                    }}
                  >
                    Explore the prototype
                  </Button>
                )}
                {newTab("Open in a new tab", true)}
              </div>
              <p className={styles.fixed}>Plays inline in landscape; expands to full screen in portrait.</p>
            </div>
          </div>
          <div className={styles.frame}>
            <PrototypeEmbed
              url={hero.url}
              name={name}
              frame={hero.frame}
              controls="external"
              state={state}
              onStateChange={setState}
              {...(startPath ? { startPath } : {})}
              {...(poster ? { poster } : {})}
              {...(hero.note ? { note: hero.note } : {})}
            />
          </div>
        </div>
      </div>
      {hero.note ? <p className={cx(styles.heroNote, styles.notPhone, styles.notIpad)}>{hero.note}</p> : null}

      {/* Phones */}
      <div className={cx(styles.protoCard, styles.notLaptop, styles.notIpad)}>
        <div className={styles.protoPoster}>
          <Cover image={coverImage(poster)} accent={view.accent} ground={view.ground} number={view.volume} />
          <span className={styles.badge}>
            <Icon name="play" size={12} filled />
            Prototype{countLabel}
          </span>
        </div>
        <div className={styles.protoCardBody}>
          {hero.title ? <h2 className={styles.protoCardTitle}>{hero.title}</h2> : null}
          <Button
            iconEnd="play"
            block
            onClick={() => {
              explore();
            }}
          >
            Try the prototype
          </Button>
          <p className={styles.protoCardNote}>Opens full screen. Nothing loads until you tap.</p>
        </div>
      </div>
    </section>
  );
}
