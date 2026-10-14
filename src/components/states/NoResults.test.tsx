// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { type ActiveFilter, NoResults } from "./NoResults";

describe("NoResults", () => {
  it("lists the filters as removable chips and clears them", async () => {
    const removeShelf = vi.fn();
    const onClear = vi.fn();
    const onKeepSearch = vi.fn();
    const filters: ActiveFilter[] = [
      { id: "shelf", label: "Strategy", kind: "shelf", onRemove: removeShelf },
      { id: "q", label: "“roadmap”", kind: "search", onRemove: vi.fn() },
    ];
    render(
      <NoResults
        filters={filters}
        message="Nothing matches."
        onClear={onClear}
        onKeepSearch={onKeepSearch}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "No projects match." })).toBeInTheDocument();
    expect(screen.getByText("Nothing matches.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Active filters" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove Strategy" }));
    expect(removeShelf).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClear).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Keep the search, clear the rest" }));
    expect(onKeepSearch).toHaveBeenCalledOnce();
  });

  it("offers keeping the search only while a search is active", () => {
    render(
      <NoResults
        filters={[{ id: "l", label: "Label: Achieved", kind: "filter", onRemove: vi.fn() }]}
        onClear={vi.fn()}
        onKeepSearch={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Keep the search, clear the rest" })).toBeNull();
  });

  it("hides the chip row with no filters", () => {
    render(<NoResults filters={[]} onClear={vi.fn()} />);
    expect(screen.queryByRole("list")).toBeNull();
  });
});
