import type { ReactNode } from "react";

import styles from "./Banner.module.css";

export type BannerTone = "err" | "warn" | "info";

interface BannerProps {
  tone: BannerTone;
  /** A decorative 18px icon (16px in `.ban` and the editor bar). */
  icon?: ReactNode | undefined;
  /** A trailing action, such as "Retry now". */
  action?: ReactNode | undefined;
  /** `alert` for errors that need attention now, `status` for news; omit for static text. */
  role?: "alert" | "status";
  /** Enters with M-ST-ENTER when it appears after the page has loaded. */
  enter?: boolean | undefined;
  children: ReactNode;
}

function classes(...names: (string | false | undefined)[]) {
  return names.filter(Boolean).join(" ");
}

/** `.alert`: the sign-in page's alerts (StudioLogin): wrong code, expired, too many tries, offline. */
export function Alert({ tone, icon, action, role, enter, children }: BannerProps) {
  return (
    <div className={classes(styles.alert, styles[tone], enter && styles.enter)} role={role}>
      {icon}
      <span className={styles.body}>{children}</span>
      {action}
    </div>
  );
}

/** `.ban`: a rounded banner (StudioStates › Banners, Upload problems). */
export function Banner({ tone, icon, action, role, enter, children }: BannerProps) {
  return (
    <div className={classes(styles.ban, styles.sm, styles[tone], enter && styles.enter)} role={role}>
      {icon}
      <span className={styles.body}>{children}</span>
      {action}
    </div>
  );
}

/** The full-width banner under an editor's header: offline, or the last change didn't save. */
export function EditorBanner({ tone, icon, action, role, children }: Omit<BannerProps, "enter">) {
  return (
    <div className={classes(styles.bar, styles[tone])} role={role}>
      {icon}
      <span className={styles.body}>{children}</span>
      {action}
    </div>
  );
}
