import { ExperienceEntry, type ExperienceEntryProps, type ExperienceKind } from "./ExperienceEntry";
import styles from "./Experience.module.css";

export type ExperienceItem = Omit<ExperienceEntryProps, "kind"> & { id: string };

interface ExperienceListProps {
  /** The visible entries, in layout order. */
  entries: ExperienceItem[];
  /** Education entries follow as Compact, with no role line (the degree is their paragraph). */
  education?: ExperienceItem[];
}

/** The kind follows position: the first entry is Featured, the second Standard, the rest Compact. */
export function kindAt(index: number): ExperienceKind {
  return index === 0 ? "featured" : index === 1 ? "standard" : "compact";
}

/** C13 · The Experience entries under their strong top rule. Hidden when there's nothing to show. */
export function ExperienceList({ entries, education = [] }: ExperienceListProps) {
  if (entries.length === 0 && education.length === 0) return null;
  return (
    <div className={styles.list}>
      {entries.map(({ id, ...entry }, i) => (
        <ExperienceEntry key={id} kind={kindAt(i)} {...entry} />
      ))}
      {education.map(({ id, ...entry }) => (
        <ExperienceEntry key={id} kind="education" {...entry} />
      ))}
    </div>
  );
}
