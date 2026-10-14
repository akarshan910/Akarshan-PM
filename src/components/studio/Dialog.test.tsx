// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dialog } from "./Dialog";

afterEach(cleanup);

function Harness({
  onConfirm = () => undefined,
  busy,
  children,
  ...rest
}: Partial<Parameters<typeof Dialog>[0]> & { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete “Arcana Workspace”?"
        confirmLabel="Delete project"
        onConfirm={onConfirm}
        busy={busy}
        {...rest}
      >
        {children}
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("opens on Cancel, closes on Esc and returns focus to its trigger", async () => {
    const user = userEvent.setup();
    render(<Harness description="It has never been published, so the live site doesn’t change." />);
    const open = screen.getByRole("button", { name: "Open" });
    await user.click(open);
    const dialog = screen.getByRole("dialog", { name: "Delete “Arcana Workspace”?" });
    expect(dialog).toHaveAccessibleDescription(
      "It has never been published, so the live site doesn’t change.",
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(open).toHaveFocus();
  });

  it("Cancel closes; the confirm runs onConfirm", async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();
    render(<Harness onConfirm={confirm} confirmVariant="danger" />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("traps focus inside", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Delete project" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("type-to-confirm: the confirm stays disabled until the exact address is typed", async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();
    render(
      <Harness
        onConfirm={confirm}
        confirmPhrase="puja-engagement-platform"
        confirmLabel="Delete forever"
        confirmVariant="danger"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    const field = screen.getByRole("textbox", { name: "Type puja-engagement-platform to confirm" });
    const del = screen.getByRole("button", { name: "Delete forever" });
    await user.type(field, "puja-engagement");
    expect(del).toHaveAttribute("aria-disabled", "true");
    await user.click(del);
    expect(confirm).not.toHaveBeenCalled();
    await user.type(field, "-platform");
    expect(del).not.toHaveAttribute("aria-disabled");
    await user.click(del);
    expect(confirm).toHaveBeenCalledTimes(1);
    // Closing clears what was typed.
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("while busy, Esc and Cancel wait and the confirm shows its spinner", async () => {
    const user = userEvent.setup();
    render(<Harness busy layout="panel" kicker="Publish changes" confirmLabel="Publishing…" />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Publish changes")).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Publishing…" });
    expect(confirm).toHaveAttribute("aria-busy", "true");
    expect(confirm.querySelector("[data-spinner]")).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("panel layout renders its checks and footer link; plain shows the icon tile", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <Harness layout="panel" footerStart={<a href="#preview">Preview first</a>} width={520}>
        <p>Cover, prototype and every image’s alt text are set.</p>
      </Harness>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Cover, prototype and every image’s alt text are set.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Preview first" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveStyle({ width: "520px" });
    unmount();
    render(<Harness icon={<svg data-testid="trash" />} iconTone="err" confirmDisabled />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByTestId("trash")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete project" })).toHaveAttribute("aria-disabled", "true");
  });
});
