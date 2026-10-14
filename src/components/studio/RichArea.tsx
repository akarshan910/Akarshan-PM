/**
 * A rich-text field (05 · Story › Text blocks; posts; text sections): an editable area limited
 * to the 06 allowlist, with a bubble menu on selected text (Bold, Italic, Link). Every change is
 * run through `cleanRich`, so the stored HTML can only hold allowed tags and safe links.
 *
 * Keyboard: Ctrl/Cmd+B, I and K format the selection; Alt+F10 moves into the bubble and Escape
 * comes back, with the selection kept. Paste keeps only allowlisted markup. Undo and redo
 * (Ctrl/Cmd+Z, Shift+Z, Y) step through this field's own history, since formatting edits the DOM
 * directly. Nothing is parsed mid-composition (IME), and the DOM is rewritten only when the value
 * changes from outside, so the caret never jumps.
 */
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

import { cx } from "../cx";
import { isSafeLink } from "~/lib/schemas";
import { cleanRich } from "~/lib/studio/rich";
import styles from "./RichArea.module.css";

/** The caret's position as a count of text characters, which survives rewriting the HTML. */
function caretOffset(root: HTMLElement): number | null {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.endContainer)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(root);
  pre.setEnd(r.endContainer, r.endOffset);
  return pre.toString().length;
}

function placeCaret(root: HTMLElement, offset: number | null) {
  const sel = document.getSelection();
  if (!sel) return;
  const r = document.createRange();
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let left = offset ?? Number.POSITIVE_INFINITY;
  let node = walk.nextNode();
  let placed = false;
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (left <= len) {
      r.setStart(node, left);
      placed = true;
      break;
    }
    left -= len;
    node = walk.nextNode();
  }
  if (!placed) {
    r.selectNodeContents(root);
    r.collapse(false);
  }
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

const escText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** What a paste inserts: allowlisted markup only, without the outer paragraph of a one-line paste. */
export function pasteHtml(data: { html: string; text: string }, kind: "rich" | "inline"): string {
  const source = data.html
    ? data.html
    : kind === "inline"
      ? escText(data.text.replace(/\s*\n\s*/g, " "))
      : data.text
          .split(/\n{2,}/)
          .map((p) => `<p>${escText(p).replace(/\n/g, " ")}</p>`)
          .join("");
  const clean = cleanRich(source, kind);
  const one = /^<p>((?:(?!<\/?p>).)*)<\/p>$/s.exec(clean);
  return one?.[1] ?? clean;
}

const HISTORY = 100;
const COALESCE_MS = 700;

interface RichAreaProps {
  value: string;
  onChange: (html: string) => void;
  label: string;
  placeholder?: string | undefined;
  kind?: "rich" | "inline";
  className?: string | undefined;
  style?: CSSProperties | undefined;
  onFocus?: () => void;
  id?: string | undefined;
}

export function RichArea({
  value,
  onChange,
  label,
  placeholder,
  kind = "rich",
  className,
  style,
  onFocus,
  id,
}: RichAreaProps) {
  const el = useRef<HTMLDivElement>(null);
  const last = useRef<string | null>(null);
  const [bubble, setBubble] = useState<{ x: number; y: number } | null>(null);
  const [linking, setLinking] = useState<string | null>(null);
  const [empty, setEmpty] = useState(!value);
  const saved = useRef<Range | null>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const past = useRef<{ html: string; caret: number | null }[]>([]);
  const future = useRef<{ html: string; caret: number | null }[]>([]);
  const lastPush = useRef(0);
  useEffect(() => {
    if (linking !== null) linkInput.current?.focus();
  }, [linking]);

  // Writes the value into the editor only when it changed from outside (load, undo, conflict).
  useEffect(() => {
    if (!el.current || value === last.current) return;
    // A first value (null) is the load; anything later replaced what was here (Load latest,
    // Undo elsewhere), so this field's own history no longer applies.
    if (last.current !== null) {
      past.current = [];
      future.current = [];
    }
    el.current.innerHTML = cleanRich(value, kind);
    last.current = value;
  }, [value, kind]);

  // The caret before an edit, so undo puts it back where it was rather than after the change.
  const caretBefore = useRef<number | null>(null);

  /** Records the value before a change; typing within a moment counts as one step. */
  const remember = (typing: boolean) => {
    const now = Date.now();
    const prev = last.current ?? cleanRich(value, kind);
    const top = past.current.at(-1);
    if (!(typing && now - lastPush.current < COALESCE_MS && top)) {
      past.current.push({
        html: prev,
        caret: caretBefore.current ?? (el.current ? caretOffset(el.current) : null),
      });
      if (past.current.length > HISTORY) past.current.shift();
    }
    caretBefore.current = null;
    lastPush.current = typing ? now : 0;
    future.current = [];
  };

  const emit = (typing = false) => {
    if (!el.current || composing.current) return;
    const html = cleanRich(el.current.innerHTML, kind);
    if (html !== (last.current ?? cleanRich(value, kind))) remember(typing);
    setEmpty(html === "");
    last.current = html;
    onChange(html);
  };

  const step = (from: typeof past, to: typeof past) => {
    const entry = from.current.pop();
    if (!entry || !el.current) return;
    to.current.push({ html: last.current ?? cleanRich(value, kind), caret: caretOffset(el.current) });
    el.current.innerHTML = entry.html;
    last.current = entry.html;
    lastPush.current = 0;
    setEmpty(entry.html === "");
    onChange(entry.html);
    placeCaret(el.current, entry.caret);
  };

  useEffect(() => {
    const onSel = () => {
      // Moving into the bubble keeps it open; the selection is saved for it.
      if (toolbar.current?.contains(document.activeElement)) return;
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !el.current?.contains(sel.anchorNode)) {
        if (linking === null) setBubble(null);
        return;
      }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const box = el.current.getBoundingClientRect();
      setBubble({ x: r.left - box.left + r.width / 2, y: r.top - box.top });
    };
    document.addEventListener("selectionchange", onSel);
    return () => {
      document.removeEventListener("selectionchange", onSel);
    };
  }, [linking]);

  /** Wraps the selection in `tag`, or unwraps it when it's already inside one. */
  const wrap = (tag: "strong" | "em" | "a", href?: string) => {
    const sel = document.getSelection();
    if (!sel || !el.current) return;
    const inside = sel.rangeCount > 0 && el.current.contains(sel.getRangeAt(0).commonAncestorContainer);
    if (!inside && saved.current) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
    if (sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!el.current.contains(range.commonAncestorContainer)) return;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== el.current) {
      if (node.nodeName.toLowerCase() === tag && tag !== "a") {
        const parent = node.parentNode;
        while (node.firstChild) parent?.insertBefore(node.firstChild, node);
        parent?.removeChild(node);
        el.current.focus();
        emit();
        return;
      }
      node = node.parentNode;
    }
    const wrapper = document.createElement(tag);
    if (href) wrapper.setAttribute("href", href);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    el.current.focus();
    sel.removeAllRanges();
    const after = document.createRange();
    after.selectNodeContents(wrapper);
    sel.addRange(after);
    emit();
  };

  const startLink = () => {
    const sel = document.getSelection();
    if (!bubble && (!sel || sel.isCollapsed)) return;
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    if (range && el.current?.contains(range.commonAncestorContainer)) saved.current = range.cloneRange();
    setLinking("https://");
  };

  const applyLink = () => {
    const href = (linking ?? "").trim();
    const sel = document.getSelection();
    if (saved.current && sel) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
    if (href && isSafeLink(href)) wrap("a", href);
    else backToText();
    setLinking(null);
    setBubble(null);
  };

  /** Escape from the bubble: back to the text, with the selection where it was. */
  const backToText = () => {
    const sel = document.getSelection();
    el.current?.focus();
    if (saved.current && sel) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (kind === "inline" && e.key === "Enter") e.preventDefault();
    if (e.altKey && e.key === "F10" && bubble) {
      e.preventDefault();
      const sel = document.getSelection();
      saved.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
      toolbar.current?.querySelector("button")?.focus();
      return;
    }
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === "b" || key === "i") {
      e.preventDefault();
      const sel = document.getSelection();
      if (sel && !sel.isCollapsed) wrap(key === "b" ? "strong" : "em");
    } else if (key === "k") {
      e.preventDefault();
      startLink();
    } else if (key === "z" || key === "y") {
      e.preventDefault();
      if (key === "y" || e.shiftKey) step(future, past);
      else step(past, future);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    insert(
      pasteHtml(
        { html: e.clipboardData.getData("text/html"), text: e.clipboardData.getData("text/plain") },
        kind,
      ),
    );
  };

  // A drop goes through the same allowlist as a paste, at the point where it lands.
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pos = (
      document as {
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
      }
    ).caretPositionFromPoint?.(e.clientX, e.clientY);
    const sel = document.getSelection();
    if (pos && sel && el.current?.contains(pos.offsetNode)) {
      const at = document.createRange();
      at.setStart(pos.offsetNode, pos.offset);
      at.collapse(true);
      sel.removeAllRanges();
      sel.addRange(at);
    }
    insert(
      pasteHtml(
        { html: e.dataTransfer.getData("text/html"), text: e.dataTransfer.getData("text/plain") },
        kind,
      ),
    );
  };

  // The browser's own formatting and history would change the field behind the stored value:
  // its undo and redo use this field's history, and its formatting commands are refused.
  const beforeInput = useRef<(e: InputEvent) => void>(() => undefined);
  useEffect(() => {
    beforeInput.current = (e: InputEvent) => {
      if (e.inputType === "historyUndo" || e.inputType === "historyRedo") {
        e.preventDefault();
        if (e.inputType === "historyUndo") step(past, future);
        else step(future, past);
        return;
      }
      if (e.inputType.startsWith("format") || e.inputType === "insertFromDrop") {
        e.preventDefault();
        return;
      }
      if (el.current && Date.now() - lastPush.current >= COALESCE_MS)
        caretBefore.current = caretOffset(el.current);
    };
  });
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const on = (e: Event) => {
      beforeInput.current(e as InputEvent);
    };
    node.addEventListener("beforeinput", on);
    return () => {
      node.removeEventListener("beforeinput", on);
    };
  }, []);

  function insert(html: string) {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.current) return;
    const range = sel.getRangeAt(0);
    if (!el.current.contains(range.commonAncestorContainer)) return;
    range.deleteContents();
    // Already allowlisted by cleanRich; a template keeps it inert while it's parsed.
    const t = document.createElement("template");
    t.innerHTML = html;
    const tail = t.content.lastChild;
    range.insertNode(t.content);
    if (tail) {
      range.setStartAfter(tail);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    emit();
  }

  return (
    <div className={styles.wrap}>
      <div
        ref={el}
        id={id}
        className={cx(styles.area, empty && styles.empty, className)}
        style={style}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline={kind === "rich"}
        aria-label={label}
        data-placeholder={placeholder}
        tabIndex={0}
        onInput={(e) => {
          if (!(e.nativeEvent as InputEvent).isComposing) emit(true);
        }}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
          emit(true);
        }}
        onPaste={onPaste}
        onDrop={onDrop}
        onKeyDown={onKey}
        onFocus={onFocus}
      />
      {bubble ? (
        <div
          className={cx("st", styles.bubble)}
          style={{ left: bubble.x, top: bubble.y }}
          ref={toolbar}
          role="toolbar"
          aria-label="Format text"
          onKeyDown={(e) => {
            if (e.key === "Escape" && linking === null) {
              e.preventDefault();
              setBubble(null);
              el.current?.focus();
            }
          }}
          onMouseDown={(e) => {
            if (linking === null) e.preventDefault();
          }}
        >
          {linking === null ? (
            <>
              <button
                type="button"
                onClick={() => {
                  wrap("strong");
                }}
                aria-label="Bold"
                aria-keyshortcuts="Control+B Meta+B"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => {
                  wrap("em");
                }}
                aria-label="Italic"
                aria-keyshortcuts="Control+I Meta+I"
              >
                <em>I</em>
              </button>
              <button type="button" onClick={startLink} aria-keyshortcuts="Control+K Meta+K">
                Link
              </button>
            </>
          ) : (
            <form
              className={styles.linkForm}
              onSubmit={(e) => {
                e.preventDefault();
                applyLink();
              }}
            >
              <input
                ref={linkInput}
                aria-label="Link address"
                value={linking}
                onChange={(e) => {
                  setLinking(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setLinking(null);
                    setBubble(null);
                    backToText();
                  }
                }}
              />
              <button type="submit">Add</button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
