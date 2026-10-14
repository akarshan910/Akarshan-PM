/**
 * C2 · Phone menu (02 · C2, 03 · Phone menu, 04 · M-NAV-MENU).
 *
 * A full-screen dialog under the pill, so the pill stays tappable. The pill nav owns the open
 * state, the inert page and the focus return; this component draws the sheet and reports which
 * control closed it. Close is instant, as on the board.
 */
import { useEffect, type MouseEvent } from "react";

import { Button } from "../buttons/Button";
import { cx } from "../cx";
import { Icon } from "../icons";
import styles from "./PhoneMenu.module.css";
import { safeHref } from "~/lib/links";

export interface MenuLink {
  id: string;
  label: string;
  href: string;
}

export interface PhoneMenuProps {
  id: string;
  links: MenuLink[];
  /** The scroll-spy's current section; its link gets `aria-current="true"`. */
  current?: string | null | undefined;
  letsTalk?: { href: string; newTab?: boolean } | undefined;
  email?: string | undefined;
  linkedin?: string | undefined;
  resume?: string | undefined;
  /** A link was chosen: the nav closes the menu, then scrolls there. */
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, link: MenuLink) => void;
  /** "Close menu" or Esc. */
  onClose: () => void;
  /** Let's Talk was chosen: the nav closes the menu, then goes there. Defaults to `onClose`. */
  onLetsTalk?: (event: MouseEvent<HTMLElement>) => void;
  /** Positioned inside its parent instead of the viewport (the catalogue's phone frame). */
  contained?: boolean;
}

export function PhoneMenu({
  id,
  links,
  current,
  letsTalk,
  email,
  linkedin,
  resume,
  onNavigate,
  onClose,
  onLetsTalk,
  contained,
}: PhoneMenuProps) {
  // Esc closes the menu from anywhere while it's open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div
      id={id}
      className={cx(styles.menu, contained && styles.contained)}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
    >
      <div className={styles.k}>Menu</div>
      <nav aria-label="Sections" className={styles.sections}>
        {links.map((link, i) => (
          <a
            key={link.id}
            className={styles.l}
            href={safeHref(link.href)}
            aria-current={link.id === current ? "true" : "false"}
            style={{ animationDelay: `${Math.min(i, 4) * 80}ms` }}
            onClick={(event) => {
              onNavigate(event, link);
            }}
          >
            <span className={styles.n}>{String(i + 1).padStart(2, "0")}</span>
            {link.label}
          </a>
        ))}
      </nav>
      {letsTalk && (
        <Button
          href={safeHref(letsTalk.href)}
          newTab={letsTalk.newTab ?? false}
          size="menu"
          block
          className={styles.cta}
          onClick={onLetsTalk ?? onClose}
        >
          Let’s Talk →
        </Button>
      )}
      {(email ?? linkedin ?? resume) && (
        <div className={styles.foot}>
          {email && <a href={safeHref(`mailto:${email}`)}>Email</a>}
          {linkedin && (
            <a href={safeHref(linkedin)} target="_blank" rel="noopener noreferrer">
              LinkedIn<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          {resume && <a href={safeHref(resume)}>Résumé (PDF)</a>}
        </div>
      )}
      <button type="button" className={styles.x} onClick={onClose}>
        <Icon name="close" />
        Close menu
      </button>
    </div>
  );
}
