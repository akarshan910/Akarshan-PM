import { Link } from "react-router";

import { Icon } from "../icons";
import actions from "./actions.module.css";
import styles from "./ExpiredPreview.module.css";

interface ExpiredPreviewProps {
  /** Where "See the published work" goes: the published page, or /work. */
  publishedHref?: string;
}

/** C21 · Expired preview (PublicStates.dc.html › Pages › Expired or revoked preview). */
export function ExpiredPreview({ publishedHref = "/work" }: ExpiredPreviewProps) {
  return (
    <div className={styles.root}>
      <Icon name="clock" size={30} className={`ico ${styles.icon}`} />
      <h1 className={styles.title}>This preview link has expired.</h1>
      <p className={styles.text}>Preview links last 7 days. Ask for a new one, or see the published work.</p>
      <div className={styles.actions}>
        <Link className={actions.ctax} to={publishedHref}>
          See the published work
        </Link>
      </div>
    </div>
  );
}
