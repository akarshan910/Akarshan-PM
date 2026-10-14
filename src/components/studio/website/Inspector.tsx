/**
 * The builder's inspector (05 · Website builder › Inspector; StudioSite `.ins`): the selection's
 * kind, title and description, "Show on the site", "Link it in the nav" with its label, the panel
 * for that section or item, the Profile & facts link, and "Position" ↑ n/m ↓.
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router";

import { cx } from "../../cx";
import buttons from "../Button.module.css";
import { Counter } from "../Field";
import { RichArea } from "../RichArea";
import { StudioIcon } from "../StudioIcon";
import { ArtIcon, ART_LABEL } from "./ArtIcon";
import type { Sel } from "./Outline";
import styles from "./Website.module.css";
import { newId } from "~/lib/defaults";
import { ACCENTS, OFF_DUTY_ART, type SKILL_SIZES } from "~/lib/schemas";
import { ACCENT_NAMES, THUMB, thumbBackground } from "~/lib/studio/format";
import { aboutToRich, richToAbout, shift } from "~/lib/studio/profile";
import type { ProjectRow } from "~/lib/studio/repo";
import {
  canNav,
  FLOATERS,
  isDraftItem,
  itemName,
  LATEST,
  MOTION,
  navDefault,
  navLinks,
  outlineKids,
  patchSection,
  pinned,
  RSS,
  sectionName,
  setNav,
  type Ctx,
  type Section,
} from "~/lib/studio/website";
import type { Profile, SiteLayout } from "~/lib/types";

type Group = Profile["skills"][number];
type Off = Profile["offDuty"][number];

const FACTS_KINDS = new Set<Section["kind"]>(["hero", "proof", "experience", "testimonials", "contact"]);

const SUB: Partial<Record<Section["kind"], string>> = {
  hero: "The first thing on your homepage.",
  proof: "The numbers under the hero.",
  shelf: "A row of project cards.",
  writing: "Your latest posts.",
  about: "Your story, in a few paragraphs.",
  experience: "Your roles, as a timeline.",
  skills: "One word cloud, in groups.",
  testimonials: "What teammates say, in a carousel.",
  offduty: "The bonus pages at the back of the volume.",
  contact: "The closing line and how to reach you.",
  text: "A free text section.",
  footer: "Credit line and last updated.",
};

const KIND_LABEL: Partial<Record<Section["kind"], string>> = { shelf: "Shelf", text: "Text section" };

function Fld({
  id,
  label,
  hint,
  children,
  counter,
}: {
  id?: string;
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  counter?: ReactNode;
}) {
  return (
    <div className={styles.fld}>
      {id ? (
        <label className={styles.lbl} htmlFor={id}>
          {label}
        </label>
      ) : (
        <span className={styles.lbl}>{label}</span>
      )}
      {children}
      {hint || counter ? (
        <div className={styles.hrow}>
          {hint ? <span className={styles.hint}>{hint}</span> : null}
          {counter}
        </div>
      ) : null}
    </div>
  );
}

function Seg<V extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
}) {
  return (
    <div className="seg" role="group" aria-label={label} style={{ marginTop: 8 }}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => {
            onChange(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SwitchRow({
  checked,
  locked,
  label,
  onClick,
}: {
  checked: boolean;
  locked?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.sw}
      role="switch"
      aria-checked={checked}
      aria-disabled={locked || undefined}
      onClick={onClick}
    >
      <span className={styles.trk} aria-hidden="true" style={{ background: checked ? "#141416" : "#D2D0CA" }}>
        <span className={styles.knb} style={{ left: checked ? 18 : 2 }} />
      </span>
      {label}
    </button>
  );
}

export function Inspector({
  sel,
  layout,
  profile,
  ctx,
  projects,
  volumes,
  postCount,
  onSelect,
  updateLayout,
  updateProfile,
  announce,
  onEyeSection,
  onEyeKid,
  onMove,
  onMoveToShelf,
  onRemoveSection,
}: {
  sel: Sel;
  layout: SiteLayout;
  profile: Profile;
  ctx: Ctx;
  projects: ProjectRow[];
  volumes: Map<string, string>;
  postCount: number;
  onSelect: (s: Sel) => void;
  updateLayout: (fn: (l: SiteLayout) => SiteLayout) => void;
  updateProfile: (fn: (p: Profile) => Profile) => void;
  announce: (m: string) => void;
  onEyeSection: (s: Section) => void;
  onEyeKid: (s: Section, kidId: string) => void;
  onMove: (by: -1 | 1) => void;
  onMoveToShelf: (from: string, to: string, id: string) => void;
  onRemoveSection: (s: Section) => void;
}) {
  const [skillDraft, setSkillDraft] = useState("");
  const [pick, setPick] = useState<{ title: string; note: string } | null>(null);

  // ---- Navigation
  if (sel.kind === "nav") {
    return (
      <Panel kind="Pinned" title="Navigation" sub="Always on, always first.">
        <div className={cx(styles.fld, styles.navNote)}>
          The pill nav keeps your current design. Its links follow the order of the sections linked in the
          nav. Turn a link on or off from each section.
        </div>
        <div className={cx(styles.fld, styles.navChips)}>
          {navLinks(layout).map((n) => (
            <span key={n.id} className={cx(styles.mini, styles.navChip)}>
              {n.label}
            </span>
          ))}
          <span className={cx(styles.mini, styles.navChip, styles.navTalk)}>Let’s Talk →</span>
        </div>
      </Panel>
    );
  }

  const sectionId = sel.kind === "sec" ? sel.id : sel.p;
  const s = layout.sections.find((x) => x.id === sectionId);
  if (!s) return <Panel kind="" title="Nothing selected" sub="Pick a section in the outline." />;
  const name = sectionName(s);
  const patch = (fn: (x: Section) => Section) => {
    updateLayout((l) => patchSection(l, s.id, fn));
  };
  const header = (k: keyof NonNullable<Section["header"]>, v: string) => {
    patch((x) => {
      const rest = Object.fromEntries(Object.entries(x.header ?? {}).filter(([key]) => key !== k));
      return { ...x, header: v ? { ...rest, [k]: v } : rest };
    });
  };
  const factsLink = FACTS_KINDS.has(s.kind) ? (
    <Link to="/studio/website/profile" className={styles.facts}>
      Names, numbers and roles are confirmed in <strong>Profile &amp; facts →</strong>
    </Link>
  ) : null;

  // ---- an item
  if (sel.kind === "kid") {
    const kid = outlineKids(s, ctx).find((k) => k.id === sel.id);
    if (!kid) return <Panel kind="" title="Nothing selected" sub="Pick a section in the outline." />;
    const items = s.items;
    const pos = items.findIndex((i) => i.id === kid.id);
    const back = (
      <button
        type="button"
        className={cx(buttons.btn, styles.backBtn)}
        onClick={() => {
          onSelect({ kind: "sec", id: s.id });
        }}
      >
        Back to {name}
      </button>
    );
    const body: ReactNode[] = [];
    if (s.kind === "hero" && ["availability", "positioning", "intro"].includes(kid.id))
      body.push(heroFields(profile, updateProfile, kid.id));
    if (kid.id === FLOATERS) body.push(floatersPanel(s, projects, volumes, patch, announce));
    if (s.kind === "shelf") body.push(projectPanel(s, kid.id, layout, ctx, onMoveToShelf));
    if (s.kind === "skills")
      body.push(skillGroupPanel(profile, kid.id, updateProfile, announce, skillDraft, setSkillDraft));
    if (s.kind === "offduty") body.push(offDutyItemPanel(profile, kid.id, updateProfile, pick, setPick));
    return (
      <Panel
        kind={name}
        title={kid.name}
        sub={kid.draft ? "Draft · not on the live site" : itemSub(s, kid.id)}
        back={back}
      >
        {kid.visible !== null ? (
          <div className={styles.visRow}>
            <SwitchRow
              checked={kid.visible}
              locked={kid.draft}
              label="Show on the site"
              onClick={() => {
                onEyeKid(s, kid.id);
              }}
            />
          </div>
        ) : null}
        {body}
        {factsLink}
        {kid.movable ? <Position pos={pos} total={items.length} onMove={onMove} /> : null}
      </Panel>
    );
  }

  // ---- a section
  const total = layout.sections.length;
  const index = layout.sections.findIndex((x) => x.id === s.id);
  const panel: ReactNode[] = [];
  switch (s.kind) {
    case "hero":
      panel.push(heroFields(profile, updateProfile));
      break;
    case "shelf":
      panel.push(
        <div key="shelf" className={styles.col}>
          <Fld
            id="i-kicker"
            label="Label above the title"
            hint="The small label in red, for example “Projects”. Leave it empty to hide it."
          >
            <input
              id="i-kicker"
              className={styles.inp}
              value={s.header?.kicker ?? ""}
              onChange={(e) => {
                header("kicker", e.target.value);
              }}
            />
          </Fld>
          <Fld id="i-st" label="Shelf title">
            <input
              id="i-st"
              className={styles.inp}
              value={s.header?.title ?? ""}
              onChange={(e) => {
                header("title", e.target.value);
              }}
            />
          </Fld>
          <Fld id="i-sm" label="Second half, in grey">
            <input
              id="i-sm"
              className={styles.inp}
              value={s.header?.titleMuted ?? ""}
              onChange={(e) => {
                header("titleMuted", e.target.value);
              }}
            />
          </Fld>
          <Fld label="Intro">
            <RichArea
              label="Intro"
              kind="inline"
              value={s.header?.intro ?? ""}
              className={styles.rich}
              onChange={(v) => {
                header("intro", v);
              }}
            />
          </Fld>
          <Fld label="Rows on the homepage" hint="Past this, the last card becomes “See all”.">
            <Seg
              label="Rows on the homepage"
              value={s.shelf?.rows ?? 2}
              options={[1, 2, 3].map((n) => ({ value: n as 1 | 2 | 3, label: String(n) }))}
              onChange={(rows) => {
                patch((x) => ({ ...x, shelf: { name: x.shelf?.name ?? name, rows } }));
              }}
            />
          </Fld>
          <div className={cx(styles.fld, styles.plain)}>
            The first visible project is the lead card. Drag projects in the outline, or open one to edit its
            page.{" "}
            <Link to="/studio/projects" className={styles.u}>
              All projects →
            </Link>
          </div>
        </div>,
      );
      break;
    case "writing":
      panel.push(
        <div key="writing" className={styles.col}>
          <Fld label="Posts on the homepage">
            <Seg
              label="Posts on the homepage"
              value={s.writing?.latest ?? 3}
              options={[2, 3, 4].map((n) => ({ value: n as 2 | 3 | 4, label: `Latest ${String(n)}` }))}
              onChange={(latest) => {
                patch((x) => ({ ...x, writing: { rss: x.writing?.rss ?? true, latest } }));
              }}
            />
          </Fld>
          {postCount === 0 ? (
            <div className={cx(styles.fld, styles.warnBox)}>
              No posts yet, so this section stays off the live site until you publish your first one.{" "}
              <Link to="/studio/writing">Write a post →</Link>
            </div>
          ) : null}
        </div>,
      );
      break;
    case "about":
      panel.push(
        <Fld key="about" label="About text">
          <RichArea
            label="About text"
            value={aboutToRich(profile.about.body)}
            className={cx(styles.rich, styles.richTall)}
            onChange={(html) => {
              const body = richToAbout(html);
              updateProfile((p) => ({ ...p, about: { ...p.about, body } }));
            }}
          />
        </Fld>,
      );
      break;
    case "skills":
    case "offduty":
      panel.push(
        <div key="hdr" className={styles.col}>
          {s.kind === "skills" ? (
            <Fld
              id="i-k"
              label="Label above the title"
              hint="The small label in red, for example “Skills”. Leave it empty to hide it."
            >
              <input
                id="i-k"
                className={styles.inp}
                value={s.header?.kicker ?? ""}
                onChange={(e) => {
                  header("kicker", e.target.value);
                }}
              />
            </Fld>
          ) : null}
          <Fld id="i-t" label="Title">
            <input
              id="i-t"
              className={styles.inp}
              value={s.header?.title ?? ""}
              onChange={(e) => {
                header("title", e.target.value);
              }}
            />
          </Fld>
          <Fld id="i-m" label="Second half, in grey">
            <input
              id="i-m"
              className={styles.inp}
              value={s.header?.titleMuted ?? ""}
              onChange={(e) => {
                header("titleMuted", e.target.value);
              }}
            />
          </Fld>
          <Fld label="Intro" hint="Leave it empty to hide it.">
            <RichArea
              label="Intro"
              kind="inline"
              value={s.header?.intro ?? ""}
              className={styles.rich}
              onChange={(v) => {
                header("intro", v);
              }}
            />
          </Fld>
          <div className={cx(styles.fld, styles.note)}>
            {s.kind === "skills"
              ? "Skills show as one word cloud. Open a group in the outline to edit its skills and choose how big each one is. On the site, hovering or tapping a group name lights up its skills."
              : "Each item is a panel on a manga-style page: its art, a caption box and a tag. Open one in the outline to edit it. The first item gets the big panel."}
          </div>
        </div>,
      );
      break;
    case "contact":
      panel.push(
        <div key="contact" className={styles.col}>
          <Fld id="i-ch" label="Closing line">
            <input
              id="i-ch"
              className={styles.inp}
              value={s.contact?.closing ?? ""}
              onChange={(e) => {
                const closing = e.target.value;
                patch((x) => ({ ...x, contact: { ...x.contact, closing } }));
              }}
            />
          </Fld>
          <Fld
            id="i-ca"
            label="Last words, in red"
            hint="Shown after the closing line, in the accent colour."
          >
            <input
              id="i-ca"
              className={styles.inp}
              value={s.contact?.closingAccent ?? ""}
              onChange={(e) => {
                const closingAccent = e.target.value;
                patch((x) => {
                  const c = {
                    closing: x.contact?.closing ?? "",
                    ...(closingAccent ? { closingAccent } : {}),
                  };
                  return { ...x, contact: c };
                });
              }}
            />
          </Fld>
        </div>,
      );
      break;
    case "footer":
      panel.push(
        <Fld
          key="footer"
          id="i-cr"
          label="Credit line"
          hint="The Last updated date comes from your latest publish."
        >
          <input
            id="i-cr"
            className={styles.inp}
            value={profile.footer.credit ?? ""}
            onChange={(e) => {
              const credit = e.target.value;
              updateProfile((p) => ({ ...p, footer: credit ? { credit } : {} }));
            }}
          />
        </Fld>,
      );
      break;
    case "text":
      panel.push(
        <div key="text" className={styles.col}>
          <Fld id="i-tt" label="Title">
            <input
              id="i-tt"
              className={styles.inp}
              value={s.header?.title ?? ""}
              onChange={(e) => {
                header("title", e.target.value);
              }}
            />
          </Fld>
          <Fld label="Text">
            <RichArea
              label="Text"
              value={s.text?.body ?? ""}
              className={cx(styles.rich, styles.richTall)}
              onChange={(body) => {
                patch((x) => ({ ...x, text: { body } }));
              }}
            />
          </Fld>
          <div className={styles.fld}>
            <button
              type="button"
              className={cx(buttons.btn, styles.danger)}
              onClick={() => {
                onRemoveSection(s);
              }}
            >
              Delete section
            </button>
          </div>
        </div>,
      );
      break;
    default:
      break;
  }

  const navOn = Boolean(s.nav);
  return (
    <Panel
      kind={KIND_LABEL[s.kind] ?? "Section"}
      title={name}
      titleInput={
        s.kind === "shelf"
          ? (v) => {
              patch((x) => ({ ...x, shelf: { rows: x.shelf?.rows ?? 2, name: v } }));
            }
          : undefined
      }
      sub={SUB[s.kind] ?? ""}
    >
      <div className={styles.visRow}>
        <SwitchRow
          checked={s.visible}
          locked={s.kind === "hero"}
          label="Show on the site"
          onClick={() => {
            onEyeSection(s);
          }}
        />
        {canNav(s) ? (
          <>
            <SwitchRow
              checked={navOn}
              label="Link it in the nav"
              onClick={() => {
                updateLayout((l) => setNav(l, s.id, navOn ? null : navDefault(s)));
              }}
            />
            {navOn ? (
              <input
                className={cx(styles.inp, styles.navInp)}
                aria-label="Nav label"
                maxLength={14}
                value={s.nav?.label ?? ""}
                onChange={(e) => {
                  const label = e.target.value;
                  updateLayout((l) => setNav(l, s.id, label));
                }}
              />
            ) : null}
          </>
        ) : null}
      </div>
      {panel}
      {s.kind === "experience" || s.kind === "testimonials" ? (
        <div className={cx(styles.fld, styles.plain)}>
          Each {s.kind === "experience" ? "role" : "testimonial"} is edited in Profile &amp; facts. Turn them
          on or off and reorder them here.
        </div>
      ) : null}
      {factsLink}
      {!pinned(s) ? <Position pos={index} total={total} onMove={onMove} /> : null}
    </Panel>
  );
}

function itemSub(s: Section, id: string): string {
  if (id === MOTION)
    return "The red speed lines and the tilt on scroll. Visitors who prefer less motion never see them move.";
  if (id === FLOATERS) return "Project covers that drift beside the hero text.";
  if (id === LATEST) return "Set how many in the Writing panel.";
  if (id === RSS) return "The RSS link under your posts.";
  if (s.kind === "shelf") return "A project card on this shelf.";
  return `Part of ${sectionName(s)}.`;
}

function Panel({
  kind,
  title,
  titleInput,
  sub,
  back,
  children,
}: {
  kind: string;
  title: string;
  titleInput?: ((v: string) => void) | undefined;
  sub: string;
  back?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <aside className={styles.inspector} aria-label="Edit selection">
      <div className={cx("card", styles.ins)}>
        <div className={styles.insHead}>
          <span className="mono" style={{ fontSize: 11 }}>
            {kind}
          </span>
          <span style={{ flex: 1 }} />
          {back}
        </div>
        {titleInput ? (
          <input
            className={styles.titleInp}
            aria-label="Shelf name"
            value={title}
            maxLength={40}
            onChange={(e) => {
              titleInput(e.target.value);
            }}
          />
        ) : (
          <h3 className={styles.insTitle}>{title}</h3>
        )}
        <div className={styles.insSub}>{sub}</div>
        {children}
      </div>
    </aside>
  );
}

function Position({ pos, total, onMove }: { pos: number; total: number; onMove: (by: -1 | 1) => void }) {
  return (
    <div className={styles.position}>
      <span className={styles.posLabel}>Position</span>
      <span style={{ flex: 1 }} />
      <button
        type="button"
        className={cx("ib", styles.posBtn)}
        aria-label="Move up"
        onClick={() => {
          onMove(-1);
        }}
      >
        <StudioIcon name="up" />
      </button>
      <span className={styles.posN}>
        {pos + 1} / {total}
      </span>
      <button
        type="button"
        className={cx("ib", styles.posBtn)}
        aria-label="Move down"
        onClick={() => {
          onMove(1);
        }}
      >
        <StudioIcon name="down" />
      </button>
    </div>
  );
}

// ---- panels

function heroFields(profile: Profile, update: (fn: (p: Profile) => Profile) => void, only?: string) {
  const show = (k: string) => !only || only === k;
  return (
    <div key="hero" className={styles.col}>
      {show("availability") ? (
        <Fld id="i-av" label="Availability chip" hint="From your current site. Keep it only while it’s true.">
          <input
            id="i-av"
            className={styles.inp}
            maxLength={60}
            value={profile.availability ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              update((p) => ({ ...p, availability: v || undefined }));
            }}
          />
        </Fld>
      ) : null}
      {show("positioning") ? (
        <Fld label="Positioning line">
          <RichArea
            label="Positioning line"
            kind="inline"
            value={profile.positioning}
            className={styles.rich}
            onChange={(positioning) => {
              update((p) => ({ ...p, positioning }));
            }}
          />
        </Fld>
      ) : null}
      {show("intro") ? (
        <Fld label="Intro">
          <RichArea
            label="Intro"
            kind="inline"
            value={profile.intro ?? ""}
            className={cx(styles.rich, styles.richMid)}
            onChange={(intro) => {
              update((p) => ({ ...p, intro: intro || undefined }));
            }}
          />
        </Fld>
      ) : null}
    </div>
  );
}

function floatersPanel(
  s: Section,
  projects: ProjectRow[],
  volumes: Map<string, string>,
  patch: (fn: (x: Section) => Section) => void,
  announce: (m: string) => void,
) {
  const hero = s.hero ?? { motion: true, floaters: { items: [], atOnce: 3 as const } };
  const byId = new Map(projects.map((p) => [p.id, p]));
  const items = hero.floaters.items.filter((id) => byId.has(id));
  const rest = projects.filter((p) => !items.includes(p.id));
  const setItems = (next: string[]) => {
    patch((x) => ({ ...x, hero: { ...hero, floaters: { ...hero.floaters, items: next } } }));
  };
  const vol = (id: string) => volumes.get(id) ?? "—";
  return (
    <div key="floaters" className={styles.col}>
      <Fld
        label="Projects that float"
        hint="They fade in at random spots right of the text, drift a little, fade out, and the next one takes over."
      >
        <div className={styles.floatList}>
          {items.map((id) => {
            const p = byId.get(id);
            if (!p) return null;
            const title = p.draft.overview.title || "Untitled project";
            return (
              <div key={id} className={styles.floatRow}>
                <span className={styles.floatDot} style={{ background: THUMB[p.draft.visuals.accent][0] }} />
                <span className={styles.floatName}>
                  VOL.{vol(id)} · {title}
                </span>
                {!p.published ? <span className={cx(styles.mini, styles.miniWarn)}>Draft</span> : null}
                <button
                  type="button"
                  className={cx("ib", styles.ib30)}
                  aria-label={`Remove ${title}`}
                  onClick={() => {
                    setItems(items.filter((x) => x !== id));
                    announce(`${title} removed from the floating previews.`);
                  }}
                >
                  <StudioIcon name="close" size={15} />
                </button>
              </div>
            );
          })}
        </div>
        {rest.length ? (
          <div className={styles.addChips}>
            {rest.map((p) => {
              const title = p.draft.overview.title || "Untitled project";
              return (
                <button
                  key={p.id}
                  type="button"
                  className={styles.addchip}
                  title={`Add ${title}`}
                  aria-label={`Add ${title}`}
                  onClick={() => {
                    setItems([...items, p.id]);
                    announce(`${title} added to the floating previews.`);
                  }}
                >
                  + VOL.{vol(p.id)}
                </button>
              );
            })}
          </div>
        ) : null}
      </Fld>
      <Fld
        label="On screen at once"
        hint="On laptops. iPad shows one and phones none. Visitors who prefer less motion see them standing still."
      >
        <Seg
          label="On screen at once"
          value={hero.floaters.atOnce}
          options={[1, 2, 3].map((n) => ({ value: n as 1 | 2 | 3, label: String(n) }))}
          onChange={(atOnce) => {
            patch((x) => ({ ...x, hero: { ...hero, floaters: { ...hero.floaters, atOnce } } }));
          }}
        />
      </Fld>
      <div className={cx(styles.fld, styles.note)}>
        Drafts can be added now. They start floating once they’re published.
      </div>
    </div>
  );
}

function projectPanel(
  s: Section,
  id: string,
  layout: SiteLayout,
  ctx: Ctx,
  onMoveToShelf: (from: string, to: string, id: string) => void,
) {
  const row = ctx.projects.get(id);
  if (!row) return null;
  const draft = isDraftItem(s, id, ctx);
  const other = layout.sections.find((x) => x.kind === "shelf" && x.id !== s.id);
  const firstVisible = s.items.find((i) => i.visible && !isDraftItem(s, i.id, ctx))?.id;
  const hint = draft
    ? "It takes this spot as soon as you publish it."
    : firstVisible === id
      ? "First on its shelf, so it’s the lead card."
      : "Drag it to the top of the shelf to make it the lead card.";
  return (
    <div key="project" className={styles.col}>
      <div className={cx(styles.fld, styles.projHead)}>
        <span
          className={styles.projThumb}
          style={{ background: thumbBackground(row.draft.visuals.accent) }}
        />
        <span>
          <strong>{itemName(s, id, ctx)}</strong>
          <span className={styles.projCo}>{row.draft.overview.company}</span>
        </span>
      </div>
      <div className={styles.fld}>
        <span className={cx(styles.mini, draft ? styles.miniWarn : styles.miniLive)}>
          {draft ? "Draft · not on the live site" : "Published"}
        </span>
      </div>
      <div className={cx(styles.fld, styles.projActions)}>
        <Link className={cx(buttons.btn, styles.h38)} to={`/studio/projects/${id}/overview`}>
          Edit the project page
        </Link>
        {other ? (
          <button
            type="button"
            className={cx(buttons.btn, styles.h38)}
            onClick={() => {
              onMoveToShelf(s.id, other.id, id);
            }}
          >
            Move to {sectionName(other)}
          </button>
        ) : null}
      </div>
      <div className={styles.hrow}>
        <span className={styles.hint}>{hint}</span>
      </div>
    </div>
  );
}

function skillGroupPanel(
  profile: Profile,
  id: string,
  update: (fn: (p: Profile) => Profile) => void,
  announce: (m: string) => void,
  draft: string,
  setDraft: (v: string) => void,
) {
  const g = profile.skills.find((x) => x.id === id);
  if (!g) return null;
  const patchG = (fn: (x: Group) => Group) => {
    update((p) => ({ ...p, skills: p.skills.map((x) => (x.id === id ? fn(x) : x)) }));
  };
  const moveSkill = (i: number, by: -1 | 1) => {
    const next = shift(g.items, i, by);
    if (next === g.items) return;
    patchG((x) => ({ ...x, items: next }));
    const it = g.items[i];
    if (it) announce(`${it.text} is now ${String(i + by + 1)} of ${String(g.items.length)}.`);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-skh="${String(i + by)}"]`)?.focus();
    });
  };
  return (
    <div key="skills" className={styles.col}>
      <Fld id="i-skgn" label="Group name" hint="Shown big and outlined in the cloud.">
        <input
          id="i-skgn"
          className={styles.inp}
          value={g.title}
          onChange={(e) => {
            const title = e.target.value;
            patchG((x) => ({ ...x, title }));
          }}
        />
      </Fld>
      <Fld id="i-skgs" label="Subtitle">
        <input
          id="i-skgs"
          className={styles.inp}
          value={g.subtitle ?? ""}
          onChange={(e) => {
            const subtitle = e.target.value;
            patchG((x) => {
              const { subtitle: _s, ...rest } = x;
              return subtitle ? { ...rest, subtitle } : rest;
            });
          }}
        />
      </Fld>
      <Fld
        label="Skills and their size"
        hint="S, M, L or XL. Size is emphasis: keep two or three big and most at M."
      >
        <div className={styles.skList}>
          {g.items.map((it, i) => (
            <div key={it.id} className={styles.skrow}>
              <button
                type="button"
                className={cx(styles.hd, styles.hdSk)}
                data-skh={i}
                aria-label={`Move ${it.text}`}
                aria-describedby="sk-help"
                onKeyDown={(e) => {
                  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                  e.preventDefault();
                  moveSkill(i, e.key === "ArrowUp" ? -1 : 1);
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor">
                  {[6, 12, 18].map((y) => (
                    <g key={y}>
                      <circle cx="9" cy={y} r="1.6" />
                      <circle cx="15" cy={y} r="1.6" />
                    </g>
                  ))}
                </svg>
              </button>
              <input
                className={styles.skn}
                value={it.text}
                aria-label={`Skill name, ${String(i + 1)} of ${String(g.items.length)}`}
                onChange={(e) => {
                  const text = e.target.value;
                  patchG((x) => ({ ...x, items: x.items.map((y) => (y.id === it.id ? { ...y, text } : y)) }));
                }}
              />
              <select
                className={styles.szsel}
                aria-label={`Size of ${it.text}`}
                value={it.size}
                onChange={(e) => {
                  const size = e.target.value as (typeof SKILL_SIZES)[number];
                  patchG((x) => ({ ...x, items: x.items.map((y) => (y.id === it.id ? { ...y, size } : y)) }));
                }}
              >
                {(["s", "m", "l", "xl"] as const).map((z) => (
                  <option key={z} value={z}>
                    {z.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={cx("ib", styles.ib26)}
                aria-label={`Remove ${it.text}`}
                onClick={() => {
                  patchG((x) => ({ ...x, items: x.items.filter((y) => y.id !== it.id) }));
                  announce(`${it.text} removed`);
                }}
              >
                <StudioIcon name="close" size={15} />
              </button>
            </div>
          ))}
        </div>
        <p id="sk-help" className={styles.skHelp}>
          Drag a handle, or focus it and press ↑ ↓, to change the order. Click a name to rename it. Order and
          size are kept exactly as you set them.
        </p>
        <input
          className={cx(styles.inp, styles.skAdd)}
          aria-label="Add a skill"
          placeholder="Add a skill and press Enter"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const text = draft.trim();
            if (!text) return;
            patchG((x) => ({ ...x, items: [...x.items, { id: newId("k"), text, size: "m" }] }));
            setDraft("");
            announce(`${text} added`);
          }}
        />
      </Fld>
    </div>
  );
}

function offDutyItemPanel(
  profile: Profile,
  id: string,
  update: (fn: (p: Profile) => Profile) => void,
  pick: { title: string; note: string } | null,
  setPick: (p: { title: string; note: string } | null) => void,
) {
  const o = profile.offDuty.find((x) => x.id === id);
  if (!o) return null;
  const first = profile.offDuty[0]?.id === id;
  const patchO = (fn: (x: Off) => Off) => {
    update((p) => ({ ...p, offDuty: p.offDuty.map((x) => (x.id === id ? fn(x) : x)) }));
  };
  return (
    <div key="off" className={styles.col}>
      <div className={styles.twoCol}>
        <Fld id="i-oft" label="Title">
          <input
            id="i-oft"
            className={styles.inp}
            value={o.title}
            onChange={(e) => {
              const title = e.target.value;
              patchO((x) => ({ ...x, title }));
            }}
          />
        </Fld>
        <Fld id="i-ofk" label="Label">
          <input
            id="i-ofk"
            className={styles.inp}
            value={o.label}
            onChange={(e) => {
              const label = e.target.value;
              patchO((x) => ({ ...x, label }));
            }}
          />
        </Fld>
      </div>
      <Fld
        id="i-ofd"
        label="Text"
        hint="About 200 characters fits every panel size."
        counter={<Counter length={o.text.length} limit={200} />}
      >
        <textarea
          id="i-ofd"
          className={cx(styles.inp, styles.ta)}
          value={o.text}
          onChange={(e) => {
            const text = e.target.value;
            patchO((x) => ({ ...x, text }));
          }}
        />
      </Fld>
      <Fld id="i-ofg" label="Tag">
        <input
          id="i-ofg"
          className={styles.inp}
          value={o.tag ?? ""}
          onChange={(e) => {
            const tag = e.target.value;
            patchO((x) => {
              const { tag: _t, ...rest } = x;
              return tag ? { ...rest, tag } : rest;
            });
          }}
        />
      </Fld>
      <Fld label="Accent">
        <div role="radiogroup" aria-label="Accent" className={styles.swatches}>
          {ACCENTS.map((a) => (
            <button
              key={a}
              type="button"
              className={styles.swatch}
              role="radio"
              aria-checked={o.accent === a}
              aria-label={ACCENT_NAMES[a]}
              style={{ background: THUMB[a][0] }}
              onClick={() => {
                patchO((x) => ({ ...x, accent: a }));
              }}
            />
          ))}
        </div>
      </Fld>
      <Fld label="Art">
        <div role="radiogroup" aria-label="Art" className={styles.arts}>
          {OFF_DUTY_ART.map((art) => (
            <button
              key={art}
              type="button"
              className={styles.artpick}
              role="radio"
              aria-checked={o.art === art}
              onClick={() => {
                patchO((x) => ({ ...x, art }));
              }}
            >
              <ArtIcon art={art} />
              {ART_LABEL[art]}
            </button>
          ))}
        </div>
      </Fld>
      {first ? (
        <Fld label="Shelf of favourites" hint="Shown as volume spines under this panel.">
          <div className={styles.floatList}>
            {(o.picks ?? []).map((pk) => (
              <div key={pk.id} className={styles.floatRow}>
                <span className={styles.spine} style={{ background: THUMB[o.accent][0] }} />
                <span className={styles.floatName}>
                  {pk.title}
                  {pk.note ? <span className={styles.pickNote}> · {pk.note}</span> : null}
                </span>
                <button
                  type="button"
                  className={cx("ib", styles.ib30)}
                  aria-label={`Remove ${pk.title}`}
                  onClick={() => {
                    patchO((x) => ({ ...x, picks: (x.picks ?? []).filter((y) => y.id !== pk.id) }));
                  }}
                >
                  <StudioIcon name="close" size={15} />
                </button>
              </div>
            ))}
          </div>
          {pick ? (
            <form
              className={styles.pickForm}
              onSubmit={(e) => {
                e.preventDefault();
                const title = pick.title.trim();
                if (!title) return;
                const note = pick.note.trim();
                patchO((x) => ({
                  ...x,
                  picks: [...(x.picks ?? []), { id: newId("pk"), title, ...(note ? { note } : {}) }],
                }));
                setPick(null);
              }}
            >
              <input
                className={styles.inp}
                aria-label="Favourite"
                placeholder="Title"
                value={pick.title}
                onChange={(e) => {
                  setPick({ ...pick, title: e.target.value });
                }}
              />
              <input
                className={styles.inp}
                aria-label="Note"
                placeholder="Note, optional"
                value={pick.note}
                onChange={(e) => {
                  setPick({ ...pick, note: e.target.value });
                }}
              />
              <button type="submit" className={cx(buttons.btn, styles.h38)}>
                Add
              </button>
            </form>
          ) : (
            <button
              type="button"
              className={styles.addchip}
              style={{ marginTop: 8 }}
              onClick={() => {
                setPick({ title: "", note: "" });
              }}
            >
              + Add a favourite
            </button>
          )}
        </Fld>
      ) : null}
    </div>
  );
}
