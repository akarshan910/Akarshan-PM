// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SaveStatus } from "./SaveStatus";

afterEach(cleanup);

describe("SaveStatus", () => {
  it("says each state in a status region", () => {
    const { rerender } = render(<SaveStatus state="saved" />);
    expect(screen.getByRole("status")).toHaveTextContent("All changes saved");
    rerender(<SaveStatus state="saved" savedLabel="Saved just now" />);
    expect(screen.getByRole("status")).toHaveTextContent("Saved just now");
    rerender(<SaveStatus state="saving" />);
    expect(screen.getByRole("status")).toHaveTextContent("Saving…");
    expect(document.querySelector('[data-spinner="save"]')).not.toBeNull();
    rerender(<SaveStatus state="offline" />);
    expect(screen.getByRole("status")).toHaveTextContent("Offline · saved on this device");
    rerender(<SaveStatus state="failed" />);
    expect(screen.getByRole("status")).toHaveTextContent("Couldn’t save");
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("offers Retry when saving failed", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<SaveStatus state="failed" onRetry={retry} />);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
