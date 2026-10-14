import actions from "./actions.module.css";
import styles from "./NoResults.module.css";

export interface ActiveFilter {
  id: string;
  /** As shown: "Strategy", "Label: Achieved", or the search in quotes: “roadmap”. */
  label: string;
  /** A shelf chip is filled; a search sits at the end of the row. */
  kind: "shelf" | "filter" | "search";
  onRemove: () => void;
}

interface NoResultsProps {
  filters: ActiveFilter[];
  /** One sentence naming what was asked for, built by the page from its filters. */
  message?: string;
  onClear: () => void;
  /** Shown only while a search is active: "Keep the search, clear the rest". */
  onKeepSearch?: () => void;
}

/**
 * C21 · No results on /work (PublicStates.dc.html › Pages › No results on /work). The filters
 * show as removable chips; clearing keeps the visitor where they were.
 */
export function NoResults({ filters, message, onClear, onKeepSearch }: NoResultsProps) {
  const searching = filters.some((filter) => filter.kind === "search");
  return (
    <div className={styles.root}>
      {filters.length > 0 ? (
        <ul className={styles.chips} aria-label="Active filters">
          {filters.map((filter) => (
            <li key={filter.id} className={filter.kind === "search" ? styles.end : undefined}>
              <button
                type="button"
                className={
                  filter.kind === "shelf"
                    ? `${actions.btnx} ${styles.chip} ${styles.on}`
                    : `${actions.btnx} ${styles.chip}`
                }
                aria-label={`Remove ${filter.label}`}
                onClick={filter.onRemove}
              >
                {filter.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={styles.body}>
        <h2 className={styles.title}>No projects match.</h2>
        {message ? <p className={styles.text}>{message}</p> : null}
        <div className={styles.actions}>
          <button type="button" className={actions.ctax} onClick={onClear}>
            Clear filters
          </button>
          {searching && onKeepSearch ? (
            <button type="button" className={actions.btnx} onClick={onKeepSearch}>
              Keep the search, clear the rest
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
