/**
 * Studio's half of rich text (06 · Rich text): whatever the editor produces is parsed with the
 * site's allowlist parser and written back as clean HTML, so a draft can only ever hold `p`,
 * `strong`, `em`, `a[href]`, `ul`, `ol`, `li` (or `strong`, `em`, `a` for `Inline`).
 */
import { parseRichText, type RichNode } from "../rich-text";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

function serialize(nodes: RichNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return esc(n.text);
      if (n.type === "a") return `<a href="${escAttr(n.href)}">${serialize(n.children)}</a>`;
      return `<${n.type}>${serialize(n.children)}</${n.type}>`;
    })
    .join("");
}

/** Sanitises editor HTML into stored `Rich` (block) or `Inline` HTML. Empty content becomes "". */
export function cleanRich(html: string, kind: "rich" | "inline" = "rich"): string {
  const nodes = parseRichText(html.replace(/<div>/gi, "<p>").replace(/<\/div>/gi, "</p>"), {
    inline: kind === "inline",
  });
  const out = serialize(nodes);
  const text = out.replace(/<[^>]*>/g, "").trim();
  if (!text) return "";
  if (kind === "inline") return out;
  // Loose text at the top level goes in a paragraph, so the site renders block content.
  return nodes.every((n) => n.type === "text" || n.type === "strong" || n.type === "em" || n.type === "a")
    ? `<p>${out}</p>`
    : out;
}
