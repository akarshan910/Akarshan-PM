// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { normaliseTopic, TopicPicker, usesLabel, type TopicUse } from "./TopicPicker";

afterEach(cleanup);

const FEW: TopicUse[] = [
  { name: "Product", uses: 4 },
  { name: "AI", uses: 2 },
  { name: "Health-tech", uses: 3 },
  { name: "Data", uses: 2 },
  { name: "Growth", uses: 1 },
];
const MANY: TopicUse[] = [
  ...FEW,
  { name: "Experimentation", uses: 2 },
  { name: "Analytics", uses: 1 },
  { name: "Strategy", uses: 3 },
  { name: "Leadership", uses: 1 },
  { name: "Design", uses: 1 },
  { name: "Monetisation", uses: 1 },
  { name: "Career", uses: 1 },
  { name: "Prototyping", uses: 2 },
];
const EIGHT = ["Product", "AI", "Health-tech", "Data", "Growth", "Strategy", "Design", "Career"];

let latest: string[] = [];
function Harness({
  vocabulary,
  initial,
  noun = "post",
  open,
  query,
}: {
  vocabulary: TopicUse[];
  initial: string[];
  noun?: "post" | "project";
  open?: boolean;
  query?: string;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    latest = value;
  }, [value]);
  return (
    <>
      <button type="button">Before</button>
      <TopicPicker
        vocabulary={vocabulary}
        value={value}
        onChange={setValue}
        noun={noun}
        initialOpen={open ?? false}
        initialQuery={query ?? ""}
      />
      <button type="button">Outside</button>
    </>
  );
}

const live = () => document.querySelector('[aria-live="polite"]')?.textContent.trim();

describe("helpers", () => {
  it("normalises a new topic: trims, collapses spaces, 32 characters", () => {
    expect(normaliseTopic("  product   strategy ")).toBe("product strategy");
    expect(normaliseTopic("x".repeat(40))).toHaveLength(32);
  });
  it("labels the use counts", () => {
    expect(usesLabel(0, "post")).toBe("new");
    expect(usesLabel(1, "post")).toBe("1 post");
    expect(usesLabel(3, "post")).toBe("3 posts");
    expect(usesLabel(1, "project")).toBe("1 project");
    expect(usesLabel(2, "project")).toBe("2 projects");
  });
});

describe("TopicPicker · chips (up to 8 in the vocabulary)", () => {
  it("shows every topic as a toggle chip in a labelled group, with the count", () => {
    render(<Harness vocabulary={FEW} initial={["Product"]} />);
    expect(screen.getByRole("group", { name: "Topics" })).toBeInTheDocument();
    expect(screen.getByText("5 topics")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Product" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "AI" })).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByText(
        "Tap to choose. Type a new one and press Enter. Past 8 topics, this becomes a dropdown with search.",
      ),
    ).toBeInTheDocument();
  });

  it("toggles chips and announces each change", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={FEW} initial={[]} />);
    await user.click(screen.getByRole("button", { name: "AI" }));
    expect(latest).toEqual(["AI"]);
    expect(live()).toBe("Added AI");
    await user.click(screen.getByRole("button", { name: "AI" }));
    expect(latest).toEqual([]);
    expect(live()).toBe("Removed AI");
  });

  it("Enter selects a matching topic whatever its case, or creates a new one", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={FEW} initial={[]} />);
    const add = screen.getByRole("textbox", { name: "Add a topic" });
    await user.type(add, "growth{Enter}");
    expect(latest).toEqual(["Growth"]);
    expect(live()).toBe("Added Growth");
    expect(add).toHaveValue("");
    await user.type(add, "  Pricing   page {Enter}");
    expect(latest).toEqual(["Growth", "Pricing page"]);
    expect(live()).toBe("Created and added Pricing page");
    expect(screen.getByText("6 topics")).toBeInTheDocument();
    await user.type(add, "   {Enter}");
    expect(latest).toEqual(["Growth", "Pricing page"]);
  });

  it("caps a project at 8 topics: unselected chips disable and Enter does nothing", async () => {
    const user = userEvent.setup();
    const vocab: TopicUse[] = EIGHT.map((name) => ({ name, uses: 1 }));
    render(<Harness vocabulary={vocab} initial={EIGHT.slice(0, 7)} noun="project" />);
    expect(screen.getByRole("button", { name: "Career" })).not.toHaveAttribute("aria-disabled");
    await user.click(screen.getByRole("button", { name: "Career" }));
    expect(latest).toHaveLength(8);
    // The vocabulary is still 8, so it stays chips; now try a ninth.
    await user.type(screen.getByRole("textbox", { name: "Add a topic" }), "Pricing{Enter}");
    expect(latest).toHaveLength(8);
    expect(live()).toBe("Up to 8 topics per project.");
    expect(screen.getByRole("textbox", { name: "Add a topic" })).toHaveValue("Pricing");
    // Removing one re-enables the rest.
    await user.click(screen.getByRole("button", { name: "Career" }));
    expect(latest).toHaveLength(7);
  });

  it("disables unselected chips at the cap and says so when one is pressed", async () => {
    const user = userEvent.setup();
    const vocab: TopicUse[] = [...EIGHT.slice(0, 7), "Pricing"].map((name) => ({ name, uses: 1 }));
    render(<Harness vocabulary={vocab} initial={[...EIGHT.slice(0, 7), "Extra"]} />);
    // 9 in the vocabulary now, so check the dropdown instead.
    expect(screen.getByRole("button", { name: /Add topics/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Add topics/ }));
    const pricing = screen.getByRole("option", { name: /Pricing/ });
    expect(pricing).toHaveAttribute("aria-disabled", "true");
    await user.click(pricing);
    expect(latest).toHaveLength(8);
    expect(live()).toBe("Up to 8 topics per post.");
  });
});

describe("TopicPicker · dropdown (more than 8)", () => {
  it("shows the selected chips and the trigger", () => {
    render(<Harness vocabulary={MANY} initial={["Product", "Strategy"]} />);
    expect(screen.getByText("13 topics")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Product" })).toBeInTheDocument();
    const trig = screen.getByRole("button", { name: "Add topics" });
    expect(trig).toHaveAttribute("aria-haspopup", "listbox");
    expect(trig).toHaveAttribute("aria-expanded", "false");
  });

  it("reads Choose topics when none are selected", () => {
    render(<Harness vocabulary={MANY} initial={[]} />);
    expect(screen.getByRole("button", { name: "Choose topics" })).toBeInTheDocument();
  });

  it("opens with focus in the search, lists selected first then A–Z, with use counts", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={MANY} initial={["Strategy"]} />);
    await user.click(screen.getByRole("button", { name: "Add topics" }));
    const search = screen.getByRole("combobox", { name: "Search or create a topic" });
    expect(search).toHaveFocus();
    const list = screen.getByRole("listbox", { name: "Topics" });
    expect(list).toHaveAttribute("aria-multiselectable", "true");
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("Strategy3 posts");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveTextContent("AI2 posts");
    expect(screen.getByText("Growth").parentElement).toHaveTextContent("1 post");
    expect(screen.getByText("1 selected · ↑ ↓ to move, Enter to choose")).toBeInTheDocument();
  });

  it("filters by substring, moves with arrows and toggles with Enter", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={MANY} initial={[]} />);
    await user.click(screen.getByRole("button", { name: "Choose topics" }));
    await user.keyboard("pro");
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Product4 posts", "Prototyping2 posts"]);
    const search = screen.getByRole("combobox");
    expect(search).toHaveAttribute("aria-activedescendant", options[0]?.id);
    await user.keyboard("{ArrowDown}");
    expect(search).toHaveAttribute("aria-activedescendant", options[1]?.id);
    await user.keyboard("{ArrowDown}");
    expect(search).toHaveAttribute("aria-activedescendant", options[0]?.id);
    await user.keyboard("{ArrowUp}{Enter}");
    expect(latest).toEqual(["Prototyping"]);
    expect(live()).toBe("Added Prototyping");
    expect(screen.getByRole("button", { name: "Create “pro”" })).toBeInTheDocument();
  });

  it("creates the query, or says nothing matches", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={MANY} initial={[]} />);
    await user.click(screen.getByRole("button", { name: "Choose topics" }));
    await user.keyboard("Pricing");
    expect(screen.getByText("No topic matches “Pricing”.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create “Pricing”" }));
    expect(latest).toEqual(["Pricing"]);
    expect(live()).toBe("Created and added Pricing");
    expect(screen.getByText("14 topics")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Pricing/ })).toHaveTextContent("new");
    // An exact match (any case) offers no Create.
    await user.keyboard("STRATEGY");
    expect(screen.queryByRole("button", { name: /Create/ })).toBeNull();
  });

  it("Enter with no active option creates the query", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={MANY} initial={[]} />);
    await user.click(screen.getByRole("button", { name: "Choose topics" }));
    await user.keyboard("Hiring{Enter}");
    expect(latest).toEqual(["Hiring"]);
  });

  it("Esc closes and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={MANY} initial={[]} />);
    const trig = screen.getByRole("button", { name: "Choose topics" });
    await user.click(trig);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(trig).toHaveFocus();
    expect(trig).toHaveAttribute("aria-expanded", "false");
  });

  it("Done closes and returns focus; Tab reaches Done", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={MANY} initial={[]} />);
    const trig = screen.getByRole("button", { name: "Choose topics" });
    await user.click(trig);
    await user.tab();
    expect(screen.getByRole("button", { name: "Done" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(trig).toHaveFocus();
  });

  it("closes on a click outside, keeping the choices", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={MANY} initial={[]} />);
    await user.click(screen.getByRole("button", { name: "Choose topics" }));
    await user.click(screen.getByRole("option", { name: /Data/ }));
    expect(latest).toEqual(["Data"]);
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(latest).toEqual(["Data"]);
  });

  it("the trigger toggles the popover closed", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={MANY} initial={[]} open />);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    // The catalogue's initially open state doesn't steal focus.
    expect(screen.getByRole("combobox")).not.toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Choose topics" }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("removes a chip with its ✕ and moves focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={MANY} initial={["Product", "AI"]} />);
    await user.click(screen.getByRole("button", { name: "Remove Product" }));
    expect(latest).toEqual(["AI"]);
    expect(live()).toBe("Removed Product");
    expect(screen.getByRole("button", { name: "Add topics" })).toHaveFocus();
  });

  it("at the cap: options disable, + Create and Enter do nothing, and the live region says so", async () => {
    const user = userEvent.setup();
    render(<Harness vocabulary={MANY} initial={EIGHT} noun="post" query="" />);
    await user.click(screen.getByRole("button", { name: "Add topics" }));
    expect(screen.getByRole("option", { name: /Analytics/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("option", { name: /Product/ })).not.toHaveAttribute("aria-disabled");
    await user.keyboard("Hiring");
    const create = screen.getByRole("button", { name: "Create “Hiring”" });
    expect(create).toHaveAttribute("aria-disabled", "true");
    await user.click(create);
    expect(latest).toHaveLength(8);
    expect(live()).toBe("Up to 8 topics per post.");
    await user.keyboard("{Enter}");
    expect(latest).toHaveLength(8);
    // The same message again is still announced (varied invisibly).
    expect(live()).toBe("Up to 8 topics per post.");
    // Removing one re-enables them.
    await user.clear(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /Career/ }));
    expect(latest).toHaveLength(7);
    expect(screen.getByRole("option", { name: /Analytics/ })).not.toHaveAttribute("aria-disabled");
  });

  it("scrolls the active option into view", () => {
    const calls: Element[] = [];
    Element.prototype.scrollIntoView = function (this: Element) {
      calls.push(this);
    };
    render(<Harness vocabulary={MANY} initial={[]} open />);
    const search = screen.getByRole("combobox");
    act(() => {
      fireEvent.keyDown(search, { key: "ArrowDown" });
    });
    expect(calls.length).toBeGreaterThan(0);
  });
});
