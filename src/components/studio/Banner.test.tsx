// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Alert, Banner, EditorBanner } from "./Banner";
import { Chip, Mono } from "./Chip";
import { Glyph } from "./glyphs";
import { Shim } from "./Skeleton";
import { Spinner } from "./Spinner";

afterEach(cleanup);

describe("Banners", () => {
  it("alerts carry their role, tone and entrance", () => {
    render(
      <>
        <Alert tone="err" role="alert" enter icon={<Glyph name="padlock" />}>
          <b>Too many tries.</b>
        </Alert>
        <Alert tone="info">After you sign in, you’ll go straight back.</Alert>
      </>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("alert", "err", "enter");
    expect(alert).toHaveTextContent("Too many tries.");
  });

  it("banners and the editor bar take an action", () => {
    render(
      <>
        <Banner tone="warn" role="status" icon={<Glyph name="cloud-off" size={16} />}>
          You’re offline.
        </Banner>
        <EditorBanner tone="err" action={<button type="button">Retry now</button>}>
          Your last change didn’t save.
        </EditorBanner>
      </>,
    );
    expect(screen.getByRole("status")).toHaveClass("ban", "warn");
    expect(screen.getByRole("button", { name: "Retry now" }).parentElement).toHaveClass("bar", "err");
  });
});

describe("Small pieces", () => {
  it("chips, mono, skeleton and spinners", () => {
    const { container } = render(
      <>
        <Chip tone="ok" dot>
          Live
        </Chip>
        <Chip size="sm">Draft</Chip>
        <Mono as="div">Publish changes</Mono>
        <Shim height={14} width="60%" radius={4} />
        <Shim height={14} />
        <Spinner />
        <Spinner kind="large" />
        <Glyph name="lock" size={20} style={{ color: "red" }} />
      </>,
    );
    expect(screen.getByText("Live")).toHaveClass("chip", "ok");
    expect(screen.getByText("Draft")).toHaveClass("chip", "neutral", "sm");
    expect(screen.getByText("Publish changes").tagName).toBe("DIV");
    const shims = container.querySelectorAll(".shim");
    expect(shims[0]).toHaveStyle({ width: "60%", height: "14px", borderRadius: "4px" });
    expect(shims[0]).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector('[data-spinner="dark"]')).not.toBeNull();
    expect(container.querySelector('[data-spinner="large"]')).not.toBeNull();
    const svg = container.querySelector("svg.ico");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveStyle({ width: "20px" });
  });
});
