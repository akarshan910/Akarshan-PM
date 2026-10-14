// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { NotFound } from "./NotFound";

afterEach(cleanup);

describe("NotFound", () => {
  it("says the page doesn't exist and offers the ways on", () => {
    render(<NotFound showWriting />, { wrapper: MemoryRouter });
    expect(screen.getByRole("heading", { level: 1, name: "This page doesn’t exist." })).toBeInTheDocument();
    expect(screen.getByText("404")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "See all work" })).toHaveAttribute("href", "/work");
    expect(screen.getByRole("link", { name: "Writing" })).toHaveAttribute("href", "/writing");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("hides Writing while there are no posts", () => {
    render(<NotFound />, { wrapper: MemoryRouter });
    expect(screen.queryByRole("link", { name: "Writing" })).toBeNull();
  });
});
