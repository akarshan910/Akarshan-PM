// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RESULT_LABELS, ResultLabel, type ResultType } from "./ResultLabel";
import { SectionHeader } from "./SectionHeader";
import { AvailabilityChip, Chip, FilterChip, StatusBadge, VolumeTag } from "./Tags";

afterEach(cleanup);

describe("ResultLabel (C5)", () => {
  it.each(Object.keys(RESULT_LABELS) as ResultType[])("renders %s as text with its meaning", (type) => {
    const { container } = render(<ResultLabel type={type} />);
    const label = container.firstElementChild as HTMLElement;
    expect(label.className).toContain(type);
    expect(label.querySelector("[aria-hidden=true]")?.textContent).toBe(RESULT_LABELS[type].text);
    expect(screen.getByText(RESULT_LABELS[type].meaning)).toHaveClass("sr-only");
  });
});

describe("SectionHeader (C4)", () => {
  it("renders kicker, two-tone title and intro", () => {
    render(
      <SectionHeader
        id="work-t"
        kicker="Selected work · Shipped"
        title="Shipped, measured,"
        titleMuted="explained."
        intro="Every number is labelled."
      />,
    );
    const h2 = screen.getByRole("heading", { level: 2, name: "Shipped, measured, explained." });
    expect(h2).toHaveAttribute("id", "work-t");
    expect(screen.getByText("explained.").className).toMatch(/muted/);
    expect(screen.getByText("Selected work · Shipped")).toBeInTheDocument();
    expect(screen.getByText("Every number is labelled.").tagName).toBe("P");
  });

  it("leaves out an empty kicker, muted half and intro", () => {
    const { container } = render(
      <SectionHeader title="Where I’ve built." kicker="" intro="" variant="wide" />,
    );
    expect(container.querySelectorAll("p")).toHaveLength(0);
    expect(container.querySelector("span")).toBeNull();
    expect(container.querySelector("h2")?.previousElementSibling).toBeNull();
    expect(container.firstElementChild?.className).toMatch(/wide/);
  });
});

describe("Tags (C6)", () => {
  it("renders the volume tag in each size, and hides it without a number", () => {
    const { container, rerender } = render(<VolumeTag number="05" accent="#FF5A67" size="lead" />);
    expect(screen.getByText("VOL.05")).toHaveStyle({ background: "#FF5A67" });
    expect(container.firstElementChild?.className).toMatch(/volLead/);
    rerender(<VolumeTag number="02" accent="#F5A524" size="compact" />);
    expect(container.textContent).toBe("Volume 02");
    rerender(<VolumeTag number="03" accent="#38BDF8" />);
    expect(container.firstElementChild?.className).toMatch(/volStandard/);
    rerender(<VolumeTag number="" accent="#38BDF8" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders both badges, and hides an empty status", () => {
    const { container, rerender } = render(<StatusBadge kind="prototype" lead />);
    expect(container.textContent).toBe("Prototype");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<StatusBadge kind="status" label="Shipped · AI" accent="#2DD4BF" />);
    expect(container.textContent).toBe("Shipped · AI");
    rerender(<StatusBadge kind="status" label={undefined} accent="#2DD4BF" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides empty chips", () => {
    const { container, rerender } = render(<Chip>AI-native health</Chip>);
    expect(container.textContent).toBe("AI-native health");
    rerender(<Chip>{""}</Chip>);
    expect(container).toBeEmptyDOMElement();
    rerender(<AvailabilityChip>Open to Senior / Lead PM roles</AvailabilityChip>);
    expect(container.querySelector("[class*=live]")).toHaveAttribute("aria-hidden", "true");
    rerender(<AvailabilityChip />);
    expect(container).toBeEmptyDOMElement();
  });

  it("toggles a filter chip by keyboard", async () => {
    const onClick = vi.fn();
    render(
      <>
        <FilterChip pressed>All</FilterChip>
        <FilterChip pressed={false} onClick={onClick}>
          Shipped
        </FilterChip>
      </>,
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    const shipped = screen.getByRole("button", { name: "Shipped" });
    expect(shipped).toHaveAttribute("aria-pressed", "false");
    shipped.focus();
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
