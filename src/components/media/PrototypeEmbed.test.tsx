// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PROTOTYPE_TIMEOUT_MS, PrototypeEmbed, type PrototypeState } from "./PrototypeEmbed";

const URL = "https://prototypes.example/sri-mandir";
const NAME = "Sri Mandir prototype";
const POSTER = { src: "/media/p.webp", width: 640, height: 1120, alt: "Home screen" };

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("orientation") ? matches : false,
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("PrototypeEmbed inline", () => {
  it("requests nothing until the visitor explores", () => {
    const { container } = render(<PrototypeEmbed url={URL} name={NAME} poster={POSTER} layout="inline" />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Explore the prototype" })).toBeInTheDocument();
  });

  it("loads a tightly sandboxed frame with a status, then runs with New tab and Exit", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PrototypeEmbed url={URL} startPath="booking" name={NAME} poster={POSTER} layout="inline" />,
    );
    await user.click(screen.getByRole("button", { name: "Explore the prototype" }));
    expect(screen.getByRole("status")).toHaveTextContent("Loading the prototype…");
    const frame = container.querySelector("iframe") as HTMLIFrameElement;
    expect(frame.src).toBe(`${URL}/booking`);
    expect(frame).toHaveAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(frame).toHaveAttribute("allow", "fullscreen");
    expect(frame).toHaveAttribute("loading", "lazy");
    expect(frame).toHaveAttribute("title", NAME);
    const newTab = screen.getByRole("link", { name: /New tab ↗/ });
    expect(newTab).toHaveAttribute("rel", "noopener noreferrer");
    expect(newTab).toHaveAttribute("target", "_blank");
    fireEvent.load(frame);
    expect(screen.queryByRole("status")).toBeNull();
    expect(frame).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Exit" }));
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Explore the prototype" })).toHaveFocus();
  });

  it("exits on Esc and returns focus to the poster", async () => {
    const user = userEvent.setup();
    render(<PrototypeEmbed url={URL} name={NAME} layout="inline" />);
    await user.click(screen.getByRole("button", { name: "Explore the prototype" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Explore the prototype" })).toHaveFocus();
  });

  it("says it didn't load after 15 seconds, and Try again reloads", () => {
    vi.useFakeTimers();
    const { container } = render(<PrototypeEmbed url={URL} name={NAME} layout="inline" />);
    fireEvent.click(screen.getByRole("button", { name: "Explore the prototype" }));
    act(() => {
      vi.advanceTimersByTime(PROTOTYPE_TIMEOUT_MS - 1);
    });
    expect(screen.queryByRole("alert")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("The prototype didn’t load.");
    expect(alert).toHaveTextContent("Try again, or open it in a new tab.");
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(container.querySelector("iframe")).not.toBeNull();
  });

  it("opens in a new tab when the host can't be embedded", () => {
    const { container } = render(<PrototypeEmbed url={URL} name={NAME} embeddable={false} />);
    const link = screen.getByRole("link", { name: /Open prototype ↗/ });
    expect(link).toHaveAttribute("href", URL);
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(
      screen.getByText("This prototype opens in a new tab: its host doesn’t allow embedding."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Explore the prototype" })).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("never frames its own origin", () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const location = window.location;
    Object.defineProperty(window, "location", {
      value: { origin: "https://site.example" },
      configurable: true,
    });
    render(<PrototypeEmbed url="https://site.example/proto" name={NAME} layout="inline" />);
    fireEvent.click(screen.getByRole("button", { name: "Explore the prototype" }));
    expect(open).toHaveBeenCalledWith("https://site.example/proto", "_blank", "noopener,noreferrer");
    expect(document.querySelector("iframe")).toBeNull();
    Object.defineProperty(window, "location", { value: location, configurable: true });
  });

  it("renders nothing for a link that isn't https", () => {
    const { container } = render(<PrototypeEmbed url="http://prototypes.example" name={NAME} />);
    expect(container.firstChild).toBeNull();
  });

  it("draws the case study's round play button when the heading owns the controls", async () => {
    const user = userEvent.setup();
    function Heading() {
      const [state, setState] = useState<PrototypeState>("poster");
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setState("poster");
            }}
          >
            Exit prototype
          </button>
          <PrototypeEmbed
            url={URL}
            name={NAME}
            controls="external"
            layout="inline"
            state={state}
            onStateChange={setState}
          />
        </>
      );
    }
    const { container } = render(<Heading />);
    expect(container.querySelector(".ctaStrip")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Explore the prototype" }));
    expect(container.querySelector(".bar")).toBeNull();
    expect(container.querySelector("iframe")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Exit prototype" }));
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Explore the prototype" })).toHaveFocus();
  });

  it("starts by itself when scrolled into view, if asked to", () => {
    let callback: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn((cb: typeof callback) => {
        callback = cb;
        return { observe: vi.fn(), disconnect };
      }),
    );
    const { container } = render(<PrototypeEmbed url={URL} name={NAME} start="visible" layout="inline" />);
    expect(container.querySelector("iframe")).toBeNull();
    act(() => {
      callback?.([{ isIntersecting: false }]);
    });
    expect(container.querySelector("iframe")).toBeNull();
    act(() => {
      callback?.([{ isIntersecting: true }]);
    });
    expect(container.querySelector("iframe")).not.toBeNull();
    expect(disconnect).toHaveBeenCalled();
  });
});

describe("PrototypeEmbed sheet", () => {
  it("opens full screen on phones and iPad portrait, and closes back to the poster", async () => {
    mockMatchMedia(true);
    const user = userEvent.setup();
    render(<PrototypeEmbed url={URL} name={NAME} note="Built from the PRD" />);
    const explore = screen.getByRole("button", { name: "Explore the prototype" });
    await user.click(explore);
    const sheet = screen.getByRole("dialog", { name: NAME });
    expect(sheet).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Built from the PRD")).toBeInTheDocument();
    const close = screen.getByRole("button", { name: "Close the prototype" });
    expect(close).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Loading the prototype…");
    const frame = sheet.querySelector("iframe") as HTMLIFrameElement;
    fireEvent.load(frame);
    expect(frame).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(explore).toHaveFocus();
  });

  it("uses the phone copy when it fails", () => {
    vi.useFakeTimers();
    render(<PrototypeEmbed url={URL} name={NAME} layout="sheet" />);
    fireEvent.click(screen.getByRole("button", { name: "Explore the prototype" }));
    act(() => {
      vi.advanceTimersByTime(PROTOTYPE_TIMEOUT_MS);
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Check your connection and try again, or open it in a new tab.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Close the prototype" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("can draw each state for the catalogue without loading anything", () => {
    const { container, rerender } = render(
      <PrototypeEmbed url={URL} name={NAME} poster={POSTER} display="running" displaySheet />,
    );
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("dialog", { name: NAME })).not.toHaveAttribute("aria-modal");
    rerender(<PrototypeEmbed url={URL} name={NAME} poster={POSTER} display="running" frame="desktop" />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector(".runningStandIn")).not.toBeNull();
    rerender(<PrototypeEmbed url={URL} name={NAME} display="error" frame="tablet" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    rerender(<PrototypeEmbed url={URL} name={NAME} display="loading" frame="none" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
