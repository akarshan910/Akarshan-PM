import { useEffect, useRef, useState } from "react";

import { toVideoEmbedUrl, videoHost, videoHostLabel } from "~/lib/links";
import { isHttpsUrl } from "~/lib/link-rules";

import { Icon } from "../icons";
import actions from "../states/actions.module.css";
import { Image } from "./Image";
import type { ImageData } from "./types";
import styles from "./VideoEmbed.module.css";

export type VideoState = "poster" | "starting" | "playing" | "unavailable";

interface VideoEmbedProps {
  /** The video's share link: YouTube, Vimeo, Loom or Google Drive. */
  url: string;
  /** `hero.title` or the block's title, shown on the poster. */
  title?: string;
  /** "3:24", when the host gave it at publish. */
  duration?: string;
  /** The host's thumbnail stored at publish (Drive: the project's cover). */
  poster?: ImageData;
  /** Studio's link check found the video gone or private. */
  unavailable?: boolean;
  className?: string | undefined;
  /** Shows one state without contacting the host. For the component catalogue and QA only. */
  state?: VideoState;
}

/** The video iframe's sandbox: the player's scripts, its own storage, fullscreen and its links. */
const VIDEO_SANDBOX = "allow-scripts allow-same-origin allow-presentation allow-popups";

/**
 * C20 · Video embed (03 · Media › Video, M-VIDEO). A poster with a real play button: nothing
 * loads from the host until it's pressed. Then the host's player replaces the poster at the
 * same size, with the spinner until it loads. Unknown hosts and removed videos get the
 * "isn't available" state with a link to the host.
 */
export function VideoEmbed({
  url,
  title,
  duration,
  poster,
  unavailable,
  className,
  state: forced,
}: VideoEmbedProps) {
  const embed = toVideoEmbedUrl(url);
  const host = videoHost(url);
  const [state, setState] = useState<VideoState>("poster");
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const shown: VideoState = forced ?? (unavailable || !embed ? "unavailable" : state);
  const stageClass = className ? `${styles.stage} ${className}` : styles.stage;

  // The play button goes away on press: keep focus in the player's box while it starts.
  useEffect(() => {
    if (state === "starting") stage.current?.focus();
  }, [state]);

  if (shown === "unavailable") {
    return (
      <div className={stageClass}>
        <div className={styles.message}>
          <div>
            <p className={styles.title}>This video isn’t available right now.</p>
            <p className={styles.sub}>It may have been moved or made private.</p>
            {isHttpsUrl(url) ? (
              <a
                className={`${actions.btnx} ${actions.small} ${styles.action}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch on the host ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const meta = [title, duration].filter(Boolean).join(" · ");
  const hostLine = host
    ? `Plays from ${videoHostLabel(host)}${host === "youtube" ? " · privacy mode" : ""}`
    : "";
  const live = shown === "starting" || shown === "playing";

  return (
    <div ref={stage} className={stageClass} data-state={shown} tabIndex={-1}>
      {shown !== "playing" ? (
        <>
          {poster ? (
            <Image image={{ ...poster, alt: "" }} className={styles.poster} />
          ) : (
            <span className={styles.ground} aria-hidden="true" />
          )}
          {meta ? <span className={`mono ${styles.meta}`}>{meta}</span> : null}
        </>
      ) : null}

      {shown === "poster" ? (
        <>
          <button
            type="button"
            className={styles.playArea}
            aria-label={title ? `Play the video: ${title}` : "Play the video"}
            onClick={() => {
              setState("starting");
            }}
          >
            <span className={styles.play}>
              <Icon name="play" size={22} filled />
            </span>
          </button>
          {hostLine ? <span className={`mono ${styles.host}`}>{hostLine}</span> : null}
        </>
      ) : null}

      {shown === "starting" ? (
        <span className={styles.center} role="status">
          <span className={styles.spin} aria-hidden="true" />
          <span className="sr-only">Loading the video…</span>
        </span>
      ) : null}

      {shown === "playing" && forced ? (
        <span className={styles.player} aria-hidden="true">
          <span className={styles.track}>
            <span />
          </span>
        </span>
      ) : null}

      {live && !forced && embed ? (
        <iframe
          ref={frame}
          className={styles.frame}
          src={embed}
          title={title ?? "Video"}
          sandbox={VIDEO_SANDBOX}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          onLoad={() => {
            setState("playing");
            frame.current?.focus();
          }}
        />
      ) : null}
    </div>
  );
}
