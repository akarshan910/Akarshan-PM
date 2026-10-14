// @vitest-environment jsdom
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { type ProofItem, ProofStrip } from "./ProofStrip";

afterEach(cleanup);

const ITEMS: [ProofItem, ProofItem, ProofItem] = [
  { id: "a", value: "230M+", label: "devices personalised and served", source: "Glance · InMobi" },
  { id: "b", value: "$2M", unit: "ARR", label: "unlocked via Tracfone, Japan and Brazil" },
  { id: "c", value: "~₹1.5 Cr", unit: "/yr", label: "saved by in-housing vendor services" },
];

describe("ProofStrip", () => {
  it("renders one list item per proof cell, with the optional unit and source", () => {
    const { getByRole } = render(<ProofStrip items={ITEMS} />);
    const list = getByRole("list");
    const cells = within(list).getAllByRole("listitem");
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveTextContent("230M+devices personalised and servedGlance · InMobi");
    expect(cells[1]).toHaveTextContent("$2M ARRunlocked");
    expect(cells[2]).toHaveTextContent("~₹1.5 Cr/yrsaved");
  });

  it("hides the source and unit when they're empty", () => {
    const { container } = render(<ProofStrip items={[ITEMS[0], { ...ITEMS[1], unit: "" }]} />);
    expect(container.querySelectorAll(".unit")).toHaveLength(0);
    expect(container.querySelectorAll(".source")).toHaveLength(1);
  });

  it("shows the problem spaces with their label, and hides the row when empty", () => {
    const { getByText, rerender, container } = render(
      <ProofStrip items={ITEMS} spaces={{ label: "Problem spaces", items: ["Data platforms", "0→1"] }} />,
    );
    expect(getByText("Problem spaces")).toBeInTheDocument();
    expect(getByText("0→1")).toHaveClass("chip");
    rerender(<ProofStrip items={ITEMS} spaces={{ items: ["Data platforms"] }} />);
    expect(container.querySelector(".spacesLabel")).toBeNull();
    rerender(<ProofStrip items={ITEMS} spaces={{ label: "Problem spaces", items: [] }} />);
    expect(container.querySelector(".spaces")).toBeNull();
  });

  it("renders the chips alone, and nothing at all when everything is empty", () => {
    const { container, rerender } = render(<ProofStrip items={[]} spaces={{ items: ["AI"] }} />);
    expect(container.querySelector("ul")).toBeNull();
    expect(container.querySelector(".chip")).not.toBeNull();
    rerender(<ProofStrip items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
