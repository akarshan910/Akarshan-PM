/**
 * URL & SEO (05 · URL & SEO; EditorSettings): the address with its live check and redirect, the
 * search and link previews, who can find it, private preview links, and unpublish or delete.
 * The address, visibility and indexing aren't part of the draft document: they're written
 * straight away (the address through the repo, visibility through pm-publish "settings").
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { cx } from "../../cx";
import { Icon } from "../../icons";
import buttons from "../Button.module.css";
import { Switch } from "../Controls";
import { useRepo, useStudio } from "../data";
import { TextArea, TextField } from "../Field";
import { useShell } from "../shell/ShellContext";
import { useToast } from "../Toast";
import { useUpload } from "../media/useUpload";
import { EditorCols, Sec } from "./EditorFrame";
import { useEditor } from "./ProjectEditor";
import styles from "./SettingsTab.module.css";
import { SOFT_LIMITS } from "~/lib/schemas";
import { slugProblem } from "~/lib/studio/checks";
import { dayAndTime } from "~/lib/studio/format";
import type { PreviewLink } from "~/lib/studio/repo";
import { slugify } from "~/lib/v0";

/** The site's address for previews; the real domain is set at launch (Q2). */
function host(): string {
  return typeof location === "undefined" ? "" : location.host;
}

export function SettingsTab({ ownerName }: { ownerName: string }) {
  const e = useEditor();
  const repo = useRepo();
  const { cache } = useStudio();
  const toast = useToast();
  const { announce } = useShell();
  const navigate = useNavigate();
  const row = e.row;
  const live = row.publishedSlug;
  const o = e.draft.overview;

  // ---- address
  const [slug, setSlug] = useState(row.slug);
  const [check, setCheck] = useState<{
    state: "idle" | "checking" | "ok" | "taken" | "bad";
    by?: string;
    message?: string;
  }>({ state: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );
  const onSlug = (value: string) => {
    setSlug(value);
    clearTimeout(timer.current);
    const p = slugProblem(value);
    if (p) {
      setCheck({ state: "bad", message: p });
      return;
    }
    if (value === row.slug) {
      setCheck({ state: "idle" });
      return;
    }
    setCheck({ state: "checking" });
    timer.current = setTimeout(() => {
      void (async () => {
        await e.autosave.flush();
        // The flush may have bumped the version, so read the row's current one.
        const current = await repo.projects.get(row.id);
        const r = await repo.projects.setSlug(row.id, value, current?.version ?? e.autosave.row.version);
        if (r.ok) {
          e.setRow(r.row);
          cache.invalidate("projects");
          setCheck({ state: "ok" });
          return;
        }
        if (r.reason === "taken") setCheck({ state: "taken", by: r.by });
        else if (r.reason === "conflict")
          setCheck({ state: "bad", message: "This project changed in another tab. Reload to try again." });
        else
          setCheck({
            state: "bad",
            message:
              r.reason === "offline"
                ? "You’re offline. The address is checked once you’re back."
                : "Couldn’t check the address. Try again.",
          });
      })();
    }, 600);
  };
  const suggestion = (() => {
    if (check.state === "taken") {
      const base = slugify(slug) || row.slug;
      const taken = new Set(
        e.rows.filter((r) => r.id !== row.id).flatMap((r) => [r.slug, r.publishedSlug ?? ""]),
      );
      if (!taken.has(base) && base !== slug) return base;
      let n = 2;
      while (taken.has(`${base}-${n}`)) n += 1;
      return `${base}-${n}`;
    }
    if (check.state === "bad" && slug && slugify(slug) && slugify(slug) !== slug) return slugify(slug);
    return "";
  })();
  const changed = live !== null && slug !== live && check.state !== "bad" && check.state !== "taken";
  const redirect = e.draft.settings.redirectOldSlug;

  // ---- search and link previews
  const defaultTitle = `${o.title || "Untitled project"}${ownerName ? ` · ${ownerName}` : ""}`;
  const title = e.draft.seo.title?.trim() || defaultTitle;
  const desc = e.draft.seo.description?.trim() || o.summary;
  const setSeo = (k: "title" | "description", v: string) => {
    e.update((d) => {
      const rest = Object.fromEntries(Object.entries(d.seo).filter(([key]) => key !== k)) as typeof d.seo;
      return { ...d, seo: v ? { ...rest, [k]: v } : rest };
    });
  };
  const og = e.draft.seo.ogImage;
  const custom = og !== undefined && og !== "cover";
  const ogUpload = useUpload({ images: true });
  const ogInput = useRef<HTMLInputElement>(null);
  const coverId = e.draft.visuals.cover?.mediaId;
  const ogSrc = custom ? e.urls[og.mediaId] : coverId ? e.urls[coverId] : undefined;

  // ---- who can find it
  const [vis, setVis] = useState(row.visibility);
  const [index, setIndex] = useState(row.indexAllowed);
  const unlisted = vis === "unlisted";
  const indexed = !unlisted && index;
  const saveSettings = async (visibility: "public" | "unlisted", indexAllowed: boolean) => {
    const r = await repo.publish({
      action: "settings",
      kind: "project",
      id: row.id,
      visibility,
      indexAllowed,
    });
    if (!r.ok) toast.show({ message: "Couldn’t save who can find it. Try again.", tone: "error" });
    cache.invalidate("projects");
  };

  // ---- preview links
  const [links, setLinks] = useState<PreviewLink[]>([]);
  const [fresh, setFresh] = useState<{ url: string; link: PreviewLink } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let alive = true;
    void repo.previews.list("project", row.id).then((l) => {
      if (alive) setLinks(l);
    });
    return () => {
      alive = false;
    };
  }, [repo, row.id]);
  const makeLink = async () => {
    try {
      const r = await repo.previews.create("project", row.id);
      setFresh(r);
      setLinks((l) => [r.link, ...l]);
      toast.show({ message: "Preview link created. It expires in 7 days." });
    } catch {
      toast.show({ message: "Couldn’t create a preview link. Try again.", tone: "error" });
    }
  };
  const revoke = async (hash: string) => {
    await repo.previews.revoke(hash);
    setLinks((l) => l.filter((x) => x.tokenHash !== hash));
    if (fresh?.link.tokenHash === hash) setFresh(null);
    toast.show({ message: "Preview link revoked. It stops working now.", tone: "neutral" });
  };

  // ---- unpublish or delete
  const [ask, setAsk] = useState<"unpublish" | "delete" | null>(null);
  const [typed, setTyped] = useState("");
  const delOk = typed.trim() === row.slug;

  const now = new Date();
  return (
    <EditorCols
      asideLabel="Previews"
      aside={
        <>
          <div>
            <div className="mono" style={{ marginBottom: 10 }}>
              Search result · preview
            </div>
            <div className={cx("card", styles.snip)}>
              <div className={styles.snipTop}>
                <span className={styles.fav} aria-hidden="true">
                  {(ownerName || "S").slice(0, 1)}
                </span>
                <span className={styles.snipSite}>
                  <span>{ownerName}</span>
                  <span className={styles.crumbs}>
                    {host()} › work › {slug || "…"}
                  </span>
                </span>
              </div>
              <div className={styles.snipTitle}>{title}</div>
              <div className={styles.snipDesc}>{desc.length > 158 ? `${desc.slice(0, 155)}…` : desc}</div>
              {!indexed ? (
                <div className={styles.snipHidden}>
                  {unlisted
                    ? "Unlisted: this result won’t appear in search engines."
                    : "Indexing is off: this result won’t appear in search engines."}
                </div>
              ) : null}
            </div>
          </div>
          <div>
            <div className="mono" style={{ marginBottom: 10 }}>
              Link preview · LinkedIn, Slack, messages
            </div>
            <div className={cx("card", styles.linkPv)}>
              <div className={styles.og}>
                {ogSrc ? <img src={ogSrc} alt="" /> : null}
                {og !== undefined && og !== "cover" && !ogSrc ? (
                  <span className={styles.ogBadge}>Using the cover until you upload one</span>
                ) : null}
              </div>
              <div className={styles.linkText}>
                <div className={styles.linkHost}>{host()}</div>
                <div className={styles.linkTitle}>{title}</div>
              </div>
            </div>
          </div>
        </>
      }
    >
      <Sec
        id="s-url"
        title="Page address"
        sub="Lowercase letters, numbers and hyphens. Short and readable is best."
      >
        <div className={styles.fld}>
          <label className={styles.lbl} htmlFor="f-slug">
            Address
          </label>
          <div
            className={cx(styles.pre, (check.state === "bad" || check.state === "taken") && styles.preBad)}
          >
            <span>{host()}/work/</span>
            <input
              id="f-slug"
              value={slug}
              spellCheck={false}
              autoCapitalize="off"
              aria-invalid={check.state === "bad" || check.state === "taken"}
              aria-describedby="f-slug-h"
              onChange={(ev) => {
                onSlug(ev.target.value);
              }}
            />
          </div>
          <div className={styles.hrow} id="f-slug-h" role="status">
            {check.state === "checking" ? (
              <span className={styles.checking}>
                <span className={styles.spin} />
                Checking…
              </span>
            ) : null}
            {check.state === "ok" || check.state === "idle" ? (
              <span className={styles.ok}>
                <Icon name="tick" size={16} />
                {slug === (live ?? row.slug) ? "This is the current address" : "Available"}
              </span>
            ) : null}
            {check.state === "taken" || check.state === "bad" ? (
              <span className={styles.err}>
                <Icon name="alert-circle" size={16} />
                {check.state === "taken" ? `Already used by “${check.by ?? ""}”.` : check.message}
              </span>
            ) : null}
            {suggestion ? (
              <button
                type="button"
                className={styles.suggest}
                onClick={() => {
                  onSlug(suggestion);
                }}
              >
                Use {suggestion}
              </button>
            ) : null}
          </div>
        </div>
        {changed ? (
          <div className={styles.redir}>
            <Switch
              checked={redirect}
              onCheckedChange={(v) => {
                e.update((d) => ({ ...d, settings: { ...d.settings, redirectOldSlug: v } }));
              }}
            >
              Redirect the old address here
            </Switch>
            <span className={styles.redirNote} style={{ color: redirect ? "#4A4A51" : "#8A5A00" }}>
              {redirect
                ? `/work/${live} will send visitors and search engines here, so shared links keep working.`
                : `Links already shared to /work/${live} will show “not found”.`}
            </span>
          </div>
        ) : null}
      </Sec>

      <Sec
        id="s-seo"
        title="Search and link previews"
        sub="Leave a field empty to use the title and summary from Overview."
      >
        <div className={styles.fld}>
          <TextField
            id="f-seoTitle"
            label="Search title"
            value={e.draft.seo.title ?? ""}
            placeholder={defaultTitle}
            onChange={(ev) => {
              setSeo("title", ev.target.value);
            }}
            hint={
              title.length > SOFT_LIMITS.seoTitle
                ? undefined
                : e.draft.seo.title
                  ? "Custom title."
                  : "Using the project title and your name."
            }
            warning={
              title.length > SOFT_LIMITS.seoTitle
                ? "Search engines may cut this off after about 60 characters."
                : undefined
            }
            counter={{ limit: SOFT_LIMITS.seoTitle, warnAbove: SOFT_LIMITS.seoTitle }}
          />
        </div>
        <div className={styles.fld}>
          <TextArea
            id="f-seoDesc"
            label="Search description"
            value={e.draft.seo.description ?? ""}
            placeholder={o.summary}
            minHeight={76}
            onChange={(ev) => {
              setSeo("description", ev.target.value);
            }}
            hint={
              desc.length > SOFT_LIMITS.seoDescription
                ? undefined
                : e.draft.seo.description
                  ? "Custom description."
                  : "Using the one-line summary."
            }
            warning={
              desc.length > SOFT_LIMITS.seoDescription ? "Likely to be cut off in results." : undefined
            }
            counter={{ limit: SOFT_LIMITS.seoDescription, warnAbove: SOFT_LIMITS.seoDescription }}
          />
        </div>
        <div className={styles.fld}>
          <span className={styles.lbl} id="l-og">
            Link preview image
          </span>
          <div role="radiogroup" aria-labelledby="l-og" className={styles.ogChoice}>
            <button
              type="button"
              className={styles.rc}
              role="radio"
              aria-checked={!custom}
              onClick={() => {
                e.update((d) => ({ ...d, seo: { ...d.seo, ogImage: "cover" } }));
              }}
            >
              <span className={styles.rdo} />
              <span className={styles.rcTitle}>Made from the cover</span>
              <span />
              <span className={styles.rcNote}>Uses the cover crop you set in Visuals.</span>
            </button>
            <button
              type="button"
              className={styles.rc}
              role="radio"
              aria-checked={custom}
              onClick={() => {
                ogInput.current?.click();
              }}
            >
              <span className={styles.rdo} />
              <span className={styles.rcTitle}>Upload a custom image</span>
              <span />
              <span className={styles.rcNote}>1200 × 630 px works everywhere.</span>
            </button>
            <input
              ref={ogInput}
              tabIndex={-1}
              aria-hidden="true"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(ev) => {
                const files = ev.target.files;
                void (async () => {
                  if (!files?.length) return;
                  const rows = await ogUpload.upload([...files].slice(0, 1));
                  const r = rows[0];
                  if (!r) return;
                  e.setMedia((m) => [r, ...m]);
                  e.setUrl(r.id, await repo.media.url(r, "1600"));
                  e.update((d) => ({ ...d, seo: { ...d.seo, ogImage: { mediaId: r.id } } }));
                })();
              }}
            />
          </div>
        </div>
      </Sec>

      <Sec
        id="s-vis"
        title="Who can find it"
        sub="Separate from publishing: this decides where a published page shows up."
      >
        <div role="radiogroup" aria-labelledby="s-vis" className={styles.visChoice}>
          {(
            [
              ["public", "Public", "On your homepage, in search engines and in the sitemap."],
              [
                "unlisted",
                "Unlisted",
                "Only people with the link can open it. Not on your homepage, not indexed, not in the sitemap. Useful for work under NDA that you share in applications.",
              ],
            ] as const
          ).map(([v, label, note]) => (
            <button
              key={v}
              type="button"
              className={styles.rc}
              role="radio"
              aria-checked={vis === v}
              onClick={() => {
                setVis(v);
                announce(
                  v === "unlisted" ? "Unlisted. Hidden from the homepage and search engines." : "Public.",
                );
                void saveSettings(v, index);
              }}
            >
              <span className={styles.rdo} />
              <span className={styles.visTitle}>{label}</span>
              <span />
              <span className={styles.rcNote}>{note}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Switch
            checked={indexed}
            disabled={unlisted}
            onCheckedChange={(v) => {
              setIndex(v);
              void saveSettings(vis, v);
            }}
          >
            Let search engines index this page
          </Switch>
        </div>
        <div className={styles.note}>
          {unlisted
            ? "Off: unlisted pages are always noindex."
            : indexed
              ? "Search engines can show this page."
              : "Hidden from search results, but still on your homepage."}
        </div>
        <div className={styles.lockNote}>
          <Icon name="lock" style={{ color: "var(--ok)" }} />
          <span>
            Drafts and previews are never public: they’re served only to you or a preview link, always with{" "}
            <code>noindex</code>, and never in the sitemap.
          </span>
        </div>
      </Sec>

      <Sec
        id="s-share"
        title="Share a private preview"
        sub="Send your draft to a mentor or reviewer before it goes live. They don’t need an account."
      >
        {fresh ? (
          <div className={styles.linkBox}>
            <div className={styles.linkRow}>
              <span className={styles.linkUrl}>{fresh.url}</span>
              <button
                type="button"
                className={buttons.btn}
                style={{ height: 34 }}
                onClick={() => {
                  void navigator.clipboard.writeText(fresh.url).then(
                    () => {
                      setCopied(true);
                      announce("Link copied.");
                      toast.show({ message: "Preview link copied.", tone: "neutral" });
                      setTimeout(() => {
                        setCopied(false);
                      }, 1800);
                    },
                    () => undefined,
                  );
                }}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            <div className={styles.linkMeta}>
              <span>Shows the latest draft · expires in 7 days · not indexed</span>
              <button
                type="button"
                className={styles.revoke}
                onClick={() => void revoke(fresh.link.tokenHash)}
              >
                Revoke link
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.noLink}>
            <button type="button" className={buttons.btn} onClick={() => void makeLink()}>
              <Icon name="link" size={16} />
              Create preview link
            </button>
            <span>Expires after 7 days. You can revoke it any time.</span>
          </div>
        )}
        {links.filter((l) => l.tokenHash !== fresh?.link.tokenHash).length > 0 ? (
          <ul className={styles.links} aria-label="Active preview links">
            {links
              .filter((l) => l.tokenHash !== fresh?.link.tokenHash)
              .map((l) => (
                <li key={l.tokenHash}>
                  <span>
                    Created {dayAndTime(l.createdAt, now)} · expires {dayAndTime(l.expiresAt, now)}
                  </span>
                  <button type="button" className={styles.revoke} onClick={() => void revoke(l.tokenHash)}>
                    Revoke
                  </button>
                </li>
              ))}
          </ul>
        ) : null}
      </Sec>

      <section className={cx(styles.dz)} aria-labelledby="s-danger">
        <h2 id="s-danger" className={styles.dzTitle}>
          Unpublish or delete
        </h2>
        {row.published ? (
          <>
            <div className={cx(styles.dzRow, styles.dzRule)}>
              <div className={styles.dzText}>
                <div className={styles.dzName}>Unpublish</div>
                <div className={styles.dzNote}>
                  Takes it off the live site and back to draft. Its address shows your work index instead. You
                  can publish again later.
                </div>
              </div>
              <button
                type="button"
                className={styles.dbtn}
                onClick={() => {
                  setAsk("unpublish");
                }}
              >
                Unpublish…
              </button>
            </div>
            {ask === "unpublish" ? (
              <div className={styles.ask}>
                <span className={styles.askText}>
                  <strong>Unpublish “{o.title}”?</strong> It disappears from your homepage now. Anyone opening
                  its link lands on your work index.
                </span>
                <span className={styles.askActs}>
                  <button
                    type="button"
                    className={buttons.btn}
                    style={{ height: 38 }}
                    onClick={() => {
                      setAsk(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.dfill}
                    onClick={() => {
                      void repo
                        .publish({ action: "unpublish", kind: "project", id: row.id })
                        .then(async (r) => {
                          setAsk(null);
                          if (!r.ok) {
                            toast.show({ message: "Couldn’t unpublish. Try again.", tone: "error" });
                            return;
                          }
                          const next = await repo.projects.get(row.id);
                          if (next) e.setRow(next);
                          cache.invalidate("projects");
                          toast.show({
                            message:
                              "Unpublished. It’s a draft again, and its address shows your work index.",
                          });
                        });
                    }}
                  >
                    Unpublish
                  </button>
                </span>
              </div>
            ) : null}
          </>
        ) : null}
        <div className={styles.dzRow}>
          <div className={styles.dzText}>
            <div className={styles.dzName}>Delete project</div>
            <div className={styles.dzNote}>
              Removes the page and all its drafts. Images and videos stay in your media library.
            </div>
          </div>
          <button
            type="button"
            className={styles.dbtn}
            onClick={() => {
              setAsk("delete");
              setTyped("");
            }}
          >
            Delete…
          </button>
        </div>
        {ask === "delete" ? (
          <div className={styles.ask}>
            <label htmlFor="f-del" className={styles.askText}>
              This can’t be undone. Type <strong className={styles.mono}>{row.slug}</strong> to confirm.
            </label>
            <input
              id="f-del"
              className={styles.delInp}
              value={typed}
              spellCheck={false}
              autoComplete="off"
              onChange={(ev) => {
                setTyped(ev.target.value);
              }}
            />
            <span className={styles.askActs}>
              <button
                type="button"
                className={buttons.btn}
                style={{ height: 38 }}
                onClick={() => {
                  setAsk(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cx(styles.dfill, !delOk && styles.dfillOff)}
                aria-disabled={!delOk}
                onClick={() => {
                  if (!delOk) return;
                  void repo.publish({ action: "delete", kind: "project", id: row.id }).then(async () => {
                    const l = await repo.layout.get();
                    cache.set("layout", l);
                    cache.invalidate("projects");
                    cache.invalidate("dashboard");
                    toast.show({ message: `Deleted “${o.title || "Untitled project"}”.`, tone: "neutral" });
                    void navigate("/studio/projects");
                  });
                }}
              >
                Delete forever
              </button>
            </span>
          </div>
        ) : null}
      </section>
    </EditorCols>
  );
}
