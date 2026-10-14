// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MovedNote } from "./MovedNote";

afterEach(cleanup);

describe("MovedNote", () => {
  it("explains the redirect and dismisses with ✕", async () => {
    const onDismiss = vi.fn();
    render(<MovedNote kind="project" onDismiss={onDismiss} />);
    expect(
      screen.getByText("That project isn’t available any more. Here’s everything that is."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(/isn’t available/)).toBeNull();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("names a post on /writing, and dismisses without a callback", async () => {
    render(<MovedNote kind="post" />);
    expect(screen.getByText(/That post isn’t available/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(/That post/)).toBeNull();
  });
});
