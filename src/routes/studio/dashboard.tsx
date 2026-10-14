import { useNavigate } from "react-router";

import { DashboardSkeleton, Dashboard } from "~/components/studio/dashboard/Dashboard";
import { useQuery, useRepo, useStudio } from "~/components/studio/data";
import { useShell } from "~/components/studio/shell/ShellContext";
import { useToast } from "~/components/studio/Toast";
import { LoadError } from "~/components/studio/states/LoadError";
import { buildDashboard } from "~/lib/studio/dashboard";
import { createProject } from "~/lib/studio/projects";

export default function StudioDashboard() {
  const repo = useRepo();
  const { cache } = useStudio();
  const navigate = useNavigate();
  const shell = useShell();
  const toast = useToast();
  const q = useQuery(
    "dashboard",
    async (r) => {
      const [projects, posts, profile, layout, linkChecks] = await Promise.all([
        r.projects.list(),
        r.posts.list(),
        r.profile.get(),
        r.layout.get(),
        r.linkChecks(),
      ]);
      return {
        model: buildDashboard({ projects, posts, profile, layout, linkChecks }),
        name: profile.draft.name,
      };
    },
    { fresh: true },
  );

  if (q.status === "loading") return <DashboardSkeleton />;
  if (q.status === "error") return <LoadError title="Couldn’t load the dashboard" onRetry={q.refetch} />;

  const newProject = () => {
    createProject(repo).then(
      (row) => {
        cache.invalidate("projects");
        cache.invalidate("dashboard");
        void navigate(`/studio/projects/${row.id}/overview`);
      },
      () => {
        toast.show({
          message: "Couldn’t create the project. Try again.",
          tone: "error",
          action: { label: "Try again", onAction: newProject },
        });
      },
    );
  };

  return (
    <Dashboard
      model={q.data.model}
      name={q.data.name}
      now={new Date()}
      email={shell.session.email}
      onNewProject={newProject}
      onSignOut={shell.signOut}
    />
  );
}
