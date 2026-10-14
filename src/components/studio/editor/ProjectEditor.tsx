/**
 * The project editor (05 · Project editor): one autosaved draft shared by the five tabs, the
 * draft layout for the shelf, the publish checklist, conflicts and the "?field=" deep links from
 * the dashboard and the publish dialog.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { useRepo, useStudio } from "../data";
import { useShell } from "../shell/ShellContext";
import { ConflictDialog } from "../states/ConflictDialog";
import { useToast } from "../Toast";
import { useAutosave, type Autosave } from "../useAutosave";
import { EditorFrame } from "./EditorFrame";
import { PublishDialog } from "./PublishDialog";
import { ACCENT_COLOURS } from "~/lib/accents";
import { projectChecks, projectIssues, type ProjectIssue } from "~/lib/studio/checks";
import { changedTabs as draftTabs, tabNames } from "~/lib/studio/diff";
import { changeLines, changedTabs, placement, publishButton } from "~/lib/studio/editor";
import { dayAndTime } from "~/lib/studio/format";
import type { EditorTabSlug } from "~/lib/studio/paths";
import { projectStatus } from "~/lib/studio/projects";
import type { DocRow, MediaRow, ProjectRow } from "~/lib/studio/repo";
import type { Img, ResolveImg } from "~/lib/published";
import type { Project, SiteLayout } from "~/lib/types";

export interface EditorData {
  row: ProjectRow;
  rows: ProjectRow[];
  layout: DocRow<SiteLayout>;
  media: MediaRow[];
  urls: Record<string, string>;
}

interface EditorApi {
  row: ProjectRow;
  draft: Project;
  update: (fn: (d: Project) => Project) => void;
  rows: ProjectRow[];
  layout: SiteLayout;
  updateLayout: (fn: (l: SiteLayout) => SiteLayout) => void;
  media: MediaRow[];
  setMedia: (fn: (m: MediaRow[]) => MediaRow[]) => void;
  urls: Record<string, string>;
  setUrl: (id: string, url: string) => void;
  resolve: ResolveImg;
  /** Shows a blocker's message on its field once the owner has tried to publish. */
  showErrors: boolean;
  issues: ProjectIssue[];
  placement: ReturnType<typeof placement>;
  autosave: Autosave<Project, ProjectRow>;
  /** Writes the address (URL & SEO), outside the draft document. */
  setRow: (row: ProjectRow) => void;
}

const Ctx = createContext<EditorApi | null>(null);

export function useEditor(): EditorApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("Editor tabs need the ProjectEditor above them.");
  return v;
}

export function mediaImg(row: MediaRow, url: string): Img {
  return {
    src: url,
    srcset: url ? `${url} ${row.width ?? 1600}w` : "",
    width: row.width ?? 1600,
    height: row.height ?? 1000,
    alt: row.decorative ? "" : (row.alt ?? ""),
    dominant: row.dominant ?? ACCENT_COLOURS.slate.ground,
    ...(row.focal ? { focal: row.focal } : {}),
  };
}

export function ProjectEditor({
  data,
  tab,
  children,
}: {
  data: EditorData;
  tab: EditorTabSlug;
  children: ReactNode;
}) {
  const repo = useRepo();
  const { cache } = useStudio();
  const { announce } = useShell();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState(data.rows);
  const [media, setMedia] = useState(data.media);
  const [urls, setUrls] = useState(data.urls);
  // ?publish=1 (from the Projects menu) opens the checklist straight away.
  const [dialog, setDialog] = useState(() => params.get("publish") === "1");
  const [publishing, setPublishing] = useState(false);
  const [showErrors, setShowErrors] = useState(() => params.get("publish") === "1");

  const autosave = useAutosave<Project, ProjectRow>({
    key: `project:${data.row.id}`,
    row: data.row,
    save: (d, v) => repo.projects.save(data.row.id, d, v),
    onSaved: (r) => {
      cache.set(`project:${r.id}`, r);
      cache.invalidate("projects");
      cache.invalidate("dashboard");
    },
  });
  const layout = useAutosave<SiteLayout, DocRow<SiteLayout>>({
    key: "layout",
    row: data.layout,
    save: (d, v) => repo.layout.save(d, v),
    onSaved: (r) => {
      cache.set("layout", r);
    },
  });

  const row = autosave.row;
  const draft = autosave.draft;
  const byId = useMemo(() => new Map(media.map((m) => [m.id, m])), [media]);
  const resolve: ResolveImg = (ref) => {
    const m = byId.get(ref.mediaId);
    return m ? mediaImg(m, urls[m.id] ?? "") : undefined;
  };
  const issues = projectIssues(draft, { slug: row.slug, media: (id) => byId.get(id) });
  const place = placement(layout.draft, rows, row.id);
  const offline = autosave.state === "offline";
  const status = projectStatus(row);
  const button = publishButton(row, offline);
  const dots = changedTabs(draft, row.published, resolve);
  const title = draft.overview.title.trim() || "Untitled project";

  // ?field= (the dashboard, the checklist) focuses a field.
  const wantPublish = params.get("publish") === "1";
  const field = params.get("field");
  useEffect(() => {
    if (!wantPublish) return;
    setParams(
      (p) => {
        p.delete("publish");
        return p;
      },
      { replace: true },
    );
  }, [wantPublish, setParams]);
  useEffect(() => {
    if (!field) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`f-${field}`);
      el?.focus();
      try {
        el?.scrollIntoView({ block: "center" });
      } catch {
        /* not in every environment */
      }
    }, 60);
    return () => {
      clearTimeout(t);
    };
  }, [field, tab]);

  const openPublish = () => {
    if (offline) {
      toast.show({ message: "You’re offline. Publish once you’re back online.", tone: "neutral" });
      return;
    }
    if (button.disabled) return;
    setShowErrors(true);
    setDialog(true);
  };

  const publish = async () => {
    if (issues.length > 0) return;
    setPublishing(true);
    await autosave.flush();
    await layout.flush();
    const result = await repo.publish({ action: "publish", kind: "project", id: row.id });
    setPublishing(false);
    if (!result.ok) {
      if (result.reason === "blocked") {
        toast.show({ message: result.issues.map((i) => i.message).join(" "), tone: "error" });
        return;
      }
      toast.show({
        message:
          result.reason === "offline"
            ? "You’re offline. Publish once you’re back online."
            : "Couldn’t publish. Your draft is safe.",
        tone: "error",
        action: { label: "Try again", onAction: () => void publish() },
      });
      return;
    }
    setDialog(false);
    const fresh = await repo.projects.get(row.id);
    if (fresh) {
      autosave.reset(fresh);
      cache.set(`project:${fresh.id}`, fresh);
    }
    setRows(await repo.projects.list());
    cache.invalidate("projects");
    cache.invalidate("dashboard");
    toast.show({
      message: result.deployed
        ? "Published. The live page updates within a minute."
        : "Published. The site will update on the next deploy",
      link: { label: "View live page ↗", href: `/work/${fresh?.publishedSlug ?? row.slug}` },
    });
    announce("Published.");
  };

  const api: EditorApi = {
    row,
    draft,
    update: autosave.update,
    rows,
    layout: layout.draft,
    updateLayout: layout.update,
    media,
    setMedia,
    urls,
    setUrl: (id, url) => {
      setUrls((u) => ({ ...u, [id]: url }));
    },
    resolve,
    showErrors,
    issues,
    placement: place,
    autosave,
    setRow: autosave.reset,
  };

  const conflict = autosave.conflict;
  return (
    <Ctx.Provider value={api}>
      <EditorFrame
        projectId={row.id}
        tab={tab}
        title={title}
        breadcrumb={["Projects", place.shelfName, place.volume].filter(Boolean).join(" · ")}
        published={row.published !== null}
        editsNotLive={status === "edits"}
        save={autosave.state === "saved" ? layout.state : autosave.state}
        savedLabel={autosave.savedLabel}
        onRetry={() => {
          autosave.retry();
          layout.retry();
        }}
        dots={dots}
        publish={button}
        onPublish={openPublish}
        lastPublished={
          row.publishedAt
            ? `Last published ${dayAndTime(row.publishedAt, new Date())
                .replace(/^Today/, "today")
                .replace(/^Yesterday/, "yesterday")}`
            : undefined
        }
      >
        {children}
      </EditorFrame>
      <PublishDialog
        open={dialog}
        onOpenChange={setDialog}
        projectId={row.id}
        title={title}
        firstPublish={!row.published}
        changes={changeLines(draft, row, resolve)}
        issues={issues}
        checks={projectChecks(draft)}
        publishing={publishing}
        onPublish={() => void publish()}
        onFix={(i) => {
          setDialog(false);
          const f =
            i.field.startsWith("chapter.") || i.field.startsWith("block.") || i.field.startsWith("outcome.")
              ? ""
              : i.field;
          void navigate(`/studio/projects/${row.id}/${i.tab}${f ? `?field=${f}` : ""}`);
        }}
      />
      <ConflictDialog
        open={conflict !== null}
        subject="This project"
        what={conflict ? `${tabNames(draftTabs(row.draft, conflict.draft))} changed on another device.` : ""}
        theirs={conflict ? tabNames(draftTabs(row.draft, conflict.draft)) : ""}
        yours={tabNames(draftTabs(row.draft, draft))}
        onKeepMine={autosave.keepMine}
        onLoadLatest={autosave.loadLatest}
      />
    </Ctx.Provider>
  );
}
