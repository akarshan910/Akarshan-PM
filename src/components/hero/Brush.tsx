import styles from "./Brush.module.css";

/** C10 · The red brush stroke under the hero name. Decorative; it draws in once per session. */
export function Brush() {
  return (
    <svg className={styles.brush} viewBox="0 0 560 34" aria-hidden="true" focusable="false">
      <path
        className={styles.stroke}
        data-intro=""
        d="M6 24 C 130 10, 330 6, 552 14"
        fill="none"
        stroke="#D61F33"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
