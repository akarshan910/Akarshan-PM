import { Chip } from "../labels/Tags";
import styles from "./ProofStrip.module.css";

export interface ProofItem {
  id: string;
  /** The number as written, e.g. "$2M". */
  value: string;
  /** An optional unit shown smaller after the value, e.g. "ARR" or "/yr". */
  unit?: string;
  /** The line under the number. */
  label: string;
  /** The mono source line, e.g. "Glance · InMobi". */
  source?: string;
}

interface ProofStripProps {
  items: ProofItem[];
  /** "Problem spaces": the mono label and the chips. Hidden when there are no chips. */
  spaces?: { label?: string; items: string[] };
}

/** A unit that starts with punctuation ("/yr", "%") sits against the value; a word gets a space. */
function unitText(unit: string): string {
  return /^[/%+×x]/.test(unit) ? unit : ` ${unit}`;
}

/**
 * C12 · The proof strip: one cell per proof item (value, unit, line, source), then the
 * "Problem spaces" chips. An unlabelled list (03 · Proof strip); M2 wraps it in its section.
 */
export function ProofStrip({ items, spaces }: ProofStripProps) {
  if (items.length === 0 && !spaces?.items.length) return null;
  return (
    <>
      {items.length > 0 ? (
        <ul className={styles.cells}>
          {items.map((item) => (
            <li key={item.id} className={styles.cell}>
              <div className={styles.value}>
                {item.value}
                {item.unit ? <span className={styles.unit}>{unitText(item.unit)}</span> : null}
              </div>
              <div className={styles.line}>{item.label}</div>
              {item.source ? <div className={styles.source}>{item.source}</div> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {spaces?.items.length ? (
        <div className={styles.spaces}>
          {spaces.label ? <span className={styles.spacesLabel}>{spaces.label}</span> : null}
          {spaces.items.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </div>
      ) : null}
    </>
  );
}
