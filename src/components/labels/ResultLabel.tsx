/**
 * C5 · Result label (02 · C5, D7). Every number on the site carries one, except tenure and counts.
 * The visible text is the uppercase word; screen readers get the word and its meaning, worded as on
 * System.dc.html's Result labels cell.
 */
import { cx } from "../cx";
import styles from "./ResultLabel.module.css";

export type ResultType = "achieved" | "target" | "projected" | "baseline" | "output";

export const RESULT_LABELS: Record<ResultType, { text: string; meaning: string }> = {
  achieved: { text: "ACHIEVED", meaning: "Achieved: measured after launch" },
  target: { text: "TARGET", meaning: "Target: a goal set in the plan, not yet measured" },
  projected: { text: "PROJECTED", meaning: "Projected: a modelled estimate" },
  baseline: { text: "BASELINE", meaning: "Baseline: the starting point before the work" },
  output: { text: "OUTPUT", meaning: "Output: what was produced" },
};

export interface ResultLabelProps {
  type: ResultType;
  className?: string;
}

export function ResultLabel({ type, className }: ResultLabelProps) {
  const { text, meaning } = RESULT_LABELS[type];
  return (
    <span className={cx(styles.tag, styles[type], className)} data-result={type}>
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">{meaning}</span>
    </span>
  );
}
