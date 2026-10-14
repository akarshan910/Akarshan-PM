/**
 * A same-origin iframe that renders its children through a portal, so the public components'
 * media queries see the device width (1280 for Desktop, 390 for Phone), not Studio's window. The
 * page's stylesheets are mirrored into the frame, including ones added later (lazy chunks, HMR),
 * and `<html>`'s classes (`still` for reduced motion) follow along.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const BLANK = '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body></body></html>';

const isStyle = (n: Node): n is HTMLElement =>
  n instanceof HTMLStyleElement || (n instanceof HTMLLinkElement && n.rel === "stylesheet");

export function PreviewFrame({
  title,
  width,
  height,
  scale,
  children,
}: {
  title: string;
  width: number;
  height: number;
  scale: number;
  children: ReactNode;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!body || !doc) return;
    const copies = new Map<Node, Node>();
    const copy = (n: Node) => {
      if (!isStyle(n) || copies.has(n)) return;
      const c = n.cloneNode(true);
      copies.set(n, c);
      doc.head.appendChild(c);
    };
    document.head.childNodes.forEach(copy);
    const sync = () => {
      doc.documentElement.className = document.documentElement.className;
    };
    sync();
    const heads = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach(copy);
        r.removedNodes.forEach((n) => {
          const c = copies.get(n);
          if (c) {
            doc.head.removeChild(c);
            copies.delete(n);
          }
        });
        // Vite updates a <style> in place on HMR.
        if (r.type === "characterData" || r.target !== document.head) {
          const owner = r.target instanceof HTMLStyleElement ? r.target : r.target.parentNode;
          const c = owner ? copies.get(owner) : undefined;
          if (owner && c) c.textContent = owner.textContent;
        }
      }
    });
    heads.observe(document.head, { childList: true, subtree: true, characterData: true });
    const html = new MutationObserver(sync);
    html.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      heads.disconnect();
      html.disconnect();
    };
  }, [body]);

  return (
    <div className="pvFrameBox" style={{ width: width * scale, height: height * scale, overflow: "hidden" }}>
      <iframe
        ref={frame}
        title={title}
        srcDoc={BLANK}
        style={{
          width,
          height,
          border: 0,
          display: "block",
          transform: `scale(${String(scale)})`,
          transformOrigin: "0 0",
        }}
        onLoad={(e) => {
          setBody(e.currentTarget.contentDocument?.body ?? null);
        }}
      />
      {body ? createPortal(children, body) : null}
    </div>
  );
}
