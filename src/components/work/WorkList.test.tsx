// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EMPTY_QUERY, type WorkQuery, type WorkRow, type WorkShelf } from "~/lib/work-list";

import { SEARCH_DEBOUNCE_MS, WorkList } from "./WorkList";

const make = (i: number): WorkRow => ({
  slug: `p-${i}`,
  volume: String(i + 1).padStart(2, "0"),
  title: i === 0 ? "Café ledger" : `Project ${i + 1}`,
  summary: "A summary",
  company: i % 2 ? "Odd Co" : "Even Co",
  topics: i % 3 ? ["Games"] : ["Fintech"],
  shelf: i < 20 ? { id: "a", name: "Shelf A" } : { id: "b", name: "Shelf B" },
  ...(i % 4 ? { headline: { value: `${i}%`, type: "target" as const } } : {}),
  labels: i % 4 ? ["target"] : ["achieved"],
  firstPublishedAt: "2026-10-13T00:00:00Z",
});

const rows = Array.from({ length: 30 }, (_, i) => make(i));
const shelves: WorkShelf[] = [
  { id: "a", name: "Shelf A", count: 20 },
  { id: "b", name: "Shelf B", count: 10 },
];

function Harness({
  initial = EMPTY_QUERY,
  onQuery,
}: {
  initial?: WorkQuery;
  onQuery?: (q: WorkQuery) => void;
}) {
  const [query, setQuery] = useState(initial);
  return (
    <MemoryRouter>
      <WorkList
        rows={rows}
        shelves={shelves}
        query={query}
        onChange={(q) => {
          setQuery(q);
          onQuery?.(q);
        }}
        moved
      />
    </MemoryRouter>
  );
}

const links = () => screen.getAllByRole("link");

afterEach(() => {
  vi.useRealTimers();
});

describe("WorkList", () => {
  it("shows 24 rows, then loads the rest and moves focus to the first new row", () => {
    render(<Harness />);
    expect(links()).toHaveLength(24);
    expect(screen.getByText("Showing 24 of 30")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load 6 more" }));
    expect(links()).toHaveLength(30);
    expect(screen.queryByRole("button", { name: /Load/ })).toBeNull();
    expect(links()[24]).toHaveFocus();
  });

  it("counts shelves and marks the pressed chip", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "All 30" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getAllByRole("button", { name: "Shelf B 10" })[0] as HTMLElement);
    expect(screen.getAllByRole("button", { name: "Shelf B 10" })[0]).toHaveAttribute("aria-pressed", "true");
    expect(links()).toHaveLength(10);
    fireEvent.click(screen.getAllByRole("button", { name: "All 30" })[0] as HTMLElement);
    expect(links()).toHaveLength(24);
  });

  it("debounces the search by 150ms and matches without accents", () => {
    vi.useFakeTimers();
    const onQuery = vi.fn();
    render(<Harness onQuery={onQuery} />);
    const [box] = screen.getAllByRole("searchbox", { name: "Search work" });
    fireEvent.change(box as HTMLElement, { target: { value: "cafe" } });
    expect(onQuery).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    expect(onQuery).toHaveBeenCalledWith(expect.objectContaining({ q: "cafe" }));
    expect(links()).toHaveLength(1);
    expect(box).toHaveValue("cafe");
  });

  it("filters through the dropdowns, which close on Escape", () => {
    render(<Harness />);
    const label = screen.getByRole("button", { name: /^Label/ });
    fireEvent.click(label);
    expect(label).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Achieved" })[0] as HTMLElement);
    expect(links()).toHaveLength(8);
    expect(screen.getByRole("button", { name: /^Label · 1/ })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(label).toHaveAttribute("aria-expanded", "false");
    expect(label).toHaveFocus();
    fireEvent.click(label);
    fireEvent.pointerDown(document.body);
    expect(label).toHaveAttribute("aria-expanded", "false");
  });

  it("sorts A–Z", () => {
    render(<Harness />);
    fireEvent.change(screen.getAllByRole("combobox", { name: "Sort" })[0] as HTMLElement, {
      target: { value: "az" },
    });
    expect(links()[0]).toHaveTextContent("Café ledger");
    expect(links()[1]).toHaveTextContent("Project 10");
  });

  it("shows no results with removable chips, and both ways out", () => {
    render(<Harness initial={{ ...EMPTY_QUERY, shelf: "b", topic: ["Fintech"], q: "zzz" }} />);
    expect(screen.getByRole("heading", { name: "No projects match." })).toBeInTheDocument();
    expect(screen.getByText("Nothing in Shelf B is about Fintech and mentions “zzz”.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove Topic: Fintech" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep the search, clear the rest" }));
    expect(screen.getByText("Nothing mentions “zzz”.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(links()).toHaveLength(24);
  });

  it("opens the phone filter sheet, filters inside it, and closes", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Filters (0)" }));
    const sheet = screen.getByRole("dialog", { name: "Filters" });
    expect(sheet).toBeInTheDocument();
    const games = screen.getAllByRole("checkbox", { name: "Games" });
    fireEvent.click(games[games.length - 1] as HTMLElement);
    expect(screen.getByRole("button", { name: "Filters (1)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("button", { name: "Filters (0)" })).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Filters (0)" }));
    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the moved note", () => {
    render(<Harness />);
    expect(screen.getByText(/isn’t available any more/)).toBeInTheDocument();
  });
});
