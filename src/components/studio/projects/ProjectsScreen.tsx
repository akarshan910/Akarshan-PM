/**
 * The Projects screen's behaviour: layout edits through autosave, the row actions with their
 * toasts and Undo (05 · Projects), and "Publish layout", which runs the site publish.
 */
import { useState } from "react";
import { useNavigate } from "react-router";

import { useRepo, useStudio } from "../data";
import { useShell } from "../shell/ShellContext";
import { ConflictDialog } from "../states/ConflictDialog";
import { UnconfirmedDialog } from "../states/UnconfirmedDialog";
import { useToast } from "../Toast";
import { useAutosave } from "../useAutosave";
import { ProjectsList } from "./ProjectsList";
import { restoreShelfOrder, shelfOrderChanged } from "~/lib/studio/diff";
import { createProject } from "~/lib/studio/projects";
import { copySlug, insertAfter, moveOnShelf, removeFromShelves } from "~/lib/studio/projects-list";
import type { DocRow, ProjectRow } from "~/lib/studio/repo";
import type { SiteLayout } from "~/lib/types";

export function ProjectsScreen({
  rows: initial,
  layout: layoutRow,
}: {
  rows: ProjectRow[];
  layout: DocRow<SiteLayout>;
}) {
  const repo = useRepo();
  const { cache } = useStudio();
  const { announce } = useShell();
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState(initial);
  const [publishing, setPublishing] = useState(false);
  const [confirmCount, setConfirmCount] = useState(0);
  const [published, setPublished] = useState(layoutRow.published);

  const layout = useAutosave<SiteLayout, DocRow<SiteLayout>>({
    key: "layout",
    row: layoutRow,
    save: (d, v) => repo.layout.save(d, v),
    onSaved: (r) => {
      cache.set("layout", r);
    },
  });

  const refreshRows = async () => {
    const next = await repo.projects.list();
    setRows(next);
    cache.set("projects", next);
    cache.invalidate("dashboard");
  };

  const changed = shelfOrderChanged(layout.draft, published);

  const publishSite = async (confirmUnconfirmed: boolean) => {
    setPublishing(true);
    await layout.flush();
    const result = await repo.publish({ action: "publish", kind: "site", confirmUnconfirmed });
    setPublishing(false);
    if (result.ok) {
      setConfirmCount(0);
      const fresh = await repo.layout.get();
      setPublished(fresh.published);
      layout.reset(fresh);
      cache.set("layout", fresh);
      toast.show({ message: "Homepage layout is live." });
      announce("Homepage layout is live.");
      return;
    }
    if (result.reason === "needs-confirm") {
      setConfirmCount(result.unconfirmed.length);
      return;
    }
    toast.show({
      message:
        result.reason === "offline"
          ? "You’re offline. Publish once you’re back online."
          : "Couldn’t publish. Try again.",
      tone: "error",
    });
  };

  const duplicate = async (row: ProjectRow, shelfId: string) => {
    const copy = structuredClone(row.draft);
    copy.overview.title = `Copy of ${row.draft.overview.title}`.slice(0, 80);
    const created = await repo.projects.create(
      copy,
      copySlug(
        row.slug,
        rows.map((r) => r.slug),
      ),
    );
    layout.update((d) => insertAfter(d, shelfId, row.id, created.id));
    await refreshRows();
    toast.show({
      message: `Duplicated as a draft: Copy of ${row.draft.overview.title}.`,
      action: {
        label: "Undo",
        onAction: () => {
          void repo.publish({ action: "delete", kind: "project", id: created.id }).then(async () => {
            layout.update((d) => removeFromShelves(d, created.id));
            await refreshRows();
            toast.show({ message: "Copy removed." });
          });
        },
      },
    });
    announce("Duplicated as a draft.");
  };

  const unpublish = async (row: ProjectRow) => {
    const title = row.draft.overview.title;
    const r = await repo.publish({ action: "unpublish", kind: "project", id: row.id });
    if (!r.ok) {
      toast.show({ message: "Couldn’t unpublish. Try again.", tone: "error" });
      return;
    }
    await refreshRows();
    toast.show({
      message: `“${title}” is off the live site and back to draft.`,
      action: {
        label: "Undo",
        onAction: () => {
          void repo.publish({ action: "restore", kind: "project", id: row.id }).then(async (again) => {
            await refreshRows();
            toast.show(
              again.ok
                ? { message: `“${title}” is live again.` }
                : { message: "Couldn’t publish it again. Open it to see why.", tone: "error" },
            );
          });
        },
      },
    });
    announce(`${title} unpublished.`);
  };

  const remove = async (row: ProjectRow) => {
    const title = row.draft.overview.title || "Untitled project";
    await repo.publish({ action: "delete", kind: "project", id: row.id });
    await refreshRows();
    toast.show({
      message: `Deleted “${title}”.`,
      action: {
        label: "Undo",
        onAction: () => {
          void repo.publish({ action: "restore", kind: "project", id: row.id }).then(async () => {
            await refreshRows();
            toast.show({ message: `Restored “${title}”.` });
            announce("Project restored.");
          });
        },
      },
    });
    announce("Project deleted.");
  };

  return (
    <>
      <ProjectsList
        layout={layout.draft}
        rows={rows}
        now={new Date()}
        layoutChanged={changed}
        publishing={publishing}
        announce={announce}
        onMove={(shelf, id, to) => {
          layout.update((d) => moveOnShelf(d, shelf, id, to));
        }}
        onStar={(shelf, id) => {
          layout.update((d) => moveOnShelf(d, shelf, id, 0));
        }}
        onDuplicate={(row, shelf) => void duplicate(row, shelf)}
        onUnpublish={(row) => void unpublish(row)}
        onDelete={(row) => void remove(row)}
        onDiscard={() => {
          if (!published) return;
          layout.update((d) => restoreShelfOrder(d, published));
          announce("Layout changes discarded.");
        }}
        onPublishLayout={() => void publishSite(false)}
        onNewProject={(shelfId) => {
          void layout
            .flush()
            .then(async () => {
              const row = await createProject(repo, shelfId);
              const fresh = await repo.layout.get();
              layout.reset(fresh);
              cache.invalidate("projects");
              cache.invalidate("dashboard");
              void navigate(`/studio/projects/${row.id}/overview`);
            })
            .catch(() => {
              toast.show({ message: "Couldn’t create the project. Try again.", tone: "error" });
            });
        }}
      />
      <UnconfirmedDialog
        open={confirmCount > 0}
        count={confirmCount}
        busy={publishing}
        onCancel={() => {
          setConfirmCount(0);
        }}
        onPublish={() => void publishSite(true)}
      />
      <ConflictDialog
        open={layout.conflict !== null}
        subject="The homepage"
        what="The homepage layout was edited on another device."
        theirs="Homepage layout"
        yours="Project order"
        onKeepMine={layout.keepMine}
        onLoadLatest={layout.loadLatest}
      />
    </>
  );
}
