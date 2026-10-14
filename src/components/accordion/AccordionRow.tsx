import { type ReactNode, useId, useState } from "react";

import { Icon } from "~/components/icons";

import styles from "./AccordionRow.module.css";

interface AccordionRowProps {
  title: ReactNode;
  /** Phones: on its own line; iPad: inline after "·". Empty hides it. */
  subtitle?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /**
   * Where the row is an accordion: everywhere (default), on iPad and phones ("touch"), or on phones
   * only ("phone"). Elsewhere the button hides and the content shows in the parent's own layout.
   */
  collapse?: "always" | "touch" | "phone";
  className?: string;
}

/**
 * C14 · Accordion row: a button with `aria-expanded` and `aria-controls`, the title, an optional
 * subtitle and a plus that turns 45° while open (M-ACCORDION).
 */
export function AccordionRow({
  title,
  subtitle,
  children,
  defaultOpen = false,
  collapse = "always",
  className,
}: AccordionRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const root = [collapse === "always" ? "" : styles[collapse], open ? styles.open : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={root}>
      <button
        type="button"
        className={styles.acc}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        <span>
          {title}
          {subtitle ? <span className={styles.sub}>{subtitle}</span> : null}
        </span>
        <Icon name="plus" className={`ico ${styles.icon ?? ""}`} />
      </button>
      <div id={panelId} className={styles.panel}>
        {children}
      </div>
    </div>
  );
}
