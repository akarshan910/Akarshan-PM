/**
 * The account card and menu (05 · Shell; StudioAuthFlow › Path 7): the signed-in address and
 * "Owner · Sign out" on the card, and a menu with "Signed in with an email code", "Owner", then
 * "Sign out" and "Sign out on all devices".
 */
import * as Menu from "@radix-ui/react-dropdown-menu";

import { cx } from "../../cx";
import { StudioIcon } from "../StudioIcon";
import styles from "./AccountMenu.module.css";

interface AccountMenuProps {
  email: string;
  onSignOut: (scope: "local" | "global") => void;
  /** The sidebar card, the rail's avatar, or the phone header's avatar. */
  variant: "card" | "avatar";
}

export function AccountMenu({ email, onSignOut, variant }: AccountMenuProps) {
  return (
    <Menu.Root modal={false}>
      {variant === "card" ? (
        <div className={styles.card}>
          <span className={styles.avatar}>
            <StudioIcon name="user" />
          </span>
          <span className={styles.who}>
            <span className={styles.email}>{email}</span>
            <Menu.Trigger asChild>
              <button
                type="button"
                className={styles.link}
                aria-label={`Owner · Sign out. Account menu for ${email}`}
              >
                Owner · Sign out
              </button>
            </Menu.Trigger>
          </span>
        </div>
      ) : (
        <Menu.Trigger asChild>
          <button type="button" className={cx(styles.avatarBtn)} aria-label={`Account: ${email}`}>
            <StudioIcon name="user" />
          </button>
        </Menu.Trigger>
      )}
      <Menu.Portal>
        <Menu.Content
          className={cx("st", styles.menu)}
          side={variant === "card" ? "top" : "right"}
          align="start"
          sideOffset={8}
        >
          <div className={styles.head}>
            <div className={styles.how}>Signed in with an email code</div>
            <div className={styles.role}>Owner</div>
            <div className={styles.addr}>{email}</div>
          </div>
          <Menu.Item
            className={styles.item}
            onSelect={() => {
              onSignOut("local");
            }}
          >
            Sign out
          </Menu.Item>
          <Menu.Item
            className={styles.item}
            onSelect={() => {
              onSignOut("global");
            }}
          >
            Sign out on all devices
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
