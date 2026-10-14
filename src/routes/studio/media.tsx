import { useQuery } from "~/components/studio/data";
import { MediaLibrary } from "~/components/studio/media/MediaLibrary";
import { LoadError } from "~/components/studio/states/LoadError";
import type { MediaUse } from "~/lib/studio/repo";
import { studioMeta } from "~/lib/studio/paths";

export const meta = () => studioMeta("Media");

export default function StudioMedia() {
  const q = useQuery(
    "media-screen",
    async (r) => {
      const [rows, storage] = await Promise.all([r.media.list(), r.media.storageUsed()]);
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
  if (q.status === "loading") return <main aria-busy="true" aria-label="Loading media" style={{ flex: 1 }} />;
  if (q.status === "error")
    return (
      <main style={{ padding: "28px clamp(20px, 3vw, 40px)" }}>
        <LoadError title="Couldn’t load your media" onRetry={q.refetch} />
      </main>
    );
  return <MediaLibrary rows={q.data.rows} uses={q.data.uses} storage={q.data.storage} />;
}
