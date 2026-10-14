// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { type SkillGroup, SkillsCloud } from "./SkillsCloud";

afterEach(cleanup);

const GROUPS: SkillGroup[] = [
  {
    id: "p",
    title: "Product",
    subtitle: "Strategy & execution",
    items: [
      { id: "a", text: "Road-mapping", size: "m" },
      { id: "b", text: "A/B Testing", size: "xl" },
    ],
  },
  {
    id: "d",
    title: "Data",
    items: [
      { id: "c", text: "SQL", size: "m" },
      { id: "e", text: "ETL", size: "s" },
      { id: "f", text: "Product & Data Analytics", size: "l" },
    ],
  },
];

const cloud = () => document.querySelector(".cloud");

describe("SkillsCloud", () => {
  it("keeps groups semantic and orders words visually", () => {
    render(<SkillsCloud groups={GROUPS} />);
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveAccessibleName("Product");
    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("heading", { level: 3, name: /Strategy & execution\s*Product/ })).toHaveStyle({
      order: "0",
    });
    expect(screen.getByText("A/B Testing")).toHaveClass("cw", "xl");
    expect(screen.getByText("ETL")).toHaveClass("s");
    // Two M words: the second in visual order uses the alternate face.
    const ms = ["Road-mapping", "SQL"].map((t) => screen.getByText(t));
    expect(ms.filter((m) => m.classList.contains("alt"))).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Data" }).querySelector(".sub")).toBeNull();
  });

  it("pins a group on click and clears it on a second click", async () => {
    const user = userEvent.setup();
    render(<SkillsCloud groups={GROUPS} />);
    const data = screen.getByRole("button", { name: "Data" });
    expect(data).toHaveAttribute("aria-pressed", "false");
    await user.click(data);
    expect(data).toHaveAttribute("aria-pressed", "true");
    expect(cloud()).toHaveClass("lit");
    expect(screen.getByText("SQL")).toHaveClass("on");
    expect(screen.getByText("Road-mapping")).not.toHaveClass("on");
    await user.click(data);
    expect(data).toHaveAttribute("aria-pressed", "false");
    // The mouse is still over it, so it previews until the pointer leaves and focus moves on.
    expect(cloud()).toHaveClass("lit");
    await user.unhover(data);
    await user.click(document.body);
    expect(cloud()).not.toHaveClass("lit");
  });

  it("previews on focus and mouse hover, not on touch", () => {
    render(<SkillsCloud groups={GROUPS} />);
    const product = screen.getByRole("button", { name: "Product" });
    fireEvent.focus(product);
    expect(cloud()).toHaveClass("lit");
    expect(screen.getByText("A/B Testing")).toHaveClass("on");
    fireEvent.blur(product);
    expect(cloud()).not.toHaveClass("lit");

    fireEvent.pointerEnter(product, { pointerType: "touch" });
    expect(cloud()).not.toHaveClass("lit");
    fireEvent.pointerEnter(product, { pointerType: "mouse" });
    expect(cloud()).toHaveClass("lit");
    fireEvent.pointerLeave(product, { pointerType: "touch" });
    expect(cloud()).toHaveClass("lit");
    fireEvent.pointerLeave(product, { pointerType: "mouse" });
    expect(cloud()).not.toHaveClass("lit");
  });

  it("is keyboard-complete: Tab reaches each group word and Enter pins it", async () => {
    const user = userEvent.setup();
    render(<SkillsCloud groups={GROUPS} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Product" })).toHaveFocus();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Data" })).toHaveAttribute("aria-pressed", "true");
  });

  it("counts skills and groups in the hint for every device", () => {
    const { container, rerender } = render(<SkillsCloud groups={GROUPS} />);
    expect(container.querySelector(".hintLaptop")).toHaveTextContent(
      "Hover or click a group to light up its skills · 5 skills in 2 groups",
    );
    expect(container.querySelector(".hintIpad")).toHaveTextContent(
      "Tap a group to light up its skills · 5 skills in 2 groups",
    );
    expect(container.querySelector(".hintPhone")).toHaveTextContent("Tap a group to light it up");
    rerender(<SkillsCloud groups={[{ id: "x", title: "X", items: [{ id: "y", text: "Y", size: "m" }] }]} />);
    expect(container.querySelector(".hintIpad")).toHaveTextContent("1 skill in 1 group");
  });

  it("sets the reveal state and each word's wave", () => {
    const { rerender } = render(<SkillsCloud groups={GROUPS} reveal="pending" />);
    expect(cloud()).toHaveClass("pending");
    rerender(<SkillsCloud groups={GROUPS} reveal="go" />);
    expect(cloud()).toHaveClass("go");
    const words = [...document.querySelectorAll<HTMLElement>(".cw")];
    for (const w of words) expect(Number(w.style.getPropertyValue("--i5"))).toBe(Number(w.style.order) % 5);
  });

  it("renders nothing without groups", () => {
    const { container } = render(<SkillsCloud groups={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
