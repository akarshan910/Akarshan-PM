import { describe, expect, it } from "vitest";

import { decodeEntities, parseRichText, richTextToPlain, tokenize, type RichNode } from "./rich-text";

/** Serialises a tree back to HTML-like text, so expectations read like markup. */
function html(nodes: RichNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return n.text;
      if (n.type === "a") return `<a href="${n.href}"${n.external ? " ext" : ""}>${html(n.children)}</a>`;
      return `<${n.type}>${html(n.children)}</${n.type}>`;
    })
    .join("");
}
const block = (s: string) => html(parseRichText(s));
const inline = (s: string) => html(parseRichText(s, { inline: true }));

/** Every tag and attribute name a sanitised tree can contain. */
function names(nodes: RichNode[], out = new Set<string>()): Set<string> {
  for (const n of nodes) {
    if (n.type === "text") continue;
    out.add(n.type);
    names(n.children, out);
  }
  return out;
}
const ALLOWED = new Set(["p", "strong", "em", "a", "ul", "ol", "li"]);

describe("decodeEntities", () => {
  it("decodes named, decimal and hex references, and leaves unknown names", () => {
    expect(decodeEntities("a &amp; b &lt;i&gt; &quot;q&quot; &#39;s&#x27; &nbsp;")).toBe(
      "a & b <i> \"q\" 's'  ",
    );
    expect(decodeEntities("&rupee;3 &rarr; &mdash; &bogus; &amp")).toBe("₹3 → — &bogus; &");
    expect(decodeEntities("&#0; &#xD800; &#x110000;")).toBe("� � �");
  });
});

describe("tokenize", () => {
  it("splits text, tags and attributes, skipping comments and declarations", () => {
    expect(tokenize('<!doctype html><p class="x" data-a=1 hidden>Hi<!-- no --></p><?php ?>')).toEqual([
      { kind: "start", name: "p", attrs: { class: "x", "data-a": "1", hidden: "" }, selfClosing: false },
      { kind: "text", text: "Hi" },
      { kind: "end", name: "p" },
    ]);
  });

  it("keeps a lone < as text and drops an unterminated tag", () => {
    expect(tokenize("1 < 2 </ 3")).toEqual([{ kind: "text", text: "1 < 2 </ 3" }]);
    expect(tokenize("ok <strong")).toEqual([{ kind: "text", text: "ok " }]);
    expect(tokenize("a</>b")).toEqual([{ kind: "text", text: "ab" }]);
    expect(tokenize("<!-- never closed")).toEqual([]);
  });

  it("reads quoted attribute values that contain >", () => {
    const [start] = tokenize(`<a title='x > y' href="/a">`);
    expect(start).toEqual({
      kind: "start",
      name: "a",
      attrs: { title: "x > y", href: "/a" },
      selfClosing: false,
    });
  });
});

describe("parseRichText", () => {
  it("keeps the allowed tags", () => {
    expect(block("<p>A <strong>b</strong> <em>c</em></p><ul><li>d</li></ul><ol><li>e</li></ol>")).toBe(
      "<p>A <strong>b</strong> <em>c</em></p><ul><li>d</li></ul><ol><li>e</li></ol>",
    );
    expect(block("<p><b>b</b><i>i</i></p>")).toBe("<p><strong>b</strong><em>i</em></p>");
  });

  it("renders the V0 inline strings", () => {
    expect(
      inline(
        "Product Manager with <strong>8 years experience</strong> driving <strong>30 Cr+ in annual revenue</strong>.",
      ),
    ).toBe(
      "Product Manager with <strong>8 years experience</strong> driving <strong>30 Cr+ in annual revenue</strong>.",
    );
  });

  it("wraps loose text in paragraphs and loose list text in items", () => {
    expect(block("Hello <strong>there</strong>")).toBe("<p>Hello <strong>there</strong></p>");
    expect(block("<ul>one<li>two</li></ul>")).toBe("<ul><li>one</li><li>two</li></ul>");
    expect(block("<ul><p>para</p></ul>")).toBe("<ul><li><p>para</p></li></ul>");
    expect(block("  \n ")).toBe("");
  });

  it("closes paragraphs and items the way HTML does", () => {
    expect(block("<p>a<p>b")).toBe("<p>a</p><p>b</p>");
    expect(block("<ul><li>a<li>b</ul>")).toBe("<ul><li>a</li><li>b</li></ul>");
    expect(block("<p>a<ul><li>b</li></ul>c</p>")).toBe("<p>a</p><ul><li>b</li></ul><p>c</p>");
    expect(block("<p><strong>a<p>b</strong>")).toBe("<p><strong>a</strong></p><p>b</p>");
    expect(block("<li>stray</li>")).toBe("<p>stray</p>");
    expect(block("<strong>a<em>b</strong>c</em>")).toBe("<p><strong>a<em>b</em></strong>c</p>");
    expect(block("</p></strong>text")).toBe("<p>text</p>");
  });

  it("drops empty elements but keeps empty list items", () => {
    expect(block("<p></p><p> </p><strong></strong><ul><li></li></ul>")).toBe("<ul><li></li></ul>");
  });

  it("flattens blocks into spaced text in inline mode", () => {
    expect(inline("<p>a</p><p>b <strong>c</strong></p><ul><li>d</li></ul>")).toBe(
      "a  b <strong>c</strong>   d",
    );
    expect(inline("x<br>y<hr/>z")).toBe("x y z");
  });

  it("keeps safe links and marks https ones external", () => {
    expect(inline('<a href="https://example.com/x">ext</a>')).toBe(
      '<a href="https://example.com/x" ext>ext</a>',
    );
    expect(
      inline('<a href="/work/a">in</a> <a href="#about">anchor</a> <a href="mailto:a@b.co">mail</a>'),
    ).toBe('<a href="/work/a">in</a> <a href="#about">anchor</a> <a href="mailto:a@b.co">mail</a>');
    expect(inline('<a href="  https://example.com ">trim</a>')).toBe(
      '<a href="https://example.com" ext>trim</a>',
    );
  });

  it("keeps the text of links with a missing or unsafe href", () => {
    expect(inline("<a>none</a>")).toBe("none");
    expect(inline('<a href="http://example.com">http</a>')).toBe("http");
    expect(inline('<a href="//evil.example">proto-relative</a>')).toBe("proto-relative");
  });

  it("never nests links", () => {
    expect(inline('<a href="/a">1<a href="/b">2</a>3</a>')).toBe('<a href="/a">123</a>');
  });

  it("drops unknown tags but keeps their text", () => {
    expect(block('<div class="x"><span style="color:red">hi</span> <u>u</u> <h1>h</h1></div>')).toBe(
      "<p>hi u h</p>",
    );
  });

  it("flattens very deep nesting instead of growing without bound", () => {
    const deep = "<em>".repeat(200) + "deep" + "</em>".repeat(200);
    const tree = parseRichText(deep, { inline: true });
    let depth = 0;
    let node: RichNode | undefined = tree[0];
    while (node && node.type !== "text") {
      depth++;
      node = node.children[0];
    }
    expect(depth).toBeLessThanOrEqual(24);
    expect(richTextToPlain(deep)).toBe("deep");
  });
});

describe("parseRichText · XSS", () => {
  const payloads: [string, string][] = [
    ["<script>alert(1)</script>ok", "ok"],
    ["<SCRIPT SRC=//x.example/x.js></SCRIPT>ok", "ok"],
    ["<script>document.write('<p>x</p>')</script>ok", "ok"],
    ["<scr<script>ipt>alert(1)</script>", "ipt>alert(1)"],
    ["<style>body{display:none}</style>ok", "ok"],
    ["<iframe src=javascript:alert(1)>inner</iframe>ok", "ok"],
    ['<svg onload="alert(1)"><script>alert(1)</script></svg>ok', "ok"],
    // An unclosed <svg> swallows the rest, as foreign content would.
    ["<svg/onload=alert(1)>ok", ""],
    ["<math><mi xlink:href='javascript:alert(1)'>x</mi></math>ok", "ok"],
    ['<img src=x onerror="alert(1)">ok', "ok"],
    ['<p onclick="alert(1)" style="x">ok</p>', "ok"],
    ["<body onload=alert(1)>ok", "ok"],
    ["<object data=javascript:alert(1)></object>ok", "ok"],
    ['<embed src="javascript:alert(1)">ok', "ok"],
    ["<template><img src=x onerror=alert(1)></template>ok", "ok"],
    ['<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>ok', '"&gt;ok'],
    ["<textarea><script>alert(1)</script></textarea>ok", "ok"],
    ["<!--<script>alert(1)</script>-->ok", "ok"],
    ["<![CDATA[<script>alert(1)</script>]]>ok", "alert(1)]]>ok"],
    ["<form action=javascript:alert(1)><button>ok</button></form>", "ok"],
    ["<meta http-equiv=refresh content='0;url=javascript:alert(1)'>ok", "ok"],
    ["<base href=javascript:alert(1)//>ok", "ok"],
    ["<link rel=import href=x>ok", "ok"],
    ['<input autofocus onfocus="alert(1)">ok', "ok"],
    ["<details open ontoggle=alert(1)>ok</details>", "ok"],
    ["<marquee onstart=alert(1)>ok</marquee>", "ok"],
    ["<isindex type=image src=1 onerror=alert(1)>ok", "ok"],
    ["<video><source onerror=alert(1)></video>ok", "ok"],
    ["<select><option>x</option></select>ok", "ok"],
    ["&lt;script&gt;alert(1)&lt;/script&gt;", "<script>alert(1)</script>"],
  ];

  it.each(payloads)("neutralises %s", (payload, text) => {
    const tree = parseRichText(payload);
    for (const name of names(tree)) expect(ALLOWED.has(name)).toBe(true);
    // Whatever text survives is plain text, rendered escaped by React.
    expect(richTextToPlain(payload).replace("&gt;", ">")).toBe(text.replace("&gt;", ">"));
  });

  const hrefs = [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java&#x09;script:alert(1)",
    "&#106;avascript:alert(1)",
    "&#x6A;avascript&#x3A;alert(1)",
    "javascript&colon;alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "//evil.example/x",
    "\\\\evil.example/x",
    "/\\evil.example",
    "https://user:pass@evil.example/",
    "http://evil.example",
    "#a b",
    "",
  ];

  it.each(hrefs)("drops the link for href %j", (href) => {
    const tree = parseRichText(`<a href="${href}">click</a>`, { inline: true });
    expect(tree).toEqual([{ type: "text", text: "click" }]);
  });

  it("drops every attribute but a safe href", () => {
    const tree = parseRichText(
      '<a href="/x" onclick="alert(1)" target="_self" style="x" rel="opener">x</a>',
      { inline: true },
    );
    expect(tree).toEqual([
      { type: "a", href: "/x", external: false, children: [{ type: "text", text: "x" }] },
    ]);
  });

  it("decodes entities into text, never into markup", () => {
    const tree = parseRichText("&lt;img src=x onerror=alert(1)&gt;", { inline: true });
    expect(tree).toEqual([{ type: "text", text: "<img src=x onerror=alert(1)>" }]);
  });

  it("handles a drop-with-content element that never closes", () => {
    expect(parseRichText("ok<script>alert(1)")).toEqual([
      { type: "p", children: [{ type: "text", text: "ok" }] },
    ]);
    expect(parseRichText("ok<svg><g><script>x</script></g>")).toEqual([
      { type: "p", children: [{ type: "text", text: "ok" }] },
    ]);
  });
});

describe("richTextToPlain", () => {
  it("returns the words alone", () => {
    expect(richTextToPlain("<p>Product <strong>Manager</strong></p><p>with   8 years</p>")).toBe(
      "Product Manager with 8 years",
    );
  });
});
