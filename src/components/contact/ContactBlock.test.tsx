// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContactBlock, COPIED_MS } from "./ContactBlock";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const FULL = {
  kicker: "Thanks for reading",
  title: "Let’s build something",
  titleAccent: "impactful.",
  titleId: "contact-t",
  intro: "Open to Senior / Lead PM roles.",
  email: "owner@example.test",
  linkedin: "https://www.linkedin.com/in/example",
  github: "https://github.com/example",
  resume: "https://example.test/resume.pdf",
};

describe("ContactBlock", () => {
  it("renders the kicker, two-tone title, intro, buttons and links", () => {
    const { container } = render(<ContactBlock {...FULL} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Let’s build something impactful." }),
    ).toHaveAttribute("id", "contact-t");
    expect(screen.getByText("impactful.")).toHaveClass("accent");
    expect(screen.getByText("Thanks for reading")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Email me" })).toHaveAttribute(
      "href",
      "mailto:owner@example.test",
    );
    expect(screen.getByRole("button", { name: "Copy email" })).toBeInTheDocument();
    // LinkedIn and GitHub appear as touch buttons and as laptop links; CSS shows one set per device.
    expect(screen.getAllByRole("link", { name: /LinkedIn/ })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Résumé (PDF)" })).toHaveAttribute("href", FULL.resume);
    expect(container.querySelector("svg.lines")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("svg.lines line")).toHaveLength(10);
  });

  it("copies the email, says Copied for 2 seconds through a polite live region, then resets", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<ContactBlock {...FULL} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toBeEmptyDOMElement();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy email" }));
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith("owner@example.test");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(status).toHaveTextContent("Copied");
    act(() => {
      vi.advanceTimersByTime(COPIED_MS - 1);
    });
    expect(status).toHaveTextContent("Copied");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("button", { name: "Copy email" })).toBeInTheDocument();
    expect(status).toBeEmptyDOMElement();
  });

  it("falls back to execCommand without the Clipboard API, and stays put if that fails", async () => {
    vi.stubGlobal("navigator", {});
    const exec = vi.fn(() => false);
    Object.defineProperty(document, "execCommand", { value: exec, configurable: true });
    render(<ContactBlock {...FULL} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy email" }));
      await Promise.resolve();
    });
    expect(exec).toHaveBeenCalledWith("copy");
    expect(screen.getByRole("button", { name: "Copy email" })).toBeInTheDocument();
    expect(document.querySelector("textarea")).toBeNull();

    exec.mockReturnValue(true);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy email" }));
      await Promise.resolve();
    });
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("hides every part whose value is empty", () => {
    const { container, rerender } = render(<ContactBlock title="Let’s talk." linkedin={FULL.linkedin} />);
    expect(screen.queryByRole("link", { name: "Email me" })).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("GitHub")).toBeNull();
    expect(screen.queryByText("Résumé (PDF)")).toBeNull();
    expect(container.querySelector(".kicker, .intro, .accent")).toBeNull();
    rerender(<ContactBlock title="Let’s talk." />);
    expect(container.querySelector(".actions, .links")).toBeNull();
    rerender(<ContactBlock title="Let’s talk." email={FULL.email} />);
    expect(container.querySelector(".pair")).toBeNull();
    expect(container.querySelector(".links")).toBeNull();
  });
});
