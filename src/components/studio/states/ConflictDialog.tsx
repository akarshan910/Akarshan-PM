/**
 * "Edited somewhere else" (StudioStates): another tab or device saved first. It names what
 * changed on each side, then "Keep mine" (overwrite) or "Load latest".
 */
import * as RadixDialog from "@radix-ui/react-dialog";
import { useRef } from "react";

import buttons from "../Button.module.css";
import dialog from "../Dialog.module.css";
import styles from "./ConflictDialog.module.css";

interface ConflictDialogProps {
  open: boolean;
  /** "This project", "The homepage", "This post", "Your profile". */
  subject: string;
  /** "Story was edited 2 minutes ago on another device." */
  what: string;
  theirs: string;
  yours: string;
  onKeepMine: () => void;
  onLoadLatest: () => void;
}

export function ConflictDialog({
  open,
  subject,
  what,
  theirs,
  yours,
  onKeepMine,
  onLoadLatest,
}: ConflictDialogProps) {
  const latest = useRef<HTMLButtonElement>(null);
  return (
    <RadixDialog.Root open={open}>
      <RadixDialog.Portal>
        <div className="st" style={{ background: "none" }}>
          <RadixDialog.Overlay className={dialog.overlay}>
            <RadixDialog.Content
              className={`${dialog.dialog} ${dialog.plain}`}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                latest.current?.focus();
              }}
              onEscapeKeyDown={(e) => {
                e.preventDefault();
              }}
              onPointerDownOutside={(e) => {
                e.preventDefault();
              }}
            >
              <RadixDialog.Title className={dialog.title}>{subject} changed in another tab</RadixDialog.Title>
              <RadixDialog.Description className={dialog.desc}>
                {what} Load the latest to keep both, or keep yours and overwrite.
              </RadixDialog.Description>
              <div className={styles.sides}>
                Theirs: {theirs} · Yours: {yours}
              </div>
              <div className={dialog.acts}>
                <button type="button" className={buttons.btn} onClick={onKeepMine}>
                  Keep mine
                </button>
                <button ref={latest} type="button" className={buttons.cta} onClick={onLoadLatest}>
                  Load latest
                </button>
              </div>
            </RadixDialog.Content>
          </RadixDialog.Overlay>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
