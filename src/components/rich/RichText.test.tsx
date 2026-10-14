// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { hasRichText, RichText } from "./RichText";

describe("RichText", () => {
  it("renders the allowed block tags as elements", () => {
    const { container } = render(
      <RichText html="<p>A <strong>b</strong> <em>c</em></p><ul><li>d</li></ul><ol><li>e</li></ol>" />,
    );
    expect(container.innerHTML).toBe(
      "<p>A <strong>b</strong> <em>c</em></p><ul><li>d</li></ul><ol><li>e</li></ol>",
    );
  });

  it("keeps inline content inline", () => {
    const { container } = render(
      <p>
        <RichText inline html="<p>Product Manager with <strong>8 years</strong></p>" />
      </p>,
    );
    expect(container.innerHTML).toBe("<p>Product Manager with <strong>8 years</strong></p>");
  });

  it("opens external links in a new tab and says so", () => {
    const { getByRole } = render(<RichText inline html='<a href="https://example.com">Site</a>' />);
    const link = getByRole("link", { name: /^Site ?\(opens in a new tab\)$/ });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("keeps site links in the same tab", () => {
    const { getByRole } = render(<RichText inline html='<a href="/work">Work</a>' />);
    const link = getByRole("link", { name: "Work" });
    expect(link).not.toHaveAttribute("target");
  });

  it("escapes everything else", () => {
    const html =
      '<img src=x onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)" onclick="x">x</a>&lt;b&gt;';
    const out = renderToString(<RichText html={html} />);
    expect(out).toBe("<p>x&lt;b&gt;</p>");
    expect(out).not.toMatch(/onerror|onclick|script|javascript/);
  });

  it("renders the same markup on the server and in the browser", () => {
    const html = "<p>One <strong>two</strong></p><p>Three <a href='https://a.example'>four</a></p>";
    const { container } = render(<RichText html={html} />);
    expect(renderToString(<RichText html={html} />)).toBe(container.innerHTML);
  });

  it("renders nothing for empty content", () => {
    const { container } = render(<RichText html="<p> </p><script>x</script>" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("hasRichText", () => {
  it("tells whether anything survives sanitising", () => {
    expect(hasRichText(undefined)).toBe(false);
    expect(hasRichText("<p> </p>")).toBe(false);
    expect(hasRichText("<script>x</script>")).toBe(false);
    expect(hasRichText("<strong>x</strong>")).toBe(true);
    expect(hasRichText("<p>x</p>", false)).toBe(true);
  });
});
