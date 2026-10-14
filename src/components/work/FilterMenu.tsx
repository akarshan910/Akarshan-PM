import { useEffect, useId, useRef, useState } from "react";

import { cx } from "../cx";
import styles from "./WorkList.module.css";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterMenuProps {
  /** "Company", "Topic" or "Label": the button's text and the group's name. */
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

/**
 * A multi-select dropdown on /work (WorkScale.dc.html's "Company ▾", "Topic ▾", "Label ▾"): a
 * disclosure button and a group of checkboxes. Esc or a click outside closes it, and focus
 * returns to the button after Esc.
 */
export function FilterMenu({ label, options, selected, onChange }: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (options.length === 0) return null;
  const count = selected.length;
  return (
    <div ref={root} className={styles.menu}>
      <button
        ref={button}
        type="button"
        className={cx(styles.fc, count > 0 && styles.fcSet)}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        {label}
        {count > 0 ? ` · ${count}` : ""} <span aria-hidden="true">▾</span>
      </button>
      <fieldset id={id} className={styles.panel} hidden={!open}>
        <legend className="sr-only">{label}</legend>
        {options.map((o) => (
          <label key={o.value} className={styles.check}>
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={(e) => {
                onChange(e.target.checked ? [...selected, o.value] : selected.filter((v) => v !== o.value));
              }}
            />
            {o.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

/** The same options as a plain group of checkboxes, for the phone filter sheet. */
export function FilterGroup({ label, options, selected, onChange }: FilterMenuProps) {
  if (options.length === 0) return null;
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupLabel}>{label}</legend>
      {options.map((o) => (
        <label key={o.value} className={styles.check}>
          <input
            type="checkbox"
            checked={selected.includes(o.value)}
            onChange={(e) => {
              onChange(e.target.checked ? [...selected, o.value] : selected.filter((v) => v !== o.value));
            }}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}
