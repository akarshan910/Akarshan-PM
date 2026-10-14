import { useQuery } from "~/components/studio/data";
import { ProfileEditor } from "~/components/studio/profile/ProfileEditor";
import { LoadError } from "~/components/studio/states/LoadError";
import { studioMeta } from "~/lib/studio/paths";

export const meta = () => studioMeta("Profile & facts");

export default function StudioProfile() {
  const q = useQuery(
    "profile-screen",
    async (r) => {
      const [profile, layout, media] = await Promise.all([r.profile.get(), r.layout.get(), r.media.list()]);
      return { profile, layout, media };
    },
    { fresh: true },
  );
  if (q.status === "loading")
    return <main aria-busy="true" aria-label="Loading your profile" style={{ flex: 1 }} />;
  if (q.status === "error")
    return (
      <main style={{ padding: "28px clamp(20px, 3vw, 40px)" }}>
        <LoadError title="Couldn’t load your profile" onRetry={q.refetch} />
      </main>
    );
  return <ProfileEditor data={q.data} />;
}
