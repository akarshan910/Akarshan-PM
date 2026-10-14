// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChangedMark, PreviewBar } from "./PreviewBar";

afterEach(cleanup);

describe("PreviewBar", () => {
  it.each([
    [6, "Draft preview · not public · expires in 6 days"],
    [1, "Draft preview · not public · expires in 1 day"],
    [0, "Draft preview · not public · expires today"],
  ])("counts down %i days", (days, text) => {
    render(<PreviewBar daysLeft={days} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("is a labelled region that can't be closed", () => {
    render(<PreviewBar daysLeft={3} />);
    const bar = screen.getByRole("region", { name: "Draft preview" });
    expect(bar).toHaveTextContent("Only people with this link can see it");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("marks a changed block", () => {
    render(<ChangedMark />);
    expect(screen.getByText("Changed since the live version")).toBeInTheDocument();
  });
});
