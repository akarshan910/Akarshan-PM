import { useId, useState } from "react";

import { countWord, TABLE_PREVIEW_ROWS, tableRows, type TableBlock as Table } from "~/lib/case-study";

import { cx } from "../../cx";
import actions from "../../states/actions.module.css";
import styles from "./Blocks.module.css";

type Props = { block: Table };

/** The RICE columns that iPad shortens to their initial: Reach, Impact, Conf., Effort. */
const SHORT = new Set([2, 3, 4, 5]);

/**
 * `table` (03 · Blocks › table): the RICE table, with the top `highlightTop` rows tinted in the
 * accent, or a plain table in the same styles. iPad shows the top five first with "+ 4 more";
 * phones turn RICE rows into cards (`phoneCards`) with a "Show all nine" button, or scroll a plain
 * table sideways with a fade on the right edge.
 */
export function TableBlock({ block }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cardsId = useId();
  const rows = tableRows(block);
  if (rows.length === 0) return null;

  const rice = block.formula === "rice";
  const extra = rows.length - TABLE_PREVIEW_ROWS;
  const collapsible = extra > 0 && !expanded;
  const cards = rice && block.phoneCards;
  const last = block.columns.length - 1;

  const cellClass = (i: number) =>
    rice
      ? cx(
          i !== 1 && styles.n,
          i === 0 && cx(styles.rank, styles.rankCol),
          i === 1 && styles.item,
          i === last && styles.score,
        )
      : undefined;

  return (
    <div>
      <div className={styles.tableFrame} data-cards={cards ? "" : undefined}>
        <table
          className={styles.table}
          data-rice={rice ? "" : undefined}
          data-collapsed={collapsible ? "" : undefined}
        >
          <thead>
            <tr>
              {block.columns.map((column, i) => (
                <th key={i} scope="col" className={rice && i === 0 ? styles.rankCol : undefined}>
                  {rice && SHORT.has(i) ? (
                    <>
                      <span className={styles.full}>{column}</span>
                      <abbr className={styles.short} title={column}>
                        {column.charAt(0)}
                      </abbr>
                    </>
                  ) : (
                    column
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, position) => (
              <tr
                key={row.key}
                data-top={row.top && rice ? "" : undefined}
                data-extra={position >= TABLE_PREVIEW_ROWS ? "" : undefined}
              >
                {block.columns.map((_, i) => (
                  <td key={i} className={cellClass(i)}>
                    {rice && i === 1 ? <span className={styles.rankInline}>{row.cells[0]} · </span> : null}
                    {row.cells[i] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
            {extra > 0 ? (
              <tr className={styles.moreRow}>
                <td>+ {extra} more</td>
                <td colSpan={block.columns.length - 1}>
                  <button
                    type="button"
                    className={styles.moreButton}
                    aria-expanded={expanded}
                    onClick={() => {
                      setExpanded(true);
                    }}
                  >
                    Show all {countWord(rows.length)}
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {cards ? (
        <>
          <ol
            id={cardsId}
            className={styles.riceCards}
            data-collapsed={collapsible ? "" : undefined}
            aria-label={block.columns[1] ?? "Ranking"}
          >
            {rows.map((row, position) =>
              row.rice ? (
                <li
                  key={row.key}
                  className={styles.rice}
                  data-top={row.top ? "" : undefined}
                  data-extra={position >= TABLE_PREVIEW_ROWS ? "" : undefined}
                >
                  <span className={styles.riceRank}>{row.rice.rank}</span>
                  <span className={styles.riceItem}>{row.rice.item}</span>
                  <span className={styles.riceScore}>{row.rice.score}</span>
                  <span className={styles.riceInputs}>
                    {row.rice.inputs}
                    {row.top ? <span className={styles.inPlan}>· In the plan</span> : null}
                  </span>
                </li>
              ) : null,
            )}
          </ol>
          {extra > 0 ? (
            <div className={styles.riceToggle}>
              <button
                type="button"
                className={actions.btn3}
                aria-expanded={expanded}
                aria-controls={cardsId}
                onClick={() => {
                  setExpanded((v) => !v);
                }}
              >
                {expanded
                  ? `Show the top ${countWord(TABLE_PREVIEW_ROWS)}`
                  : `Show all ${countWord(rows.length)}`}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
