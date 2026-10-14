import styles from "./SaveStatus.module.css";
import { cx } from "../cx";
import { Icon } from "../icons";
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
        {state === "saved" ? <Icon name="tick" className={cx("ico", styles.ico)} /> : null}
        {state === "offline" ? <Icon name="cloud-off" className={cx("ico", styles.ico)} /> : null}
        {state === "failed" ? <Icon name="alert-circle" className={cx("ico", styles.ico)} /> : null}
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
