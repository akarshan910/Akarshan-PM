import * as RadixSwitch from "@radix-ui/react-switch";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

import styles from "./Field.module.css";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** The visible label, inside the switch as on the boards. */
  children: ReactNode;
  disabled?: boolean | undefined;
  id?: string | undefined;
}

/** `.sw`: Studio's switch (StudioWriting "Show on my homepage"). M-ST-SWITCH. */
export function Switch({ checked, onCheckedChange, children, disabled, id }: SwitchProps) {
  return (
    <RadixSwitch.Root
      className={styles.sw}
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...(disabled ? { disabled } : {})}
      {...(id ? { id } : {})}
    >
      <span className={styles.trk} aria-hidden="true">
        <RadixSwitch.Thumb className={styles.knb} />
      </span>
      {children}
    </RadixSwitch.Root>
  );
}

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean | undefined;
}

/** `.chk`: a native checkbox in Studio's ink (EditorVisuals). */
export function Checkbox({ checked, onCheckedChange, children, disabled }: CheckboxProps) {
  return (
    <label className={styles.chk}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => {
          onCheckedChange(e.target.checked);
        }}
      />
      {children}
    </label>
  );
}

export interface Choice<V extends string> {
  value: V;
  label: ReactNode;
}

interface SegmentedProps<V extends string> {
  label: ReactNode;
  options: readonly Choice<V>[];
  value: V;
  onChange: (value: V) => void;
  /** 36px in the editors, 34px on StudioWriting and StudioStates. */
  size?: 34 | 36;
}

/** `.seg`: a labelled group of pressed buttons (EditorOverview "Homepage shelf"). */
export function Segmented<V extends string>({
  label,
  options,
  value,
  onChange,
  size = 36,
}: SegmentedProps<V>) {
  const id = useId();
  return (
    <div className={styles.field}>
      <span className={styles.lbl} id={id}>
        {label}
      </span>
      <div
        className={[styles.seg, size === 34 ? styles.seg34 : ""].filter(Boolean).join(" ")}
        role="group"
        aria-labelledby={id}
      >
        {options.map((o) => (
          <button
            key={o.value}
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
    </div>
  );
}

interface RadioCardOption<V extends string> extends Choice<V> {
  note?: ReactNode | undefined;
}

interface RadioCardsProps<V extends string> {
  /** The group's accessible name. */
  label: string;
  options: readonly RadioCardOption<V>[];
  value: V | null;
  onChange: (value: V) => void;
}

/** `.rc`: radio cards with a title and a note (StudioProfile). Arrow keys move and choose. */
export function RadioCards<V extends string>({ label, options, value, onChange }: RadioCardsProps<V>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    refs.current[next]?.focus();
  };
  return (
    <div className={styles.rgroup} role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          className={styles.rc}
          role="radio"
          aria-checked={o.value === value}
          tabIndex={i === current ? 0 : -1}
          onClick={() => {
            onChange(o.value);
          }}
          onKeyDown={(e) => {
            onKey(e, i);
          }}
        >
          <span className={styles.rdo} aria-hidden="true" />
          <span className={styles.rcTitle}>{o.label}</span>
          {o.note ? (
            <>
              <span />
              <span className={styles.rcNote}>{o.note}</span>
            </>
          ) : null}
        </button>
      ))}
    </div>
  );
}
