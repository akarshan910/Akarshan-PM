/**
 * A screen that couldn't load (StudioProjects › error): what failed, that the live site is
 * untouched, and "Try again".
 */
import { StudioIcon } from "../StudioIcon";
import styles from "./LoadError.module.css";

export function LoadError({
  title,
  text = "Studio couldn’t reach the database. Check your connection and try again. Nothing on your live site has changed.",
  onRetry,
}: {
  title: string;
  text?: string | undefined;
  onRetry: () => void;
}) {
  return (
    <div className={`card ${styles.wrap}`} role="alert">
      <span className={styles.icon}>
        <StudioIcon name="alert" />
      </span>
      <div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>{text}</p>
        <button type="button" className={styles.btn} onClick={onRetry}>
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
            <path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" />
          </svg>
          Try again
        </button>
      </div>
    </div>
  );
}
