import { forwardRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";

import styles from "./Button.module.css";
import { Spinner, type SpinnerKind } from "./Spinner";
import { cx } from "../cx";

export type ButtonVariant = "cta" | "btn" | "pbtn" | "btn2" | "btn2-dark" | "ghost" | "danger" | "link";

const CLASS: Record<ButtonVariant, string | undefined> = {
  cta: styles.cta,
  btn: styles.btn,
  pbtn: styles.pbtn,
  btn2: styles.btn2,
  "btn2-dark": styles.btn2Dark,
  ghost: styles.ghost,
  danger: styles.danger,
  link: styles.link,
};

const SPIN: Partial<Record<ButtonVariant, SpinnerKind>> = { cta: "cta", pbtn: "light", danger: "cta" };

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  variant?: ButtonVariant;
  /**
   * Unavailable but still focusable, so its reason can be read (`aria-disabled`, as on the boards).
   * Clicks are ignored.
   */
  disabled?: boolean | undefined;
  /** Working: shows the spinner before the label, sets `aria-busy` and ignores clicks. */
  busy?: boolean | undefined;
  children: ReactNode;
}

/** Studio's buttons: `.cta`, `.btn`, `.pbtn`, `.btn2`, ghost, destructive and text link. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "btn", disabled, busy, className, onClick, type = "button", children, ...rest },
  ref,
) {
  const blocked = Boolean(disabled) || Boolean(busy);
  const handle = (e: MouseEvent<HTMLButtonElement>) => {
    if (blocked) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  return (
    <button
      ref={ref}
      type={type}
      className={cx(CLASS[variant], className)}
      aria-disabled={disabled ? true : undefined}
      aria-busy={busy ? true : undefined}
      onClick={handle}
      {...rest}
    >
      {busy ? <Spinner kind={SPIN[variant] ?? "dark"} /> : null}
      {children}
    </button>
  );
});

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** The accessible name; icon buttons have no visible text. */
  label: string;
  /** 38px in the editors, 36px on StudioStates and StudioWriting. */
  size?: 36 | 38;
  children: ReactNode;
}

/** `.ib`: a borderless icon button. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 38, className, type = "button", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cx(styles.ib, size === 36 ? styles.ib36 : "", className)}
      {...rest}
    >
      {children}
    </button>
  );
});
