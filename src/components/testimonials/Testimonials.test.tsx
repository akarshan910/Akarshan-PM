// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TestimonialCard, type Testimonial } from "./TestimonialCard";
import { counterText, Testimonials } from "./Testimonials";

let reduced = false;
beforeEach(() => {
  reduced = false;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduced })),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("still");
});

const item = (n: number, extra: Partial<Testimonial> = {}): Testimonial => ({
  id: `t${n}`,
  quote: `Quote ${n}`,
  name: `Person ${n}`,
  role: `Role ${n}`,
  initials: `P${n}`,
  avatar: { background: "#2A2033", color: "#D9C2F7" },
  ...extra,
});
const SEVEN = Array.from({ length: 7 }, (_, i) => item(i + 1));
const heading = <h2>What teammates say.</h2>;

const visible = () =>
  [...document.querySelectorAll("figure")]
    .filter((f) => !f.classList.contains("off"))
    .map((f) => f.textContent);

describe("TestimonialCard", () => {
  it("shows the quote in curly quotes, the avatar, name, role and the LinkedIn link", () => {
    render(<TestimonialCard {...item(1, { linkedin: "https://www.linkedin.com/in/x" })} />);
    expect(screen.getByText("“Quote 1”").tagName).toBe("BLOCKQUOTE");
    expect(screen.getByText("P1")).toHaveStyle({ background: "#2A2033", color: "#D9C2F7" });
    expect(screen.getByText("P1")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "Person 1 on LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/x",
    );
  });

  it("never links a LinkedIn value that isn't https", () => {
    render(<TestimonialCard {...item(1, { linkedin: "javascript:alert(1)" })} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("hides the link and role when they're empty", () => {
    const { container } = render(<TestimonialCard {...item(1, { role: "" })} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector(".role")).toBeNull();
  });
});

describe("counterText", () => {
  it("counts the page", () => {
    expect(counterText(0, 7)).toBe("1–3 of 7");
    expect(counterText(1, 7)).toBe("4–6 of 7");
    expect(counterText(2, 7)).toBe("7 of 7");
  });
});

describe("Testimonials", () => {
  it("pages three at a time, cross-fading, with a polite counter", () => {
    vi.useFakeTimers();
    render(<Testimonials heading={heading} items={SEVEN} />);
    const prev = screen.getByRole("button", { name: "Previous testimonials" });
    const next = screen.getByRole("button", { name: "Next testimonials" });
    const counter = screen.getByText("1–3 of 7");
    expect(counter).toHaveAttribute("aria-live", "polite");
    expect(prev).toBeDisabled();
    expect(visible()).toHaveLength(3);

    fireEvent.click(next);
    expect(document.querySelector(".track")).toHaveClass("out");
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(document.querySelector(".track")).toHaveClass("in");
    expect(counter).toHaveTextContent("4–6 of 7");
    expect(visible()[0]).toContain("Quote 4");

    fireEvent.click(next);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(counter).toHaveTextContent("7 of 7");
    expect(next).toBeDisabled();
    fireEvent.click(next);
    expect(document.querySelector(".track")).not.toHaveClass("out");

    fireEvent.click(prev);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(counter).toHaveTextContent("4–6 of 7");
  });

  it("swaps instantly under reduced motion", () => {
    document.documentElement.classList.add("still");
    render(<Testimonials heading={heading} items={SEVEN} />);
    fireEvent.click(screen.getByRole("button", { name: "Next testimonials" }));
    expect(screen.getByText("4–6 of 7")).toBeInTheDocument();
    expect(document.querySelector(".track")).not.toHaveClass("out");
  });

  it("has a dot button per card that scrolls the rail to it, by keyboard too", async () => {
    const user = userEvent.setup();
    render(<Testimonials heading={heading} items={SEVEN} />);
    const track = document.querySelector<HTMLElement>(".track");
    const scrollTo = vi.fn();
    if (track) track.scrollTo = scrollTo;
    const dots = screen.getAllByRole("button", { name: /Show testimonial \d of 7/ });
    expect(dots).toHaveLength(7);
    expect(dots[0]).toHaveAttribute("aria-current", "true");
    dots[2]?.focus();
    await user.keyboard("{Enter}");
    expect(dots[2]).toHaveAttribute("aria-current", "true");
    expect(dots[0]).not.toHaveAttribute("aria-current");
    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "smooth" });
  });

  it("follows the rail's scroll position with the current dot", () => {
    render(<Testimonials heading={heading} items={SEVEN} />);
    const track = document.querySelector<HTMLElement>(".track");
    const figures = [...document.querySelectorAll<HTMLElement>("figure")];
    figures.forEach((f, i) => {
      Object.defineProperty(f, "offsetLeft", { value: i * 476 });
    });
    if (track) {
      track.scrollLeft = 960;
      fireEvent.scroll(track);
    }
    expect(screen.getByRole("button", { name: "Show testimonial 3 of 7" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("hides paging for three or fewer, dots and the swipe hint for one, and everything for none", () => {
    const { rerender, container } = render(<Testimonials heading={heading} items={SEVEN.slice(0, 3)} />);
    expect(screen.queryByRole("button", { name: "Next testimonials" })).toBeNull();
    expect(screen.getAllByRole("button", { name: /Show testimonial/ })).toHaveLength(3);
    expect(screen.getByText("Swipe →")).toBeInTheDocument();
    rerender(<Testimonials heading={heading} items={SEVEN.slice(0, 1)} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("Swipe →")).toBeNull();
    rerender(<Testimonials heading={heading} items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
