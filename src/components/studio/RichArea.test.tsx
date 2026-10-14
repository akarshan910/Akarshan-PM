// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { must } from "~/lib/studio/test-helpers";
import { pasteHtml, RichArea } from "./RichArea";

function Harness({
  initial,
  onChange,
  kind,
}: {
  initial: string;
  onChange?: (v: string) => void;
  kind?: "rich" | "inline";
}) {
  const [v, setV] = useState(initial);
  return (
    <RichArea
      label="Body"
      value={v}
      kind={kind ?? "rich"}
      onChange={(html) => {
        setV(html);
        onChange?.(html);
      }}
    />
  );
}

// jsdom doesn't lay out ranges.
Range.prototype.getBoundingClientRect = () => new DOMRect(0, 0, 10, 10);

/** The text node and offset at character `n` of the field's text. */
function at(box: HTMLElement, n: number): [Node, number] {
  const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  let left = n;
  let node = walk.nextNode();
  let lastNode: Node | null = null;
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (left <= len) return [node, left];
    left -= len;
    lastNode = node;
    node = walk.nextNode();
  }
  const end = must(lastNode);
  return [end, end.textContent?.length ?? 0];
}

/** Selects characters [a, b) of the field's text and tells the bubble. */
function select(box: HTMLElement, a: number, b: number) {
  const r = document.createRange();
  r.setStart(...at(box, a));
  r.setEnd(...at(box, b));
  const sel = must(document.getSelection());
  sel.removeAllRanges();
  sel.addRange(r);
  act(() => {
    document.dispatchEvent(new Event("selectionchange"));
  });
}

const caretAtEnd = (box: HTMLElement) => {
  const n = box.textContent.length;
  select(box, n, n);
};

const paste = (box: HTMLElement, html: string, text = "") => {
  fireEvent.paste(box, {
    clipboardData: { getData: (t: string) => (t === "text/html" ? html : t === "text/plain" ? text : "") },
  });
};

// The payloads src/lib/rich-text.test.ts uses for the site's parser.
const XSS = [
  "<script>alert(1)</script>ok",
  "<scr<script>ipt>alert(1)</script>",
  "<iframe src=javascript:alert(1)>inner</iframe>ok",
  '<svg onload="alert(1)"><script>alert(1)</script></svg>ok',
  "<svg/onload=alert(1)>ok",
  "<math><mi xlink:href='javascript:alert(1)'>x</mi></math>ok",
  '<img src=x onerror="alert(1)">ok',
  '<p onclick="alert(1)" style="color:red">ok</p>',
  "<body onload=alert(1)>ok",
  "<object data=javascript:alert(1)></object>ok",
  '<embed src="javascript:alert(1)">ok',
  "<template><img src=x onerror=alert(1)></template>ok",
  '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>ok',
  "<!--<script>alert(1)</script>-->ok",
  "<form action=javascript:alert(1)><button>ok</button></form>",
  "<meta http-equiv=refresh content='0;url=javascript:alert(1)'>ok",
  '<a href="javascript:alert(1)">x</a>',
  '<a href=" javascript:alert(1)">x</a>',
  '<a href="javascript&colon;alert(1)">x</a>',
  '<a href="vbscript:msgbox(1)">x</a>',
  '<a href="data:text/html,<script>alert(1)</script>">x</a>',
  '<span style="background:url(javascript:alert(1))">x</span>',
];

describe("RichArea", () => {
  it("is a labelled multi-line textbox", () => {
    render(<Harness initial="<p>Hello</p>" />);
    const box = screen.getByRole("textbox", { name: "Body" });
    expect(box).toHaveAttribute("aria-multiline", "true");
    expect(box.innerHTML).toBe("<p>Hello</p>");
  });

  it("formats with Ctrl/Cmd+B, I and K, and undoes and redoes it", () => {
    const onChange = vi.fn();
    render(<Harness initial="<p>Hello world</p>" onChange={onChange} />);
    const box = screen.getByRole("textbox", { name: "Body" });
    select(box, 0, 5);
    fireEvent.keyDown(box, { key: "b", ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong> world</p>");
    select(box, 6, 11);
    fireEvent.keyDown(box, { key: "i", metaKey: true });
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong> <em>world</em></p>");

    fireEvent.keyDown(box, { key: "z", ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong> world</p>");
    fireEvent.keyDown(box, { key: "z", ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith("<p>Hello world</p>");
    expect(box.innerHTML).toBe("<p>Hello world</p>");
    fireEvent.keyDown(box, { key: "z", ctrlKey: true, shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong> world</p>");
    fireEvent.keyDown(box, { key: "y", ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong> <em>world</em></p>");
    // Nothing left to redo.
    const calls = onChange.mock.calls.length;
    fireEvent.keyDown(box, { key: "y", ctrlKey: true });
    expect(onChange.mock.calls.length).toBe(calls);

    // Ctrl+K with nothing selected does nothing; with a selection it asks for the address.
    caretAtEnd(box);
    act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });
    fireEvent.keyDown(box, { key: "k", ctrlKey: true });
    expect(screen.queryByRole("textbox", { name: "Link address" })).not.toBeInTheDocument();
  });

  it("reaches the bubble by keyboard and returns focus to the text", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="<p>Hello world</p>" onChange={onChange} />);
    const box = screen.getByRole("textbox", { name: "Body" });
    box.focus();
    select(box, 0, 5);
    fireEvent.keyDown(box, { key: "F10", altKey: true });
    const bold = screen.getByRole("button", { name: "Bold" });
    expect(bold).toHaveFocus();
    expect(bold).toHaveAttribute("aria-keyshortcuts", "Control+B Meta+B");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong> world</p>");
    expect(box).toHaveFocus();

    // Escape from the toolbar goes back to the text.
    select(box, 6, 11);
    fireEvent.keyDown(box, { key: "F10", altKey: true });
    fireEvent.keyDown(screen.getByRole("button", { name: "Bold" }), { key: "Escape" });
    expect(box).toHaveFocus();

    // A link: Ctrl+K, an address, Enter.
    select(box, 6, 11);
    fireEvent.keyDown(box, { key: "k", ctrlKey: true });
    const address = screen.getByRole("textbox", { name: "Link address" });
    expect(address).toHaveFocus();
    await user.clear(address);
    await user.type(address, "https://example.com{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(
      '<p><strong>Hello</strong> <a href="https://example.com">world</a></p>',
    );
    expect(box).toHaveFocus();

    // An unsafe address is refused, and Escape cancels; both return to the text.
    select(box, 0, 1);
    fireEvent.keyDown(box, { key: "k", ctrlKey: true });
    const again = screen.getByRole("textbox", { name: "Link address" });
    await user.clear(again);
    await user.type(again, "javascript:alert(1){Enter}");
    expect(box).toHaveFocus();
    expect(box.innerHTML).not.toContain("javascript");
    select(box, 0, 1);
    fireEvent.keyDown(box, { key: "k", ctrlKey: true });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Link address" }), { key: "Escape" });
    expect(box).toHaveFocus();
    expect(screen.queryByRole("textbox", { name: "Link address" })).not.toBeInTheDocument();
  });

  it("pastes plain text or allowlisted markup only", () => {
    const onChange = vi.fn();
    render(<Harness initial="<p>A</p>" onChange={onChange} />);
    const box = screen.getByRole("textbox", { name: "Body" });
    for (const payload of XSS) {
      caretAtEnd(box);
      paste(box, payload);
      const html = box.innerHTML;
      expect(html, payload).not.toMatch(
        /<(script|img|iframe|svg|math|object|embed|template|form|meta|style|span|noscript)/i,
      );
      expect(html, payload).not.toMatch(/\son\w+=|style=|javascript:|vbscript:|data:/i);
    }
    expect(onChange).toHaveBeenCalled();
    const last = must(onChange.mock.calls.at(-1))[0] as string;
    expect(last).not.toMatch(/javascript:|<script/i);
  });

  it("keeps formatting from a paste and unwraps a one-line paragraph", () => {
    expect(
      pasteHtml(
        { html: '<p style="x">Hi <b>there</b> <a href="https://a.b">link</a></p>', text: "" },
        "rich",
      ),
    ).toBe('Hi <strong>there</strong> <a href="https://a.b">link</a>');
    expect(pasteHtml({ html: "<p>One</p><p>Two</p>", text: "" }, "rich")).toBe("<p>One</p><p>Two</p>");
    expect(pasteHtml({ html: "", text: "a <b> & c" }, "rich")).toBe("a &lt;b&gt; &amp; c");
    expect(pasteHtml({ html: "", text: "One\nline\n\nTwo" }, "rich")).toBe("<p>One line</p><p>Two</p>");
    expect(pasteHtml({ html: "", text: "One\nTwo" }, "inline")).toBe("One Two");
    expect(pasteHtml({ html: "<ul><li>x</li></ul>", text: "" }, "inline")).toBe("x");

    const onChange = vi.fn();
    render(<Harness initial="<p>Start</p>" onChange={onChange} />);
    const box = screen.getByRole("textbox", { name: "Body" });
    caretAtEnd(box);
    paste(box, "", " and <more>");
    expect(onChange).toHaveBeenLastCalledWith("<p>Start and &lt;more&gt;</p>");
    // A paste is one undo step.
    fireEvent.keyDown(box, { key: "z", ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith("<p>Start</p>");
  });

  it("waits for an IME composition to end, and doesn't rewrite the DOM after its own change", () => {
    const onChange = vi.fn();
    render(<Harness initial="<p>Hi</p>" onChange={onChange} />);
    const box = screen.getByRole("textbox", { name: "Body" });
    const text = must(box.querySelector("p")?.firstChild);
    fireEvent.compositionStart(box);
    text.textContent = "Hiに";
    fireEvent.input(box, { isComposing: true });
    fireEvent.input(box);
    fireEvent.keyDown(box, { key: "b", ctrlKey: true, isComposing: true });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(box);
    expect(onChange).toHaveBeenLastCalledWith("<p>Hiに</p>");
    // The parent re-rendered with the new value; the same text node is still there, so the caret stays.
    expect(box.querySelector("p")?.firstChild).toBe(text);
  });

  it("groups quick typing into one undo step, and blocks Enter in a one-line field", () => {
    const onChange = vi.fn();
    render(<Harness initial="Title" kind="inline" onChange={onChange} />);
    const box = screen.getByRole("textbox", { name: "Body" });
    expect(box).toHaveAttribute("aria-multiline", "false");
    const text = must(box.firstChild);
    text.textContent = "Title a";
    fireEvent.input(box);
    text.textContent = "Title ab";
    fireEvent.input(box);
    expect(onChange).toHaveBeenLastCalledWith("Title ab");
    const enter = fireEvent.keyDown(box, { key: "Enter" });
    expect(enter).toBe(false);
    fireEvent.keyDown(box, { key: "z", ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith("Title");
  });
});
