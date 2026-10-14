import { ResultLabel } from "~/components/labels/ResultLabel";
import { metricsOutcomes } from "~/lib/case-study";
import type { BlockPublished } from "~/lib/published";

import { useCaseStudy } from "../context";
import styles from "./Blocks.module.css";

type Props = { block: Extract<BlockPublished, { type: "metrics" }> };

/** `metrics`: the outcomes it names, or those in the strip, as chapter 05's "60s" stat card. */
export function MetricsBlock({ block }: Props) {
  const { project } = useCaseStudy();
  const outcomes = metricsOutcomes(block, project.outcomes);
  if (outcomes.length === 0) return null;
  return (
    <div className={styles.metrics}>
      {outcomes.map((o) => (
        <div key={o.id} className={styles.metric}>
          <span className={styles.metricValue}>{o.value}</span>
          <span className={styles.metricLabel}>{o.label}</span>
          <ResultLabel type={o.type} />
        </div>
      ))}
    </div>
  );
}
