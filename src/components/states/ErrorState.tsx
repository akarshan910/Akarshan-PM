import { Link } from "react-router";

import actions from "./actions.module.css";
import styles from "./ErrorState.module.css";

interface ErrorStateProps {
  /** Retries the failed load. Without it, Try again reloads the page. */
  onRetry?: () => void;
  /** `h1` when it replaces a page, `h2` inside one. */
  headingLevel?: 1 | 2;
}

/**
 * C21 · Error (PublicStates.dc.html › Pages › Something went wrong): a failed client-side load,
 * such as a preview, an unlisted project or "Load more". The nav stays, so visitors can move on.
 */
export function ErrorState({ onRetry, headingLevel = 1 }: ErrorStateProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className={styles.root} role="alert">
      <Heading className={styles.title}>Something went wrong.</Heading>
      <p className={styles.text}>This page couldn’t load. It’s us, not you. Try again in a moment.</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={actions.ctax}
          onClick={
            onRetry ??
            (() => {
              window.location.reload();
            })
          }
        >
          Try again
        </button>
        <Link className={actions.btnx} to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
