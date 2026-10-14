/**
 * Outcomes (05 · Outcomes; EditorOutcomes): each result's number, what it measures, its type and
 * whose it is, the private evidence note, the strip switch and the card headline star; the dark
 * live preview, the honesty check and the label key on the right.
 *
 * A new result has no type yet, and the schema can't store one without, so it waits here until
 * the owner picks a type ("Pick one. Unlabelled numbers can't be published.").
 */
import { useState } from "react";

import { cx } from "../../cx";
import { Icon } from "../../icons";
import buttons from "../Button.module.css";
import { Switch } from "../Controls";
import { StudioIcon } from "../StudioIcon";
import { useShell } from "../shell/ShellContext";
import { useToast } from "../Toast";
import { EditorCols } from "./EditorFrame";
import styles from "./OutcomesTab.module.css";
import { useEditor } from "./ProjectEditor";
import { newId } from "~/lib/defaults";
import { RESULT_TYPES } from "~/lib/schemas";
import { honesty } from "~/lib/studio/checks";
import type { Outcome, ResultType } from "~/lib/types";

const TYPE_HELP: Record<ResultType, [string, string]> = {
  achieved: ["Measured after launch. Needs a private evidence note.", "ACHIEVED"],
  target: ["A goal, not a measurement. Shown with an outline tag.", "TARGET"],
  projected: ["A forecast. Note how you got it, so you can explain it.", "PROJECTED"],
  baseline: ["Where things stood before. The starting point for a target.", "BASELINE"],
  output: ["Something you made, like screens, a PRD or a prototype.", "OUTPUT"],
};
const TYPE_NAME: Record<ResultType, string> = {
  achieved: "Achieved",
  target: "Target",
  projected: "Projected",
  baseline: "Baseline",
  output: "Output",
};
/** The dark preview's tags: fill, text, border style, border colour. */
const DARK: Record<ResultType, [string, string, string, string]> = {
  achieved: ["rgba(60,203,139,.12)", "#9BE7C4", "solid", "transparent"],
  target: ["transparent", "#B9B7B1", "solid", "rgba(242,241,238,.3)"],
  projected: ["transparent", "#B9B7B1", "dashed", "rgba(242,241,238,.4)"],
  baseline: ["#1D1D24", "#B9B7B1", "solid", "transparent"],
  output: ["rgba(255,90,103,.12)", "#FF5A67", "solid", "transparent"],
};
const CREDIT: Record<NonNullable<Outcome["credit"]>, string> = {
  mine: "My ownership",
  team: "Team result",
  business: "Business outcome",
};

type Draft = Omit<Outcome, "type"> & { type?: ResultType };

function Tag({ type }: { type: ResultType | undefined }) {
  const d = type ? DARK[type] : (["transparent", "#8F8D87", "dashed", "rgba(242,241,238,.3)"] as const);
  return (
    <span className={styles.lt} style={{ background: d[0], color: d[1], border: `1px ${d[2]} ${d[3]}` }}>
      {type ? TYPE_HELP[type][1] : "NO LABEL"}
    </span>
  );
}

export function OutcomesTab() {
  const e = useEditor();
  const toast = useToast();
  const { announce } = useShell();
  const d = e.draft;
  const [pending, setPending] = useState<Draft[]>([]);
  const [moved, setMoved] = useState<{ id: string; flip: number } | null>(null);
  const all: Draft[] = [...d.outcomes, ...pending];

  const setOutcomes = (fn: (o: Outcome[]) => Outcome[], head?: string | null) => {
    e.update((x) => {
      const outcomes = fn(x.outcomes);
      const h = head === undefined ? x.headlineOutcomeId : (head ?? undefined);
      const next = { ...x, outcomes };
      if (h && outcomes.some((o) => o.id === h)) next.headlineOutcomeId = h;
      else delete next.headlineOutcomeId;
      return next;
    });
  };

  const patch = (id: string, p: Partial<Draft>) => {
    if (pending.some((x) => x.id === id)) {
      const next = pending.map((x) => (x.id === id ? { ...x, ...p } : x));
      const ready = next.find((x) => x.id === id);
      if (ready?.type) {
        setPending(next.filter((x) => x.id !== id));
        setOutcomes((o) => [...o, ready as Outcome]);
      } else setPending(next);
      return;
    }
    setOutcomes((o) =>
      o.map((x) => {
        if (x.id !== id) return x;
        const out = { ...x, ...p };
        if (p.evidence === "") delete out.evidence;
        return out;
      }),
    );
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = d.outcomes.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= d.outcomes.length) return;
    setOutcomes((o) => {
      const arr = o.slice();
      const [x] = arr.splice(i, 1);
      if (x) arr.splice(j, 0, x);
      return arr;
    });
    setMoved((m) => ({ id, flip: (m?.flip ?? 0) + 1 }));
    announce(`Result moved to position ${j + 1}.`);
  };

  const remove = (id: string) => {
    if (pending.some((x) => x.id === id)) {
      setPending((p) => p.filter((x) => x.id !== id));
      return;
    }
    const idx = d.outcomes.findIndex((x) => x.id === id);
    const item = d.outcomes[idx];
    const wasHead = d.headlineOutcomeId === id;
    setOutcomes((o) => o.filter((x) => x.id !== id), wasHead ? null : undefined);
    announce("Result deleted.");
    toast.show({
      message: "Result deleted.",
      tone: "neutral",
      action: {
        label: "Undo",
        onAction: () => {
          if (item) setOutcomes((o) => [...o.slice(0, idx), item, ...o.slice(idx)], wasHead ? id : undefined);
          setMoved((m) => ({ id, flip: (m?.flip ?? 0) + 1 }));
          toast.show({ message: "Result restored." });
          announce("Result restored.");
        },
      },
    });
  };

  const add = () => {
    const id = newId("o");
    setPending((p) => [...p, { id, value: "", label: "", inStrip: true }]);
    setMoved((m) => ({ id, flip: (m?.flip ?? 0) + 1 }));
  };

  const head = d.outcomes.find((o) => o.id === d.headlineOutcomeId);
  const strip = d.outcomes.filter((o) => o.inStrip && o.value.trim());
  const checks = honesty(d);
  const ICON = {
    ok: ["✓", "#E6F4EC", "#0F7A4A", "Passed: "],
    warn: ["!", "#FFF4DB", "#8A5A00", "Check: "],
    err: ["×", "#FDECEA", "#B42318", "Must fix: "],
  } as const;

  return (
    <EditorCols
      asideLabel="Preview and checks"
      aside={
        <>
          <div>
            <div className={styles.pvHead}>
              <span className="mono">On the page · live preview</span>
              <span className={styles.pvNote}>Dark theme</span>
            </div>
            <div className={styles.pv}>
              <div className={styles.pvLabel}>Results</div>
              {strip.length === 0 ? (
                <div className={styles.pvEmpty}>Nothing in the strip. The page skips this section.</div>
              ) : null}
              {strip.length > 0 ? (
                <div className={styles.strip}>
                  {strip.map((o) => (
                    <div key={o.id} className={styles.stripItem}>
                      <div className={styles.stripTop}>
                        <span className={styles.big}>{o.value}</span>
                        <Tag type={o.type} />
                      </div>
                      <div className={styles.stripLbl}>{o.label || "…"}</div>
                      <div className={styles.stripCredit}>
                        {o.credit ? CREDIT[o.credit] : "Credit not set"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className={styles.pvLabel} style={{ marginTop: 18 }}>
                Homepage card headline
              </div>
              {head?.value.trim() ? (
                <div className={styles.head}>
                  <span className={styles.headV}>{head.value}</span>
                  <span className={styles.stripLbl}>{head.label}</span>
                  <Tag type={head.type} />
                </div>
              ) : (
                <div className={styles.pvEmpty}>No headline: the card shows its summary only.</div>
              )}
            </div>
          </div>
          <div className={cx("card", styles.box)}>
            <div className={styles.boxTitle}>Honesty check</div>
            <div className={styles.boxSub}>Runs as you edit, and again before publishing.</div>
            <div className={styles.checks}>
              {checks.map((h) => (
                <div key={h.text} className={styles.check}>
                  <span
                    className={styles.checkIco}
                    style={{ background: ICON[h.level][1], color: ICON[h.level][2] }}
                    aria-hidden="true"
                  >
                    {ICON[h.level][0]}
                  </span>
                  <span>
                    <span className="sr-only">{ICON[h.level][3]}</span>
                    {h.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className={cx("card", styles.box)}>
            <div className={styles.boxTitle}>What the labels mean</div>
            <div className={styles.key}>
              {(
                [
                  [
                    "ACHIEVED",
                    { background: "rgba(60,203,139,.14)", color: "#0F7A4A" },
                    "Measured after launch. Needs evidence.",
                  ],
                  [
                    "TARGET",
                    { border: "1px solid rgba(20,20,22,.3)", color: "#4A4A51" },
                    "A goal you set or were given. Not measured yet.",
                  ],
                  [
                    "PROJECTED",
                    { border: "1px dashed rgba(20,20,22,.4)", color: "#4A4A51" },
                    "A forecast from a model or estimate.",
                  ],
                  [
                    "BASELINE",
                    { background: "#F0F0EC", color: "#4A4A51" },
                    "Where things stood before you started.",
                  ],
                  [
                    "OUTPUT",
                    { background: "rgba(214,31,51,.08)", color: "#C2182C" },
                    "Something you made: screens, a PRD, a prototype.",
                  ],
                ] as const
              ).map(([t, st, text]) => (
                <div key={t} className={styles.keyRow}>
                  <span className={styles.lt} style={st}>
                    {t}
                  </span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div className={styles.keyNote}>Each label differs by fill or outline, not only colour.</div>
          </div>
        </>
      }
    >
      <div className={styles.top}>
        <div>
          <h2 className={styles.h2}>Results</h2>
          <p className={styles.intro}>
            Every number says what kind of result it is and whose it is. Visitors see both. Your evidence note
            stays private, for you and for interviews.
          </p>
        </div>
        <button type="button" className={buttons.btn} onClick={add}>
          <Icon name="plus" size={16} />
          Add result
        </button>
      </div>

      {all.length === 0 ? (
        <div className={styles.none}>
          <div className={styles.noneTitle}>No results yet</div>
          <div className={styles.noneText}>
            The card shows the summary instead of a headline number, and the page skips its results strip.
            Strategy work often has targets rather than outcomes: label them as targets.
          </div>
          <button type="button" className={buttons.btn} onClick={add}>
            Add a result
          </button>
        </div>
      ) : null}

      <div className={styles.list}>
        {all.map((m, i) => {
          const n = i + 1;
          const a = m.type === "achieved";
          const evErr = a && !m.evidence?.trim();
          const isHead = d.headlineOutcomeId === m.id;
          const isPending = !m.type;
          const noType = isPending && (e.showErrors || (m.value.trim() !== "" && m.label.trim() !== ""));
          const ring = moved?.id === m.id ? (moved.flip % 2 ? "ringA" : "ringB") : "";
          return (
            <article
              key={m.id}
              id={`f-outcome-${m.id}`}
              className={cx(styles.mc, ring)}
              aria-label={`Result ${n}`}
              style={{ borderColor: evErr ? "#E8A39B" : isHead ? "#141416" : undefined }}
            >
              <div className={styles.mcHead}>
                <span className="mono">Result {n}</span>
                <button
                  type="button"
                  className={styles.hl}
                  aria-pressed={isHead}
                  disabled={isPending}
                  title="The one number on the homepage card"
                  onClick={() => {
                    setOutcomes((o) => o, isHead ? null : m.id);
                    announce(isHead ? "No headline on the card." : "Card headline changed.");
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    aria-hidden="true"
                    style={{
                      fill: isHead ? "#D61F33" : "none",
                      stroke: "currentColor",
                      strokeWidth: 1.75,
                      strokeLinejoin: "round",
                    }}
                  >
                    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />
                  </svg>
                  {isHead ? "Card headline" : "Make card headline"}
                </button>
                <span style={{ flex: 1 }} />
                <button
                  type="button"
                  className="ib"
                  aria-label={`Move result ${n} up`}
                  aria-disabled={i === 0 || isPending}
                  onClick={() => {
                    move(m.id, -1);
                  }}
                >
                  <StudioIcon name="up" />
                </button>
                <button
                  type="button"
                  className="ib"
                  aria-label={`Move result ${n} down`}
                  aria-disabled={i >= d.outcomes.length - 1 || isPending}
                  onClick={() => {
                    move(m.id, 1);
                  }}
                >
                  <StudioIcon name="down" />
                </button>
                <button
                  type="button"
                  className="ib"
                  aria-label={`Delete result ${n}`}
                  onClick={() => {
                    remove(m.id);
                  }}
                >
                  <Icon name="trash" />
                </button>
              </div>
              <div className={styles.nums}>
                <label className={styles.numLbl}>
                  Number
                  <input
                    className={cx(styles.inp, styles.bigInp, e.showErrors && !m.value.trim() && styles.bad)}
                    value={m.value}
                    placeholder="e.g. 52%"
                    onChange={(ev) => {
                      patch(m.id, { value: ev.target.value });
                    }}
                  />
                </label>
                <label className={styles.numLbl}>
                  What it measures
                  <input
                    className={cx(styles.inp, e.showErrors && !m.label.trim() && styles.bad)}
                    value={m.label}
                    placeholder="e.g. renewal rate"
                    onChange={(ev) => {
                      patch(m.id, { label: ev.target.value });
                    }}
                  />
                </label>
              </div>
              <div className={styles.row}>
                <span className={styles.lbl}>
                  Type of result <span className={styles.req}>Required</span>
                </span>
                <div
                  className={cx("seg", styles.seg)}
                  role="group"
                  aria-label={`Type of result ${n}`}
                  style={{ border: `1px solid ${noType ? "#B42318" : "transparent"}` }}
                >
                  {RESULT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={m.type === t}
                      onClick={() => {
                        patch(m.id, { type: t });
                        announce(`Type set to ${t}.`);
                      }}
                    >
                      {TYPE_NAME[t]}
                    </button>
                  ))}
                </div>
                <div className={styles.hrow} style={{ color: noType ? "#B42318" : "#6A6A72" }}>
                  {m.type ? TYPE_HELP[m.type][0] : "Pick one. Unlabelled numbers can’t be published."}
                </div>
              </div>
              <div className={styles.row} style={{ marginTop: 12 }}>
                <span className={styles.lbl}>
                  Whose result <span className={styles.req}>Recommended</span>
                </span>
                <div className={cx("seg", styles.seg)} role="group" aria-label={`Whose result ${n}`}>
                  {(["mine", "team", "business"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={m.credit === c}
                      onClick={() => {
                        patch(m.id, { credit: c });
                      }}
                    >
                      {CREDIT[c]}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.row} style={{ marginTop: 14 }}>
                <label className={styles.lbl} htmlFor={`ev-${m.id}`}>
                  Evidence <span className={styles.req}>{a ? "Required for achieved" : "Optional"}</span>
                  <Icon name="lock" size={14} style={{ color: "var(--tx3)" }} />
                  <span className={styles.only}>Only you see this</span>
                </label>
                <textarea
                  id={`ev-${m.id}`}
                  className={cx(styles.inp, styles.ev, evErr && styles.bad)}
                  value={m.evidence ?? ""}
                  placeholder={
                    a
                      ? "Where the number comes from: a dashboard, report or experiment"
                      : "Where the goal or estimate came from"
                  }
                  aria-invalid={evErr}
                  aria-describedby={evErr ? `ev-${m.id}-err` : undefined}
                  onChange={(ev) => {
                    patch(m.id, { evidence: ev.target.value });
                  }}
                />
                {evErr ? (
                  <div id={`ev-${m.id}-err`} className={styles.err}>
                    <Icon name="alert-circle" size={16} />
                    Achieved results need a note on where the number comes from: a dashboard, report or
                    experiment.
                  </div>
                ) : null}
              </div>
              <div style={{ marginTop: 8 }}>
                <Switch
                  checked={m.inStrip}
                  onCheckedChange={(v) => {
                    patch(m.id, { inStrip: v });
                  }}
                >
                  Show in the page’s results strip
                </Switch>
              </div>
            </article>
          );
        })}
      </div>
    </EditorCols>
  );
}
