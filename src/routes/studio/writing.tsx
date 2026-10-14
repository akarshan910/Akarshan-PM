import { useNavigate } from "react-router";

import { useQuery, useRepo, useStudio } from "~/components/studio/data";
import { LoadError } from "~/components/studio/states/LoadError";
import { useToast } from "~/components/studio/Toast";
import { WritingList } from "~/components/studio/writing/WritingList";
import { newPost } from "~/lib/defaults";
import { nextUntitledSlug } from "~/lib/defaults";
import { resumeIdeas } from "~/lib/studio/writing";
import { slugify } from "~/lib/v0";
import { studioMeta } from "~/lib/studio/paths";

export const meta = () => studioMeta("Writing");

export default function StudioWriting() {
  const repo = useRepo();
  const { cache } = useStudio();
  const toast = useToast();
  const navigate = useNavigate();
  const q = useQuery(
    "posts-screen",
    async (r) => {
      const [rows, profile] = await Promise.all([r.posts.list(), r.profile.get()]);
      return { rows, profile: profile.draft };
    },
    { fresh: true },
  );
  if (q.status === "loading") return <main aria-busy="true" aria-label="Loading posts" style={{ flex: 1 }} />;
  if (q.status === "error")
    return (
      <main style={{ padding: "24px clamp(20px, 3vw, 36px)" }}>
        <LoadError title="Couldn’t load your posts" onRetry={q.refetch} />
      </main>
    );
  const { rows, profile } = q.data;

  const create = (title: string, announce?: string) => {
    const draft = { ...newPost(), title };
    const taken = rows.map((r) => r.slug);
    const base = slugify(title).slice(0, 80);
    const slug = base && !taken.includes(base) ? base : nextUntitledSlug(taken);
    repo.posts.create(draft, slug).then(
      (row) => {
        cache.invalidate("posts-screen");
        if (announce) toast.show({ message: announce, tone: "neutral" });
        void navigate(`/studio/writing/${row.id}`);
      },
      () => {
        toast.show({ message: "Couldn’t create the post. Try again.", tone: "error" });
      },
    );
  };

  return (
    <WritingList
      rows={rows}
      ideas={resumeIdeas(
        profile,
        rows.map((r) => r.draft.title),
      )}
      now={new Date()}
      onNewPost={() => {
        create("");
      }}
      onStartIdea={(title) => {
        create(title, "Draft started.");
      }}
    />
  );
}
