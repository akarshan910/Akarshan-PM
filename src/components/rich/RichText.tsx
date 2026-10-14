/**
 * Renders an `Inline` or `Rich` string from content as React elements, through the allowlist in
 * `src/lib/rich-text.ts` (06 · Rich text). There's no `dangerouslySetInnerHTML`: every text node is
 * escaped by React, and only `p`, `strong`, `em`, `a[href]`, `ul`, `ol` and `li` are ever created.
 */
import { Fragment, type ReactNode, useMemo } from "react";

import { parseRichText, type RichNode } from "~/lib/rich-text";

export interface RichTextProps {
  html: string;
  /** Inline content (a hero line, a bullet): only `strong`, `em` and links. */
  inline?: boolean;
}

function render(nodes: readonly RichNode[]): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return <Fragment key={i}>{node.text}</Fragment>;
      case "a":
        return node.external ? (
          <a key={i} href={node.href} target="_blank" rel="noopener noreferrer">
            {render(node.children)}
            <span aria-hidden="true"> ↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <a key={i} href={node.href}>
            {render(node.children)}
          </a>
        );
      default: {
        const Tag = node.type;
        return <Tag key={i}>{render(node.children)}</Tag>;
      }
    }
  });
}

export function RichText({ html, inline = false }: RichTextProps) {
  const nodes = useMemo(() => parseRichText(html, { inline }), [html, inline]);
  if (nodes.length === 0) return null;
  return <>{render(nodes)}</>;
}

/** True when a string has something to show once sanitised. */
export function hasRichText(html: string | undefined, inline = true): html is string {
  return html !== undefined && parseRichText(html, { inline }).length > 0;
}
