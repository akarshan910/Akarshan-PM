/**
 * The publish checklist (05 · Publishing a project; StudioStates › Publish changes / Publish
 * blocked; each Editor board's "publish dialog"): what's changing, each blocker with a link to
 * its field, the warnings, then "Preview first", Cancel and "Publish now" (or "Fix {n} to publish").
 */
import { Link } from "react-router";

import { cx } from "../../cx";
import { Icon } from "../../icons";
import { Dialog } from "../Dialog";
import type { Check, ProjectIssue } from "~/lib/studio/checks";
import { TAB_LABELS } from "~/lib/studio/paths";
import styles from "./PublishDialog.module.css";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  title: string;
  firstPublish: boolean;
  changes: string[];
  issues: ProjectIssue[];
  checks: Check[];
  publishing: boolean;
  onPublish: () => void;
  /** Moves to the field with the problem (closes the dialog first). */
  onFix: (issue: ProjectIssue) => void;
}

export function PublishDialog(p: PublishDialogProps) {
  const blocked = p.issues.length;
  return (
    <Dialog
      open={p.open}
      onOpenChange={p.onOpenChange}
      layout="panel"
      kicker={p.firstPublish ? "Publish" : "Publish changes"}
      title={p.firstPublish ? `Publish “${p.title}”?` : `Update the live page for “${p.title}”?`}
      description={
        p.firstPublish
          ? "It goes live at its address and takes its place on your homepage. The page updates within a minute."
          : "The live version is replaced. The page updates within a minute; its link stays the same."
      }
      busy={p.publishing}
      confirmDisabled={blocked > 0}
      confirmLabel={p.publishing ? "Publishing…" : blocked > 0 ? `Fix ${blocked} to publish` : "Publish now"}
      onConfirm={p.onPublish}
      footerStart={
        <Link to={`/studio/preview/project/${p.projectId}`} className={styles.first}>
          Preview first
        </Link>
      }
    >
      <div className={styles.box}>
        <div className={styles.boxHead}>What’s changing</div>
        <div className={styles.boxBody}>
          {p.changes.length > 0 ? (
            p.changes.map((c) => <div key={c}>{c}</div>)
          ) : (
            <div>Nothing new since the last publish.</div>
          )}
        </div>
      </div>
      <div className={styles.checks}>
        {p.issues.map((i) => (
          <div key={`${i.tab}:${i.field}:${i.message}`} className={styles.block}>
            <Icon name="x-circle" />
            <span>
              <strong>{i.message}</strong> Fix this to publish.{" "}
              <button
                type="button"
                className={styles.fix}
                onClick={() => {
                  p.onFix(i);
                }}
              >
                {TAB_LABELS[i.tab]} →
              </button>
            </span>
          </div>
        ))}
        {p.checks.map((c) => (
          <div key={c.text} className={cx(styles.line, c.ok ? styles.okLine : styles.warnLine)}>
            <Icon name={c.ok ? "tick" : "alert"} />
            <span className={styles.lineText}>
              {c.text.endsWith(" Review") ? (
                <>
                  {c.text.slice(0, -" Review".length)}{" "}
                  <Link to={`/studio/projects/${p.projectId}/${c.tab ?? "story"}`} className={styles.review}>
                    Review
                  </Link>
                </>
              ) : (
                c.text
              )}
            </span>
          </div>
        ))}
        {blocked > 0 ? (
          <p className={styles.note}>Each item links to the field. Drafts keep saving while you fix them.</p>
        ) : null}
      </div>
    </Dialog>
  );
}
