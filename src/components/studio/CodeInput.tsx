import { forwardRef, useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent } from "react";

import styles from "./CodeInput.module.css";
import { cx } from "../cx";
import { CODE_LENGTH, CODE_LENGTH_WORD } from "~/lib/studio/signin";

/** How long six digits wait before they submit on their own (02 · S2). */
export const CODE_SUBMIT_DELAY = 150;
export { CODE_LENGTH, CODE_LENGTH_WORD };

/**
 * - `idle`: typing.
 * - `wrong`: the check failed; the boxes go red (`.bad`) and the input is `aria-invalid`.
 * - `expired`: the code timed out; the alert says so, the boxes stay normal.
 * - `checking`: the code is being checked; boxes `.off`, input disabled.
 * - `locked`: too many tries; boxes `.off`, input disabled.
 */
export type CodeStatus = "idle" | "wrong" | "expired" | "checking" | "locked";

interface CodeInputProps {
  /** The digits so far, at most six. */
  value: string;
  /** Every edit, already stripped to digits. Clear a wrong or expired status here when the owner types. */
  onChange: (digits: string) => void;
  /** Called 150ms after the sixth digit arrives, unless another edit comes first. */
  onComplete: (code: string) => void;
  status?: CodeStatus;
  /** The input's id. The page has one code input, so it's `otp-in` as on the board. */
  id?: string | undefined;
  /** The hint's id, `otp-h` on the board. */
  hintId?: string | undefined;
  autoFocus?: boolean | undefined;
}

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/**
 * 02 · S2: the visible label "6-digit code", six boxes (decorative) under one real input with
 * `autocomplete="one-time-code"`, and the hint. Non-digits are dropped, so "482 913" pastes as "482913".
 */
export const CodeInput = forwardRef<HTMLInputElement, CodeInputProps>(function CodeInput(
  { value, onChange, onComplete, status = "idle", id = "otp-in", hintId = "otp-h", autoFocus },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const complete = useRef(onComplete);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const off = status === "checking" || status === "locked";
  const digits = digitsOnly(value);

  const accept = (next: string) => {
    clearTimeout(timer.current);
    if (next === digits) return;
    onChange(next);
    if (next.length === CODE_LENGTH) {
      timer.current = setTimeout(() => {
        complete.current(next);
      }, CODE_SUBMIT_DELAY);
    }
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    accept(digitsOnly(e.target.value));
  };

  // maxlength would cut "482 913" to "482 91" before onChange sees it, so paste is read whole.
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = digitsOnly(e.clipboardData.getData("text"));
    if (!pasted) return;
    e.preventDefault();
    accept(pasted);
  };

  const cur = Math.min(digits.length, CODE_LENGTH - 1);
  const boxClass = (i: number) =>
    cx(
      styles.box,
      status === "wrong" ? styles.bad : "",
      off ? styles.off : "",
      !off && focused && i === cur && digits.length < CODE_LENGTH ? styles.cur : "",
    );

  return (
    <div>
      <label htmlFor={id} className={styles.lbl}>
        {CODE_LENGTH}-digit code
      </label>
      <div className={styles.otp} role="group" aria-label={`${CODE_LENGTH}-digit code`}>
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <span key={i} className={boxClass(i)} aria-hidden="true" data-box={i}>
            {digits[i] ?? ""}
          </span>
        ))}
        <input
          ref={ref}
          id={id}
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={CODE_LENGTH}
          value={digits}
          onChange={onInput}
          onPaste={onPaste}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
          // Keep the caret at the end, so the boxes always show where the next digit goes.
          onSelect={(e) => {
            const el = e.currentTarget;
            if (el.selectionStart !== el.value.length) el.setSelectionRange(el.value.length, el.value.length);
          }}
          aria-invalid={status === "wrong"}
          aria-describedby={hintId}
          disabled={off}
          // The sign-in page moves focus here when the code step opens (05 · Sign-in).
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
        />
      </div>
      <p id={hintId} className={styles.note}>
        Paste the code, or type it. It signs you in as soon as all {CODE_LENGTH_WORD} digits are in.
      </p>
    </div>
  );
});
