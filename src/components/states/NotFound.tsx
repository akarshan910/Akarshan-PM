import { Link } from "react-router";

import actions from "./actions.module.css";
import styles from "./NotFound.module.css";

interface NotFoundProps {
  /** Writing hides while there are no posts (03 · Page states, D19). */
  showWriting?: boolean;
}

/**
 * C21 · Not found (PublicStates.dc.html › Pages › Not found, and On phones). Also what visitors
 * get for drafts, scheduled posts and deleted pages, so it never reveals that anything exists.
 */
export function NotFound({ showWriting = false }: NotFoundProps) {
  return (
    <div className={styles.root}>
      <div className={styles.code} aria-hidden="true">
        404
      </div>
      <h1 className={styles.title}>This page doesn’t exist.</h1>
      <p className={styles.text}>
        It may have moved. Everything that’s published is one <span className={styles.laptop}>click</span>
        <span className={styles.phone}>tap</span> away.
      </p>
      <div className={styles.actions}>
        <Link className={actions.ctax} to="/work">
          See all work
        </Link>
        {showWriting ? (
          <Link className={actions.btnx} to="/writing">
            Writing
          </Link>
        ) : null}
        <Link className={actions.btnx} to="/">
          Home
        </Link>
      </div>
    </div>
  );
}
