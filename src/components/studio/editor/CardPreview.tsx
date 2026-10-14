/**
 * "Homepage card · live preview" (EditorOverview, EditorVisuals): the draft drawn with the public
 * StandardCard, in the site's dark tokens, so the owner sees exactly what visitors will.
 */
import { StandardCard } from "../../cards/ProjectCard";
import { toCardData } from "../../sections/cards";
import { Inert } from "../Inert";
import { publishProject, type ResolveImg } from "~/lib/published";
import type { Project } from "~/lib/types";
import styles from "./CardPreview.module.css";

export function CardPreview({
  draft,
  slug,
  volume,
  resolve,
}: {
  draft: Project;
  slug: string;
  volume?: string | undefined;
  resolve: ResolveImg;
}) {
  const project = publishProject(
    {
      ...draft,
      overview: {
        ...draft.overview,
        title: draft.overview.title.trim() || "Untitled project",
        summary: draft.overview.summary.trim() || "Add a one-line summary.",
      },
    },
    resolve,
  );
  const data = toCardData({
    id: slug,
    slug,
    listed: true,
    publishedAt: "",
    firstPublishedAt: "",
    project,
    ...(volume ? { volume } : {}),
  });
  return (
    <div className={`site ${styles.pv}`}>
      <Inert className={styles.inner}>
        <StandardCard project={{ ...data, href: "#" }} lazy={false} />
      </Inert>
    </div>
  );
}
