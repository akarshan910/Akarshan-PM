/**
 * The Website builder's live preview (05 · Website builder › Preview): the draft homepage drawn with
 * the public components, plus what visitors won't see when "Show hidden" is on (labelled
 * placeholders), draft cards at 75% with "DRAFT · NOT LIVE", and the selected section outlined in
 * #D61F33 with its name. Clicking a section selects it in the outline.
 */
import { useMemo } from "react";

import { PillNav } from "../../nav/PillNav";
import { HomeContext, legacyAnchors, SECTIONS } from "../../sections";
import { Inert } from "../Inert";
import styles from "./SitePreview.module.css";
import type { PublicContent } from "~/lib/content-source";
import { buildHomeView } from "~/lib/site";
import type { SiteLayout } from "~/lib/types";
import { sectionName, type Section } from "~/lib/studio/website";

function emptyText(s: Section): string {
  const n = sectionName(s);
  if (s.kind === "shelf") return `${n}: nothing published yet, so it’s hidden on the live site`;
  if (s.kind === "writing") return "Writing appears with your first post";
  return `${n} has nothing turned on`;
}

export function SitePreview({
  content,
  layout,
  draftSlugs,
  ghost,
  selected,
  onSelect,
  selectable = true,
}: {
  content: PublicContent;
  /** The draft layout, with hidden sections, in page order. */
  layout: SiteLayout;
  /** Addresses of draft projects drawn as cards ("Show drafts"). */
  draftSlugs: string[];
  ghost: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
  /** Off in Draft preview: no click-to-select layer, and the page stays interactive. */
  selectable?: boolean;
}) {
  const view = useMemo(() => buildHomeView(content), [content]);
  const shown = new Map(view.sections.map((s) => [s.id, s]));
  const context = useMemo(
    () => ({ anchors: legacyAnchors(view.sections), updatedAt: view.chrome.footer.updatedAt }),
    [view],
  );
  const heroId = view.sections.find((s) => s.kind === "hero")?.id;
  const draftCss = draftSlugs
    .filter((s) => /^[a-z0-9-]+$/.test(s))
    .map(
      (s) =>
        `a[href="/work/${s}"]{opacity:.75;position:relative}a[href="/work/${s}"]::after{content:"DRAFT · NOT LIVE";position:absolute;left:12px;top:12px;z-index:3;padding:4px 8px;background:#D61F33;color:#fff;font:600 11px/1 var(--fm,monospace);letter-spacing:.08em}`,
    )
    .join("");

  return (
    <HomeContext.Provider value={context}>
      {draftCss ? <style>{draftCss}</style> : null}
      <Inert when={selectable}>
        <PillNav
          links={view.chrome.nav}
          letsTalk={view.chrome.letsTalk}
          {...(heroId ? { heroId } : {})}
          contactId="contact"
          email={view.chrome.contact.email}
          linkedin={view.chrome.contact.linkedin}
          resume={view.chrome.contact.resume}
        />
      </Inert>
      <main id="main">
        {layout.sections.map((s) => {
          const v = shown.get(s.id);
          const name = sectionName(s);
          const isSel = selected === s.id;
          const ghostText = !s.visible ? `${name} is hidden` : v ? null : emptyText(s);
          if (!v && !ghost) return null;
          const Section = SECTIONS[s.kind];
          return (
            <div key={s.id} className={styles.psec} data-selected={isSel || undefined}>
              {selectable ? (
                <button
                  type="button"
                  className={styles.hit}
                  aria-label={`Edit ${name}`}
                  aria-pressed={isSel}
                  onClick={() => {
                    onSelect(s.id);
                  }}
                />
              ) : null}
              {isSel ? <span className={styles.tag}>{name}</span> : null}
              {v ? (
                <Inert when={selectable}>
                  <Section section={v} profile={view.profile} projects={view.projects} posts={view.posts} />
                </Inert>
              ) : (
                <div className={styles.ghost}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.ghostIco}>
                    <path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-2.8 3.6M6.6 6.6A17 17 0 002 12s3.6 7 10 7a9.6 9.6 0 004.4-1" />
                  </svg>
                  {ghostText}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </HomeContext.Provider>
  );
}
