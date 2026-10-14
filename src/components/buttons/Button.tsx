/**
 * C3 · Buttons (02 · C3, 04 · M-CTA, M-BTN2).
 *
 * - `primary`: the angled CTA, `.cta`.
 * - `secondary`: `.cta2`; `compact` for "Full résumé"; `destructive` for delete actions.
 * - `ghost`: the System board's plain button.
 *
 * With `href` it renders a link, otherwise a button. Disabled and loading use `aria-disabled`, so
 * the control keeps its focus and its name; clicks are ignored while either is set.
 */
import type { MouseEvent, ReactNode } from "react";

import { cx } from "../cx";
import { Icon, type IconName } from "../icons";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  /** `compact`: the 44px secondary ("Full résumé"). `menu`: the 54px CTA inside the phone menu. */
  size?: "default" | "compact" | "menu";
  /** Renders an `<a>`. */
  href?: string | undefined;
  /** Opens in a new tab, and says so to screen readers (03 · Accessibility). */
  newTab?: boolean;
  /** An icon before the label. */
  icon?: IconName;
  /** An icon after the label, such as the arrow on "See selected work". */
  iconEnd?: IconName;
  /** Full width: `display: flex; width: 100%` (phones). */
  block?: boolean;
  disabled?: boolean;
  /** Shows the spinner; `loadingLabel` replaces the label, e.g. "Sending". */
  loading?: boolean;
  loadingLabel?: string;
  type?: "button" | "submit";
  onClick?: ((event: MouseEvent<HTMLElement>) => void) | undefined;
  className?: string | undefined;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

const VARIANT: Record<ButtonVariant, (string | undefined)[]> = {
  primary: [styles.cta],
  secondary: [styles.cta2],
  destructive: [styles.cta2, styles.destructive],
  ghost: [styles.ghost],
};

export function Button({
  children,
  variant = "primary",
  size = "default",
  href,
  newTab,
  icon,
  iconEnd,
  block,
  disabled,
  loading,
  loadingLabel,
  type = "button",
  onClick,
  className,
  ...aria
}: ButtonProps) {
  const inert = Boolean(disabled || loading);
  const classes = cx(
    ...VARIANT[variant],
    size === "compact" && styles.compact,
    size === "menu" && styles.menu,
    block && styles.block,
    className,
  );
  const handle = (event: MouseEvent<HTMLElement>) => {
    if (inert) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  const content = (
    <>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon && <Icon name={icon} />}
      {loading && loadingLabel ? loadingLabel : children}
      {!loading && iconEnd && <Icon name={iconEnd} />}
      {newTab && <span className="sr-only"> (opens in a new tab)</span>}
    </>
  );
  const state = {
    "aria-disabled": inert ? ("true" as const) : undefined,
    "aria-busy": loading ? ("true" as const) : undefined,
  };

  if (href !== undefined) {
    return (
      <a
        {...aria}
        {...state}
        className={classes}
        href={inert ? undefined : href}
        role={inert ? "link" : undefined}
        tabIndex={inert ? 0 : undefined}
        onClick={handle}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }
  return (
    <button {...aria} {...state} type={type} className={classes} onClick={handle}>
      {content}
    </button>
  );
}

export interface IconButtonProps {
  icon: IconName;
  /** Required: an icon-only control needs a name ("Previous testimonials"). */
  label: string;
  /** `square`: the System board's 44×44, radius 8. `round`: the Testimonials arrows. */
  shape?: "square" | "round";
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string | undefined;
  "aria-controls"?: string;
  "aria-expanded"?: boolean;
}

/** 44×44 icon-only button. Disabled uses the native attribute, as the Testimonials board does. */
export function IconButton({
  icon,
  label,
  shape = "square",
  disabled,
  onClick,
  className,
  ...aria
}: IconButtonProps) {
  return (
    <button
      {...aria}
      type="button"
      aria-label={label}
      disabled={disabled}
      className={cx(shape === "round" ? styles.round : styles.icon, className)}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}
