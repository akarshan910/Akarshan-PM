/**
 * One public page drawn inside a preview frame: the homepage, a case study or a post, with the
 * site's nav and footer, from the given content. Links stay inside the preview (a click on one
 * does nothing) so the owner never leaves the draft by accident.
 */
import type { MouseEvent, ReactNode } from "react";

import { CaseStudyNeighbours } from "../../case-study/CaseStudyNeighbours";
import { CaseStudyPage } from "../../case-study/CaseStudyPage";
import { PageFooter } from "../../footer/PageFooter";
import { SiteFooter } from "../../footer/SiteFooter";
import { PillNav } from "../../nav/PillNav";
import { formatDate } from "../../sections/Footer";
import { PostPage } from "../../writing/PostPage";
import { SitePreview } from "./SitePreview";
import { caseStudyView } from "~/lib/case-study";
import type { PublicContent } from "~/lib/content-source";
import { buildChrome } from "~/lib/site";
import type { PreviewKind } from "~/lib/studio/preview";
import { postView } from "~/lib/writing";

const stay = (e: MouseEvent) => {
  const a = (e.target as Element).closest("a[href]");
  if (a && a.getAttribute("target") !== "_blank" && !a.getAttribute("href")?.startsWith("#"))
    e.preventDefault();
};

export function PublicPage({
  kind,
  content,
  slug,
  css,
  notes,
}: {
  kind: PreviewKind;
  content: PublicContent;
  slug: string;
  /** Extra CSS for the frame ("Highlight changes"). */
  css?: string;
  /** "Studio only: …" lines at the end of the page. */
  notes?: string[];
}) {
  const chrome = buildChrome(content);
  let page: ReactNode = null;
  if (kind === "site") {
    page = (
      <SitePreview
        content={content}
        layout={content.layout}
        draftSlugs={[]}
        ghost={false}
        selected={null}
        selectable={false}
        onSelect={() => undefined}
      />
    );
  } else if (kind === "project") {
    const view = caseStudyView(content, slug);
    const date = formatDate(content.updatedAt);
    page = view ? (
      <>
        <PillNav
          links={chrome.nav}
          letsTalk={chrome.letsTalk}
          email={chrome.contact.email}
          linkedin={chrome.contact.linkedin}
          resume={chrome.contact.resume}
        />
        <CaseStudyPage view={view} />
        <CaseStudyNeighbours view={view} />
        <SiteFooter
          year={date?.year ?? new Date().getFullYear()}
          name={view.name}
          back={{ href: "/work", label: "Back to all work" }}
        />
      </>
    ) : null;
  } else {
    const view = postView(content, slug);
    page = view ? (
      <>
        <PillNav
          links={chrome.nav}
          letsTalk={chrome.letsTalk}
          email={chrome.contact.email}
          linkedin={chrome.contact.linkedin}
          resume={chrome.contact.resume}
        />
        <PostPage view={view} />
        <PageFooter footer={chrome.footer} />
      </>
    ) : null;
  }
  return (
    <div onClickCapture={stay}>
      {css ? <style>{css}</style> : null}
      {page}
      {notes?.length ? (
        <div style={{ margin: "30px auto 48px", maxWidth: 1152, padding: "0 20px" }}>
          {notes.map((n) => (
            <p
              key={n}
              style={{
                margin: "0 0 10px",
                padding: "16px 18px",
                border: "1.5px dashed rgba(245,165,36,.6)",
                color: "#F5C66B",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {n}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
