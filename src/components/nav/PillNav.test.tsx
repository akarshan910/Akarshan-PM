// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhoneMenu } from "./PhoneMenu";
import { PillNav } from "./PillNav";
import { pickCurrent } from "./scrollSpy";

const LINKS = [
  { id: "work", label: "Work", href: "#work" },
  { id: "about", label: "About", href: "#about" },
  { id: "skills", label: "Skills", href: "#skills" },
];

const scrolls: Record<string, ReturnType<typeof vi.fn>> = {};

/** Sections at fixed tops, so the spy can read them. */
function page(tops: Record<string, number>) {
  for (const [id, top] of Object.entries(tops)) {
    const el = document.createElement("section");
    el.id = id;
    el.getBoundingClientRect = () => ({ top }) as DOMRect;
    const scroll = vi.fn();
    scrolls[id] = scroll;
    el.scrollIntoView = scroll;
    document.body.append(el);
  }
}

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  Object.defineProperty(document, "fonts", { value: { ready: Promise.resolve() }, configurable: true });
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  document.documentElement.className = "";
  vi.unstubAllGlobals();
});

describe("pickCurrent", () => {
  it("picks the last section at or above the line", () => {
    const tops = [
      { id: "top", top: -900 },
      { id: "work", top: -20 },
      { id: "about", top: 400 },
    ];
    expect(pickCurrent(tops, 80)).toBe("work");
    expect(pickCurrent(tops, -1000)).toBeNull();
    expect(pickCurrent([], 0)).toBeNull();
  });
});

describe("PillNav (C1)", () => {
  it("renders the primary nav, the skip link first, and Let's Talk", async () => {
    render(<PillNav links={LINKS} letsTalk={{ href: "#contact" }} skipTo="#work" />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Skip to work" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Let’s Talk →" })).toHaveAttribute("href", "#contact");
  });

  it("hides Let's Talk and the skip link without a target", () => {
    render(<PillNav links={LINKS} />);
    expect(screen.queryByRole("link", { name: /Let’s Talk/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "Skip to work" })).toBeNull();
  });

  it("follows the scroll-spy: hero, a section, then contact", () => {
    page({ top: 0, work: 2000, about: 3000, contact: 5000 });
    render(<PillNav links={LINKS} letsTalk={{ href: "#contact" }} />);
    const pill = document.querySelector<HTMLElement>("[class*=pill]");
    // Over the hero: no link is current, the highlight is hidden.
    expect(screen.queryByRole("link", { current: true })).toBeNull();
    expect(pill?.style.opacity).toBe("0");

    (document.getElementById("work") as HTMLElement).getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
    act(() => {
      fireEvent.scroll(window);
    });
    const work = screen.getByRole("link", { name: "Work" });
    expect(work).toHaveAttribute("aria-current", "true");
    expect(work.className).toMatch(/on/);
    expect(pill?.style.opacity).toBe("1");

    (document.getElementById("contact") as HTMLElement).getBoundingClientRect = () =>
      ({ top: 10 }) as DOMRect;
    act(() => {
      fireEvent.scroll(window);
    });
    expect(screen.queryByRole("link", { current: true })).toBeNull();
    expect(screen.getByRole("link", { name: "Let’s Talk →" }).className).toMatch(/active/);
  });

  it("a fixed current link turns the spy off", () => {
    page({ top: 0 });
    render(<PillNav links={LINKS} current="work" />);
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("aria-current", "true");
  });

  it("a click sets the link current and scrolls, smoothly unless motion is reduced", async () => {
    page({ top: 0, about: 3000 });
    render(<PillNav links={LINKS} />);
    await userEvent.click(screen.getByRole("link", { name: "About" }));
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "true");
    expect(scrolls.about).toHaveBeenCalledWith({ behavior: "smooth" });
    document.documentElement.classList.add("still");
    await userEvent.click(screen.getByRole("link", { name: "About" }));
    expect(scrolls.about).toHaveBeenLastCalledWith({ behavior: "auto" });
  });

  it("leaves links to other pages alone", async () => {
    render(<PillNav links={[{ id: "about", label: "About", href: "/#about" }]} />);
    const link = screen.getByRole("link", { name: "About" });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    await Promise.resolve();
  });
});

describe("Phone menu (C2)", () => {
  it("opens from Menu, traps the page, and closes on Esc with focus back on Menu", async () => {
    const main = document.createElement("main");
    document.body.append(main);
    render(
      <PillNav
        links={LINKS}
        letsTalk={{ href: "#contact" }}
        email="owner@example.test"
        linkedin="https://example.test/in"
        resume="/resume.pdf"
      />,
    );
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);

    const dialog = screen.getByRole("dialog", { name: "Site menu" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("Close menu");
    expect(toggle).toHaveAttribute("aria-controls", dialog.id);
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(main).toHaveAttribute("inert");
    expect(screen.getByRole("navigation", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /01\s*Work/ })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute("href", "mailto:owner@example.test");
    expect(screen.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Résumé (PDF)" })).toHaveAttribute("href", "/resume.pdf");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(main).not.toHaveAttribute("inert");
    expect(document.documentElement.style.overflow).toBe("");
    expect(toggle).toHaveFocus();
  });

  it("wraps Tab inside the pill and the menu", async () => {
    render(<PillNav links={LINKS} letsTalk={{ href: "#contact" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const close = screen.getByText("Close menu");
    // jsdom has no layout, so every element counts as visible except via offsetParent; fake it.
    for (const el of document.querySelectorAll<HTMLElement>("header a, header button"))
      Object.defineProperty(el, "offsetParent", { value: document.body, configurable: true });
    const all = document.querySelectorAll<HTMLElement>("header a[href], header button");
    const last = all[all.length - 1] as HTMLElement;
    last.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(all[0]);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(last);
    await userEvent.click(close);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a menu link closes the menu, then scrolls", async () => {
    page({ top: 0, skills: 4000 });
    render(<PillNav links={LINKS} />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await userEvent.click(screen.getByRole("link", { name: /03\s*Skills/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(scrolls.skills).toHaveBeenCalled();
  });

  it("Let's Talk in the menu closes it and goes to contact", async () => {
    page({ top: 0, contact: 6000 });
    render(<PillNav links={LINKS} letsTalk={{ href: "#contact" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.click(dialog.querySelector("a[href='#contact']") as HTMLElement);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(scrolls.contact).toHaveBeenCalled();
  });

  it("Let's Talk in the pill closes an open menu when it opens a new tab", async () => {
    render(<PillNav links={LINKS} letsTalk={{ href: "https://example.test/book", newTab: true }} />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const pillLink = screen.getAllByRole("link", { name: /Let’s Talk/ })[0] as HTMLElement;
    expect(pillLink).toHaveAttribute("target", "_blank");
    fireEvent.click(pillLink);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("marks the current section and hides empty footer links", () => {
    render(
      <PhoneMenu id="m" links={LINKS} current="about" onNavigate={vi.fn()} onClose={vi.fn()} contained />,
    );
    expect(screen.getByRole("link", { name: /02\s*About/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /01\s*Work/ })).toHaveAttribute("aria-current", "false");
    expect(screen.queryByRole("link", { name: "Email" })).toBeNull();
    expect(screen.queryByRole("link", { name: /Let’s Talk/ })).toBeNull();
  });
});
