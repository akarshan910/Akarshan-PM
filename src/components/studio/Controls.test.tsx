// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Checkbox, RadioCards, Segmented, Switch } from "./Controls";

afterEach(cleanup);

describe("Switch", () => {
  it("is a labelled switch that toggles by click and keyboard", async () => {
    const user = userEvent.setup();
    function H() {
      const [on, setOn] = useState(true);
      return (
        <Switch checked={on} onCheckedChange={setOn}>
          Show on my homepage
        </Switch>
      );
    }
    render(<H />);
    const sw = screen.getByRole("switch", { name: "Show on my homepage" });
    expect(sw).toHaveAttribute("aria-checked", "true");
    await user.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "false");
    sw.focus();
    await user.keyboard(" ");
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("can be disabled", () => {
    render(
      <Switch checked={false} onCheckedChange={vi.fn()} disabled id="sw">
        Show hidden
      </Switch>,
    );
    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByRole("switch")).toHaveAttribute("id", "sw");
  });
});

describe("Checkbox", () => {
  it("reports its checked state", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <Checkbox checked={false} onCheckedChange={change}>
        Decorative image
      </Checkbox>,
    );
    await user.click(screen.getByRole("checkbox", { name: "Decorative image" }));
    expect(change).toHaveBeenCalledWith(true);
  });
});

describe("Segmented", () => {
  it("is a labelled group of pressed buttons", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <Segmented
        label="When"
        size={34}
        options={[
          { value: "now", label: "Publish now" },
          { value: "later", label: "Schedule" },
        ]}
        value="now"
        onChange={change}
      />,
    );
    expect(screen.getByRole("group", { name: "When" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish now" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Schedule" }));
    expect(change).toHaveBeenCalledWith("later");
  });
});

describe("RadioCards", () => {
  it("is a radio group with roving focus; arrows move and choose", async () => {
    const user = userEvent.setup();
    function H() {
      const [v, setV] = useState<"pm" | "spm" | null>(null);
      return (
        <RadioCards
          label="Current title"
          options={[
            { value: "pm", label: "Product Manager", note: "As on your résumé" },
            { value: "spm", label: "Senior Product Manager" },
          ]}
          value={v}
          onChange={setV}
        />
      );
    }
    render(<H />);
    expect(screen.getByRole("radiogroup", { name: "Current title" })).toBeInTheDocument();
    const [a, b] = screen.getAllByRole("radio");
    expect(a).toHaveAttribute("tabindex", "0");
    expect(b).toHaveAttribute("tabindex", "-1");
    await user.click(a as HTMLElement);
    expect(a).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{ArrowDown}");
    expect(b).toHaveAttribute("aria-checked", "true");
    expect(b).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(a).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(b).toHaveFocus();
    await user.keyboard("{ArrowLeft}x");
    expect(a).toHaveAttribute("aria-checked", "true");
  });
});
