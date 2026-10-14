/**
 * The dashboard (05 · Dashboard; StudioDashboard populated, empty and loading; StudioTablet's
 * landscape dashboard). The phone layout puts the account menu in the header (05 · Shell).
 */
import { Link } from "react-router";

import { cx } from "../../cx";
import { AccountMenu } from "../shell/AccountMenu";
import { StudioIcon } from "../StudioIcon";
import type { DashboardModel, NeedItem } from "~/lib/studio/dashboard";
import { dayAndTime, firstName, greeting, longDate, relative, thumbBackground } from "~/lib/studio/format";
import styles from "./Dashboard.module.css";

interface DashboardProps {
  model: DashboardModel;
  name: string;
  now: Date;
  email: string;
  onNewProject: () => void;
  onSignOut: (scope: "local" | "global") => void;
}

function Header({
  title,
  email,
  onSignOut,
}: {
  title: string;
  email: string;
  onSignOut: DashboardProps["onSignOut"];
}) {
  return (
    <header className={styles.appbar}>
      <span className={styles.appTitle}>{title}</span>
      <AccountMenu email={email} onSignOut={onSignOut} variant="avatar" />
    </header>
  );
}

function NeedRow({ item }: { item: NeedItem }) {
  if (item.kind === "draft") {
    return (
      <Link className={cx("row", styles.need)} to={item.href}>
        <span
          className={styles.thumb}
          style={{ background: thumbBackground(item.accent) }}
          aria-hidden="true"
        />
        <span className={styles.needMain}>
          <span className={styles.needTitle}>{item.title}</span>
          <span className={styles.chips}>
            {item.chips.map((c) => (
              <span key={c} className={cx("chip", styles.warnChip)}>
                {c}
              </span>
            ))}
          </span>
          <span className={styles.chipLine}>{item.chips.join(" · ")}</span>
        </span>
        <span className={styles.progress}>
          <span className={styles.bar}>
            <span style={{ width: `${item.percent}%` }} />
          </span>
          <span className={styles.pct}>{item.percent}% complete</span>
        </span>
        <span className={styles.pctShort}>{item.percent}%</span>
        <span className={styles.go}>Continue →</span>
      </Link>
    );
  }
  return (
    <Link className={cx("row", styles.need, styles.alertRow)} to={item.href}>
      <span className={cx(styles.thumb, styles.alertIcon)} aria-hidden="true">
        <StudioIcon name="alert" />
      </span>
      <span className={styles.needMain}>
        <span className={styles.needTitle}>{item.title}</span>
        <span className={styles.needText}>{item.text}</span>
      </span>
      <span className={styles.goWide}>{item.kind === "rice" ? "Review in case study →" : "Review →"}</span>
    </Link>
  );
}

export function Dashboard({ model, name, now, email, onNewProject, onSignOut }: DashboardProps) {
  const first = firstName(name);
  const hello = `${greeting(now)}${first ? `, ${first}` : ""}`;

  if (model.empty) {
    return (
      <>
        <Header title="Studio" email={email} onSignOut={onSignOut} />
        <main className={styles.main}>
          <h1 className={styles.h1}>Welcome to Studio</h1>
          <div className={cx("card", styles.empty)}>
            <div aria-hidden="true" className={styles.spines}>
              <span className={styles.spineA} />
              <span className={styles.spineB} />
              <span className={styles.spineC} />
            </div>
            <h2 className={styles.emptyTitle}>Your first volume starts here</h2>
            <p className={styles.emptyText}>
              Add your first project. It stays a private draft until you publish it.
            </p>
            <div className={styles.emptyActs}>
              <button type="button" className={styles.cta} onClick={onNewProject}>
                New project
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const { stats } = model;
  return (
    <>
      <Header title="Studio" email={email} onSignOut={onSignOut} />
      <main className={styles.main}>
        <div className={styles.top}>
          <div>
            <div className="mono">{longDate(now)}</div>
            <h1 className={styles.h1}>{hello}</h1>
            <p className={styles.lede}>{model.summary}</p>
          </div>
          <div className={styles.acts}>
            <Link className={styles.btn} to="/studio/website">
              Edit website
            </Link>
            <button type="button" className={styles.cta} onClick={onNewProject}>
              <StudioIcon name="plus" size={16} />
              New project
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={cx("card", styles.stat)}>
            <div className="mono">Projects</div>
            <div className={styles.num}>{stats.projects}</div>
          </div>
          <div className={cx("card", styles.stat)}>
            <div className="mono">Published</div>
            <div className={styles.numRow}>
              <span className={styles.num}>{stats.published}</span>
              <span className={cx("chip", styles.live)}>Live</span>
            </div>
          </div>
          <div className={cx("card", styles.stat)}>
            <div className="mono">Drafts</div>
            <div className={styles.numRow}>
              <span className={styles.num}>{stats.drafts}</span>
              <span className={cx("chip", styles.private)}>Private</span>
            </div>
          </div>
          <div className={cx("card", styles.stat)}>
            <div className="mono">
              <span className={styles.longLabel}>Site last published</span>
              <span className={styles.shortLabel}>Last published</span>
            </div>
            <div className={styles.when}>
              {stats.sitePublishedAt ? dayAndTime(stats.sitePublishedAt, now) : "Not yet"}
            </div>
            <a className={styles.viewLive} href="/" target="_blank" rel="noopener noreferrer">
              View live
              <StudioIcon name="live" size={14} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>

        <div className={styles.cols}>
          <section className={cx("card", styles.needs)} aria-labelledby="needs-h">
            <div className={styles.secHead}>
              <h2 id="needs-h" className={styles.h2}>
                Needs your input
              </h2>
              <span className="mono">
                {model.needs.length} {model.needs.length === 1 ? "item" : "items"}
              </span>
            </div>
            {model.needs.length === 0 ? (
              <p className={styles.none}>Nothing needs your input right now.</p>
            ) : (
              model.needs.map((n) => <NeedRow key={`${n.kind}:${n.id}`} item={n} />)
            )}
          </section>

          <div className={styles.side}>
            <section className={cx("card", styles.recent)} aria-labelledby="recent-h">
              <div className={styles.secHeadSm}>
                <h2 id="recent-h" className={styles.h2}>
                  Recently edited
                </h2>
              </div>
              <div className={styles.recentList}>
                {model.recent.map((r) => (
                  <Link key={r.id} className={cx("row", styles.recentRow)} to={r.href}>
                    <span className={styles.recentTitle}>{r.title}</span>
                    <span className={styles.ago}>{relative(r.at, now)}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className={cx("card", styles.quick)} aria-labelledby="quick-h">
              <h2 id="quick-h" className={cx(styles.h2, styles.quickH)}>
                Quick actions
              </h2>
              <div className={styles.quickList}>
                <Link className={cx(styles.btn, styles.quickBtn)} to="/studio/media">
                  <StudioIcon name="upload" />
                  Upload media
                </Link>
                <Link className={cx(styles.btn, styles.quickBtn)} to="/studio/website">
                  <StudioIcon name="grip" />
                  Arrange the homepage
                </Link>
                <Link className={cx(styles.btn, styles.quickBtn)} to="/studio/writing">
                  <StudioIcon name="writing" />
                  Write a post
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

/** StudioDashboard › loading. */
export function DashboardSkeleton() {
  return (
    <main className={styles.main} aria-busy="true" aria-label="Loading the dashboard">
      <div className="shim" style={{ width: 240, height: 30 }} />
      <div className="shim" style={{ marginTop: 10, width: 360, maxWidth: "100%", height: 16 }} />
      <div className={styles.skStats}>
        {[50, 50, 50, 90].map((w, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div className="shim" style={{ width: 70, height: 12 }} />
            <div className="shim" style={{ marginTop: 14, width: w, height: i === 3 ? 20 : 30 }} />
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 24, padding: 20, display: "grid", gap: 18 }}>
        <div className="shim" style={{ height: 40 }} />
        <div className="shim" style={{ height: 40 }} />
        <div className="shim" style={{ height: 40 }} />
      </div>
    </main>
  );
}
