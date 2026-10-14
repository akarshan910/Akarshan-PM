// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorState } from "./ErrorState";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ErrorState", () => {
  it("apologises and retries", async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} headingLevel={2} />, { wrapper: MemoryRouter });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This page couldn’t load. It’s us, not you. Try again in a moment.",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Something went wrong." })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });

  it("reloads the page when there's nothing to retry", async () => {
    const reload = vi.fn();
    const location = window.location;
    Object.defineProperty(window, "location", {
      value: { origin: location.origin, reload },
      configurable: true,
    });
    render(<ErrorState />, { wrapper: MemoryRouter });
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reload).toHaveBeenCalledOnce();
    Object.defineProperty(window, "location", { value: location, configurable: true });
  });
});
