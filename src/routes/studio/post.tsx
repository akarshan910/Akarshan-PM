import { useParams } from "react-router";

import { useQuery } from "~/components/studio/data";
import { LoadError } from "~/components/studio/states/LoadError";
import { ScreenSkeleton } from "~/components/studio/states/ScreenSkeleton";
import { PostEditor } from "~/components/studio/writing/PostEditor";
import { studioMeta } from "~/lib/studio/paths";

export const meta = () => studioMeta("Writing");

export default function StudioPost() {
  const { id = "" } = useParams();
  const q = useQuery(
    `post-screen:${id}`,
    async (r) => {
      const [row, profile, media] = await Promise.all([r.posts.get(id), r.profile.get(), r.media.list()]);
      return row ? { row, profile: profile.draft, media } : null;
    },
    { fresh: true },
  );
  if (q.status === "loading") return <ScreenSkeleton label="Loading the post" variant="editor" />;
  if (q.status === "error" || q.data === null)
    return (
      <main style={{ padding: "24px clamp(20px, 3vw, 36px)" }}>
        <LoadError
          title={q.status === "error" ? "Couldn’t load this post" : "This post doesn’t exist"}
          text={
            q.status === "error" ? undefined : "It may have been deleted. Your other posts are in Writing."
          }
          onRetry={q.refetch}
        />
      </main>
    );
  return <PostEditor key={id} row={q.data.row} profile={q.data.profile} media={q.data.media} />;
}
