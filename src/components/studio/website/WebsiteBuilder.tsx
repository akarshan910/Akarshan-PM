/**
 * The Website builder (05 · Website builder; StudioSite): the header with "{n} changes not live",
 * Discard and "Publish website"; the outline; the live preview (Desktop 1280 at half size, Phone
 * 390 at 0.9) drawn with the public components; and the inspector. The layout and the profile
 * autosave separately; publishing sends both (`pm-publish`, kind "site").
 */
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";

import { cx } from "../../cx";
import buttons from "../Button.module.css";
import { useRepo, useStudio } from "../data";
import { Dialog } from "../Dialog";
import { mediaImg } from "../editor/ProjectEditor";
import { PreviewFrame } from "../preview/PreviewFrame";
import { SitePreview } from "../preview/SitePreview";
import { SaveStatus } from "../SaveStatus";
import { useShell } from "../shell/ShellContext";
import { ConflictDialog } from "../states/ConflictDialog";
import { UnconfirmedDialog } from "../states/UnconfirmedDialog";
import { useToast } from "../Toast";
import { UNSAVED_MESSAGE, useAutosave } from "../useAutosave";
import { Inspector } from "./Inspector";
import { Outline, type Sel } from "./Outline";
import styles from "./Website.module.css";
import { publishProfile, type ProfilePublished, type ResolveImg } from "~/lib/published";
import type { DocRow, MediaRow, PostRow, ProjectRow } from "~/lib/studio/repo";
import {
  addTextSection,
  itemName,
  moveKid,
  moveSection,
  moveToShelf,
  outlineKids,
  placeKid,
  placeSection,
  previewContent,
  removeSection,
  restoreSection,
  sectionName,
  setKidVisible,
  setSectionVisible,
  siteChanges,
  volumeNumbers,
  type Ctx,
  type OutlineKid,
  type Section,
} from "~/lib/studio/website";
import type { Profile, SiteLayout } from "~/lib/types";

type ProfileRow = DocRow<Profile, ProfilePublished>;
type LayoutRow = DocRow<SiteLayout>;

export interface WebsiteData {
  profile: ProfileRow;
  layout: LayoutRow;
  projects: ProjectRow[];
  posts: PostRow[];
  media: MediaRow[];
  urls: Record<string, string>;
}

const DEVICES = {
  desk: { width: 1280, scale: 0.5 },
  phone: { width: 390, scale: 0.9 },
} as const;
const PV_HEIGHT = 1290;

export function WebsiteBuilder({ data }: { data: WebsiteData }) {
  const repo = useRepo();
  const { cache } = useStudio();
  const { announce } = useShell();
  const toast = useToast();

  const prof = useAutosave<Profile, ProfileRow>({
    key: "profile",
    row: data.profile,
    save: (d, v) => repo.profile.save(d, v),
    onSaved: (r) => {
      cache.set("profile", r);
      cache.invalidate("dashboard");
    },
  });
  const lay = useAutosave<SiteLayout, LayoutRow>({
    key: "layout",
    row: data.layout,
    save: (d, v) => repo.layout.save(d, v),
    onSaved: (r) => {
      cache.set("layout", r);
      cache.invalidate("dashboard");
    },
  });
  const layout = lay.draft;
  const profile = prof.draft;

  const [sel, setSel] = useState<Sel>({ kind: "sec", id: "hero" });
  const [open, setOpen] = useState<Record<string, boolean>>({ hero: true });
  const [moved, setMoved] = useState<{ id: string; flip: number } | null>(null);
  const [device, setDevice] = useState<"desk" | "phone">("desk");
  const [ghost, setGhost] = useState(true);
  const [drafts, setDrafts] = useState(true);
  const [dialog, setDialog] = useState<"publish" | "discard" | null>(null);
  const [unconfirmed, setUnconfirmed] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);

  const byMedia = useMemo(() => new Map(data.media.map((m) => [m.id, m])), [data.media]);
  const resolve = useCallback<ResolveImg>(
    (ref) => {
      const m = byMedia.get(ref.mediaId);
      return m ? mediaImg(m, data.urls[m.id] ?? "") : undefined;
    },
    [byMedia, data.urls],
  );
  const postCount = data.posts.filter((p) => p.published).length;
  const ctx: Ctx = useMemo(
    () => ({ profile, projects: new Map(data.projects.map((r) => [r.id, r])), postCount }),
    [profile, data.projects, postCount],
  );
  const changes = useMemo(
    () =>
      siteChanges(layout, lay.row.published, ctx, {
        draft: publishProfile(profile, resolve),
        live: prof.row.published,
      }),
    [layout, lay.row.published, ctx, profile, resolve, prof.row.published],
  );
  const preview = useMemo(
    () =>
      previewContent({
        profile,
        layout,
        projects: data.projects,
        posts: data.posts,
        resolve,
        drafts,
        phone: device === "phone",
        updatedAt: lay.row.publishedAt ?? lay.row.updatedAt,
      }),
    [
      profile,
      layout,
      data.projects,
      data.posts,
      resolve,
      drafts,
      device,
      lay.row.publishedAt,
      lay.row.updatedAt,
    ],
  );
  const volumes = useMemo(() => volumeNumbers(layout, data.projects), [layout, data.projects]);

  const flash = (id: string) => {
    setMoved((m) => ({ id, flip: (m?.flip ?? 0) + 1 }));
  };

  // ---- outline actions
  const eyeSection = (s: Section) => {
    if (s.kind === "hero") {
      announce("The hero always shows. Hide its parts instead.");
      return;
    }
    lay.update((l) => setSectionVisible(l, s.id, !s.visible));
    announce(`${sectionName(s)} ${s.visible ? "hidden" : "shown"}.`);
  };
  const eyeKid = (s: Section, k: OutlineKid) => {
    if (k.draft) {
      announce("Drafts stay off the site until you publish them.");
      return;
    }
    if (k.visible === null) return;
    lay.update((l) => setKidVisible(l, s.id, k.id, !k.visible));
    announce(`${k.name} ${k.visible ? "hidden" : "shown"}.`);
  };
  const moveSec = (s: Section, by: -1 | 1) => {
    const next = moveSection(layout, s.id, by);
    if (!next) return false;
    lay.update(() => next);
    flash(s.id);
    announce(
      `${sectionName(s)} is now section ${String(next.sections.findIndex((x) => x.id === s.id) + 1)}.`,
    );
    return true;
  };
  const moveItem = (s: Section, k: OutlineKid, by: -1 | 1) => {
    if (!k.movable) return false;
    const next = moveKid(layout, s.id, k.id, by);
    if (!next) return false;
    lay.update(() => next);
    flash(k.id);
    const items = next.sections.find((x) => x.id === s.id)?.items ?? [];
    announce(
      `${k.name} is now ${String(items.findIndex((i) => i.id === k.id) + 1)} of ${String(items.length)}.`,
    );
    return true;
  };
  const onDragEnd = useCallback(
    (d: { kind: "sec" | "kid"; p?: string; id: string }) => {
      setMoved((m) => ({ id: d.id, flip: (m?.flip ?? 0) + 1 }));
      const s = lay.draft.sections.find((x) => x.id === (d.kind === "sec" ? d.id : d.p));
      if (!s) return;
      announce(`${d.kind === "sec" ? sectionName(s) : itemName(s, d.id, ctx)} moved.`);
    },
    [lay.draft, announce, ctx],
  );
  const addSection = () => {
    const r = addTextSection(layout);
    lay.update(() => r.layout);
    setSel({ kind: "sec", id: r.id });
    flash(r.id);
    announce("Text section added before Contact.");
  };

  // ---- inspector actions
  const inspectorMove = (by: -1 | 1) => {
    if (sel.kind === "sec") {
      const s = layout.sections.find((x) => x.id === sel.id);
      if (s) moveSec(s, by);
    } else if (sel.kind === "kid") {
      const s = layout.sections.find((x) => x.id === sel.p);
      const k = s ? outlineKids(s, ctx).find((x) => x.id === sel.id) : undefined;
      if (s && k) moveItem(s, k, by);
    }
  };
  const inspectorEyeKid = (s: Section, kidId: string) => {
    const k = outlineKids(s, ctx).find((x) => x.id === kidId);
    if (k) eyeKid(s, k);
  };
  const toShelf = (from: string, to: string, id: string) => {
    lay.update((l) => moveToShelf(l, from, to, id));
    setSel({ kind: "kid", p: to, id });
    setOpen((o) => ({ ...o, [to]: true }));
    flash(id);
    const target = layout.sections.find((x) => x.id === to);
    announce(
      `${ctx.projects.get(id)?.draft.overview.title ?? "Project"} moved to ${target ? sectionName(target) : "the shelf"}.`,
    );
  };
  const deleteSection = (s: Section) => {
    const at = layout.sections.findIndex((x) => x.id === s.id);
    lay.update((l) => removeSection(l, s.id));
    setSel({ kind: "sec", id: "hero" });
    toast.show({
      message: `${sectionName(s)} deleted.`,
      tone: "neutral",
      action: {
        label: "Undo",
        onAction: () => {
          // Back at its place in the layout as it is now, keeping edits made since.
          lay.update((l) => restoreSection(l, s, at));
          setSel({ kind: "sec", id: s.id });
        },
      },
    });
  };

  // ---- publish and discard
  const publish = async (confirmUnconfirmed = false) => {
    setPublishing(true);
    if (!(await prof.flush()) || !(await lay.flush())) {
      setPublishing(false);
      toast.show({ message: UNSAVED_MESSAGE, tone: "error" });
      return;
    }
    const result = await repo.publish({
      action: "publish",
      kind: "site",
      ...(confirmUnconfirmed ? { confirmUnconfirmed: true } : {}),
    });
    setPublishing(false);
    if (!result.ok) {
      if (result.reason === "needs-confirm") {
        setDialog(null);
        setUnconfirmed(result.unconfirmed.length);
        return;
      }
      setDialog(null);
      setUnconfirmed(null);
      toast.show({
        message:
          result.reason === "offline"
            ? "You’re offline. Publish once you’re back online."
            : "Couldn’t publish. Your draft is safe.",
        tone: "error",
        action: { label: "Try again", onAction: () => void publish(confirmUnconfirmed) },
      });
      return;
    }
    setDialog(null);
    setUnconfirmed(null);
    const [fp, fl] = await Promise.all([repo.profile.get(), repo.layout.get()]);
    prof.reset(fp);
    lay.reset(fl);
    cache.set("profile", fp);
    cache.set("layout", fl);
    cache.invalidate("dashboard");
    toast.show({
      message: "Homepage published. It updates within a minute.",
      link: { label: "View live ↗", href: "/" },
    });
    announce("Homepage published.");
  };
  const discard = () => {
    const live = lay.row.published;
    if (live) lay.update(() => structuredClone(live));
    setDialog(null);
    announce("Changes discarded.");
  };

  const n = changes.length;
  const saveState = lay.state === "saved" ? prof.state : lay.state;
  const dev = DEVICES[device];

  return (
    <div className={styles.page}>
      <header className={styles.tb}>
        <div className={styles.tbTitle}>
          <div className="mono" style={{ fontSize: 11 }}>
            <Link to="/studio">Studio</Link> / Website
          </div>
          <h1 className={styles.h1}>Website</h1>
        </div>
        {lay.row.published ? (
          <span className={cx("chip", styles.live)}>
            <span className={styles.liveDot} />
            Live
          </span>
        ) : null}
        {n ? (
          <span className={cx("chip", styles.dirty)}>
            {n} {n === 1 ? "change" : "changes"} not live
          </span>
        ) : null}
        <SaveStatus
          state={saveState}
          savedLabel={lay.savedLabel}
          onRetry={() => {
            lay.retry();
            prof.retry();
          }}
        />
        <span style={{ flex: 1 }} />
        {n && lay.row.published ? (
          <button
            type="button"
            className={buttons.btn}
            onClick={() => {
              setDialog("discard");
            }}
          >
            Discard
          </button>
        ) : null}
        <Link className={buttons.btn} to="/studio/preview/site/home">
          Preview
        </Link>
        <button
          type="button"
          className={buttons.cta}
          aria-disabled={n === 0 || undefined}
          onClick={() => {
            if (n === 0) {
              announce("Nothing to publish. The homepage is up to date.");
              return;
            }
            setDialog("publish");
          }}
        >
          Publish website
        </button>
      </header>

      <main className={styles.main} id="main">
        <h2 className="sr-only">Website</h2>
        <Outline
          layout={layout}
          ctx={ctx}
          sel={sel}
          open={open}
          moved={moved}
          onSelect={(next) => {
            setSel(next);
            if (next.kind === "sec") setOpen((o) => ({ ...o, [next.id]: true }));
          }}
          onToggleOpen={(id) => {
            setOpen((o) => ({ ...o, [id]: !o[id] }));
          }}
          onEyeSection={eyeSection}
          onEyeKid={eyeKid}
          onMoveSection={moveSec}
          onMoveKid={moveItem}
          onPlaceSection={(id, index) => {
            lay.update((l) => placeSection(l, id, index));
          }}
          onPlaceKid={(p, id, index) => {
            lay.update((l) => placeKid(l, p, id, index));
          }}
          onDragEnd={onDragEnd}
          onAddSection={addSection}
        />

        <section aria-label="Live preview" className={styles.preview}>
          <div className={styles.pvBar}>
            <div className="seg" role="group" aria-label="Preview device">
              {(
                [
                  ["desk", "Desktop"],
                  ["phone", "Phone"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={device === v}
                  onClick={() => {
                    setDevice(v);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <span style={{ flex: 1 }} />
            {(
              [
                ["Show hidden", ghost, setGhost],
                ["Show drafts", drafts, setDrafts],
              ] as const
            ).map(([label, on, set]) => (
              <button
                key={label}
                type="button"
                className={styles.sw}
                role="switch"
                aria-checked={on}
                style={{ minHeight: 34, fontSize: 13 }}
                onClick={() => {
                  set(!on);
                }}
              >
                <span
                  className={styles.trk}
                  aria-hidden="true"
                  style={{ background: on ? "#141416" : "#D2D0CA" }}
                >
                  <span className={styles.knb} style={{ left: on ? 18 : 2 }} />
                </span>
                {label}
              </button>
            ))}
          </div>
          <div className={styles.pv}>
            <PreviewFrame
              title={`Homepage preview, ${device === "desk" ? "desktop" : "phone"}`}
              width={dev.width}
              height={Math.round(PV_HEIGHT / dev.scale)}
              scale={dev.scale}
            >
              <SitePreview
                content={preview.content}
                layout={preview.content.layout}
                draftSlugs={preview.draftSlugs}
                ghost={ghost}
                selected={sel.kind === "nav" ? null : sel.kind === "sec" ? sel.id : sel.p}
                onSelect={(id) => {
                  setSel({ kind: "sec", id });
                  setOpen((o) => ({ ...o, [id]: true }));
                }}
              />
            </PreviewFrame>
          </div>
        </section>

        <Inspector
          sel={sel}
          layout={layout}
          profile={profile}
          ctx={ctx}
          projects={data.projects}
          volumes={volumes}
          postCount={postCount}
          onSelect={setSel}
          updateLayout={lay.update}
          updateProfile={prof.update}
          announce={announce}
          onEyeSection={eyeSection}
          onEyeKid={inspectorEyeKid}
          onMove={inspectorMove}
          onMoveToShelf={toShelf}
          onRemoveSection={deleteSection}
        />
      </main>

      <Dialog
        open={dialog === "publish"}
        onOpenChange={(o) => {
          if (!o) setDialog(null);
        }}
        layout="panel"
        kicker="Publish website"
        title="Update the live homepage?"
        description="Only these changes go live. Project pages and drafts aren’t touched."
        cancelLabel="Cancel"
        confirmLabel={publishing ? "Publishing…" : "Publish now"}
        busy={publishing}
        onConfirm={() => void publish()}
        footerStart={
          <Link to="/studio/preview/site/home" className={styles.u}>
            Preview first
          </Link>
        }
      >
        <div className={styles.changes}>
          <div className={styles.changesHead}>
            {n} {n === 1 ? "change" : "changes"}
          </div>
          <ul className={styles.changesList}>
            {changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </Dialog>
      <Dialog
        open={dialog === "discard"}
        onOpenChange={(o) => {
          if (!o) setDialog(null);
        }}
        title="Discard your new order?"
        description="The homepage keeps its live order. Project drafts aren’t affected."
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        confirmVariant="danger"
        onConfirm={discard}
      />
      <UnconfirmedDialog
        open={unconfirmed !== null}
        count={unconfirmed ?? 0}
        busy={publishing}
        onCancel={() => {
          setUnconfirmed(null);
        }}
        onPublish={() => void publish(true)}
      />
      <ConflictDialog
        open={lay.conflict !== null || prof.conflict !== null}
        subject="The homepage"
        what="The homepage was edited on another device."
        theirs={lay.conflict ? "Homepage layout" : "Profile"}
        yours={lay.conflict ? "Homepage layout" : "Profile"}
        onKeepMine={() => {
          if (lay.conflict) lay.keepMine();
          if (prof.conflict) prof.keepMine();
        }}
        onLoadLatest={() => {
          if (lay.conflict) lay.loadLatest();
          if (prof.conflict) prof.loadLatest();
        }}
      />
    </div>
  );
}
