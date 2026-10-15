import { type ReactNode, useId, useState } from "react";

import { Icon } from "~/components/icons";

import styles from "./AccordionRow.module.css";
import { cx } from "../cx";

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
  const root = cx(collapse === "always" ? "" : styles[collapse], open ? styles.open : "", className);
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
          {/* The space belongs to the title's font, as on HomeTablet ("Razorpay <span>· …"). */}
          {subtitle ? (
            <>
              {" "}
              <span className={styles.sub}>{subtitle}</span>
            </>
          ) : null}
        </span>
        <Icon name="plus" className={cx("ico", styles.icon)} />
      </button>
      <div id={panelId} className={styles.panel}>
        {children}
      </div>
    </div>
  );
}
