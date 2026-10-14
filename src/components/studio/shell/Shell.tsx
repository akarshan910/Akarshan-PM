/**
 * The Studio shell (05 · Shell; boards StudioDashboard, StudioTablet, StudioMobile):
 *
 * - laptop and iPad landscape (≥ 1024): the sidebar, with the account card at the bottom;
 * - iPad portrait (768–1023): the 68px icon rail, labels as tooltips;
 * - phones (< 768): the five-tab bottom bar. The account menu is under Home.
 *
 * The Website builder uses the rail at every width above phones (`nav="rail"`).
 */
import * as Tooltip from "@radix-ui/react-tooltip";
import { useEffect, useRef, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";

import { cx } from "../../cx";
import { StudioIcon, type StudioIconName } from "../StudioIcon";
import { AccountMenu } from "./AccountMenu";
import styles from "./Shell.module.css";

export interface NavItem {
  to: string;
  label: string;
  /** The phone tab's label, where it differs ("Home"). */
  tab?: string;
  icon: StudioIconName;
  end?: boolean;
  count?: number | undefined;
}

export function navItems(projectCount?: number): NavItem[] {
  return [
    { to: "/studio", label: "Dashboard", tab: "Home", icon: "dashboard", end: true },
    { to: "/studio/website", label: "Website", icon: "website" },
    { to: "/studio/projects", label: "Projects", icon: "projects", count: projectCount },
    { to: "/studio/writing", label: "Writing", icon: "writing" },
    { to: "/studio/media", label: "Media", icon: "media" },
  ];
}

interface ShellProps {
  email: string;
  projectCount?: number | undefined;
  /** "rail" keeps the icon rail on laptops too (Website builder). */
  nav?: "auto" | "rail";
  /** Phones hide the tab bar in the editors, which have their own bottom bar (StudioMobile). */
  tabbar?: boolean;
  /** The live site's address, for "View live site ↗". */
  liveHref?: string;
  onSignOut: (scope: "local" | "global") => void;
  children: ReactNode;
}

function Wordmark({ small }: { small?: boolean }) {
  return (
    <span className={small ? styles.markSm : styles.mark}>
      Studio<span className={styles.dot}>.</span>
    </span>
  );
}

export function Shell({
  email,
  projectCount,
  nav = "auto",
  tabbar = true,
  liveHref = "/",
  onSignOut,
  children,
}: ShellProps) {
  const items = navItems(projectCount);
  const { pathname } = useLocation();
  const main = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // A new Studio page moves focus to its heading, as a full page load would (WCAG 2.4.3).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const h1 = [...(main.current?.querySelectorAll<HTMLElement>("h1") ?? [])].find(
        (h) => h.offsetParent !== null,
      );
      const target = h1 ?? main.current;
      if (!target) return;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }, 0);
    return () => {
      clearTimeout(t);
    };
  }, [pathname]);
  // The editor and post routes keep their parent's item current.
  const current = (item: NavItem) =>
    item.end ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to);

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className={cx("st", styles.shell)} data-nav={nav} data-tabbar={tabbar ? undefined : "off"}>
        <a className={styles.skip} href="#studio-main">
          Skip to content
        </a>
        <aside className={styles.sidebar} aria-label="Studio">
          <div className={styles.brand}>
            <Wordmark />
            <span className="mono" style={{ fontSize: 11 }}>
              CMS
            </span>
          </div>
          <nav aria-label="Studio" className={styles.sideNav}>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={() => cx(styles.nav, current(item) && styles.on)}
                aria-current={current(item) ? "page" : undefined}
              >
                <StudioIcon name={item.icon} />
                {item.label}
                {item.count !== undefined ? <span className={styles.count}>{item.count}</span> : null}
              </NavLink>
            ))}
            <div className={styles.divider} />
            <a className={styles.nav} href={liveHref} target="_blank" rel="noopener noreferrer">
              <StudioIcon name="live" />
              View live site
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </nav>
          <div className={styles.account}>
            <AccountMenu email={email} onSignOut={onSignOut} variant="card" />
          </div>
        </aside>

        <nav className={styles.rail} aria-label="Studio">
          <NavLink to="/studio" end className={cx(styles.railMark)} aria-label="Studio dashboard">
            S<span className={styles.dot}>.</span>
          </NavLink>
          {items.map((item) => (
            <Tooltip.Root key={item.to}>
              <Tooltip.Trigger asChild>
                <NavLink
                  to={item.to}
                  end={item.end ?? false}
                  className={() => cx(styles.rl, current(item) && styles.on)}
                  aria-label={item.label}
                  aria-current={current(item) ? "page" : undefined}
                >
                  <StudioIcon name={item.icon} />
                </NavLink>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="right" sideOffset={8} className={cx("st", styles.tip)}>
                  {item.label}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
          <div className={styles.railEnd}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <a
                  className={styles.rl}
                  href={liveHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View live site (opens in a new tab)"
                >
                  <StudioIcon name="live" />
                </a>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="right" sideOffset={8} className={cx("st", styles.tip)}>
                  View live site
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            <AccountMenu email={email} onSignOut={onSignOut} variant="avatar" />
          </div>
        </nav>

        <div className={styles.main} id="studio-main" ref={main} tabIndex={-1}>
          {children}
        </div>

        <nav className={styles.tabbar} aria-label="Studio">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              className={() => cx(styles.tbi, current(item) && styles.on)}
              aria-current={current(item) ? "page" : undefined}
            >
              <StudioIcon name={item.icon} size={22} />
              {item.tab ?? item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </Tooltip.Provider>
  );
}
