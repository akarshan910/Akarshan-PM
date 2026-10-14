import { useState } from "react";

import { Icon } from "../icons";
import styles from "./MovedNote.module.css";

interface MovedNoteProps {
  /** What was unpublished: `/work?moved=1` or `/writing?moved=1`. */
  kind: "project" | "post";
  /** Called after ✕ hides the note, e.g. to drop `moved=1` from the address. */
  onDismiss?: () => void;
}

/**
 * C21 · The moved note (PublicStates.dc.html › Pages › A project that was unpublished). It sits
 * above the list a once-public page now redirects to, and ✕ dismisses it.
 */
export function MovedNote({ kind, onDismiss }: MovedNoteProps) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className={styles.note}>
      <Icon name="alert-circle" size={15} className={`ico ${styles.icon}`} />
      <p className={styles.text}>That {kind} isn’t available any more. Here’s everything that is.</p>
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Dismiss"
        onClick={() => {
          setOpen(false);
          onDismiss?.();
        }}
      >
        ✕
      </button>
    </div>
  );
}
