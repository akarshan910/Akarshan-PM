import styles from "./Blocks.module.css";

/** `divider`: a hairline with 48px above and below. */
export function DividerBlock() {
  return <hr className={styles.divider} />;
}
