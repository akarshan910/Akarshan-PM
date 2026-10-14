/**
 * "You've been signed out" (StudioStates › Session expired; StudioAuthFlow › Path 6): the session
 * ended while editing. The page stays visible behind it, read-only; edits stay on this device.
 * It can't be dismissed: the only way on is to sign in again.
 */
import * as RadixDialog from "@radix-ui/react-dialog";

import { Icon } from "../../icons";
import dialog from "../Dialog.module.css";
import styles from "./SessionExpired.module.css";

export function SessionExpired({
  open,
  email,
  onSignIn,
}: {
  open: boolean;
  email: string;
  onSignIn: () => void;
}) {
  return (
    <RadixDialog.Root open={open}>
      <RadixDialog.Portal>
        <div className="st" style={{ background: "none" }}>
          <RadixDialog.Overlay className={dialog.overlay}>
            <RadixDialog.Content
              className={`${dialog.dialog} ${dialog.plain}`}
              onEscapeKeyDown={(e) => {
                e.preventDefault();
              }}
              onPointerDownOutside={(e) => {
                e.preventDefault();
              }}
            >
              <span className={dialog.tile}>
                <Icon name="lock" />
              </span>
              <RadixDialog.Title className={dialog.title}>You’ve been signed out</RadixDialog.Title>
              <RadixDialog.Description className={dialog.desc}>
                Sign in again to keep editing. Your changes are saved on this device and sync after you sign
                in.
              </RadixDialog.Description>
              <div className={styles.acts}>
                <button type="button" className={styles.go} onClick={onSignIn} data-email={email}>
                  Email me a code
                </button>
                <span className={styles.note}>Sent to the address you used last on this device.</span>
              </div>
            </RadixDialog.Content>
          </RadixDialog.Overlay>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
