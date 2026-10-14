import { useQuery } from "~/components/studio/data";
import { LoadError } from "~/components/studio/states/LoadError";
import { WebsiteBuilder } from "~/components/studio/website/WebsiteBuilder";
import { studioMeta } from "~/lib/studio/paths";

export const meta = () => studioMeta("Website");

/** The builder keeps the icon rail on laptops (StudioSite). */
export const handle = { studioNav: "rail" };

export default function StudioWebsite() {
  const q = useQuery(
    "website-screen",
    async (r) => {
      const [profile, layout, projects, posts, media] = await Promise.all([
        r.profile.get(),
        r.layout.get(),
        r.projects.list(),
        r.posts.list(),
        r.media.list(),
      ]);
      const urls: Record<string, string> = {};
      await Promise.all(media.map(async (m) => (urls[m.id] = await r.media.url(m, "960"))));
      return { profile, layout, projects, posts, media, urls };
    },
    { fresh: true },
  );
  if (q.status === "loading")
    return <main aria-busy="true" aria-label="Loading the website builder" style={{ flex: 1 }} />;
  if (q.status === "error")
    return (
      <main style={{ padding: "28px clamp(20px, 3vw, 40px)" }}>
        <LoadError title="Couldn’t load your homepage" onRetry={q.refetch} />
      </main>
    );
  return <WebsiteBuilder data={q.data} />;
}
