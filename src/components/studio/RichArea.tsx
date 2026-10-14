/**
 * A rich-text field (05 · Story › Text blocks; posts; text sections): an editable area limited
 * to the 06 allowlist, with a bubble menu on selected text (Bold, Italic, Link). Every change is
 * run through `cleanRich`, so the stored HTML can only hold allowed tags and safe links.
 */
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import { cx } from "../cx";
import { isSafeLink } from "~/lib/schemas";
import { cleanRich } from "~/lib/studio/rich";
import styles from "./RichArea.module.css";

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
  useEffect(() => {
    if (linking !== null) linkInput.current?.focus();
  }, [linking]);

  // Writes the value into the editor only when it changed from outside (load, undo, conflict).
  useEffect(() => {
    if (!el.current || value === last.current) return;
    el.current.innerHTML = cleanRich(value, kind);
    last.current = value;
  }, [value, kind]);

  const emit = () => {
    if (!el.current) return;
    const html = cleanRich(el.current.innerHTML, kind);
    setEmpty(html === "");
    last.current = html;
    onChange(html);
  };

  useEffect(() => {
    const onSel = () => {
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
    if (!sel || sel.rangeCount === 0 || !el.current) return;
    const range = sel.getRangeAt(0);
    if (!el.current.contains(range.commonAncestorContainer)) return;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== el.current) {
      if (node.nodeName.toLowerCase() === tag && tag !== "a") {
        const parent = node.parentNode;
        while (node.firstChild) parent?.insertBefore(node.firstChild, node);
        parent?.removeChild(node);
        emit();
        return;
      }
      node = node.parentNode;
    }
    const wrapper = document.createElement(tag);
    if (href) wrapper.setAttribute("href", href);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    sel.removeAllRanges();
    const after = document.createRange();
    after.selectNodeContents(wrapper);
    sel.addRange(after);
    emit();
  };

  const startLink = () => {
    const sel = document.getSelection();
    saved.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
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
    setLinking(null);
    setBubble(null);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (kind === "inline" && e.key === "Enter") e.preventDefault();
  };

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
        onInput={emit}
        onKeyDown={onKey}
        onFocus={onFocus}
      />
      {bubble ? (
        <div
          className={cx("st", styles.bubble)}
          style={{ left: bubble.x, top: bubble.y }}
          role="toolbar"
          aria-label="Format text"
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
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => {
                  wrap("em");
                }}
                aria-label="Italic"
              >
                <em>I</em>
              </button>
              <button type="button" onClick={startLink}>
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
                    setLinking(null);
                    setBubble(null);
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
