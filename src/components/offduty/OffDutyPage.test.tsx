// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { OffDutyArt } from "./art";
import { type OffDutyItem, OffDutyPage } from "./OffDutyPage";

afterEach(cleanup);

const ARTS: OffDutyArt[] = ["kunai", "pencil", "paddle", "pan", "plane", "camera"];
const ITEMS: OffDutyItem[] = ARTS.map((art, i) => ({
  id: `o${i}`,
  label: `Label ${i + 1}`,
  title: `Title ${i + 1}`,
  text: `Text ${i + 1}`,
  tag: i === 5 ? "" : `Tag ${i + 1}`,
  accent: "#FF5A67",
  ground: "#1C0C0F",
  art,
}));
const PICKS = [
  { id: "p1", title: "Attack on Titan", note: "Action · Strategy" },
  { id: "p2", title: "Death Note" },
];

describe("OffDutyPage", () => {
  it("renders each item as an article labelled by its title, with decorative art", () => {
    const { container } = render(<OffDutyPage items={ITEMS} />);
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(6);
    expect(articles[0]).toHaveAccessibleName("Title 1");
    expect(articles[0]).toHaveAttribute("data-l", "big");
    expect(articles[0]).toHaveAttribute("data-i", "big");
    expect(articles[1]).toHaveAttribute("data-l", "side");
    expect(articles[3]).toHaveAttribute("data-i", "third");
    expect(articles[0]?.style.getPropertyValue("--pa")).toBe("#FF5A67");
    expect(articles[0]?.style.getPropertyValue("--lc")).toBe("1 / 8");
    const art = container.querySelectorAll("article svg, .num, .tone");
    for (const el of art) expect(el).toHaveAttribute("aria-hidden", "true");
    expect(within(articles[0] as HTMLElement).getByText("01")).toHaveClass("num");
    // Each preset draws something.
    for (const a of articles) expect(a.querySelector(".ico")?.childElementCount).toBeGreaterThan(0);
    // Three speed-line variants per panel: laptop, iPad and phone slots.
    expect(articles[0]?.querySelectorAll(".sl")).toHaveLength(3);
  });

  it("hides an empty tag and has no shelf without picks", () => {
    render(<OffDutyPage items={ITEMS} />);
    expect(screen.getByText("Tag 1")).toHaveClass("tag");
    expect(within(screen.getAllByRole("article")[5] as HTMLElement).queryByText(/Tag/)).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("shows the first item's picks as numbered spines, in the panel and after the phone rail", () => {
    const items = [{ ...ITEMS[0], picks: PICKS } as OffDutyItem, ...ITEMS.slice(1)];
    render(<OffDutyPage items={items} />);
    const lists = screen.getAllByRole("list", { name: "All-time favourites" });
    expect(lists).toHaveLength(2);
    const spines = within(lists[0] as HTMLElement).getAllByRole("listitem");
    expect(spines[0]).toHaveTextContent("01Attack on TitanAction · Strategy");
    expect(spines[0]?.style.getPropertyValue("--sh")).toBe("#FF5A67");
    expect(spines[1]?.style.paddingTop).toBe("18px");
    expect(spines[1]?.querySelector(".spG")).toBeNull();
    expect(screen.getAllByText("Currently watching / all-time favourites")).toHaveLength(2);
    expect(screen.getByRole("region", { name: "Currently watching / all-time favourites" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("is a focusable, labelled rail whose decorative dots follow the scroll", () => {
    const { container } = render(<OffDutyPage items={ITEMS} />);
    const rail = screen.getByRole("region", { name: "Off duty" });
    expect(rail).toHaveAttribute("tabindex", "0");
    const dots = container.querySelector(".dots");
    expect(dots).toHaveAttribute("aria-hidden", "true");
    expect(dots?.children[0]).toHaveClass("dotOn");
    [...rail.children].forEach((p, i) => {
      Object.defineProperty(p, "offsetLeft", { value: i * 312 });
    });
    rail.scrollLeft = 640;
    fireEvent.scroll(rail);
    expect(dots?.children[2]).toHaveClass("dotOn");
  });

  it("sets the grid rows for the item count, and hides dots for one item and everything for none", () => {
    const { container, rerender } = render(<OffDutyPage items={ITEMS.slice(0, 1)} />);
    const rail = screen.getByRole("region", { name: "Off duty" });
    expect(rail.style.getPropertyValue("--lrows")).toBe("278px 278px");
    expect(rail.style.getPropertyValue("--irows")).toBe("560px");
    expect(container.querySelector(".dots")).toBeNull();
    rerender(<OffDutyPage items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
