import * as RadixDialog from "@radix-ui/react-dialog";
import { useId, useRef, useState, type ReactNode } from "react";

import { Button } from "./Button";
import styles from "./Dialog.module.css";
import { cx } from "../cx";

interface DialogProps {
  open: boolean;
  /** Called with false on Cancel, Esc and a click outside (none of them while busy). */
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode | undefined;
  /** plain: a confirm, 480px. panel: the publish checklist, 560px, with a kicker and a footer bar. */
  layout?: "plain" | "panel";
  /** The panel's mono kicker, such as "Publish changes". */
  kicker?: string | undefined;
  /** The 40px tile above a plain dialog's title, such as the trash icon. */
  icon?: ReactNode | undefined;
  iconTone?: "neutral" | "err";
  width?: number | undefined;
  /** Anything between the description and the buttons: checks, a conflict summary. */
  children?: ReactNode | undefined;
  cancelLabel?: string | undefined;
  confirmLabel: ReactNode;
  confirmVariant?: "cta" | "danger";
  onConfirm: () => void;
  /** The confirm is `aria-disabled`, as "Fix 2 to publish" is. */
  confirmDisabled?: boolean | undefined;
  /** Publishing: the confirm shows the spinner, and Esc and Cancel wait. */
  busy?: boolean | undefined;
  /** Type-to-confirm: the confirm stays disabled until this exact text is typed. */
  confirmPhrase?: string | undefined;
  /** A link or text button at the start of the buttons row: "Preview first", "Unpublish instead". */
  footerStart?: ReactNode | undefined;
}

/**
 * Studio's dialog on Radix Dialog: it traps focus, opens on Cancel (the safe choice), closes on Esc
 * except while publishing, and returns focus to whatever opened it.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  layout = "plain",
  kicker,
  icon,
  iconTone = "neutral",
  width,
  children,
  cancelLabel = "Cancel",
  confirmLabel,
  confirmVariant = "cta",
  onConfirm,
  confirmDisabled,
  busy,
  confirmPhrase,
  footerStart,
}: DialogProps) {
  const cancel = useRef<HTMLButtonElement>(null);
  // Studio opens dialogs from its own buttons, not a Radix trigger, so remember who opened it.
  const opener = useRef<HTMLElement | null>(null);
  const typeId = useId();
  const [typed, setTyped] = useState("");
  const phraseOk = confirmPhrase === undefined || typed === confirmPhrase;
  const blocked = Boolean(confirmDisabled) || !phraseOk;

  const change = (next: boolean) => {
    if (!next && busy) return;
    if (!next) setTyped("");
    onOpenChange(next);
  };

  const panel = layout === "panel";
  const head = (
    <>
      {!panel && icon ? (
        <span className={cx(styles.tile, iconTone === "err" ? styles.tileErr : "")}>{icon}</span>
      ) : null}
      {panel && kicker ? <div className={styles.kicker}>{kicker}</div> : null}
      <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
      {description ? (
        <RadixDialog.Description className={styles.desc}>{description}</RadixDialog.Description>
      ) : null}
    </>
  );
  const typeToConfirm =
    confirmPhrase === undefined ? null : (
      <>
        <label className={styles.typeLbl} htmlFor={typeId}>
          Type <strong>{confirmPhrase}</strong> to confirm
        </label>
        <input
          id={typeId}
          className={styles.typeInp}
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
          }}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </>
    );
  const actions = (
    <div className={styles.acts}>
      {footerStart ? <span className={styles.start}>{footerStart}</span> : null}
      <Button
        ref={cancel}
        variant="btn"
        onClick={() => {
          change(false);
        }}
        disabled={busy}
      >
        {cancelLabel}
      </Button>
      <Button variant={confirmVariant} onClick={onConfirm} disabled={blocked && !busy} busy={busy}>
        {confirmLabel}
      </Button>
    </div>
  );

  return (
    <RadixDialog.Root open={open} onOpenChange={change}>
      <RadixDialog.Portal>
        <div className="st" style={{ background: "none" }}>
          <RadixDialog.Overlay className={styles.overlay}>
            <RadixDialog.Content
              className={cx(styles.dialog, panel ? styles.panel : styles.plain)}
              style={width ? { width } : panel ? { width: 560 } : undefined}
              {...(description ? {} : { "aria-describedby": undefined })}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                opener.current =
                  document.activeElement instanceof HTMLElement ? document.activeElement : null;
                cancel.current?.focus();
              }}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                if (opener.current?.isConnected) opener.current.focus();
                opener.current = null;
              }}
              onEscapeKeyDown={(e) => {
                if (busy) e.preventDefault();
              }}
              onPointerDownOutside={(e) => {
                if (busy) e.preventDefault();
              }}
            >
              {panel ? (
                <>
                  <div className={styles.head}>{head}</div>
                  {children || typeToConfirm ? (
                    <div className={styles.content}>
                      {children}
                      {typeToConfirm}
                    </div>
                  ) : null}
                  {actions}
                </>
              ) : (
                <>
                  {head}
                  {children}
                  {typeToConfirm}
                  {actions}
                </>
              )}
            </RadixDialog.Content>
          </RadixDialog.Overlay>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
