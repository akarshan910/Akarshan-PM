// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AccordionRow } from "./AccordionRow";

describe("AccordionRow", () => {
  it("is a button that expands and collapses its panel, by click and by keyboard", async () => {
    const user = userEvent.setup();
    render(
      <AccordionRow title="Razorpay" subtitle="Senior Product Analyst · 2021">
        <p>Body</p>
      </AccordionRow>,
    );
    const button = screen.getByRole("button", { name: /Razorpay\s*Senior Product Analyst · 2021/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    const panel = document.getElementById(button.getAttribute("aria-controls") ?? "");
    expect(panel).toHaveTextContent("Body");
    expect(button.parentElement).not.toHaveClass("open");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button.parentElement).toHaveClass("open");

    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("starts open on request, hides an empty subtitle, and marks where it collapses", () => {
    const { container } = render(
      <AccordionRow title="BIT Mesra" defaultOpen collapse="touch" className="extra">
        x
      </AccordionRow>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(container.querySelector(".sub")).toBeNull();
    expect(container.firstElementChild).toHaveClass("touch", "open", "extra");
  });
});
