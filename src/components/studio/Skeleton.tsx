import type { CSSProperties } from "react";

import styles from "./Skeleton.module.css";

interface ShimProps {
  width?: CSSProperties["width"] | undefined;
  height: CSSProperties["height"];
  radius?: number | undefined;
}

/** One `.shim` bar. Decorative: the region that is loading carries `aria-busy`. */
export function Shim({ width, height, radius }: ShimProps) {
  return (
    <span
      className={styles.shim}
      aria-hidden="true"
      style={{ width, height, ...(radius === undefined ? {} : { borderRadius: radius }) }}
    />
  );
}
