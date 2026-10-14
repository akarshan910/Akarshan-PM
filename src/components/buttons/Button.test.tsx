// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, IconButton } from "./Button";
import { TextLink } from "./TextLink";

afterEach(cleanup);

describe("Button (C3)", () => {
  it("renders a button by default and a link with href", () => {
    render(
      <>
        <Button>Primary</Button>
        <Button href="#work" iconEnd="arrow-down">
          See selected work
        </Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Primary" })).toHaveAttribute("type", "button");
    const link = screen.getByRole("link", { name: "See selected work" });
    expect(link).toHaveAttribute("href", "#work");
    expect(link.className).toContain("cta");
  });

  it("applies the variant and size classes", () => {
    render(
      <>
        <Button variant="secondary" size="compact" icon="download">
          Full résumé
        </Button>
        <Button variant="destructive">Delete project</Button>
        <Button variant="ghost">Ghost</Button>
        <Button size="menu" block>
          Let’s Talk →
        </Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Full résumé" }).className).toMatch(/cta2.*compact/);
    expect(screen.getByRole("button", { name: "Delete project" }).className).toMatch(/destructive/);
    expect(screen.getByRole("button", { name: "Ghost" }).className).toMatch(/ghost/);
    expect(screen.getByRole("button", { name: "Let’s Talk →" }).className).toMatch(/menu.*block/);
  });

  it("ignores clicks while disabled, and keeps focus", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Publish
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Publish" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows the spinner and the in-progress verb while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Sending" onClick={onClick}>
        Send
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Sending" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("[class*=spinner]")).not.toBeNull();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick and supports keyboard activation", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps a disabled link in the tab order without an href", async () => {
    const onClick = vi.fn();
    render(
      <Button href="/x" disabled onClick={onClick}>
        Link
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).not.toHaveAttribute("href");
    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("says when a link opens a new tab", () => {
    render(
      <Button href="https://example.test" newTab variant="secondary">
        New tab ↗
      </Button>,
    );
    const link = screen.getByRole("link", { name: /^New tab ↗\s*\(opens in a new tab\)$/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("IconButton (C3)", () => {
  it("names the icon-only button and supports disabled", () => {
    render(
      <>
        <IconButton icon="arrow-left" label="Previous testimonials" shape="round" disabled />
        <IconButton icon="more" label="More actions" />
      </>,
    );
    expect(screen.getByRole("button", { name: "Previous testimonials" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "More actions" }).className).toMatch(/icon/);
  });
});

describe("TextLink (C3)", () => {
  it("renders both variants", () => {
    render(
      <>
        <TextLink href="/work">All work →</TextLink>
        <TextLink href="https://example.test" variant="inline" icon="arrow-out" newTab>
          LinkedIn
        </TextLink>
      </>,
    );
    expect(screen.getByRole("link", { name: "All work →" }).className).toMatch(/underline/);
    const inline = screen.getByRole("link", { name: /^LinkedIn\s*\(opens in a new tab\)$/ });
    expect(inline.className).toMatch(/inline/);
    expect(inline.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
