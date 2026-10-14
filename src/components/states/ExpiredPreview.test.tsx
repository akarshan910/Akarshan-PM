// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { ExpiredPreview } from "./ExpiredPreview";

afterEach(cleanup);

describe("ExpiredPreview", () => {
  it("is a friendly dead end with a way forward", () => {
    render(<ExpiredPreview />, { wrapper: MemoryRouter });
    expect(
      screen.getByRole("heading", { level: 1, name: "This preview link has expired." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Preview links last 7 days. Ask for a new one, or see the published work."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See the published work" })).toHaveAttribute("href", "/work");
  });

  it("can point at the published page", () => {
    render(<ExpiredPreview publishedHref="/work/puja" />, { wrapper: MemoryRouter });
    expect(screen.getByRole("link", { name: "See the published work" })).toHaveAttribute(
      "href",
      "/work/puja",
    );
  });
});
