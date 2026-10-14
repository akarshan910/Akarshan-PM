/**
 * Writing › a post (05 · Writing › The editor and Post settings; StudioWriting › writing a draft,
 * many topics, topics dropdown open, publish dialog, scheduled, published).
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { cx } from "../../cx";
import { Icon } from "../../icons";
import buttons from "../Button.module.css";
import { Switch } from "../Controls";
import { useRepo, useStudio } from "../data";
import { Dialog } from "../Dialog";
import { RichArea } from "../RichArea";
import { SaveStatus } from "../SaveStatus";
import { useShell } from "../shell/ShellContext";
import { ConflictDialog } from "../states/ConflictDialog";
import { useToast } from "../Toast";
import { TopicPicker, type TopicUse } from "../TopicPicker";
import { UNSAVED_MESSAGE, useAutosave } from "../useAutosave";
import { useStudioTitle } from "../useStudioTitle";
import { useUpload } from "../media/useUpload";
import styles from "./Writing.module.css";
import { isHttpsUrl } from "~/lib/schemas";
import { postChecks, postIssues, postWords, readingMinutes } from "~/lib/studio/checks";
import type { MediaRow, PostRow } from "~/lib/studio/repo";
import {
  citableFacts,
  excerptOrFirstLines,
  factBlock,
  followsTitle,
  fromLocalInput,
  postSlugFor,
  postStatus,
  scheduleLabel,
  toLocalInput,
} from "~/lib/studio/writing";
import { newId } from "~/lib/defaults";
import type { Post, PostBlock, Profile } from "~/lib/types";

type AddKind = "text" | "heading" | "quote" | "image" | "embed" | "code";

export function PostEditor({
  row: initial,
  profile,
  media: initialMedia,
}: {
  row: PostRow;
  profile: Profile;
  media: MediaRow[];
}) {
  const repo = useRepo();
  const { cache } = useStudio();
  const toast = useToast();
  const { announce } = useShell();
  const [media, setMedia] = useState(initialMedia);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [vocab, setVocab] = useState<TopicUse[]>([]);
  const [dialog, setDialog] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [when, setWhen] = useState<"now" | "later">(initial.scheduledFor ? "later" : "now");
  const [schedule, setSchedule] = useState(() =>
    toLocalInput(initial.scheduledFor ?? new Date(Date.now() + 86_400_000).toISOString()),
  );
  const [embed, setEmbed] = useState<string | null>(null);
  const [canonical, setCanonical] = useState(initial.draft.canonicalUrl ?? "");

  const a = useAutosave<Post, PostRow>({
    key: `post:${initial.id}`,
    row: initial,
    save: (d, v) => repo.posts.save(initial.id, d, v),
    onSaved: () => {
      cache.invalidate("posts");
      cache.invalidate("dashboard");
    },
  });
  const p = a.draft;
  useStudioTitle(p.title.trim() || "Untitled draft", "Writing");
  const row = a.row;
  const status = postStatus(row);

  useEffect(() => {
    let live = true;
    void repo.topics("post").then((t) => {
      if (live) setVocab(t.map((x) => ({ name: x.topic, uses: x.uses })));
    });
    void Promise.all(media.map(async (m) => [m.id, await repo.media.url(m, "960")] as const)).then(
      (pairs) => {
        if (live) setUrls(Object.fromEntries(pairs));
      },
    );
    return () => {
      live = false;
    };
    // The media list only grows here; urls for new rows are added on upload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo]);

  // ---- the address follows the title until edited
  const [slug, setSlug] = useState(row.slug);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const writeSlug = (next: string) => {
    setSlug(next);
    clearTimeout(slugTimer.current);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(next)) return;
    slugTimer.current = setTimeout(() => {
      void (async () => {
        // The address waits until the last edit has saved, so it can't overwrite it.
        if (!(await a.flush())) return;
        // The flush may have bumped the version, so read the row's current one.
        const current = await repo.posts.get(row.id);
        if (!current) return;
        const r = await repo.posts.setSlug(row.id, next, current.version);
        if (r.ok) a.reset(r.row);
      })();
    }, 600);
  };
  useEffect(
    () => () => {
      clearTimeout(slugTimer.current);
    },
    [],
  );

  const set = (fn: (d: Post) => Post) => {
    a.update(fn);
  };
  const setTitle = (title: string) => {
    const follow = followsTitle(slug, p.title);
    set((d) => ({ ...d, title }));
    if (follow && title.trim()) writeSlug(postSlugFor(title, slug));
  };

  // ---- blocks
  const patchBlock = (id: string, fn: (b: PostBlock) => PostBlock) => {
    set((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === id ? fn(b) : b)) }));
  };
  const removeBlock = (id: string) => {
    set((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) }));
  };
  const upload = useUpload({ images: true });
  const addRows = async (rows: MediaRow[]) => {
    setMedia((m) => [...rows, ...m]);
    for (const r of rows) {
      const u = await repo.media.url(r, "960");
      setUrls((x) => ({ ...x, [r.id]: u }));
    }
  };
  const add = (kind: AddKind) => {
    if (kind === "embed") {
      setEmbed("");
      return;
    }
    if (kind === "image") return;
    const block: PostBlock =
      kind === "text"
        ? { id: newId("b"), type: "text", body: "" }
        : kind === "code"
          ? { id: newId("b"), type: "code", body: "" }
          : { id: newId("b"), type: kind, body: "" };
    set((d) => ({ ...d, blocks: [...d.blocks, block] }));
    announce("Block added.");
  };
  const addImage = async (files: FileList | null) => {
    if (!files?.length) return;
    const rows = await upload.upload([...files].slice(0, 1));
    const r = rows[0];
    if (!r) return;
    await addRows(rows);
    set((d) => ({ ...d, blocks: [...d.blocks, { id: newId("b"), type: "image", mediaId: r.id }] }));
    announce("Block added.");
  };
  const coverUpload = useUpload({ images: true });
  const addCover = async (files: FileList | null) => {
    if (!files?.length) return;
    const rows = await coverUpload.upload([...files].slice(0, 1));
    const r = rows[0];
    if (!r) return;
    await addRows(rows);
    set((d) => ({ ...d, cover: { mediaId: r.id } }));
  };

  // ---- publishing
  const byId = new Map(media.map((m) => [m.id, m]));
  const issues = postIssues(p, { media: (id) => byId.get(id) });
  const checks = postChecks(p, issues);
  const later = when === "later" && status !== "published";
  const scheduledIso = fromLocalInput(schedule);
  const words = postWords(p);
  const facts = citableFacts(profile);
  const cover = p.cover?.mediaId ? byId.get(p.cover.mediaId) : undefined;
  const coverAlt = p.cover?.alt ?? cover?.alt ?? "";

  const publish = async () => {
    if (issues.length > 0) return;
    setPublishing(true);
    if (!(await a.flush())) {
      setPublishing(false);
      toast.show({ message: UNSAVED_MESSAGE, tone: "error" });
      return;
    }
    const r = await repo.publish({
      action: "publish",
      kind: "post",
      id: row.id,
      ...(later ? { scheduleFor: scheduledIso } : {}),
    });
    setPublishing(false);
    if (!r.ok) {
      toast.show({
        message:
          r.reason === "offline"
            ? "You’re offline. Publish once you’re back online."
            : "Couldn’t publish. Your draft is safe.",
        tone: "error",
      });
      return;
    }
    setDialog(false);
    const fresh = await repo.posts.get(row.id);
    if (fresh) a.reset(fresh);
    cache.invalidate("posts");
    cache.invalidate("dashboard");
    const msg =
      later && scheduledIso
        ? `Scheduled for ${scheduleLabel(scheduledIso).long}.`
        : `Published at /writing/${fresh?.publishedSlug ?? slug} and added to your RSS feed.`;
    toast.show({ message: msg });
    announce(later ? "Scheduled." : "Published.");
  };

  const unschedule = async () => {
    if (!(await a.flush())) {
      toast.show({ message: UNSAVED_MESSAGE, tone: "error" });
      return;
    }
    const r = await repo.publish({ action: "publish", kind: "post", id: row.id, scheduleFor: null });
    if (r.ok) {
      const fresh = await repo.posts.get(row.id);
      if (fresh) a.reset(fresh);
      setWhen("now");
      cache.invalidate("posts");
      toast.show({ message: "Unscheduled. It’s back in Drafts.", tone: "neutral" });
    }
  };

  const chip =
    status === "published"
      ? ["Published", "#E6F4EC", "#0F7A4A"]
      : status === "scheduled" && row.scheduledFor
        ? [`Scheduled · ${scheduleLabel(row.scheduledFor).short}`, "#EAF1FB", "#1D4F91"]
        : ["Draft", "#EFEEEA", "#4A4A51"];
  const cta = status === "published" ? "Update post" : later ? "Schedule" : "Publish";

  return (
    <main className={styles.main}>
      <div className={styles.edit}>
        <div className={styles.editMain}>
          <div className={styles.bar}>
            <Link to="/studio/writing" className={buttons.btn} style={{ height: 36 }}>
              <Icon name="chevron-left" size={16} />
              All posts
            </Link>
            <span className="chip" style={{ background: chip[1], color: chip[2] }}>
              {chip[0]}
            </span>
            <SaveStatus state={a.state} savedLabel={a.savedLabel} onRetry={a.retry} />
            <span style={{ flex: 1 }} />
            <span className={styles.count}>
              {words} words · {readingMinutes(words)} min read
            </span>
            <Link to={`/studio/preview/post/${row.id}`} className={buttons.btn} style={{ height: 40 }}>
              Preview
            </Link>
            <button
              type="button"
              className={buttons.cta}
              onClick={() => {
                setDialog(true);
              }}
            >
              {cta}
            </button>
          </div>
          {row.scheduleError ? (
            <div className={styles.schedErr} role="alert">
              <Icon name="alert-circle" />
              <span>
                <strong>Couldn’t publish.</strong> {row.scheduleError}
              </span>
            </div>
          ) : null}
          <h1 className="sr-only">{p.title || "Untitled draft"}</h1>
          <article className={cx("card", styles.paper)}>
            {cover ? (
              <div className={styles.cover}>
                {urls[cover.id] ? <img src={urls[cover.id]} alt="" /> : null}
                <button
                  type="button"
                  className={cx(buttons.btn, styles.coverRemove)}
                  onClick={() => {
                    set((d) => {
                      const { cover: _c, ...rest } = d;
                      return rest;
                    });
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className={styles.coverEmpty}>
                <Icon name="image" size={16} />
                Add a cover image · optional
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={(ev) => void addCover(ev.target.files)}
                />
              </label>
            )}
            {cover ? (
              <div className={styles.coverAlt}>
                <label htmlFor="w-coverAlt" className={styles.lbl}>
                  Cover alt text <span className={styles.req}>Required</span>
                </label>
                <input
                  id="w-coverAlt"
                  className={cx(styles.inp, !coverAlt.trim() && styles.bad)}
                  value={coverAlt}
                  onChange={(ev) => {
                    const alt = ev.target.value;
                    set((d) => ({ ...d, cover: { ...(d.cover ?? { mediaId: cover.id }), alt } }));
                  }}
                />
              </div>
            ) : null}
            <label className="sr-only" htmlFor="w-title">
              Title
            </label>
            <textarea
              id="w-title"
              className={styles.pt}
              rows={Math.max(1, Math.ceil(p.title.length / 34))}
              value={p.title}
              placeholder="Title"
              onChange={(ev) => {
                setTitle(ev.target.value);
              }}
            />
            <label className="sr-only" htmlFor="w-dek">
              Subtitle
            </label>
            <input
              id="w-dek"
              className={styles.pd}
              value={p.subtitle ?? ""}
              placeholder="Subtitle, optional"
              onChange={(ev) => {
                const v = ev.target.value;
                set((d) => {
                  const { subtitle: _s, ...rest } = d;
                  return v ? { ...rest, subtitle: v } : rest;
                });
              }}
            />
            <div className={styles.rule} />
            <div className={styles.blocks}>
              {p.blocks.map((b, i) => (
                <div key={b.id} className={styles.pblock}>
                  {b.type === "text" ? (
                    <RichArea
                      value={b.body}
                      label="Paragraph"
                      placeholder={i === 0 ? "Start with the moment you noticed it…" : "Write…"}
                      className={styles.pb}
                      onChange={(body) => {
                        patchBlock(b.id, (x) => (x.type === "text" ? { ...x, body } : x));
                      }}
                    />
                  ) : null}
                  {b.type === "heading" || b.type === "quote" || b.type === "code" ? (
                    <textarea
                      className={cx(
                        styles.pb,
                        b.type === "heading" && styles.h2b,
                        b.type === "quote" && styles.qb,
                        b.type === "code" && styles.cb,
                      )}
                      value={b.body}
                      rows={b.type === "heading" ? 1 : 3}
                      aria-label={b.type === "heading" ? "Heading" : b.type === "quote" ? "Quote" : "Code"}
                      placeholder={
                        b.type === "heading"
                          ? "Heading"
                          : b.type === "quote"
                            ? "A line worth quoting"
                            : "Code"
                      }
                      onChange={(ev) => {
                        const body = ev.target.value;
                        patchBlock(b.id, (x) => (x.type === b.type ? { ...x, body } : x));
                      }}
                    />
                  ) : null}
                  {b.type === "image" ? (
                    <div className={styles.img}>
                      {urls[b.mediaId] ? <img src={urls[b.mediaId]} alt="" /> : null}
                      <input
                        className={styles.inp}
                        aria-label="Image alt text"
                        placeholder="Alt text: what the image shows"
                        value={b.alt ?? byId.get(b.mediaId)?.alt ?? ""}
                        onChange={(ev) => {
                          const alt = ev.target.value;
                          patchBlock(b.id, (x) => (x.type === "image" ? { ...x, alt } : x));
                        }}
                      />
                    </div>
                  ) : null}
                  {b.type === "embed" ? <div className={styles.embed}>{b.url}</div> : null}
                  {b.type === "fact" ? (
                    <div className={styles.factBlock}>
                      <strong>{b.value}</strong> {b.label}{" "}
                      <span className={cx("chip", styles.factChip)}>{b.resultType.toUpperCase()}</span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className={cx("ib", styles.blockDel)}
                    aria-label="Remove block"
                    onClick={() => {
                      removeBlock(b.id);
                    }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
            </div>
            {embed !== null ? (
              <form
                className={styles.embedForm}
                onSubmit={(ev) => {
                  ev.preventDefault();
                  const url = embed.trim();
                  if (!isHttpsUrl(url)) return;
                  set((d) => ({ ...d, blocks: [...d.blocks, { id: newId("b"), type: "embed", url }] }));
                  setEmbed(null);
                  announce("Block added.");
                }}
              >
                <input
                  className={styles.inp}
                  aria-label="Embed link"
                  placeholder="Paste a YouTube, Vimeo, Loom or Figma link"
                  value={embed}
                  onChange={(ev) => {
                    setEmbed(ev.target.value);
                  }}
                />
                <button type="submit" className={buttons.btn} style={{ height: 40 }}>
                  Add
                </button>
              </form>
            ) : null}
            <div className={styles.addRow}>
              <span>Add</span>
              <div className={styles.addm} role="group" aria-label="Add a block">
                {(
                  [
                    ["text", "Paragraph"],
                    ["heading", "Heading"],
                    ["quote", "Quote"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      add(k);
                    }}
                  >
                    {label}
                  </button>
                ))}
                <label className={styles.addFile}>
                  Image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    onChange={(ev) => void addImage(ev.target.files)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    add("embed");
                  }}
                >
                  Embed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    add("code");
                  }}
                >
                  Code
                </button>
              </div>
            </div>
          </article>
        </div>

        <aside className={styles.side} aria-label="Post settings">
          <section className={cx("card", styles.box)}>
            <h2 className={styles.boxTitle}>Post settings</h2>
            <div className={styles.fld}>
              <label className={styles.lbl} htmlFor="w-slug">
                Address
              </label>
              <div className={styles.pre}>
                <span>/writing/</span>
                <input
                  id="w-slug"
                  value={slug}
                  placeholder="from-the-title"
                  spellCheck={false}
                  onChange={(ev) => {
                    writeSlug(ev.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                  }}
                />
              </div>
            </div>
            <div className={styles.fld}>
              <label className={styles.lbl} htmlFor="w-ex">
                Excerpt
              </label>
              <textarea
                id="w-ex"
                className={styles.inp}
                style={{ minHeight: 76, height: "auto", padding: "10px 12px" }}
                value={p.excerpt ?? ""}
                maxLength={160}
                placeholder="Leave empty to use the first lines"
                onChange={(ev) => {
                  const v = ev.target.value;
                  set((d) => {
                    const { excerpt: _e, ...rest } = d;
                    return v ? { ...rest, excerpt: v } : rest;
                  });
                }}
              />
              <div className={styles.hrow}>
                <span className={styles.hint}>Shown on cards and in search.</span>
                <span
                  className={styles.cnt}
                  style={{ color: (p.excerpt ?? "").length > 160 ? "#B42318" : "#6A6A72" }}
                >
                  {(p.excerpt ?? "").length}/160
                </span>
              </div>
            </div>
            <div className={styles.fld}>
              <TopicPicker
                id="w-topics"
                vocabulary={vocab}
                value={p.topics}
                noun="post"
                onChange={(topics) => {
                  set((d) => ({ ...d, topics }));
                }}
              />
            </div>
            {status !== "published" ? (
              <div className={styles.fld}>
                <span className={styles.lbl} id="l-when">
                  When
                </span>
                <div className="seg" role="group" aria-labelledby="l-when" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    aria-pressed={when === "now"}
                    onClick={() => {
                      setWhen("now");
                    }}
                  >
                    Publish now
                  </button>
                  <button
                    type="button"
                    aria-pressed={when === "later"}
                    onClick={() => {
                      setWhen("later");
                    }}
                  >
                    Schedule
                  </button>
                </div>
                {when === "later" ? (
                  <input
                    type="datetime-local"
                    className={styles.inp}
                    aria-label="Publish date and time"
                    value={schedule}
                    onChange={(ev) => {
                      setSchedule(ev.target.value);
                    }}
                    style={{ height: 40, fontSize: 14 }}
                  />
                ) : null}
                {status === "scheduled" ? (
                  <button
                    type="button"
                    className={cx(buttons.ghost, styles.unschedule)}
                    onClick={() => void unschedule()}
                  >
                    Unschedule
                  </button>
                ) : null}
              </div>
            ) : null}
            <div style={{ marginTop: 10 }}>
              <Switch
                checked={p.showOnHome}
                onCheckedChange={(v) => {
                  set((d) => ({ ...d, showOnHome: v }));
                }}
              >
                Show on my homepage
              </Switch>
            </div>
            <div className={styles.fld} style={{ marginTop: 8 }}>
              <label className={styles.lbl} htmlFor="w-can">
                Canonical link <span className={styles.req}>Optional</span>
              </label>
              <input
                id="w-can"
                className={styles.inp}
                placeholder="Only if it first appeared elsewhere"
                style={{ height: 40, fontSize: 14 }}
                value={canonical}
                onChange={(ev) => {
                  const v = ev.target.value.trim();
                  setCanonical(ev.target.value);
                  if (v === "" || isHttpsUrl(v))
                    set((d) => {
                      const { canonicalUrl: _c, ...rest } = d;
                      return v ? { ...rest, canonicalUrl: v } : rest;
                    });
                }}
              />
              <div className={styles.hrow}>
                <span className={styles.hint}>
                  If you later share it on LinkedIn or Medium, point those copies back here.
                </span>
              </div>
            </div>
          </section>
          <section className={cx("card", styles.box)}>
            <h2 className={styles.boxTitle}>Facts you can cite</h2>
            <p className={styles.boxSub}>
              Confirmed numbers from your profile, with their labels. Click one to add it to the end of the
              post.
            </p>
            {facts.length === 0 ? (
              <p className={styles.boxSub} style={{ margin: 0 }}>
                None yet. Confirm a number and give it a label in{" "}
                <Link to="/studio/website/profile" className={styles.u}>
                  Profile &amp; facts
                </Link>
                .
              </p>
            ) : (
              <div className={styles.facts}>
                {facts.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={styles.fact}
                    onClick={() => {
                      set((d) => ({ ...d, blocks: [...d.blocks, factBlock(f)] }));
                      announce("Fact added at the end.");
                    }}
                  >
                    <span style={{ flex: 1 }}>{f.text}</span>
                    <span className={cx("chip", styles.factChip)}>{f.type.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
          <section className={cx("card", styles.box, styles.seo)}>
            <div className="mono" style={{ fontSize: 11 }}>
              Search preview
            </div>
            <div className={styles.seoUrl}>
              {typeof location === "undefined" ? "" : location.host} › writing › {slug || "…"}
            </div>
            <div className={styles.seoTitle}>
              {p.title || "Untitled"}
              {profile.name ? ` · ${profile.name}` : ""}
            </div>
            <div className={styles.seoDesc}>
              {excerptOrFirstLines(p) || "The first lines of your post appear here."}
            </div>
          </section>
        </aside>
      </div>

      <Dialog
        open={dialog}
        onOpenChange={setDialog}
        layout="panel"
        kicker={later ? "Schedule post" : "Publish post"}
        title={
          later && scheduledIso
            ? `Schedule for ${scheduleLabel(scheduledIso).long}?`
            : `Publish to /writing/${slug || "your-post"}?`
        }
        cancelLabel="Keep writing"
        busy={publishing}
        confirmDisabled={issues.length > 0 || (later && !scheduledIso)}
        confirmLabel={
          publishing
            ? "Publishing…"
            : issues.length > 0
              ? "Fix to continue"
              : status === "published"
                ? "Update post"
                : later
                  ? "Schedule"
                  : "Publish now"
        }
        onConfirm={() => void publish()}
      >
        <div className={styles.checks}>
          {checks.map((c) => (
            <div key={c.text} className={styles.check}>
              <span
                aria-hidden="true"
                className={styles.checkIco}
                style={{
                  background: c.ok ? "#E6F4EC" : c.block ? "#FDECEA" : "#FFF4DB",
                  color: c.ok ? "#0F7A4A" : c.block ? "#B42318" : "#8A5A00",
                }}
              >
                {c.ok ? "✓" : c.block ? "×" : "!"}
              </span>
              <span className={styles.checkText}>
                <span className="sr-only">{c.ok ? "Done: " : c.block ? "Must fix: " : "Note: "}</span>
                {c.text}
              </span>
            </div>
          ))}
        </div>
      </Dialog>
      <ConflictDialog
        open={a.conflict !== null}
        subject="This post"
        what="The post was edited on another device."
        theirs="Post text"
        yours="Post text"
        onKeepMine={a.keepMine}
        onLoadLatest={a.loadLatest}
      />
    </main>
  );
}
