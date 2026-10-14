import styles from "./SaveStatus.module.css";
import { Glyph } from "./glyphs";
import { Spinner } from "./Spinner";

export type SaveState = "saved" | "saving" | "offline" | "failed";

interface SaveStatusProps {
  state: SaveState;
  /** The saved text: "All changes saved" when the editor opens, "Saved just now" after a save. */
  savedLabel?: string | undefined;
  /** "Couldn't save" offers Retry. */
  onRetry?: () => void;
}

const TEXT: Record<Exclude<SaveState, "saved">, string> = {
  saving: "Saving…",
  offline: "Offline · saved on this device",
  failed: "Couldn’t save",
};

/**
 * The editor header's save status. It never hides. "Saving…" shows the 13px M-ST-SPIN spinner
 * (04: M-ST-PULSE isn't built, so no pulsing dot).
 */
export function SaveStatus({ state, savedLabel = "All changes saved", onRetry }: SaveStatusProps) {
  const tone = state === "offline" ? styles.offline : state === "failed" ? styles.failed : "";
  return (
    <span className={[styles.status, tone].filter(Boolean).join(" ")} data-state={state}>
      <span role="status" className={styles.live}>
        {state === "saving" ? <Spinner kind="save" /> : null}
        {state === "saved" ? <Glyph name="tick" className={styles.ico} /> : null}
        {state === "offline" ? <Glyph name="cloud-off" className={styles.ico} /> : null}
        {state === "failed" ? <Glyph name="alert-circle" className={styles.ico} /> : null}
        {state === "saved" ? savedLabel : TEXT[state]}
      </span>
      {state === "failed" && onRetry ? (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </span>
  );
}
