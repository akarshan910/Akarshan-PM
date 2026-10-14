import { useParams } from "react-router";

import { useQuery } from "~/components/studio/data";
import { DraftPreview } from "~/components/studio/preview/DraftPreview";
import { mediaImg } from "~/components/studio/editor/ProjectEditor";
import { LoadError } from "~/components/studio/states/LoadError";
import { ScreenSkeleton } from "~/components/studio/states/ScreenSkeleton";
import { studioMeta } from "~/lib/studio/paths";
import type { PreviewKind } from "~/lib/studio/preview";

export const meta = () => studioMeta("Draft preview");

/** The preview has its own bar, so the Studio nav steps aside. */
export const handle = { studioChrome: false };

const KINDS = new Set<PreviewKind>(["project", "post", "site"]);

export default function StudioPreview() {
  const { kind = "", id = "" } = useParams();
  const k = KINDS.has(kind as PreviewKind) ? (kind as PreviewKind) : null;
  const q = useQuery(
    `preview:${kind}:${id}`,
    async (r) => {
      const [profile, layout, projects, posts, media] = await Promise.all([
        r.profile.get(),
        r.layout.get(),
        r.projects.list(),
        r.posts.list(),
        r.media.list(),
      ]);
      const urls: Record<string, string> = {};
      await Promise.all(media.map(async (m) => (urls[m.id] = await r.media.url(m, "1600"))));
      const byId = new Map(media.map((m) => [m.id, m]));
      return {
        profile,
        layout,
        projects,
        posts,
        now: new Date().toISOString(),
        resolve: (ref: { mediaId: string }) => {
          const m = byId.get(ref.mediaId);
          return m ? mediaImg(m, urls[m.id] ?? "") : undefined;
        },
      };
    },
    { fresh: true },
  );
  const missing =
    !k ||
    (q.status === "ready" &&
      ((k === "project" && !q.data.projects.some((p) => p.id === id)) ||
        (k === "post" && !q.data.posts.some((p) => p.id === id))));
  if (missing || q.status === "error")
    return (
      <main style={{ padding: "28px clamp(20px, 3vw, 40px)" }}>
        <LoadError
          title={q.status === "error" ? "Couldn’t load the preview" : "There’s nothing to preview here"}
          onRetry={q.refetch}
        />
      </main>
    );
  if (q.status === "loading") return <ScreenSkeleton label="Loading the preview" variant="preview" />;
  return <DraftPreview kind={k} id={id} source={q.data} />;
}
