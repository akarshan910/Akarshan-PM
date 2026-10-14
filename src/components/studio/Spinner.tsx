import styles from "./Spinner.module.css";

export type SpinnerKind = "save" | "cta" | "light" | "dark" | "large";

/** M-ST-SPIN. Decorative: the busy state is announced by the control or status that holds it. */
export function Spinner({ kind = "dark" }: { kind?: SpinnerKind }) {
  return <span className={`${styles.spin} ${styles[kind]}`} aria-hidden="true" data-spinner={kind} />;
}
