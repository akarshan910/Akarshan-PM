// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, IconButton } from "./Button";

describe("Button", () => {
  it("renders each board class", () => {
    render(
      <>
        <Button variant="cta">Publish</Button>
        <Button>Preview</Button>
        <Button variant="pbtn">Email me a code</Button>
        <Button variant="btn2">Use a different email</Button>
        <Button variant="btn2-dark">Open the dashboard</Button>
        <Button variant="ghost">Unschedule</Button>
        <Button variant="danger">Delete project</Button>
        <Button variant="link" className="extra">
          Resend code
        </Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Publish" })).toHaveClass("cta");
    expect(screen.getByRole("button", { name: "Preview" })).toHaveClass("btn");
    expect(screen.getByRole("button", { name: "Email me a code" })).toHaveClass("pbtn");
    expect(screen.getByRole("button", { name: "Use a different email" })).toHaveClass("btn2");
    expect(screen.getByRole("button", { name: "Open the dashboard" })).toHaveClass("btn2Dark");
    expect(screen.getByRole("button", { name: "Unschedule" })).toHaveClass("ghost");
    expect(screen.getByRole("button", { name: "Delete project" })).toHaveClass("danger");
    expect(screen.getByRole("button", { name: "Resend code" })).toHaveClass("link", "extra");
    expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute("type", "button");
  });

  it("aria-disabled stays focusable but ignores clicks", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    render(
      <Button variant="cta" disabled onClick={click}>
        Fix 2 to publish
      </Button>,
    );
    const b = screen.getByRole("button", { name: "Fix 2 to publish" });
    expect(b).toHaveAttribute("aria-disabled", "true");
    expect(b).not.toBeDisabled();
    await user.tab();
    expect(b).toHaveFocus();
    await user.click(b);
    expect(click).not.toHaveBeenCalled();
  });

  it("busy shows the spinner, sets aria-busy and ignores clicks", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    render(
      <Button variant="pbtn" busy onClick={click}>
        Checking code…
      </Button>,
    );
    const b = screen.getByRole("button", { name: "Checking code…" });
    expect(b).toHaveAttribute("aria-busy", "true");
    expect(b.querySelector('[data-spinner="light"]')).not.toBeNull();
    await user.click(b);
    expect(click).not.toHaveBeenCalled();
  });

  it("runs onClick when enabled", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    render(<Button onClick={click}>Retry now</Button>);
    await user.click(screen.getByRole("button", { name: "Retry now" }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("icon buttons carry their label", () => {
    render(
      <>
        <IconButton label="More actions">
          <svg />
        </IconButton>
        <IconButton label="Close" size={36}>
          <svg />
        </IconButton>
      </>,
    );
    expect(screen.getByRole("button", { name: "More actions" })).toHaveClass("ib");
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass("ib", "ib36");
  });
});
