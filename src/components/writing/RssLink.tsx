import { Icon } from "~/components/icons";

import { cx } from "../cx";
import styles from "./Writing.module.css";

/** The feed's address (01 · Routes; the feed itself is built in M5). */
export const RSS_HREF = "/writing/rss.xml";

/** The RSS link: /writing's header button, also on the homepage section when `writing.rss` is on. */
export function RssLink({ className }: { className?: string }) {
  return (
    <a className={cx(styles.rss, className)} href={RSS_HREF}>
      <Icon name="rss" />
      RSS
    </a>
  );
}
