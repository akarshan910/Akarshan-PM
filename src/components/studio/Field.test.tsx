// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SOFT_LIMITS } from "~/lib/schemas";

import { Counter, SelectField, TextArea, TextField } from "./Field";

afterEach(cleanup);

const noop = () => undefined;

describe("Field", () => {
  it("labels the input, tags it Required, and describes it with the hint and counter", () => {
    render(
      <TextField
        id="f-title"
        label="Project title"
        required
        hint="Sentence case reads best. Keep it under 60 characters."
        counter={{ limit: SOFT_LIMITS.projectTitle }}
        value="Puja engagement platform"
        onChange={noop}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Project title Required" });
    expect(input).toHaveAttribute("aria-describedby", "f-title-h");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAccessibleDescription("Sentence case reads best. Keep it under 60 characters. 24/60");
  });

  it("an error replaces the hint, turns the border red and sets aria-invalid", () => {
    render(
      <TextField
        id="f-title"
        label="Project title"
        hint="Sentence case reads best."
        error="Add a title. It’s used on the card, the page and in search."
        value=""
        onChange={noop}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Project title" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("invalid");
    expect(input).toHaveAccessibleDescription("Add a title. It’s used on the card, the page and in search.");
    expect(screen.queryByText("Sentence case reads best.")).toBeNull();
  });

  it("a warning shows in amber with the alert icon", () => {
    render(<TextField id="f-role" label="My role" warning="My role is empty." value="" onChange={noop} />);
    expect(screen.getByText("My role is empty.").parentElement).toHaveClass("warn");
  });

  it("has no description row without hint, error, warning or counter", () => {
    render(<TextField id="f-co" label="Company" mono value="" onChange={noop} />);
    const input = screen.getByRole("textbox", { name: "Company" });
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).toHaveClass("monoInp");
    expect(document.getElementById("f-co-h")).toBeNull();
  });

  it("the counter warns near the limit and turns red past it", () => {
    const { rerender } = render(<Counter length={100} limit={140} warnAbove={120} />);
    expect(screen.getByText("100/140")).not.toHaveClass("cntWarn");
    rerender(<Counter length={121} limit={140} warnAbove={120} />);
    expect(screen.getByText("121/140")).toHaveClass("cntWarn");
    rerender(<Counter length={141} limit={140} warnAbove={120} />);
    expect(screen.getByText("141/140")).toHaveClass("cntOver");
    expect(screen.getByText("141/140")).toHaveAttribute("data-over", "true");
  });

  it("textarea counts its value and takes a minimum height", () => {
    render(
      <TextArea
        id="f-ex"
        label="Excerpt"
        hint="Shown on cards and in search."
        counter={{ limit: 160 }}
        minHeight={76}
        value="Hello"
        onChange={noop}
      />,
    );
    const ta = screen.getByRole("textbox", { name: "Excerpt" });
    expect(ta).toHaveStyle({ minHeight: "76px" });
    expect(screen.getByText("5/160")).toBeInTheDocument();
  });

  it("select keeps the field chrome", () => {
    render(
      <SelectField id="f-scr" label="Opens on" hint="The first screen." defaultValue="Home">
        <option>Home</option>
        <option>Booking</option>
      </SelectField>,
    );
    expect(screen.getByRole("combobox", { name: "Opens on" })).toHaveAccessibleDescription(
      "The first screen.",
    );
  });
});
