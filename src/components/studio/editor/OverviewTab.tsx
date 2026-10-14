/**
 * Overview (05 · Overview; EditorOverview): basics, the case-study summary, "Your part in it" and
 * links, with the homepage card live preview on the right.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { cx } from "../../cx";
import { Segmented } from "../Controls";
import { useRepo } from "../data";
import { TextArea, TextField } from "../Field";
import { StudioIcon } from "../StudioIcon";
import { TopicPicker, type TopicUse } from "../TopicPicker";
import { CardPreview } from "./CardPreview";
import { EditorCols, Sec } from "./EditorFrame";
import styles from "./OverviewTab.module.css";
import { useEditor } from "./ProjectEditor";
import { SOFT_LIMITS } from "~/lib/schemas";
import { shelves } from "~/lib/studio/projects";
import { insertAfter, removeFromShelves } from "~/lib/studio/projects-list";
import type { Project } from "~/lib/types";

type Overview = Project["overview"];

const KINDS = [
  { value: "shipped", label: "Shipped" },
  { value: "study", label: "Strategy study" },
  { value: "prototype", label: "Prototype" },
] as const;

export function OverviewTab() {
  const e = useEditor();
  const repo = useRepo();
  const o = e.draft.overview;
  const [vocab, setVocab] = useState<TopicUse[]>([]);
  useEffect(() => {
    let live = true;
    void repo.topics("project").then((t) => {
      if (live) setVocab(t.map((x) => ({ name: x.topic, uses: x.uses })));
    });
    return () => {
      live = false;
    };
  }, [repo]);

  const set = <K extends keyof Overview>(k: K, v: Overview[K]) => {
    e.update((d) => ({ ...d, overview: { ...d.overview, [k]: v } }));
  };
  const setText =
    (
      k:
        "title" | "company" | "cardLabel" | "summary" | "problem" | "proposal" | "role" | "timeline" | "team",
    ) =>
    (ev: { target: { value: string } }) => {
      const v = ev.target.value;
      e.update((d) => {
        // Optional fields are removed when emptied, so they hide on the live page (06).
        const optional = k !== "title" && k !== "company" && k !== "summary";
        const overview =
          v === "" && optional
            ? (Object.fromEntries(Object.entries(d.overview).filter(([key]) => key !== k)) as Overview)
            : { ...d.overview, [k]: v };
        return { ...d, overview };
      });
    };

  const titleErr =
    e.showErrors && !o.title.trim()
      ? "Add a title. It’s used on the card, the page and in search."
      : undefined;
  const sumOver = o.summary.length > SOFT_LIMITS.summary;
  const sumErr = sumOver
    ? "Trim to 140 characters so it fits on the card."
    : e.showErrors && !o.summary.trim()
      ? "Add a summary. The card and search results need it."
      : undefined;
  const companyErr = e.showErrors && !o.company.trim() ? "Add the company or client." : undefined;
  const prdBad = Boolean(o.prdUrl) && !/^https:\/\//.test(o.prdUrl ?? "");
  const empty = [o.role, o.timeline, o.team].filter((x) => !x?.trim()).length;
  const shelfList = shelves(e.layout);
  const shelfId = e.placement.shelfId;
  const hero = e.draft.visuals.hero;
  const headline = e.draft.outcomes.find((x) => x.id === e.draft.headlineOutcomeId);

  const moveShelf = (to: string) => {
    if (to === shelfId) return;
    e.updateLayout((l) => insertAfter(removeFromShelves(l, e.row.id), to, null, e.row.id));
  };

  const preview = (
    <CardPreview draft={e.draft} slug={e.row.slug} volume={e.placement.volume} resolve={e.resolve} />
  );

  return (
    <EditorCols
      asideLabel="Live card preview"
      sheet={
        <details className={cx("card", styles.sheet)}>
          <summary className={styles.sheetHead}>
            <span className={styles.sheetThumb} aria-hidden="true" />
            <span className={styles.sheetText}>
              <strong>Card preview</strong>
              <span>How it looks on your homepage</span>
            </span>
            <StudioIcon name="chevron" />
          </summary>
          <div className={styles.sheetBody}>{preview}</div>
        </details>
      }
      aside={
        <>
          <div className={styles.pvHead}>
            <span className="mono">Homepage card · live preview</span>
            <span className={styles.pvNote}>Updates as you type</span>
          </div>
          {preview}
          <div className={cx("card", styles.where)}>
            <div className={styles.whereTitle}>Where this appears</div>
            <div className={styles.whereText}>
              {shelfId
                ? `Homepage, ${e.placement.shelfName} shelf, position ${String(e.placement.position).padStart(2, "0")}`
                : "Not on a homepage shelf"}{" "}
              · the page header · search and link previews (until you set them in URL & SEO).
            </div>
            {headline ? (
              <Link to={`/studio/projects/${e.row.id}/outcomes`} className={styles.u}>
                The {headline.value} headline comes from Outcomes
              </Link>
            ) : null}
          </div>
        </>
      }
    >
      <Sec
        id="s-basics"
        title="Basics"
        sub="What visitors see first: on the homepage card, at the top of the page and in search results."
      >
        <div className={styles.fld}>
          <TextField
            id="f-title"
            label="Title"
            required
            value={o.title}
            onChange={setText("title")}
            hint="Sentence case reads best. Keep it under 60 characters."
            error={titleErr}
            counter={{ limit: SOFT_LIMITS.projectTitle }}
            maxLength={80}
          />
        </div>
        <div className={styles.two}>
          <div className={styles.fld}>
            <TextField
              id="f-company"
              label="Company or client"
              required
              value={o.company}
              onChange={setText("company")}
              error={companyErr}
              maxLength={60}
            />
          </div>
          <div className={styles.fld}>
            <TextField
              id="f-cardLabel"
              label="Card label"
              value={o.cardLabel ?? ""}
              onChange={setText("cardLabel")}
              hint="Shown after the company, in small caps."
              maxLength={40}
            />
          </div>
        </div>
        <div className={styles.fld}>
          <TextArea
            id="f-summary"
            label="One-line summary"
            required
            value={o.summary}
            onChange={setText("summary")}
            hint="The card’s summary and the default search description. Say what you built and why."
            error={sumErr}
            counter={{ limit: SOFT_LIMITS.summary, warnAbove: 120 }}
          />
        </div>
        <div className={styles.two}>
          <div className={styles.fld}>
            {shelfList.length > 0 ? (
              <Segmented
                label="Homepage shelf"
                options={shelfList.map((s) => ({ value: s.id, label: s.shelf?.name ?? s.id }))}
                value={shelfId ?? ""}
                onChange={moveShelf}
              />
            ) : null}
          </div>
          <div className={styles.fld}>
            <Segmented
              label="Kind of work"
              options={KINDS}
              value={o.kind}
              onChange={(v) => {
                set("kind", v);
              }}
            />
          </div>
        </div>
        <div className={styles.fld}>
          <div className={styles.topics}>
            <TopicPicker
              id="f-topics"
              vocabulary={vocab}
              value={o.topics}
              onChange={(t) => {
                set("topics", t);
              }}
              noun="project"
            />
          </div>
        </div>
      </Sec>

      <Sec
        id="s-brief"
        title="Case-study summary"
        sub="Two short columns under the prototype, next to your success measures. Each one hides on the live page while it’s empty."
      >
        <div className={styles.fld}>
          <TextArea
            id="f-problem"
            label="The problem"
            value={o.problem ?? ""}
            onChange={setText("problem")}
            placeholder="What was broken, and how you know."
            hint="One or two sentences. Bold is allowed."
            counter={{ limit: 280 }}
            maxLength={280}
          />
        </div>
        <div className={styles.fld}>
          <TextArea
            id="f-proposal"
            label="What I proposed"
            value={o.proposal ?? ""}
            onChange={setText("proposal")}
            placeholder="The approach, in a sentence or two."
            hint="Keep it to the decision, not the whole plan."
            counter={{ limit: 280 }}
            maxLength={280}
          />
        </div>
      </Sec>

      <Sec
        id="s-ctx"
        title="Your part in it"
        sub="Recruiters look for this first. Each empty field hides its line on the live page; nothing shows as blank."
        aside={
          empty > 0 ? <span className={cx("chip", styles.warnChip)}>{empty} of 3 empty</span> : undefined
        }
      >
        <div className={styles.fld}>
          <TextArea
            id="f-role"
            label={
              <>
                My role <span className={styles.req}>Recommended</span>
              </>
            }
            value={o.role ?? ""}
            onChange={setText("role")}
            placeholder="What you owned, in one or two sentences"
            minHeight={72}
            maxLength={80}
            hint={o.role?.trim() ? "Shown under the title and in “My role and decisions”." : undefined}
            warning={o.role?.trim() ? undefined : "Empty, so the “My role and decisions” chapter is hidden."}
          />
        </div>
        <div className={styles.two}>
          <div className={styles.fld}>
            <TextField
              id="f-timeline"
              label="Timeline"
              value={o.timeline ?? ""}
              onChange={setText("timeline")}
              placeholder="e.g. 3 weeks"
              maxLength={80}
            />
          </div>
          <div className={styles.fld}>
            <TextField
              id="f-team"
              label="Team"
              value={o.team ?? ""}
              onChange={setText("team")}
              placeholder="e.g. Solo, or PM with 2 engineers"
              maxLength={80}
            />
          </div>
        </div>
      </Sec>

      <Sec
        id="s-links"
        title="Links"
        sub="Optional. Each one becomes a button on the page. Use view-only links."
      >
        <div className={styles.two}>
          <div className={styles.fld}>
            <PrdField
              value={o.prdUrl ?? ""}
              bad={prdBad}
              onChange={(v) => {
                e.update((d) => {
                  const overview = { ...d.overview };
                  if (v) overview.prdUrl = v;
                  else delete overview.prdUrl;
                  return { ...d, overview };
                });
              }}
            />
          </div>
          <div className={styles.fld}>
            <span className={styles.lbl}>Interactive prototype</span>
            <Link to={`/studio/projects/${e.row.id}/visuals`} className={styles.proto}>
              {hero.type === "prototype" && hero.url ? (
                <>
                  <StudioIcon name="tick" style={{ color: "var(--ok)" }} />
                  <span className={styles.protoUrl}>{hero.url.replace(/^https:\/\//, "")}</span>
                </>
              ) : (
                <span className={styles.protoUrl} style={{ color: "var(--tx3)" }}>
                  No prototype yet
                </span>
              )}
              <span className={styles.manage}>Manage in Visuals →</span>
            </Link>
          </div>
        </div>
      </Sec>
    </EditorCols>
  );
}

/**
 * The PRD link. The draft keeps only valid https links (the schema refuses anything else), so
 * the field holds what's typed and saves once it's a full https:// link.
 */
function PrdField({ value, bad, onChange }: { value: string; bad: boolean; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  const valid = (v: string) => v === "" || /^https:\/\/[^\s/]+\.[^\s]+/.test(v);
  return (
    <TextField
      id="f-prdUrl"
      label="PRD or document"
      value={text}
      placeholder="https://docs.google.com/…"
      onChange={(ev) => {
        const v = ev.target.value.trim();
        setText(ev.target.value);
        if (valid(v)) onChange(v);
      }}
      hint="Shown as “Read the PRD”."
      error={
        bad || (text.trim() !== "" && !valid(text.trim()))
          ? "Use a full link that starts with https://"
          : undefined
      }
    />
  );
}
