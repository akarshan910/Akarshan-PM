import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { Icon } from "../icons";
import styles from "./TopicPicker.module.css";

/** A post or project holds at most 8 topics (06 · Topics, D44). */
export const TOPIC_CAP = 8;
/** Up to this many topics in the vocabulary, the picker is chips; past it, a dropdown with search. */
export const CHIP_LIMIT = 8;
/** A new topic is at most 32 characters (02 · S1). */
export const TOPIC_MAX_LENGTH = 32;

export interface TopicUse {
  name: string;
  /** How many posts (or projects) use it. 0 shows "new". */
  uses: number;
}

interface TopicPickerProps {
  /** Every topic already used by posts (or by projects), with its use count. */
  vocabulary: readonly TopicUse[];
  /** The topics on this post or project. */
  value: readonly string[];
  onChange: (topics: string[]) => void;
  /** "post" in Writing, "project" in the project editor: the counts and the cap message say it. */
  noun: "post" | "project";
  id?: string | undefined;
  /** For the catalogue: open the dropdown with this query typed. */
  initialQuery?: string | undefined;
  initialOpen?: boolean | undefined;
}

/** Trims, collapses inner spaces and keeps 32 characters. */
export function normaliseTopic(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, TOPIC_MAX_LENGTH).trim();
}

const lower = (s: string) => s.toLocaleLowerCase();

/** "1 post", "N posts", or "new" ("project"/"projects" in the project editor). */
export function usesLabel(uses: number, noun: "post" | "project"): string {
  if (!uses) return "new";
  return `${uses} ${noun}${uses === 1 ? "" : "s"}`;
}

/**
 * 02 · S1: chips while the vocabulary has up to 8 topics, then a multi-select dropdown with search
 * and create. Case-insensitive; the first spelling wins. At 8 selected, unselected topics are
 * disabled, "+ Create" and Enter do nothing, and the live region says so.
 */
export function TopicPicker({
  vocabulary,
  value,
  onChange,
  noun,
  id,
  initialQuery = "",
  initialOpen = false,
}: TopicPickerProps) {
  const auto = useId();
  const base = id ?? `tp${auto.replace(/:/g, "")}`;
  const [created, setCreated] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(initialOpen);
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(initialQuery ? 0 : -1);
  const [announce, setAnnounce] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  // The vocabulary, plus topics created here and any selected ones it doesn't list, deduped by case.
  const uses = new Map<string, number>();
  const all: string[] = [];
  for (const name of [...vocabulary.map((t) => t.name), ...created, ...value]) {
    const k = lower(name);
    if (!uses.has(k)) {
      uses.set(k, 0);
      all.push(name);
    }
  }
  for (const t of vocabulary) uses.set(lower(t.name), Math.max(uses.get(lower(t.name)) ?? 0, t.uses));

  const selected = new Set(value.map(lower));
  const isOn = (t: string) => selected.has(lower(t));
  const full = value.length >= TOPIC_CAP;
  const many = all.length > CHIP_LIMIT;
  const capMessage = `Up to ${TOPIC_CAP} topics per ${noun}.`;

  const say = (text: string) => {
    // The same sentence twice still gets read: vary it invisibly.
    setAnnounce((prev) => (prev === text ? `${text}\u00a0` : text));
  };

  const toggle = (t: string) => {
    if (isOn(t)) {
      onChange(value.filter((v) => lower(v) !== lower(t)));
      say(`Removed ${t}`);
      return;
    }
    if (full) {
      say(capMessage);
      return;
    }
    onChange([...value, t]);
    say(`Added ${t}`);
  };

  /** Adds the typed topic, or selects the existing one it matches. Returns whether it acted. */
  const add = (raw: string): boolean => {
    const v = normaliseTopic(raw);
    if (!v) return false;
    const hit = all.find((t) => lower(t) === lower(v));
    if (full && !(hit && isOn(hit))) {
      say(capMessage);
      return false;
    }
    if (!hit) setCreated((c) => [...c, v]);
    const t = hit ?? v;
    if (!isOn(t)) onChange([...value, t]);
    say(`${hit ? "Added" : "Created and added"} ${t}`);
    return true;
  };

  // The dropdown's list: selected first, then alphabetical, filtered by substring.
  const q = normaliseTopic(query);
  const shown = all
    .filter((t) => !q || lower(t).includes(lower(q)))
    .sort((a, b) => Number(isOn(b)) - Number(isOn(a)) || a.localeCompare(b));
  const canCreate = Boolean(q) && all.every((t) => lower(t) !== lower(q));

  const close = (focusTrigger: boolean) => {
    setOpen(false);
    setQuery("");
    setActive(-1);
    if (focusTrigger) trigger.current?.focus();
  };

  // Clicking outside closes; choices have already applied.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent | MouseEvent) => {
      if (wrap.current && e.target instanceof Node && !wrap.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
        setActive(-1);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  // Opening by hand moves focus into the search; the catalogue's initially open state doesn't.
  const focusSearch = useRef(false);
  useEffect(() => {
    if (open && focusSearch.current) search.current?.focus();
    focusSearch.current = false;
  }, [open]);

  useEffect(() => {
    if (active < 0) return;
    const el = list.current?.children[active];
    if (el instanceof HTMLElement && typeof el.scrollIntoView === "function")
      el.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = shown.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(n ? (active + 1) % n : -1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(n ? (active - 1 + n) % n : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const t = active > -1 ? shown[active] : undefined;
      if (t !== undefined) toggle(t);
      else if (add(query)) {
        setQuery("");
        setActive(-1);
      }
    }
  };

  const onWrapKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      e.preventDefault();
      close(true);
    }
  };

  const labelId = `${base}-l`;
  const head = (
    <div className={styles.head}>
      <span className={styles.lbl} id={labelId}>
        Topics
      </span>
      <span className={styles.count}>
        {all.length} {all.length === 1 ? "topic" : "topics"}
      </span>
    </div>
  );
  const live = (
    <div className="sr-only" aria-live="polite">
      {announce}
    </div>
  );

  if (!many) {
    return (
      <div>
        {head}
        <div className={styles.chips} role="group" aria-labelledby={labelId}>
          {all.map((t) => {
            const on = isOn(t);
            return (
              <button
                key={t}
                type="button"
                className={styles.chip}
                aria-pressed={on}
                aria-disabled={!on && full ? true : undefined}
                onClick={() => {
                  toggle(t);
                }}
              >
                {t}
              </button>
            );
          })}
          <input
            className={styles.tpadd}
            aria-label="Add a topic"
            placeholder="+ Add topic"
            maxLength={TOPIC_MAX_LENGTH}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (add(draft)) setDraft("");
            }}
          />
        </div>
        <div className={styles.hrow}>
          <span>
            Tap to choose. Type a new one and press Enter. Past 8 topics, this becomes a dropdown with search.
          </span>
        </div>
        {live}
      </div>
    );
  }

  const popId = `${base}-pop`;
  const listId = `${base}-list`;
  return (
    <div>
      {head}
      {/* Esc anywhere in the picker closes the dropdown; the keys themselves live on its controls. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className={styles.ms} ref={wrap} onKeyDown={onWrapKey}>
        <div className={[styles.field, open ? styles.open : ""].filter(Boolean).join(" ")}>
          {value.map((t) => (
            <span key={t} className={styles.msChip}>
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => {
                  toggle(t);
                  trigger.current?.focus();
                }}
              >
                <Icon name="close" style={{ width: 12, height: 12 }} />
              </button>
            </span>
          ))}
          <button
            ref={trigger}
            type="button"
            className={styles.trig}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? popId : undefined}
            aria-describedby={labelId}
            onClick={() => {
              if (open) close(false);
              else {
                focusSearch.current = true;
                setOpen(true);
              }
            }}
          >
            <span>{value.length ? "Add topics" : "Choose topics"}</span>
            <Icon name="chevron-down" style={{ width: 16, height: 16 }} />
          </button>
        </div>
        {open ? (
          <div id={popId} className={styles.pop}>
            <input
              ref={search}
              className={styles.search}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                active > -1 && shown[active] !== undefined ? `${base}-o-${active}` : undefined
              }
              aria-label="Search or create a topic"
              placeholder="Search or create a topic"
              maxLength={TOPIC_MAX_LENGTH}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKey}
            />
            <ul
              ref={list}
              id={listId}
              className={styles.list}
              role="listbox"
              aria-multiselectable="true"
              aria-label="Topics"
            >
              {shown.map((t, i) => {
                const on = isOn(t);
                const off = !on && full;
                return (
                  // Options take the pointer; the combobox keeps focus and handles the keys.
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                  <li
                    key={t}
                    id={`${base}-o-${i}`}
                    className={[styles.opt, i === active ? styles.act : ""].filter(Boolean).join(" ")}
                    role="option"
                    aria-selected={on}
                    aria-disabled={off ? true : undefined}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={() => {
                      setActive(i);
                      toggle(t);
                    }}
                  >
                    <span className={styles.cbx} aria-hidden="true" />
                    {t}
                    <span className={styles.uses}>{usesLabel(uses.get(lower(t)) ?? 0, noun)}</span>
                  </li>
                );
              })}
            </ul>
            {q && !shown.length ? <p className={styles.empty}>No topic matches “{q}”.</p> : null}
            {canCreate ? (
              <button
                type="button"
                className={styles.create}
                aria-disabled={full ? true : undefined}
                onClick={() => {
                  if (add(query)) {
                    setQuery("");
                    setActive(-1);
                  }
                  search.current?.focus();
                }}
              >
                <Icon name="plus" style={{ width: 15, height: 15 }} />
                Create “{q}”
              </button>
            ) : null}
            <div className={styles.foot}>
              <span>{value.length} selected · ↑ ↓ to move, Enter to choose</span>
              <button
                type="button"
                className={styles.done}
                onClick={() => {
                  close(true);
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {live}
    </div>
  );
}
