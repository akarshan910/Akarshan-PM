import { type CSSProperties, useMemo, useRef } from "react";

import { chapterAnchors, chapterNumber, type CaseStudyView, groupBlocks } from "~/lib/case-study";

import { cx } from "../cx";
import { Block } from "./blocks/Block";
import styles from "./CaseStudy.module.css";
import { CaseStudyHeader } from "./CaseStudyHeader";
import { CaseStudyHero } from "./CaseStudyHero";
import { CaseStudySummary } from "./CaseStudySummary";
import { ChapterBar, ChapterRail } from "./ChapterNav";
import { CaseStudyContext } from "./context";
import { useChapterSpy } from "./useChapterSpy";
import { useReveal } from "~/motion/reveal";

/**
 * /work/:slug (03 · Case study): the header, the hero media, the Summary, then the chapters with
 * their navigation (the rail on laptop, the chapter bar on iPad and phones) and the reading
 * progress. The page's accent is the project's: `--pa` and `--pg` are set here, on `<main>`.
 */
export function CaseStudyPage({ view }: { view: CaseStudyView }) {
  const { project } = view;
  const root = useRef<HTMLElement>(null);
  const article = useRef<HTMLElement>(null);
  const chapters = useMemo(() => {
    const ids = chapterAnchors(project.story.map((c) => c.title));
    return project.story.map((chapter, i) => ({
      chapter,
      anchor: ids[i] ?? `chapter-${chapterNumber(i)}`,
      title: chapter.title,
      groups: groupBlocks(chapter.blocks),
    }));
  }, [project.story]);
  const anchors = useMemo(() => chapters.map((c) => c.anchor), [chapters]);
  const current = useChapterSpy(root, article, anchors);
  const context = useMemo(() => ({ project }), [project]);
  const style = { "--pa": view.accent, "--pg": view.ground } as CSSProperties;

  return (
    <CaseStudyContext.Provider value={context}>
      <main id="main" ref={root} className={styles.page} style={style}>
        <div className={styles.progress} aria-hidden="true">
          <span />
        </div>
        <CaseStudyHeader view={view} />
        <CaseStudyHero view={view} />
        <CaseStudySummary project={project} />
        {chapters.length > 0 ? (
          <>
            <ChapterBar chapters={chapters} current={current} />
            <div className={cx("wrap", styles.wrapped, styles.body)}>
              <ChapterRail chapters={chapters} current={current} />
              <article ref={article} className={styles.article}>
                {chapters.map(({ chapter, anchor, groups }, i) => (
                  <Chapter key={chapter.id} anchor={anchor} index={i} title={chapter.title} groups={groups} />
                ))}
              </article>
            </div>
          </>
        ) : null}
      </main>
    </CaseStudyContext.Provider>
  );
}

/**
 * One chapter. Below the fold it reveals as it scrolls in (M-REVEAL): the number, the title, then
 * its blocks, 80ms apart.
 */
function Chapter({
  anchor,
  index,
  title,
  groups,
}: {
  anchor: string;
  index: number;
  title: string;
  groups: ReturnType<typeof groupBlocks>;
}) {
  const ref = useReveal<HTMLElement>({ blocks: ":scope > span, :scope > h2, :scope > div > *" });
  return (
    <section
      ref={ref}
      id={anchor}
      data-chapter={chapterNumber(index)}
      className={styles.chapter}
      aria-labelledby={`${anchor}-t`}
    >
      <span className={styles.chn} aria-hidden="true">
        {chapterNumber(index)}
      </span>
      <h2 id={`${anchor}-t`} className={styles.cht} tabIndex={-1}>
        {title}
      </h2>
      <div className={styles.blocks}>
        {groups.map((group) => (
          <Block key={group.kind === "boxes" ? group.id : group.block.id} group={group} />
        ))}
      </div>
    </section>
  );
}
