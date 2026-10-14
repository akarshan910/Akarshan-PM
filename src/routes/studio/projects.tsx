import { useQuery } from "~/components/studio/data";
import { ProjectsSkeleton } from "~/components/studio/projects/ProjectsList";
import { ProjectsScreen } from "~/components/studio/projects/ProjectsScreen";
import { LoadError } from "~/components/studio/states/LoadError";
import { studioMeta } from "~/lib/studio/paths";

export const meta = () => studioMeta("Projects");

export default function StudioProjects() {
  const q = useQuery(
    "projects-screen",
    async (r) => {
      const [rows, layout] = await Promise.all([r.projects.list(), r.layout.get()]);
      return { rows, layout };
    },
    { fresh: true },
  );
  if (q.status === "loading") return <ProjectsSkeleton />;
  if (q.status === "error")
    return (
      <main style={{ padding: "28px clamp(20px, 3vw, 40px) 48px" }}>
        <LoadError title="Couldn’t load your projects" onRetry={q.refetch} />
      </main>
    );
  return <ProjectsScreen rows={q.data.rows} layout={q.data.layout} />;
}
