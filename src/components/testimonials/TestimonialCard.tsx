import type { CSSProperties } from "react";

import { Icon } from "~/components/icons";

import styles from "./Testimonials.module.css";

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
  /** The testimonial's own colour pair for the initials avatar, e.g. #2A2033 on #D9C2F7. */
  avatar: { background: string; color: string };
  /** https link to LinkedIn. Empty hides the link. */
  linkedin?: string;
}

interface TestimonialCardProps extends Testimonial {
  className?: string | undefined;
  style?: CSSProperties;
}

/**
 * C16 · Testimonial card: the quote in curly quotes, then the initials avatar, name, role and the
 * LinkedIn link on laptop; "Name · Role" (iPad) or name over role (phone) on touch layouts.
 */
export function TestimonialCard({
  quote,
  name,
  role,
  initials,
  avatar,
  linkedin,
  className,
  style,
}: TestimonialCardProps) {
  return (
    <figure className={className ? `${styles.card ?? ""} ${className}` : styles.card} style={style}>
      <blockquote className={styles.quote}>“{quote}”</blockquote>
      <figcaption className={styles.caption}>
        <span className={styles.avatar} style={avatar} aria-hidden="true">
          {initials}
        </span>
        <span className={styles.who}>
          <span className={styles.name}>{name}</span>
          {role ? <span className={styles.role}>{role}</span> : null}
        </span>
        {linkedin ? (
          <a className={styles.linkedin} href={linkedin} aria-label={`${name} on LinkedIn`}>
            <Icon name="arrow-out" />
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}
