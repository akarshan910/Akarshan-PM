import { useQuery } from "~/components/studio/data";
import { MediaLibrary } from "~/components/studio/media/MediaLibrary";
import { LoadError } from "~/components/studio/states/LoadError";
import { ScreenSkeleton } from "~/components/studio/states/ScreenSkeleton";
import type { MediaUse } from "~/lib/studio/repo";
import { studioMeta } from "~/lib/studio/paths";

export const meta = () => studioMeta("Media");

export default function StudioMedia() {
  const q = useQuery(
    "media-screen",
    async (r) => {
      const [all, storage] = await Promise.all([r.media.list(), r.media.storageUsed()]);
      // Video posters (poster-*.jpg) are made and managed by publishing, so they stay out of the library.
      const rows = all.filter((m) => !m.filename.startsWith("poster-"));
      const uses: Record<string, MediaUse[]> = {};
      await Promise.all(
        rows.map(async (m) => {
          uses[m.id] = await r.media.uses(m.id);
        }),
      );
      return { rows, uses, storage };
    },
    { fresh: true },
  );
  if (q.status === "loading") return <ScreenSkeleton label="Loading media" />;
  if (q.status === "error")
    return (
      <main style={{ padding: "28px clamp(20px, 3vw, 40px)" }}>
        <LoadError title="Couldn’t load your media" onRetry={q.refetch} />
      </main>
    );
  return <MediaLibrary rows={q.data.rows} uses={q.data.uses} storage={q.data.storage} />;
}
