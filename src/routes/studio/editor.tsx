import { Navigate, useParams } from "react-router";

import { useQuery } from "~/components/studio/data";
import { OverviewTab } from "~/components/studio/editor/OverviewTab";
import { ProjectEditor, type EditorData } from "~/components/studio/editor/ProjectEditor";
import { EditorTabs } from "~/components/studio/editor/tabs";
import { LoadError } from "~/components/studio/states/LoadError";
import { EDITOR_TABS, studioMeta, type EditorTabSlug } from "~/lib/studio/paths";

/** The editors keep the 72px rail on laptops, and phones trade the tab bar for Preview and Publish. */
export const meta = () => studioMeta("Project");

export const handle = { studioNav: "rail", studioTabbar: false };

export default function StudioEditor() {
  const { id = "", tab } = useParams();
  const q = useQuery(
    `editor:${id}`,
    async (r): Promise<EditorData | null> => {
      const [row, rows, layout, media, profile] = await Promise.all([
        r.projects.get(id),
        r.projects.list(),
        r.layout.get(),
        r.media.list(),
        r.profile.get(),
      ]);
      if (!row) return null;
      const urls: Record<string, string> = {};
      await Promise.all(media.map(async (m) => (urls[m.id] = await r.media.url(m, "960"))));
      return { row, rows, layout, media, urls, ownerName: profile.draft.name };
    },
    { fresh: true },
  );

  if (!tab || !(EDITOR_TABS as readonly string[]).includes(tab))
    return <Navigate to={`/studio/projects/${id}/overview`} replace />;
  if (q.status === "loading")
    return <main aria-busy="true" aria-label="Loading the project" style={{ flex: 1 }} />;
  if (q.status === "error" || q.data === null)
    return (
      <main style={{ padding: "28px clamp(20px, 3vw, 40px) 48px" }}>
        <LoadError
          title={q.status === "error" ? "Couldn’t load this project" : "This project doesn’t exist"}
          text={
            q.status === "error"
              ? undefined
              : "It may have been deleted. Your other projects are in Projects."
          }
          onRetry={q.refetch}
        />
      </main>
    );
  const t = tab as EditorTabSlug;
  return (
    <ProjectEditor key={id} data={q.data} tab={t}>
      {t === "overview" ? <OverviewTab /> : <EditorTabs tab={t} />}
    </ProjectEditor>
  );
}
