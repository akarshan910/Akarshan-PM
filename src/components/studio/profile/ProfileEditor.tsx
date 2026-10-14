/**
 * Profile & facts (05 · Profile & facts; StudioProfile): one long form in sections (Hero, Proof
 * strip, About, Experience, Testimonials, Contact and links), with the D38 "More fields" as plain
 * forms in the same styles, the hero's live preview and "Before you publish" on the right.
 *
 * The profile and the layout autosave separately (roles on the timeline and testimonials in the
 * carousel are layout items). "Publish profile" is the site publish: profile and layout together.
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router";

import { cx } from "../../cx";
import { RichText } from "../../rich/RichText";
import { Icon } from "../../icons";
import buttons from "../Button.module.css";
import { RadioCards, Segmented, Switch } from "../Controls";
import { useRepo, useStudio } from "../data";
import { Counter, TextArea, TextField } from "../Field";
import { RichArea } from "../RichArea";
import { SaveStatus } from "../SaveStatus";
import { useShell } from "../shell/ShellContext";
import { ConflictDialog } from "../states/ConflictDialog";
import { UnconfirmedDialog } from "../states/UnconfirmedDialog";
import { StudioIcon } from "../StudioIcon";
import { useToast } from "../Toast";
import { UNSAVED_MESSAGE, useAutosave } from "../useAutosave";
import styles from "./Profile.module.css";
import { newId } from "~/lib/defaults";
import type { ProfilePublished } from "~/lib/published";
import { isHttpsUrl, isSafeLink } from "~/lib/schemas";
import { setFact } from "~/lib/studio/facts";
import { ACCENT_NAMES, THUMB } from "~/lib/studio/format";
import {
  aboutToRich,
  factNote,
  HERO_BUTTON_MAX,
  initialsOf,
  LETS_TALK_HINT,
  moveItem,
  openCount,
  openFacts,
  ordered,
  pickFact,
  prependItem,
  placeholderItems,
  plainLength,
  POSITIONING_HARD,
  POSITIONING_SOFT,
  profileChecks,
  proofText,
  removeItem,
  richToAbout,
  setItemVisible,
  shift,
  titleOptions,
  type OpenFact,
} from "~/lib/studio/profile";
import type { DocRow, MediaRow } from "~/lib/studio/repo";
import { ACCENTS } from "~/lib/schemas";
import type { Profile, SiteLayout } from "~/lib/types";

type ProfileRow = DocRow<Profile, ProfilePublished>;
type LayoutRow = DocRow<SiteLayout>;

export interface ProfileData {
  profile: ProfileRow;
  layout: LayoutRow;
  media: MediaRow[];
}

function Sec({
  id,
  title,
  sub,
  aside,
  children,
}: {
  id: string;
  title: string;
  sub?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={cx("card", styles.sec)} aria-labelledby={id}>
      <div className={styles.secHead}>
        <div>
          <h2 id={id}>{title}</h2>
          {sub ? <p className={styles.sub}>{sub}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Arrows({
  name,
  index,
  count,
  onMove,
}: {
  name: string;
  index: number;
  count: number;
  onMove: (by: -1 | 1) => void;
}) {
  return (
    <span className={styles.arrows}>
      <button
        type="button"
        className={cx("ib", styles.sm)}
        aria-label={`Move ${name} up`}
        aria-disabled={index === 0}
        onClick={() => {
          if (index > 0) onMove(-1);
        }}
      >
        <StudioIcon name="up" />
      </button>
      <button
        type="button"
        className={cx("ib", styles.sm)}
        aria-label={`Move ${name} down`}
        aria-disabled={index === count - 1}
        onClick={() => {
          if (index < count - 1) onMove(1);
        }}
      >
        <StudioIcon name="down" />
      </button>
    </span>
  );
}

export function ProfileEditor({ data }: { data: ProfileData }) {
  const repo = useRepo();
  const { cache } = useStudio();
  const { announce } = useShell();
  const toast = useToast();

  const prof = useAutosave<Profile, ProfileRow>({
    key: "profile",
    row: data.profile,
    save: (d, v) => repo.profile.save(d, v),
    onSaved: (r) => {
      cache.set("profile", r);
      cache.invalidate("dashboard");
    },
  });
  const lay = useAutosave<SiteLayout, LayoutRow>({
    key: "layout",
    row: data.layout,
    save: (d, v) => repo.layout.save(d, v),
    onSaved: (r) => {
      cache.set("layout", r);
    },
  });
  const p = prof.draft;
  const layout = lay.draft;
  const set = (fn: (d: Profile) => Profile) => {
    prof.update(fn);
  };
  const setContact = (patch: Partial<Profile["contact"]>) => {
    set((d) => ({ ...d, contact: { ...d.contact, ...patch } }));
  };

  // Turning availability off keeps the text, so turning it back on restores it.
  const [avText, setAvText] = useState(p.availability ?? "");
  const [editing, setEditing] = useState<string | null>(null);
  const [dialog, setDialog] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [newSpace, setNewSpace] = useState("");

  const facts = openFacts(p);
  const factFor = (key: string) => facts.find((f) => f.key === key);
  const titles = titleOptions(p);
  const { checks, summary } = profileChecks(p);
  const placeholders = placeholderItems(p);
  const proofRows = ordered(layout, "proof", p.proof);
  const proofOpen = facts.filter((f) => f.where === "proof").length;
  const expRows = ordered(layout, "experience", p.experience);
  const tstRows = ordered(layout, "testimonials", p.testimonials);
  const tstOn = tstRows.filter((t) => t.visible).length;
  const resumeFile = p.contact.resume?.mediaId
    ? data.media.find((m) => m.id === p.contact.resume?.mediaId)
    : undefined;

  const confirm = (key: string, which: "live" | "alternative", message: string) => {
    set((d) => pickFact(d, key, which));
    announce(message);
  };

  // ---- publishing (the site publish: profile and layout together)
  const publish = async (confirmUnconfirmed = false) => {
    setPublishing(true);
    if (!(await prof.flush()) || !(await lay.flush())) {
      setPublishing(false);
      toast.show({ message: UNSAVED_MESSAGE, tone: "error" });
      return;
    }
    const result = await repo.publish({
      action: "publish",
      kind: "site",
      ...(confirmUnconfirmed ? { confirmUnconfirmed: true } : {}),
    });
    setPublishing(false);
    if (!result.ok) {
      if (result.reason === "needs-confirm") {
        setDialog(result.unconfirmed.length);
        return;
      }
      setDialog(null);
      toast.show({
        message:
          result.reason === "offline"
            ? "You’re offline. Publish once you’re back online."
            : "Couldn’t publish. Your draft is safe.",
        tone: "error",
        action: { label: "Try again", onAction: () => void publish(confirmUnconfirmed) },
      });
      return;
    }
    setDialog(null);
    const [fp, fl] = await Promise.all([repo.profile.get(), repo.layout.get()]);
    prof.reset(fp);
    lay.reset(fl);
    cache.set("profile", fp);
    cache.set("layout", fl);
    cache.invalidate("dashboard");
    toast.show({ message: "Profile published. The homepage updates within a minute." });
    announce("Profile published.");
  };

  const saveState = prof.state === "saved" ? lay.state : prof.state;

  // ---- a fact's flag: the note and one button per value
  const flag = (f: OpenFact, onEdit: () => void) => (
    <div key={f.key} className={styles.flag}>
      <StudioIcon name="alert" size={16} />
      <span className={styles.flagNote}>{factNote(f)}</span>
      {f.alternative ? (
        <>
          <button
            type="button"
            className={styles.fixb}
            onClick={() => {
              confirm(f.key, "live", "Kept the site figure.");
            }}
          >
            Keep the site figure
          </button>
          <button type="button" className={styles.fixb} onClick={onEdit}>
            Use the résumé figure
          </button>
        </>
      ) : (
        <button
          type="button"
          className={styles.fixb}
          onClick={() => {
            confirm(f.key, "live", "Confirmed.");
          }}
        >
          Still true
        </button>
      )}
    </div>
  );

  return (
    <main className={styles.main} id="main">
      <div className={styles.top}>
        <div>
          <div className="mono">
            <Link to="/studio">Studio</Link> / <Link to="/studio/website">Website</Link> / Profile &amp; facts
          </div>
          <h1 className={styles.h1}>Profile &amp; facts</h1>
          <p className={styles.lede}>
            Your name, title and the numbers people check, in one long form. Confirm facts here; order and
            visibility live in{" "}
            <Link to="/studio/website" className={styles.u}>
              Website
            </Link>
            .
          </p>
        </div>
        <div className={styles.actions}>
          <SaveStatus
            state={saveState}
            savedLabel={prof.savedLabel}
            onRetry={() => {
              prof.retry();
              lay.retry();
            }}
          />
          <Link className={buttons.btn} to="/studio/preview/site/home">
            Preview
          </Link>
          <button type="button" className={buttons.cta} disabled={publishing} onClick={() => void publish()}>
            {publishing && dialog === null ? "Publishing…" : "Publish profile"}
          </button>
        </div>
      </div>

      <div className={styles.cols}>
        <div className={styles.form}>
          {/* ---------------------------------------------------------------- Hero */}
          <Sec id="h-hero" title="Hero" sub="The first thing on your homepage.">
            <TextField
              id="f-name"
              label="Name"
              value={p.name}
              maxLength={60}
              onChange={(e) => {
                const name = e.target.value;
                set((d) => ({ ...d, name }));
              }}
            />
            {titles ? (
              <div className={styles.fld}>
                <span className={styles.lbl} id="l-title">
                  Job title
                  {factFor("title") ? (
                    <span className="chip" style={{ background: "var(--warnbg)", color: "var(--warn)" }}>
                      Your call
                    </span>
                  ) : null}
                </span>
                <div className={styles.titleCards}>
                  <RadioCards
                    label="Job title"
                    options={titles.map((t) => ({ value: t.which, label: t.value, note: t.label }))}
                    value={factFor("title") ? null : "live"}
                    onChange={(which) => {
                      confirm("title", which, "Job title confirmed.");
                    }}
                  />
                </div>
                <div className={styles.hrow}>
                  <span className={styles.hint}>Use the one recruiters will also see on LinkedIn.</span>
                </div>
              </div>
            ) : (
              <TextField
                id="f-title"
                label="Job title"
                value={p.title}
                maxLength={60}
                onChange={(e) => {
                  const title = e.target.value;
                  set((d) => ({ ...d, title }));
                }}
              />
            )}
            <div className={styles.fld}>
              <span className={styles.lbl} id="l-pos">
                Positioning line
              </span>
              <RichArea
                id="f-pos"
                label="Positioning line"
                kind="inline"
                value={p.positioning}
                className={styles.richSm}
                onChange={(positioning) => {
                  set((d) => ({ ...d, positioning }));
                }}
              />
              <div className={styles.hrow}>
                {plainLength(p.positioning) > POSITIONING_HARD ? (
                  <span className={styles.errText}>
                    Trim to {POSITIONING_HARD} characters. Aim for {POSITIONING_SOFT}.
                  </span>
                ) : (
                  <span className={styles.hint}>One sentence. Says what you build and why it matters.</span>
                )}
                <Counter length={plainLength(p.positioning)} limit={POSITIONING_SOFT} />
              </div>
            </div>
            <div className={styles.two}>
              <TextField
                id="f-loc"
                label="Location"
                value={p.location ?? ""}
                maxLength={40}
                onChange={(e) => {
                  const location = e.target.value;
                  set((d) => ({ ...d, location: location || undefined }));
                }}
              />
              <div className={styles.fld}>
                <span className={styles.lbl}>Availability</span>
                <Switch
                  checked={Boolean(p.availability)}
                  onCheckedChange={(on) => {
                    set((d) => {
                      const next = {
                        ...d,
                        availability: on ? avText || undefined : undefined,
                        unconfirmed: on ? d.unconfirmed : d.unconfirmed.filter((k) => k !== "availability"),
                      };
                      return next;
                    });
                  }}
                >
                  Show availability in the hero
                </Switch>
                {p.availability !== undefined ? (
                  <input
                    className={styles.inp}
                    aria-label="Availability text"
                    value={avText}
                    maxLength={60}
                    placeholder="e.g. Open to senior product roles"
                    onChange={(e) => {
                      const v = e.target.value;
                      setAvText(v);
                      set((d) => ({ ...d, availability: v }));
                    }}
                  />
                ) : null}
                <div className={styles.hrow}>
                  <span className={styles.hint}>
                    {!p.availability
                      ? "Off. Turn it on only if you want to say it publicly."
                      : factFor("availability")
                        ? "From your current site. Keep it only while it’s true."
                        : "Shown as a small chip in the hero."}
                  </span>
                  {p.availability && factFor("availability") ? (
                    <button
                      type="button"
                      className={styles.fixb}
                      style={{ marginLeft: "auto" }}
                      onClick={() => {
                        confirm("availability", "live", "Availability confirmed.");
                      }}
                    >
                      Still true
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            <HeroButton
              value={p.heroButtons.primary}
              onCommit={(primary) => {
                set((d) => ({ ...d, heroButtons: { ...d.heroButtons, primary } }));
              }}
            />
            <div className={styles.fld}>
              <Switch
                checked={Boolean(p.heroButtons.resume)}
                onCheckedChange={(resume) => {
                  set((d) => ({ ...d, heroButtons: { ...d.heroButtons, resume } }));
                }}
              >
                Show the Résumé (PDF) button
              </Switch>
            </div>
          </Sec>

          {/* ---------------------------------------------------------------- Proof strip */}
          <Sec
            id="h-proof"
            title="Proof strip"
            sub="The numbers under the hero. Where your current site and résumé disagree, the live value stays until you pick one."
            aside={
              proofOpen ? (
                <span className="chip" style={{ background: "var(--warnbg)", color: "var(--warn)" }}>
                  {proofOpen} to confirm
                </span>
              ) : null
            }
          >
            <div className={styles.list}>
              {proofRows.map((row) => {
                const key = `proof.${row.id}.value`;
                const f = factFor(key);
                const fact = p.facts[key];
                const open = editing === row.id;
                const chip = f
                  ? ["Needs your call", "var(--warnbg)", "var(--warn)"]
                  : fact
                    ? [fact.source === "resume" ? "Résumé figure" : "Site figure", "var(--okbg)", "var(--ok)"]
                    : null;
                const edit = (patch: Partial<Profile["proof"][number]>) => {
                  set((d) => ({
                    ...d,
                    proof: d.proof.map((x) => (x.id === row.id ? { ...x, ...patch } : x)),
                  }));
                };
                return (
                  <div key={row.id} className={styles.pr}>
                    <span className={styles.prV}>{proofText(row)}</span>
                    <span className={styles.prL}>
                      {row.label}
                      {row.source || !row.visible ? (
                        <span className={styles.prSrc}>
                          {[row.source, row.visible ? "" : "Hidden in Website"].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.prEnd}>
                      {chip ? (
                        <span className="chip" style={{ background: chip[1], color: chip[2] }}>
                          {chip[0]}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className={styles.fixb}
                        aria-label={`Edit ${proofText(row)} ${row.label}`}
                        aria-expanded={open}
                        onClick={() => {
                          setEditing(open ? null : row.id);
                        }}
                      >
                        Edit
                      </button>
                    </span>
                    {f && !open
                      ? flag(f, () => {
                          setEditing(row.id);
                        })
                      : null}
                    {open ? (
                      <div className={styles.inline}>
                        {f?.alternative ? (
                          <p className={styles.ref}>
                            Your résumé says “{f.alternative}”. Update the number and its label to match, then
                            confirm.
                          </p>
                        ) : null}
                        <div className={styles.three}>
                          <TextField
                            id={`pv-${row.id}`}
                            label="Number"
                            value={row.value}
                            onChange={(e) => {
                              edit({ value: e.target.value });
                            }}
                          />
                          <TextField
                            id={`pu-${row.id}`}
                            label="Unit"
                            value={row.unit ?? ""}
                            placeholder="e.g. M+"
                            onChange={(e) => {
                              const unit = e.target.value;
                              set((d) => ({
                                ...d,
                                proof: d.proof.map((x) => {
                                  if (x.id !== row.id) return x;
                                  const { unit: _drop, ...rest } = x;
                                  return unit ? { ...rest, unit } : rest;
                                }),
                              }));
                            }}
                          />
                          <TextField
                            id={`pl-${row.id}`}
                            label="Label"
                            value={row.label}
                            onChange={(e) => {
                              edit({ label: e.target.value });
                            }}
                          />
                        </div>
                        <div className={styles.inlineEnd}>
                          {f?.alternative ? (
                            <button
                              type="button"
                              className={buttons.btn}
                              onClick={() => {
                                set((d) => {
                                  const next = pickFact(d, key, "live");
                                  const fct = next.facts[key];
                                  if (fct?.alternative)
                                    next.facts[key] = {
                                      source: "resume",
                                      alternative: { value: f.live, source: fct.source },
                                    };
                                  return next;
                                });
                                setEditing(null);
                                announce("Résumé figure confirmed.");
                              }}
                            >
                              Save and confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={buttons.btn}
                              onClick={() => {
                                setEditing(null);
                              }}
                            >
                              Done
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className={styles.fld}>
              <TextField
                id="f-spaces"
                label="Problem spaces"
                value={p.spaces?.label ?? ""}
                placeholder="e.g. Problem spaces"
                hint="The label and chips beside the numbers."
                onChange={(e) => {
                  const label = e.target.value;
                  set((d) => ({ ...d, spaces: { label, items: d.spaces?.items ?? [] } }));
                }}
              />
              <ul className={styles.chips} aria-label="Problem spaces">
                {(p.spaces?.items ?? []).map((item, i, all) => (
                  <li key={`${item}-${String(i)}`} className={styles.spaceChip}>
                    <span>{item}</span>
                    <Arrows
                      name={item}
                      index={i}
                      count={all.length}
                      onMove={(by) => {
                        set((d) => ({
                          ...d,
                          spaces: {
                            label: d.spaces?.label ?? "",
                            items: shift(d.spaces?.items ?? [], i, by),
                          },
                        }));
                      }}
                    />
                    <button
                      type="button"
                      className={cx("ib", styles.sm)}
                      aria-label={`Remove ${item}`}
                      onClick={() => {
                        set((d) => ({
                          ...d,
                          spaces: {
                            label: d.spaces?.label ?? "",
                            items: (d.spaces?.items ?? []).filter((_, j) => j !== i),
                          },
                        }));
                        announce(`${item} removed.`);
                      }}
                    >
                      <StudioIcon name="close" />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className={styles.addRow}
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = newSpace.trim();
                  if (!v) return;
                  set((d) => ({
                    ...d,
                    spaces: { label: d.spaces?.label ?? "", items: [...(d.spaces?.items ?? []), v] },
                  }));
                  setNewSpace("");
                  announce(`${v} added.`);
                }}
              >
                <input
                  className={styles.inp}
                  aria-label="New problem space"
                  placeholder="Add a problem space"
                  value={newSpace}
                  onChange={(e) => {
                    setNewSpace(e.target.value);
                  }}
                />
                <button type="submit" className={buttons.btn}>
                  Add
                </button>
              </form>
            </div>
          </Sec>

          {/* ---------------------------------------------------------------- About */}
          <Sec id="h-about" title="About">
            <div className={styles.fld}>
              <RichArea
                label="About text"
                value={aboutToRich(p.about.body)}
                className={styles.rich}
                onChange={(html) => {
                  const body = richToAbout(html);
                  set((d) => ({ ...d, about: { ...d.about, body } }));
                }}
              />
            </div>
            <div className={styles.fld}>
              <span className={styles.lbl}>Points</span>
              <div className={styles.list}>
                {(p.about.points ?? []).map((pt, i, all) => {
                  const edit = (patch: Partial<typeof pt>) => {
                    set((d) => ({
                      ...d,
                      about: {
                        ...d.about,
                        points: (d.about.points ?? []).map((x) => (x.id === pt.id ? { ...x, ...patch } : x)),
                      },
                    }));
                  };
                  const name = pt.title || `point ${String(i + 1)}`;
                  return (
                    <div key={pt.id} className={styles.point}>
                      <div className={styles.pointBody}>
                        <TextField
                          id={`pt-${pt.id}`}
                          label="Title"
                          value={pt.title}
                          onChange={(e) => {
                            edit({ title: e.target.value });
                          }}
                        />
                        <RichArea
                          label={`Text for ${name}`}
                          kind="inline"
                          value={pt.text}
                          className={styles.richSm}
                          onChange={(text) => {
                            edit({ text });
                          }}
                        />
                      </div>
                      <span className={styles.pointEnd}>
                        <Arrows
                          name={name}
                          index={i}
                          count={all.length}
                          onMove={(by) => {
                            set((d) => ({
                              ...d,
                              about: { ...d.about, points: shift(d.about.points ?? [], i, by) },
                            }));
                          }}
                        />
                        <button
                          type="button"
                          className={cx("ib", styles.sm)}
                          aria-label={`Remove ${name}`}
                          onClick={() => {
                            set((d) => ({
                              ...d,
                              about: {
                                ...d.about,
                                points: (d.about.points ?? []).filter((x) => x.id !== pt.id),
                              },
                            }));
                            announce("Point removed.");
                          }}
                        >
                          <Icon name="trash" />
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className={cx(buttons.btn, styles.addBtn)}
                onClick={() => {
                  set((d) => ({
                    ...d,
                    about: {
                      ...d.about,
                      points: [...(d.about.points ?? []), { id: newId("pt"), title: "", text: "" }],
                    },
                  }));
                }}
              >
                Add point
              </button>
            </div>
          </Sec>

          {/* ---------------------------------------------------------------- Experience */}
          <Sec
            id="h-exp"
            title="Experience"
            sub="From your résumé. Switch off any role you don’t want on the timeline."
            aside={
              <button
                type="button"
                className={cx(buttons.btn, styles.btn36)}
                onClick={() => {
                  const id = newId("e");
                  set((d) => ({
                    ...d,
                    experience: [{ id, company: "", role: "", dates: "", highlights: [] }, ...d.experience],
                  }));
                  lay.update((l) => prependItem(l, "experience", id));
                  setEditing(id);
                  announce("Role added. Fill in its details.");
                }}
              >
                Add role
              </button>
            }
          >
            <div className={styles.list}>
              {expRows.map((x) => {
                const role = x.role || "New role";
                const co = x.company || "a company";
                const open = editing === x.id;
                const ph = placeholders.filter((h) => h.experienceId === x.id);
                const bullets = facts.filter((f) => f.where === "experience" && f.experienceId === x.id);
                const edit = (patch: Partial<Profile["experience"][number]>) => {
                  set((d) => ({
                    ...d,
                    experience: d.experience.map((e) => (e.id === x.id ? { ...e, ...patch } : e)),
                  }));
                };
                return (
                  <div key={x.id} className={styles.xr}>
                    <span className={styles.xrMain}>
                      <button
                        type="button"
                        className={styles.rowName}
                        aria-expanded={open}
                        onClick={() => {
                          setEditing(open ? null : x.id);
                        }}
                      >
                        <strong>{role}</strong> · {x.company || "Company"}
                      </button>
                    </span>
                    <span className={styles.xrDates}>{x.dates}</span>
                    <span className={styles.xrEnd}>
                      <Switch
                        checked={x.visible}
                        label={`Show ${role} at ${co} on the site`}
                        onCheckedChange={(on) => {
                          lay.update((l) => setItemVisible(l, "experience", x.id, on));
                        }}
                      />
                    </span>
                    {ph.map((h) => (
                      <div key={h.itemId} className={styles.xflag}>
                        Your current site shows a “$XXXK” placeholder here. It stays hidden until you remove
                        it.
                        <button
                          type="button"
                          className={styles.fixb}
                          onClick={() => {
                            set((d) => removeItem(d, h.experienceId, h.itemId));
                            announce("Placeholder removed.");
                          }}
                        >
                          Remove the placeholder
                        </button>
                      </div>
                    ))}
                    {bullets.map((f) =>
                      editing === f.key ? (
                        <div key={f.key} className={styles.inline}>
                          <p className={styles.ref}>Your résumé says “{f.alternative}”.</p>
                          <BulletEditor
                            fact={f}
                            onSave={(text) => {
                              set((d) => {
                                const next = setFact(pickFact(d, f.key, "live"), f.key, text);
                                next.facts[f.key] = {
                                  source: "resume",
                                  alternative: { value: f.live, source: "current-site" },
                                };
                                return next;
                              });
                              setEditing(null);
                              announce("Résumé figure confirmed.");
                            }}
                            onCancel={() => {
                              setEditing(null);
                            }}
                          />
                        </div>
                      ) : (
                        flag(f, () => {
                          setEditing(f.key);
                        })
                      ),
                    )}
                    {open ? (
                      <div className={styles.inline}>
                        <div className={styles.two}>
                          <TextField
                            id={`xr-${x.id}`}
                            label="Role"
                            value={x.role}
                            onChange={(e) => {
                              edit({ role: e.target.value });
                            }}
                          />
                          <TextField
                            id={`xc-${x.id}`}
                            label="Company"
                            value={x.company}
                            onChange={(e) => {
                              edit({ company: e.target.value });
                            }}
                          />
                          <TextField
                            id={`xd-${x.id}`}
                            label="Dates"
                            value={x.dates}
                            placeholder="e.g. May 2025 — Present"
                            onChange={(e) => {
                              edit({ dates: e.target.value });
                            }}
                          />
                          <TextField
                            id={`xl-${x.id}`}
                            label="Location"
                            value={x.location ?? ""}
                            onChange={(e) => {
                              const location = e.target.value;
                              set((d) => ({
                                ...d,
                                experience: d.experience.map((e2) => {
                                  if (e2.id !== x.id) return e2;
                                  const { location: _l, ...rest } = e2;
                                  return location ? { ...rest, location } : rest;
                                }),
                              }));
                            }}
                          />
                        </div>
                        <div className={styles.inlineEnd}>
                          <button
                            type="button"
                            className={cx(buttons.btn, styles.danger)}
                            onClick={() => {
                              const before = p;
                              set((d) => ({ ...d, experience: d.experience.filter((e) => e.id !== x.id) }));
                              setEditing(null);
                              toast.show({
                                message: `Removed ${role}.`,
                                tone: "neutral",
                                action: {
                                  label: "Undo",
                                  onAction: () => {
                                    set(() => before);
                                  },
                                },
                              });
                            }}
                          >
                            Remove role
                          </button>
                          <button
                            type="button"
                            className={buttons.btn}
                            onClick={() => {
                              setEditing(null);
                            }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className={styles.fld}>
              <span className={styles.lbl}>Education</span>
              <div className={styles.list}>
                {(p.education ?? []).map((ed, i, all) => {
                  const edit = (patch: Partial<typeof ed>) => {
                    set((d) => ({
                      ...d,
                      education: (d.education ?? []).map((x) => (x.id === ed.id ? { ...x, ...patch } : x)),
                    }));
                  };
                  const name = ed.school || `education ${String(i + 1)}`;
                  return (
                    <div key={ed.id} className={styles.point}>
                      <div className={styles.three}>
                        <TextField
                          id={`es-${ed.id}`}
                          label="School"
                          value={ed.school}
                          onChange={(e) => {
                            edit({ school: e.target.value });
                          }}
                        />
                        <TextField
                          id={`eg-${ed.id}`}
                          label="Degree"
                          value={ed.degree}
                          onChange={(e) => {
                            edit({ degree: e.target.value });
                          }}
                        />
                        <TextField
                          id={`ed-${ed.id}`}
                          label="Dates"
                          value={ed.dates ?? ""}
                          onChange={(e) => {
                            edit({ dates: e.target.value });
                          }}
                        />
                      </div>
                      <span className={styles.pointEnd}>
                        <Arrows
                          name={name}
                          index={i}
                          count={all.length}
                          onMove={(by) => {
                            set((d) => ({ ...d, education: shift(d.education ?? [], i, by) }));
                          }}
                        />
                        <button
                          type="button"
                          className={cx("ib", styles.sm)}
                          aria-label={`Remove ${name}`}
                          onClick={() => {
                            set((d) => ({
                              ...d,
                              education: (d.education ?? []).filter((x) => x.id !== ed.id),
                            }));
                            announce("Education removed.");
                          }}
                        >
                          <Icon name="trash" />
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className={cx(buttons.btn, styles.addBtn)}
                onClick={() => {
                  set((d) => ({
                    ...d,
                    education: [...(d.education ?? []), { id: newId("ed"), school: "", degree: "" }],
                  }));
                }}
              >
                Add education
              </button>
            </div>
          </Sec>

          {/* ---------------------------------------------------------------- Testimonials */}
          <Sec
            id="h-tst"
            title="Testimonials"
            sub="Every one that’s switched on shows in the homepage carousel."
            aside={
              <span className="chip" style={{ background: "#EFEEEA", color: "var(--tx2)" }}>
                {tstOn} on the homepage
              </span>
            }
          >
            <div className={styles.list}>
              {tstRows.map((t, i) => {
                const open = editing === t.id;
                const edit = (patch: Partial<Profile["testimonials"][number]>) => {
                  set((d) => ({
                    ...d,
                    testimonials: d.testimonials.map((x) => (x.id === t.id ? { ...x, ...patch } : x)),
                  }));
                };
                const name = t.name || "this testimonial";
                return (
                  <div key={t.id} className={styles.tr}>
                    <span className={styles.ini} style={{ background: THUMB[t.tone][1] }} aria-hidden="true">
                      {t.initials}
                    </span>
                    <span className={styles.trName}>
                      <button
                        type="button"
                        className={styles.rowName}
                        aria-expanded={open}
                        onClick={() => {
                          setEditing(open ? null : t.id);
                        }}
                      >
                        <strong>{t.name}</strong>
                      </button>
                      <span className={styles.trRole}>{t.role}</span>
                    </span>
                    <span className={styles.trTag}>
                      {t.tag ? (
                        <span className="chip" style={{ background: "#EFEEEA", color: "var(--tx2)" }}>
                          {t.tag}
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.trSw}>
                      <Switch
                        checked={t.visible}
                        label={`Show ${name} on the homepage`}
                        onCheckedChange={(on) => {
                          lay.update((l) => setItemVisible(l, "testimonials", t.id, on));
                        }}
                      >
                        <span className={styles.swText}>Homepage</span>
                      </Switch>
                    </span>
                    <Arrows
                      name={name}
                      index={i}
                      count={tstRows.length}
                      onMove={(by) => {
                        lay.update((l) =>
                          moveItem(
                            l,
                            "testimonials",
                            tstRows.map((x) => x.id),
                            t.id,
                            by,
                          ),
                        );
                        announce(`${name} moved ${by < 0 ? "up" : "down"}.`);
                      }}
                    />
                    {open ? (
                      <div className={styles.inline}>
                        <TextArea
                          id={`tq-${t.id}`}
                          label="Quote"
                          value={t.quote}
                          onChange={(e) => {
                            edit({ quote: e.target.value });
                          }}
                        />
                        <div className={styles.two}>
                          <TextField
                            id={`tn-${t.id}`}
                            label="Name"
                            value={t.name}
                            onChange={(e) => {
                              const n = e.target.value;
                              edit(
                                t.initials === initialsOf(t.name)
                                  ? { name: n, initials: initialsOf(n) }
                                  : { name: n },
                              );
                            }}
                          />
                          <TextField
                            id={`ti-${t.id}`}
                            label="Initials"
                            value={t.initials}
                            maxLength={3}
                            onChange={(e) => {
                              edit({ initials: e.target.value });
                            }}
                          />
                          <TextField
                            id={`tr-${t.id}`}
                            label="Role"
                            value={t.role}
                            onChange={(e) => {
                              edit({ role: e.target.value });
                            }}
                          />
                          <TextField
                            id={`tt-${t.id}`}
                            label="Tag"
                            value={t.tag ?? ""}
                            placeholder="e.g. Design"
                            onChange={(e) => {
                              const tag = e.target.value;
                              set((d) => ({
                                ...d,
                                testimonials: d.testimonials.map((x) => {
                                  if (x.id !== t.id) return x;
                                  const { tag: _t, ...rest } = x;
                                  return tag ? { ...rest, tag } : rest;
                                }),
                              }));
                            }}
                          />
                        </div>
                        <div className={styles.fld}>
                          <span className={styles.lbl} id={`tone-${t.id}`}>
                            Tone
                          </span>
                          <div role="radiogroup" aria-labelledby={`tone-${t.id}`} className={styles.swatches}>
                            {ACCENTS.map((a) => (
                              <button
                                key={a}
                                type="button"
                                role="radio"
                                aria-checked={t.tone === a}
                                aria-label={ACCENT_NAMES[a]}
                                className={styles.swatch}
                                style={{ background: THUMB[a][1] }}
                                onClick={() => {
                                  edit({ tone: a });
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <LinkField
                          id={`tl-${t.id}`}
                          label="LinkedIn"
                          mono
                          value={t.linkedin}
                          placeholder="https://linkedin.com/in/…"
                          onCommit={(linkedin) => {
                            set((d) => ({
                              ...d,
                              testimonials: d.testimonials.map((x) => {
                                if (x.id !== t.id) return x;
                                const { linkedin: _l, ...rest } = x;
                                return linkedin ? { ...rest, linkedin } : rest;
                              }),
                            }));
                          }}
                        />
                        <div className={styles.inlineEnd}>
                          <button
                            type="button"
                            className={buttons.btn}
                            onClick={() => {
                              setEditing(null);
                            }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Sec>

          {/* ---------------------------------------------------------------- Contact and links */}
          <Sec id="h-contact" title="Contact and links">
            <div className={styles.two}>
              <LinkField
                id="f-mail"
                label="Email"
                type="email"
                value={p.contact.email}
                check={isEmail}
                error="Check the address."
                onCommit={(email) => {
                  setContact({ email });
                }}
              />
              <LinkField
                id="f-li"
                label="LinkedIn"
                mono
                value={p.contact.linkedin}
                placeholder="https://linkedin.com/in/…"
                onCommit={(linkedin) => {
                  setContact({ linkedin });
                }}
              />
              <LinkField
                id="f-gh"
                label="GitHub"
                mono
                value={p.contact.github}
                placeholder="https://github.com/…"
                onCommit={(github) => {
                  setContact({ github });
                }}
              />
              <div className={styles.fld}>
                <label className={styles.lbl} htmlFor="f-phone">
                  Phone
                </label>
                <input
                  id="f-phone"
                  className={cx(styles.inp, styles.mono)}
                  type="tel"
                  value={p.contact.phone ?? ""}
                  placeholder="[Your phone number]"
                  onChange={(e) => {
                    const phone = e.target.value;
                    setContact({ phone: phone || undefined });
                  }}
                />
                <Switch
                  checked={p.contact.showPhone}
                  onCheckedChange={(showPhone) => {
                    setContact({ showPhone });
                  }}
                >
                  Show my phone number on the site
                </Switch>
              </div>
            </div>
            <div className={styles.fld}>
              <span className={styles.lbl}>Résumé</span>
              {resumeFile ? (
                <Link to="/studio/media" className={styles.file}>
                  <span className={styles.fileKind}>PDF</span>
                  <span className={styles.fileName}>{resumeFile.filename}</span>
                  <span className={styles.fileGo}>Replace in Media →</span>
                </Link>
              ) : (
                <LinkField
                  id="f-resume"
                  label="Résumé link"
                  hideLabel
                  mono
                  value={p.contact.resume?.url}
                  placeholder="https://… your résumé"
                  hint={
                    <>
                      A link, or upload a PDF in{" "}
                      <Link to="/studio/media" className={styles.u}>
                        Media →
                      </Link>
                    </>
                  }
                  onCommit={(url) => {
                    setContact({ resume: url ? { url } : undefined });
                  }}
                />
              )}
            </div>
            <div className={styles.fld}>
              <Segmented
                label="“Let’s Talk” goes to"
                value={p.contact.letsTalk}
                options={[
                  { value: "contact", label: "Contact section" },
                  { value: "email", label: "Email" },
                  { value: "linkedin", label: "LinkedIn" },
                  { value: "booking", label: "A booking link" },
                ]}
                onChange={(letsTalk) => {
                  setContact({ letsTalk });
                }}
              />
              {p.contact.letsTalk === "booking" ? (
                <LinkField
                  id="f-booking"
                  label="Booking link"
                  hideLabel
                  value={p.contact.booking}
                  placeholder="https://… your booking page"
                  hint={LETS_TALK_HINT.booking}
                  onCommit={(booking) => {
                    setContact({ booking });
                  }}
                />
              ) : (
                <div className={styles.hrow}>
                  <span className={styles.hint}>{LETS_TALK_HINT[p.contact.letsTalk]}</span>
                </div>
              )}
            </div>
          </Sec>
        </div>

        {/* ---------------------------------------------------------------- preview and checklist */}
        <aside className={styles.side} aria-label="Preview and checklist">
          <div>
            <div className="mono" style={{ marginBottom: 10 }}>
              Hero · live preview
            </div>
            <div className={styles.pv}>
              <div className={styles.pvChips}>
                <span className={styles.pvRole}>
                  {p.title}
                  {p.experience[0]?.company ? ` · ${p.experience[0].company}` : ""}
                </span>
                {p.availability?.trim() ? <span className={styles.pvAv}>{p.availability}</span> : null}
              </div>
              <div className={styles.pvName}>
                {p.name || "Your name"}
                <span style={{ color: "#D61F33" }}>.</span>
              </div>
              <p className={styles.pvPos}>
                <RichText html={p.positioning} inline />
              </p>
              <div className={styles.pvProof}>
                {proofRows
                  .filter((r) => r.visible)
                  .slice(0, 4)
                  .map((r) => (
                    <div key={r.id}>
                      <div className={styles.pvV}>{proofText(r)}</div>
                      <div className={styles.pvL}>{r.label}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className={cx("card", styles.checks)}>
            <div className={styles.checksTitle}>Before you publish</div>
            <div className={styles.checksSum}>{summary}</div>
            <ul className={styles.checkList}>
              {checks.map((c) => (
                <li key={c.text}>
                  <span aria-hidden="true" className={c.ok ? styles.ok : styles.todo}>
                    {c.ok ? "✓" : "!"}
                  </span>
                  <span>
                    <span className="sr-only">{c.ok ? "Done: " : "To confirm: "}</span>
                    {c.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <UnconfirmedDialog
        open={dialog !== null}
        count={dialog ?? openCount(p)}
        busy={publishing}
        onCancel={() => {
          setDialog(null);
        }}
        onPublish={() => void publish(true)}
      />
      <ConflictDialog
        open={prof.conflict !== null || lay.conflict !== null}
        subject="Your profile"
        what="Your profile was edited on another device."
        theirs={prof.conflict ? "Profile" : "Homepage order"}
        yours={prof.conflict ? "Profile" : "Homepage order"}
        onKeepMine={() => {
          if (prof.conflict) prof.keepMine();
          if (lay.conflict) lay.keepMine();
        }}
        onLoadLatest={() => {
          if (prof.conflict) prof.loadLatest();
          if (lay.conflict) lay.loadLatest();
        }}
      />
    </main>
  );
}

function BulletEditor({
  fact,
  onSave,
  onCancel,
}: {
  fact: OpenFact;
  onSave: (html: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(fact.live);
  return (
    <>
      <RichArea
        label="Highlight text"
        kind="inline"
        value={text}
        className={styles.richSm}
        onChange={setText}
      />
      <div className={styles.inlineEnd}>
        <button type="button" className={buttons.btn} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={buttons.btn}
          onClick={() => {
            onSave(text);
          }}
        >
          Save and confirm
        </button>
      </div>
    </>
  );
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * A link or address field. What the owner types stays here until it's valid (or empty), and only
 * then goes to the draft, so a half-typed link never blocks saving the rest of the profile.
 */
function LinkField({
  id,
  label,
  value,
  onCommit,
  check = isHttpsUrl,
  error = "Use a full link that starts with https://",
  hint,
  hideLabel,
  mono,
  type,
  placeholder,
}: {
  id: string;
  label: string;
  value: string | undefined;
  onCommit: (value: string | undefined) => void;
  check?: (v: string) => boolean;
  error?: string;
  hint?: ReactNode;
  hideLabel?: boolean;
  mono?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(value ?? "");
  const [seen, setSeen] = useState(value);
  // The draft changed from outside (Load latest, Undo): show that instead.
  if (value !== seen) {
    setSeen(value);
    if ((value ?? "") !== text.trim()) setText(value ?? "");
  }
  const t = text.trim();
  const bad = t !== "" && !check(t);
  const change = (next: string) => {
    setText(next);
    const v = next.trim();
    if (v === "" || check(v)) {
      setSeen(v || undefined);
      onCommit(v || undefined);
    }
  };
  if (hideLabel)
    return (
      <div>
        <input
          id={id}
          className={cx(styles.inp, mono && styles.mono)}
          aria-label={label}
          type={type}
          value={text}
          placeholder={placeholder}
          aria-invalid={bad || undefined}
          aria-describedby={`${id}-h`}
          onChange={(e) => {
            change(e.target.value);
          }}
        />
        <div className={styles.hrow} id={`${id}-h`}>
          <span className={bad ? styles.errText : styles.hint}>{bad ? error : hint}</span>
        </div>
      </div>
    );
  return (
    <TextField
      id={id}
      label={label}
      mono={mono}
      type={type}
      value={text}
      placeholder={placeholder}
      hint={hint}
      error={bad ? error : undefined}
      onChange={(e) => {
        change(e.target.value);
      }}
    />
  );
}

type Primary = Profile["heroButtons"]["primary"];

/** The hero button: written to the draft once it has a label and a safe link, or when cleared. */
function HeroButton({ value, onCommit }: { value: Primary; onCommit: (v: Primary) => void }) {
  const [label, setLabel] = useState(value?.label ?? "");
  const [href, setHref] = useState(value?.href ?? "");
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setLabel(value?.label ?? "");
    setHref(value?.href ?? "");
  }
  const badHref = href.trim() !== "" && !isSafeLink(href.trim());
  const commit = (l: string, h: string) => {
    const L = l.trim();
    const H = h.trim();
    if (!L && !H) {
      setSeen(undefined);
      onCommit(undefined);
    } else if (L && H && isSafeLink(H) && L.length <= HERO_BUTTON_MAX) {
      const next = { label: l, href: H };
      setSeen(next);
      onCommit(next);
    }
  };
  return (
    <div className={styles.two}>
      <TextField
        id="f-btn-label"
        label="Hero button"
        value={label}
        maxLength={HERO_BUTTON_MAX}
        counter={{ limit: HERO_BUTTON_MAX }}
        placeholder="e.g. View my work"
        onChange={(e) => {
          setLabel(e.target.value);
          commit(e.target.value, href);
        }}
      />
      <TextField
        id="f-btn-href"
        label="Hero button link"
        mono
        value={href}
        placeholder="#work or https://…"
        hint={
          label.trim() && !href.trim()
            ? "Add a link to show the button."
            : "A section on the page (#work) or a full link."
        }
        error={badHref ? "Use an https:// or mailto: link, a /path or a #section." : undefined}
        onChange={(e) => {
          setHref(e.target.value);
          commit(label, e.target.value);
        }}
      />
    </div>
  );
}
