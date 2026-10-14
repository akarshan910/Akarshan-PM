/**
 * C1 · Pill nav (02 · C1, D4, D9, 04 · M-NAV-RING, M-NAV-LINK, M-NAV-PILL, M-NAV-CONTACT).
 *
 * Laptop and iPad: the section links, a separator, then Let's Talk, with the sliding highlight
 * (`updatePill`) and the scroll-spy (`updateNavSection`) ported from the live site. Phones: Menu,
 * a separator, then Let's Talk; Menu opens the phone menu (C2).
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent } from "react";

import { prefersReducedMotion } from "~/motion/reduced-motion";

import { cx } from "../cx";
import { Icon } from "../icons";
import { PhoneMenu, type MenuLink } from "./PhoneMenu";
import styles from "./PillNav.module.css";
import { useScrollSpy } from "./scrollSpy";
import { safeHref } from "~/lib/links";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type NavLink = MenuLink;

export interface PillNavProps {
  /** Every visible section with a nav label, in page order. On other pages, `href` is `/#<id>`. */
  links: NavLink[];
  /** Where "Let's Talk →" goes (03 · The page shell). Without a target it hides. */
  letsTalk?: { href: string; newTab?: boolean } | undefined;
  /** A fixed current link, e.g. "work" on a case study. Turns the scroll-spy off. */
  current?: string | undefined;
  /** The hero's id: over it, no link is active. */
  heroId?: string;
  /** The contact section's id: over it, Let's Talk glows. */
  contactId?: string;
  /** "Skip to work" target. Without one, the skip link is left out. */
  skipTo?: string | undefined;
  /** The phone menu's footer links, each shown when set. */
  email?: string | undefined;
  linkedin?: string | undefined;
  resume?: string | undefined;
  /** `static` draws the pill in the page flow (the catalogue only). */
  position?: "fixed" | "static";
}

/** Scrolls to a same-page section. Smooth scrolling is off under reduced motion. */
function scrollToHash(href: string): boolean {
  const hash = href.slice(href.indexOf("#") + 1);
  if (!href.includes("#") || !hash) return false;
  if (href.startsWith("/") && !href.startsWith(`${window.location.pathname}#`)) return false;
  const target = document.getElementById(hash);
  if (!target) return false;
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  return true;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PillNav({
  links,
  letsTalk,
  current: fixedCurrent,
  heroId = "top",
  contactId = "contact",
  skipTo,
  email,
  linkedin,
  resume,
  position = "fixed",
}: PillNavProps) {
  const menuId = useId();
  const shellRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const placed = useRef(false);
  const [open, setOpen] = useState(false);

  const spyIds = [heroId, ...links.map((l) => l.id), contactId];
  const [spied, setSpied] = useScrollSpy(spyIds, navRef, fixedCurrent === undefined);
  const current = fixedCurrent ?? spied;
  const activeLink = links.some((l) => l.id === current) ? current : null;
  const contactActive = current !== null && current === contactId;

  /** `updatePill`: the highlight sits under the active link; no transition on first paint or resize. */
  const placePill = useCallback(
    (animate: boolean) => {
      const pill = pillRef.current;
      const nav = navRef.current;
      const link = activeLink ? linkRefs.current.get(activeLink) : undefined;
      if (!pill || !nav || !link) return;
      const run = animate && placed.current;
      if (!run) pill.style.transition = "none";
      const navR = nav.getBoundingClientRect();
      const linkR = link.getBoundingClientRect();
      pill.style.left = `${linkR.left - navR.left}px`;
      pill.style.width = `${linkR.width}px`;
      placed.current = true;
      if (!run)
        requestAnimationFrame(() => {
          pill.style.transition = "";
        });
    },
    [activeLink],
  );

  useIsoLayoutEffect(() => {
    placePill(true);
  }, [placePill]);

  useEffect(() => {
    const still = () => {
      placePill(false);
    };
    window.addEventListener("resize", still);
    void document.fonts.ready.then(still);
    return () => {
      window.removeEventListener("resize", still);
    };
  }, [placePill]);

  const closeMenu = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) requestAnimationFrame(() => menuBtnRef.current?.focus());
  }, []);

  // While the menu is open: the page behind is inert and doesn't scroll, focus stays in the pill
  // and the menu (03 · Phone menu). The menu itself closes on Esc.
  useEffect(() => {
    const shell = shellRef.current;
    if (!open || !shell) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const made: Element[] = [];
    for (let node: Element | null = shell; node && node !== document.body; node = node.parentElement) {
      for (const sibling of Array.from(node.parentElement?.children ?? [])) {
        if (sibling !== node && !sibling.hasAttribute("inert") && sibling.tagName !== "SCRIPT") {
          sibling.setAttribute("inert", "");
          made.push(sibling);
        }
      }
    }
    shell.querySelector<HTMLElement>(`[id="${CSS.escape(menuId)}"] a[href]`)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = Array.from(shell.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = overflow;
      for (const el of made) el.removeAttribute("inert");
    };
  }, [open, menuId]);

  const onLink = (event: MouseEvent<HTMLAnchorElement>, link: NavLink) => {
    if (fixedCurrent === undefined) setSpied(link.id);
    if (scrollToHash(link.href)) event.preventDefault();
  };

  const onMenuLink = (event: MouseEvent<HTMLAnchorElement>, link: NavLink) => {
    const samePage = link.href.includes("#") && document.getElementById(link.href.split("#")[1] ?? "");
    if (samePage) event.preventDefault();
    closeMenu();
    // Close first, so the page can scroll again, then scroll.
    if (samePage)
      requestAnimationFrame(() => {
        scrollToHash(link.href);
      });
  };

  const onLetsTalk = (event: MouseEvent<HTMLElement>) => {
    if (!letsTalk || letsTalk.newTab) {
      if (open) closeMenu(false);
      return;
    }
    if (!open) {
      if (scrollToHash(letsTalk.href)) event.preventDefault();
      return;
    }
    // From the menu: close first, so the page can scroll again, then go.
    const href = letsTalk.href;
    const samePage = href.includes("#") && document.getElementById(href.split("#")[1] ?? "");
    if (samePage) event.preventDefault();
    closeMenu(false);
    if (samePage)
      requestAnimationFrame(() => {
        scrollToHash(href);
      });
  };

  return (
    <>
      {skipTo && (
        <a className={styles.skip} href={skipTo}>
          Skip to work
        </a>
      )}
      <header ref={shellRef}>
        <nav
          ref={navRef}
          className={cx(styles.nav, position === "static" && styles.static)}
          aria-label="Primary"
        >
          <span
            ref={pillRef}
            className={styles.pill}
            aria-hidden="true"
            style={{ opacity: activeLink ? 1 : 0 }}
          />
          <button
            ref={menuBtnRef}
            type="button"
            className={cx(styles.menuBtn, "hit44")}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => {
              if (open) closeMenu();
              else setOpen(true);
            }}
          >
            <Icon name={open ? "close" : "menu"} />
            {open ? "Close" : "Menu"}
          </button>
          {links.length > 0 && (
            <div className={styles.links}>
              {links.map((link) => (
                <a
                  key={link.id}
                  ref={(el) => {
                    if (el) linkRefs.current.set(link.id, el);
                    else linkRefs.current.delete(link.id);
                  }}
                  className={cx(styles.nl, "hit44", link.id === activeLink && styles.on)}
                  href={safeHref(link.href)}
                  aria-current={link.id === activeLink ? "true" : undefined}
                  onClick={(event) => {
                    onLink(event, link);
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
          {letsTalk && (
            <>
              <span className={styles.sep} aria-hidden="true" />
              <a
                className={cx(styles.contact, "hit44", contactActive && styles.active)}
                href={safeHref(letsTalk.href)}
                onClick={onLetsTalk}
                {...(letsTalk.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                Let’s Talk →{letsTalk.newTab && <span className="sr-only"> (opens in a new tab)</span>}
              </a>
            </>
          )}
        </nav>
        {open && (
          <PhoneMenu
            id={menuId}
            links={links}
            current={current}
            letsTalk={letsTalk}
            email={email}
            linkedin={linkedin}
            resume={resume}
            onNavigate={onMenuLink}
            onClose={closeMenu}
            onLetsTalk={onLetsTalk}
          />
        )}
      </header>
    </>
  );
}
