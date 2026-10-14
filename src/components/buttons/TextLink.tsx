/** C3 · Text link: the red-ruled uppercase link, or the plain inline link with a trailing icon. */
import type { ReactNode } from "react";

import { cx } from "../cx";
import { Icon, type IconName } from "../icons";
import styles from "./TextLink.module.css";

export interface TextLinkProps {
  href: string;
  children: ReactNode;
  variant?: "underline" | "inline";
  /** A trailing icon, 15px on the inline variant (arrow-out for external links, download for the PDF). */
  icon?: IconName;
  /** Opens in a new tab, and says so to screen readers. */
  newTab?: boolean;
  className?: string | undefined;
}

export function TextLink({ href, children, variant = "underline", icon, newTab, className }: TextLinkProps) {
  return (
    <a
      href={href}
      className={cx(variant === "inline" ? styles.inline : styles.underline, className)}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {icon && <Icon name={icon} />}
      {newTab && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
