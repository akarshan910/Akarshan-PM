import styles from "./SiteFooter.module.css";

interface SiteFooterProps {
  year: number | string;
  name: string;
  /** The laptop credit after the name, e.g. "Vibe-coded in Bengaluru". Empty hides it. */
  credit?: string;
  /** The last site publish, formatted "13 Oct 2026". Empty hides it. */
  updated?: string;
  /** Case studies: a link back to the work list instead of the date. */
  back?: { href: string; label: string };
}

/**
 * C19 · The site footer. Laptop: "© year name · credit" and "Last updated date"; iPad: "© year name"
 * and "Updated date"; phone: one line, "© year name · Updated date" (02 · C19, 03 · Footer).
 */
export function SiteFooter({ year, name, credit, updated, back }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>
          © {year} {name}
          {credit && !back ? <span className={styles.credit}> · {credit}</span> : null}
          {updated && !back ? <span className={styles.phoneOnly}> · Updated {updated}</span> : null}
        </span>
        {back ? (
          <a className={styles.back} href={back.href}>
            {back.label}
          </a>
        ) : updated ? (
          <span className={styles.right}>
            <span className={styles.date}>
              <span className={styles.last}>Last updated</span>
              <span className={styles.ipadOnly}>Updated</span> {updated}
            </span>
          </span>
        ) : null}
      </div>
    </footer>
  );
}
