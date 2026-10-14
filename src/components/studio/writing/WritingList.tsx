/**
 * Writing › the list (05 · Writing; StudioWriting › no posts yet, scheduled, published): Drafts,
 * Scheduled and Published with counts, New post, and "Ideas from your résumé".
 */
import { useState } from "react";
import { Link } from "react-router";

import { cx } from "../../cx";
import buttons from "../Button.module.css";
import { StudioIcon } from "../StudioIcon";
import { relative } from "~/lib/studio/format";
import type { PostRow } from "~/lib/studio/repo";
import { EMPTY_TABS, FIRST_POST, postStatus, scheduleLabel, type PostTab } from "~/lib/studio/writing";
import styles from "./Writing.module.css";

const CHIP: Record<PostTab, [string, string, string]> = {
  draft: ["Draft", "#EFEEEA", "#4A4A51"],
  scheduled: ["Scheduled", "#EAF1FB", "#1D4F91"],
  published: ["Published", "#E6F4EC", "#0F7A4A"],
};

export function WritingList({
  rows,
  ideas,
  now,
  onNewPost,
  onStartIdea,
}: {
  rows: PostRow[];
  ideas: { key: string; title: string; from: string }[];
  now: Date;
  onNewPost: () => void;
  onStartIdea: (title: string) => void;
}) {
  const [tab, setTab] = useState<PostTab>("draft");
  const count = (t: PostTab) => rows.filter((r) => postStatus(r) === t).length;
  const shown = rows
    .filter((r) => postStatus(r) === tab)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const empty = rows.length === 0 ? FIRST_POST : EMPTY_TABS[tab];

  return (
    <>
      <header className={styles.appbar}>
        <h1 className={styles.appTitle}>Writing</h1>
        <button
          type="button"
          className={cx(buttons.cta, styles.newIcon)}
          aria-label="New post"
          onClick={onNewPost}
        >
          <StudioIcon name="plus" />
        </button>
      </header>
      <main className={styles.main}>
        <div className={styles.top}>
          <div>
            <div className="mono">
              <Link to="/studio">Studio</Link> / Writing
            </div>
            <h1 className={styles.h1}>Writing</h1>
            <p className={styles.lede}>
              Posts live on your site at /writing, in an RSS feed, and, when you choose, on your homepage.
            </p>
          </div>
          <button type="button" className={buttons.cta} onClick={onNewPost}>
            <StudioIcon name="plus" size={16} />
            New post
          </button>
        </div>
        <div className={styles.tabs2} role="group" aria-label="Filter posts">
          {(
            [
              ["draft", "Drafts"],
              ["scheduled", "Scheduled"],
              ["published", "Published"],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => {
                setTab(t);
              }}
            >
              {label} {count(t)}
            </button>
          ))}
        </div>
        {shown.length > 0 ? (
          <div className={styles.rows}>
            {shown.map((r) => {
              const st = postStatus(r);
              const chip = CHIP[st];
              return (
                <Link key={r.id} to={`/studio/writing/${r.id}`} className={styles.prow}>
                  <span className={styles.pmain}>
                    <span className={styles.ptitle} style={{ color: r.draft.title ? "#141416" : "#6A6A72" }}>
                      {r.draft.title || "Untitled draft"}
                    </span>
                    <span className={styles.psub}>
                      {r.scheduleError
                        ? `Couldn’t publish: ${r.scheduleError}`
                        : r.draft.excerpt || r.draft.subtitle || "No excerpt yet"}
                    </span>
                  </span>
                  <span
                    className={cx("chip", styles.pchip)}
                    style={{
                      background: r.scheduleError ? "#FDECEA" : chip[1],
                      color: r.scheduleError ? "#B42318" : chip[2],
                    }}
                  >
                    {r.scheduleError
                      ? "Couldn’t publish"
                      : st === "scheduled" && r.scheduledFor
                        ? `Scheduled · ${scheduleLabel(r.scheduledFor).short}`
                        : chip[0]}
                  </span>
                  <span className={styles.pup}>{relative(r.updatedAt, now)}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={cx("card", styles.empty)}>
            <div className={styles.emptyTitle}>{empty[0]}</div>
            <div className={styles.emptyText}>{empty[1]}</div>
          </div>
        )}
        <h2 className={styles.h2}>Ideas from your résumé</h2>
        <p className={styles.ideasNote}>
          Suggestions only. Nothing here is published, and each draft starts empty apart from the title.
        </p>
        <div className={styles.ideas}>
          {ideas.map((i) => (
            <div key={i.key} className={styles.idea}>
              <span className={styles.ideaTitle}>{i.title}</span>
              <span className={styles.ideaFrom}>From: {i.from}</span>
              <button
                type="button"
                className={buttons.btn}
                style={{ alignSelf: "flex-start", height: 36 }}
                onClick={() => {
                  onStartIdea(i.title);
                }}
              >
                Start a draft
              </button>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
