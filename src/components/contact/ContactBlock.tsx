import { useEffect, useRef, useState } from "react";

import { Icon } from "~/components/icons";

import styles from "./ContactBlock.module.css";

/** "Copied" shows for 2 seconds (02 · C18). */
export const COPIED_MS = 2000;

interface ContactBlockProps {
  /** e.g. "Thanks for reading". Empty hides it. */
  kicker?: string;
  /** The closing line, then its accent half in red. */
  title: string;
  titleAccent?: string;
  /** For the section's aria-labelledby. */
  titleId?: string;
  intro?: string;
  /** Without an email, Email me and Copy email hide (03 · Contact). */
  email?: string;
  linkedin?: string;
  github?: string;
  /** The résumé PDF's URL (laptop only). */
  resume?: string;
}

/** The ten static lines behind the laptop block, from Home.dc.html. */
const ENDS = [0, 150, 300, 450, 600];

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and insecure origins: a hidden textarea and execCommand.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "absolute";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the fallback where the Clipboard API is missing
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/**
 * C18 · The contact block: kicker, two-tone display title, intro, then Email me and Copy email with
 * LinkedIn, GitHub and Résumé (PDF) links on laptop; Email me, LinkedIn and GitHub as buttons on iPad
 * and phones. Copy email reads "Copied" for 2 seconds, announced in a polite live region; no toast.
 */
export function ContactBlock({
  kicker,
  title,
  titleAccent,
  titleId,
  intro,
  email,
  linkedin,
  github,
  resume,
}: ContactBlockProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const onCopy = async () => {
    if (!email || !(await copyText(email))) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
    }, COPIED_MS);
  };

  const hasLinks = Boolean(linkedin || github || resume);
  return (
    <div className={styles.block}>
      <svg
        className={styles.lines}
        viewBox="0 0 1440 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        {ENDS.map((y) => (
          <line key={`l${y}`} x1="720" y1="300" x2="-40" y2={y} />
        ))}
        {ENDS.map((y) => (
          <line key={`r${y}`} x1="720" y1="300" x2="1480" y2={y} />
        ))}
      </svg>
      <div className={styles.inner}>
        {kicker ? <div className={styles.kicker}>{kicker}</div> : null}
        <h2 id={titleId} className={styles.title}>
          {title}
          {titleAccent ? (
            <>
              {" "}
              <span className={styles.accent}>{titleAccent}</span>
            </>
          ) : null}
        </h2>
        {intro ? <p className={styles.intro}>{intro}</p> : null}
        {email || linkedin || github ? (
          <div className={styles.actions}>
            {email ? (
              <>
                <a className={styles.cta} href={`mailto:${email}`}>
                  <Icon name="mail" className={`ico ${styles.mailIcon ?? ""}`} />
                  Email me
                </a>
                <button
                  type="button"
                  className={`${styles.cta2 ?? ""} ${styles.copy ?? ""}`}
                  onClick={() => {
                    void onCopy();
                  }}
                >
                  <Icon name={copied ? "check" : "copy"} />
                  {copied ? "Copied" : "Copy email"}
                </button>
              </>
            ) : null}
            {linkedin || github ? (
              <div className={styles.pair}>
                {linkedin ? (
                  <a className={styles.cta2} href={linkedin}>
                    LinkedIn
                  </a>
                ) : null}
                {github ? (
                  <a className={styles.cta2} href={github}>
                    GitHub
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {hasLinks ? (
          <div className={styles.links}>
            {linkedin ? (
              <a className={styles.link} href={linkedin}>
                LinkedIn
                <Icon name="arrow-out" className={`ico ${styles.small ?? ""}`} />
              </a>
            ) : null}
            {github ? (
              <a className={styles.link} href={github}>
                GitHub
                <Icon name="arrow-out" className={`ico ${styles.small ?? ""}`} />
              </a>
            ) : null}
            {resume ? (
              <a className={styles.link} href={resume}>
                Résumé (PDF)
                <Icon name="download" className={`ico ${styles.small ?? ""}`} />
              </a>
            ) : null}
          </div>
        ) : null}
        <span className="sr-only" role="status" aria-live="polite">
          {copied ? "Copied" : ""}
        </span>
      </div>
    </div>
  );
}
