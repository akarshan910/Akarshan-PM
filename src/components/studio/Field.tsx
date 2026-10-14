import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cx } from "../cx";
import { Icon } from "../icons";
import styles from "./Field.module.css";

export interface CounterLimit {
  /** The soft limit: the counter reads "n/limit" and turns red past it (see `SOFT_LIMITS`). */
  limit: number;
  /** Optional: amber from this length up to the limit, as the 140-character summary does from 121. */
  warnAbove?: number | undefined;
}

interface FieldChrome {
  id: string;
  label: ReactNode;
  /** Shows the "Required" tag beside the label. */
  required?: boolean | undefined;
  hint?: ReactNode | undefined;
  /** An error replaces the hint, turns the border red and sets `aria-invalid`. */
  error?: ReactNode | undefined;
  /** A warning replaces the hint, in amber with the alert icon. The value is still valid. */
  warning?: ReactNode | undefined;
  /** A character counter, "n/limit". */
  counter?: CounterLimit;
  /** Geist Mono, for addresses and slugs. */
  mono?: boolean | undefined;
}

/** "n/limit", in --tx3, amber past `warnAbove`, red past `limit` (EditorOverview, StudioWriting). */
export function Counter({ length, limit, warnAbove }: CounterLimit & { length: number }) {
  const tone =
    length > limit ? styles.cntOver : warnAbove !== undefined && length > warnAbove ? styles.cntWarn : "";
  return (
    <span className={[styles.cnt, tone].filter(Boolean).join(" ")} data-over={length > limit || undefined}>
      {length}/{limit}
    </span>
  );
}

function HintRow({
  id,
  hint,
  error,
  warning,
  counter,
  length,
}: Pick<FieldChrome, "hint" | "error" | "warning" | "counter"> & { id: string; length: number }) {
  if (!hint && !error && !warning && !counter) return null;
  return (
    <div className={styles.hrow} id={id}>
      {error ? (
        <span className={styles.err}>
          <Icon name="alert-circle" className={cx("ico", styles.msgIco)} />
          <span>{error}</span>
        </span>
      ) : warning ? (
        <span className={styles.warn}>
          <Icon name="alert" className={`ico ${styles.msgIco}`} />
          <span>{warning}</span>
        </span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
      {counter ? (
        <>
          {" "}
          <Counter length={length} {...counter} />
        </>
      ) : null}
    </div>
  );
}

function Label({ id, label, required }: Pick<FieldChrome, "id" | "label" | "required">) {
  return (
    <label className={styles.lbl} htmlFor={id}>
      {label}
      {required ? (
        <>
          {" "}
          <span className={styles.req}>Required</span>
        </>
      ) : null}
    </label>
  );
}

function controlProps(chrome: FieldChrome, extraClass?: string) {
  const described = chrome.hint || chrome.error || chrome.warning || chrome.counter;
  return {
    id: chrome.id,
    className: [styles.inp, chrome.mono ? styles.monoInp : "", chrome.error ? styles.invalid : "", extraClass]
      .filter(Boolean)
      .join(" "),
    "aria-invalid": chrome.error ? true : undefined,
    "aria-describedby": described ? `${chrome.id}-h` : undefined,
  };
}

function split<T extends FieldChrome>(props: T) {
  const { id, label, required, hint, error, warning, counter, mono, ...rest } = props;
  return { chrome: { id, label, required, hint, error, warning, counter, mono } as FieldChrome, rest };
}

type TextFieldProps = FieldChrome & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

/** A labelled single-line field: `.lbl`, `.inp` and the `.hrow` of hint, error or warning plus counter. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(props, ref) {
  const { chrome, rest } = split(props);
  return (
    <div className={styles.field}>
      <Label id={chrome.id} label={chrome.label} required={chrome.required} />
      <input ref={ref} type="text" {...{ ...rest, ...controlProps(chrome) }} />
      <HintRow {...chrome} id={`${chrome.id}-h`} length={String(rest.value ?? "").length} />
    </div>
  );
});

type TextAreaProps = FieldChrome &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> & { minHeight?: number };

/** A labelled multi-line field (88px minimum, resizes vertically). */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(props, ref) {
  const { minHeight, ...withChrome } = props;
  const { chrome, rest } = split(withChrome);
  return (
    <div className={styles.field}>
      <Label id={chrome.id} label={chrome.label} required={chrome.required} />
      <textarea
        ref={ref}
        {...rest}
        {...controlProps(chrome)}
        style={minHeight ? { minHeight, ...rest.style } : rest.style}
      />
      <HintRow {...chrome} id={`${chrome.id}-h`} length={String(rest.value ?? "").length} />
    </div>
  );
});

type SelectFieldProps = Omit<FieldChrome, "counter" | "mono"> &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> & { children: ReactNode };

/** A labelled native select in the `.inp` style (EditorCaseStudy "Opens on"). */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(props, ref) {
  const { children, ...withChrome } = props;
  const { chrome, rest } = split(withChrome);
  return (
    <div className={styles.field}>
      <Label id={chrome.id} label={chrome.label} required={chrome.required} />
      <select ref={ref} {...{ ...rest, ...controlProps(chrome) }}>
        {children}
      </select>
      <HintRow {...chrome} id={`${chrome.id}-h`} length={0} />
    </div>
  );
});
