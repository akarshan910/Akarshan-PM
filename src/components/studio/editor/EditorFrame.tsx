/**
 * The project editor's frame, the same on every tab (05 · Project editor; EditorOverview and the
 * other Editor boards; StudioTablet and StudioMobile for iPad and phones): the header with the
 * breadcrumb, status chips, save status, Preview and the angled publish button; the tabs with
 * their unpublished-edit dots; the offline and save-failed banners; and the two-column body.
 */
import { useEffect, useRef, type FocusEvent, type ReactNode } from "react";
import { Link, NavLink } from "react-router";

import { cx } from "../../cx";
import { Icon } from "../../icons";
import { EditorBanner } from "../Banner";
import buttons from "../Button.module.css";
import { SaveStatus, type SaveState } from "../SaveStatus";
import { StudioIcon } from "../StudioIcon";
import type { PublishButton } from "~/lib/studio/editor";
import { EDITOR_TABS, TAB_LABELS, type EditorTabSlug } from "~/lib/studio/paths";
import styles from "./EditorFrame.module.css";

interface EditorFrameProps {
  projectId: string;
  tab: EditorTabSlug;
  title: string;
  breadcrumb: string;
  published: boolean;
  editsNotLive: boolean;
  save: SaveState;
  savedLabel: string;
  onRetry: () => void;
  dots: ReadonlySet<EditorTabSlug>;
  publish: PublishButton;
  onPublish: () => void;
  /** "Last published today, 14:02" for the iPad footer. */
  lastPublished?: string | undefined;
  /** The tab, usually an `EditorCols`. */
  children: ReactNode;
}

export function EditorFrame(p: EditorFrameProps) {
  const pub = p.publish;
  // The tab strip scrolls sideways on narrow screens: keep the current tab, and a focused one, in view.
  const tabsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = tabsRef.current;
    const cur = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !cur) return;
    const n = nav.getBoundingClientRect();
    const c = cur.getBoundingClientRect();
    if (c.right > n.right) nav.scrollLeft += c.right - n.right;
    else if (c.left < n.left) nav.scrollLeft -= n.left - c.left;
  }, [p.tab]);
  const revealTab = (e: FocusEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget && typeof e.target.scrollIntoView === "function")
      e.target.scrollIntoView({ inline: "nearest", block: "nearest" });
  };

  return (
    <div className={styles.frame}>
      <header className={styles.tb}>
        <Link className="ib" to="/studio/projects" aria-label="Back to projects">
          <StudioIcon name="back" />
        </Link>
        <div className={styles.titleBox}>
          <div className={cx("mono", styles.crumb)}>{p.breadcrumb}</div>
          <h1 className={styles.title}>{p.title}</h1>
          <div className={styles.chipsSm}>
            {p.published ? <span className={cx("chip", styles.chipSm, styles.ok)}>Published</span> : null}
            {p.editsNotLive ? (
              <span className={cx("chip", styles.chipSm, styles.warn)}>Edits not live</span>
            ) : null}
            {!p.published ? <span className={cx("chip", styles.chipSm, styles.draft)}>Draft</span> : null}
          </div>
        </div>
        <span className={styles.chips}>
          {p.published ? (
            <span className={cx("chip", styles.ok)}>
              <span className={styles.liveDot} />
              Published
            </span>
          ) : (
            <span className={cx("chip", styles.draft)}>Draft</span>
          )}
          {p.editsNotLive ? <span className={cx("chip", styles.warn)}>Edits not live</span> : null}
        </span>
        <span className={styles.save}>
          <SaveStatus state={p.save} savedLabel={p.savedLabel} onRetry={p.onRetry} />
        </span>
        <span
          className={styles.phoneSave}
          role="status"
          aria-label={p.save === "saved" ? p.savedLabel : undefined}
        >
          {p.save === "saved" ? (
            <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 18a4.5 4.5 0 01-.6-9A6 6 0 0118 9.5a4 4 0 01-1 8.5zM9.5 13.5l2 2 3.5-3.5" />
            </svg>
          ) : (
            <SaveStatus state={p.save} savedLabel={p.savedLabel} onRetry={p.onRetry} />
          )}
        </span>
        <span className={styles.spacer} />
        <Link className={cx(buttons.btn, styles.preview)} to={`/studio/preview/project/${p.projectId}`}>
          <StudioIcon name="eye" size={16} />
          Preview
        </Link>
        <Link
          className={cx("ib", styles.previewIb)}
          to={`/studio/preview/project/${p.projectId}`}
          aria-label="Preview"
        >
          <StudioIcon name="eye" />
        </Link>
        <button
          type="button"
          className={cx(buttons.cta, styles.pub)}
          onClick={p.onPublish}
          aria-disabled={pub.disabled}
          title={
            pub.label === "Reconnect to publish"
              ? "Reconnect to publish"
              : pub.disabled
                ? "Everything is live"
                : "Review and publish your edits"
          }
        >
          {pub.label === "Published" ? <Icon name="tick" size={16} /> : null}
          <span className={styles.pubLong}>{pub.label}</span>
          <span className={styles.pubShort}>{pub.label === "Publish changes" ? "Publish" : pub.label}</span>
        </button>
      </header>
      <nav ref={tabsRef} className={styles.tabs} aria-label="Project sections" onFocus={revealTab}>
        {EDITOR_TABS.map((t) => (
          <NavLink
            key={t}
            to={`/studio/projects/${p.projectId}/${t}`}
            className={cx(styles.tab)}
            // Its ::after is the current-tab underline; at 46–48px it needs no hit area.
            data-hit="off"
            aria-current={t === p.tab ? "page" : undefined}
          >
            {TAB_LABELS[t]}
            {p.dots.has(t) ? (
              <>
                <span className={styles.dot} aria-hidden="true" />
                <span className="sr-only">, has unpublished edits</span>
              </>
            ) : null}
          </NavLink>
        ))}
      </nav>
      {p.save === "offline" ? (
        <EditorBanner tone="warn" icon={<Icon name="cloud-off" />}>
          <strong>You’re offline.</strong> Keep editing. Changes are kept on this device and sync when you
          reconnect. Publishing is paused.
        </EditorBanner>
      ) : null}
      {p.save === "failed" ? (
        <EditorBanner
          tone="err"
          role="alert"
          icon={<Icon name="alert-circle" />}
          action={
            <button type="button" className={cx(buttons.btn, styles.retryNow)} onClick={p.onRetry}>
              Retry now
            </button>
          }
        >
          <strong>Your last change didn’t save.</strong> Studio will keep retrying. Keep this tab open until
          it says Saved.
        </EditorBanner>
      ) : null}
      <main className={styles.main}>{p.children}</main>
      <div className={styles.tabletFoot}>
        <SaveStatus state={p.save} savedLabel={p.savedLabel} onRetry={p.onRetry} />
        {p.lastPublished ? <span>{p.lastPublished}</span> : null}
      </div>
      <div className={styles.phoneFoot}>
        <Link className={buttons.btn} to={`/studio/preview/project/${p.projectId}`}>
          Preview
        </Link>
        <button type="button" className={buttons.cta} onClick={p.onPublish} aria-disabled={pub.disabled}>
          {pub.label}
        </button>
      </div>
    </div>
  );
}

/**
 * A tab's two columns: the fields, and the live previews on the right. On iPad and phones the
 * right column folds into `sheet`, a summary row above the fields (StudioTablet).
 */
export function EditorCols({
  children,
  aside,
  asideLabel,
  sheet,
}: {
  children: ReactNode;
  aside?: ReactNode;
  asideLabel?: string;
  sheet?: ReactNode;
}) {
  return (
    <>
      {sheet ? <div className={styles.sheet}>{sheet}</div> : null}
      <div className={styles.cols}>
        <div className={styles.fields}>{children}</div>
        {aside ? (
          <aside className={styles.aside} aria-label={asideLabel}>
            {aside}
          </aside>
        ) : null}
      </div>
    </>
  );
}

/** `.card.sec`: a titled section of fields. */
export function Sec({
  id,
  title,
  sub,
  aside,
  children,
}: {
  id: string;
  title: string;
  sub?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={cx("card", styles.sec)} aria-labelledby={id}>
      {aside ? (
        <div className={styles.secHead}>
          <div>
            <h2 id={id}>{title}</h2>
            {sub ? <p className={styles.sub}>{sub}</p> : null}
          </div>
          {aside}
        </div>
      ) : (
        <>
          <h2 id={id}>{title}</h2>
          {sub ? <p className={styles.sub}>{sub}</p> : null}
        </>
      )}
      {children}
    </section>
  );
}
