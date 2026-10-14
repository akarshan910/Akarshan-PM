// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { VideoEmbed } from "./VideoEmbed";

const URL = "https://www.youtube.com/watch?v=abc123";
const POSTER = { src: "/media/p.webp", width: 1280, height: 720, alt: "Thumbnail", dominant: "#111" };

describe("VideoEmbed", () => {
  it("shows a poster with a real play button and loads nothing from the host", () => {
    const { container } = render(
      <VideoEmbed url={URL} title="Walkthrough" duration="3:24" poster={POSTER} />,
    );
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Play the video: Walkthrough" })).toBeInTheDocument();
    expect(screen.getByText("Walkthrough · 3:24")).toBeInTheDocument();
    expect(screen.getByText("Plays from YouTube · privacy mode")).toBeInTheDocument();
    // The poster is decorative next to the button's name.
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("starts the privacy-mode player in a sandboxed frame on press, with a spinner until it loads", async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={URL} title="Walkthrough" />);
    await user.click(screen.getByRole("button", { name: "Play the video: Walkthrough" }));
    const frame = container.querySelector("iframe") as HTMLIFrameElement;
    expect(frame.src).toBe("https://www.youtube-nocookie.com/embed/abc123?autoplay=1&rel=0");
    expect(frame).toHaveAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-presentation allow-popups",
    );
    expect(frame).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    expect(frame).toHaveAttribute("title", "Walkthrough");
    expect(screen.getByRole("status")).toHaveTextContent("Loading the video…");
    expect(container.firstElementChild).toHaveFocus();
    fireEvent.load(frame);
    expect(screen.queryByRole("status")).toBeNull();
    expect((container.firstElementChild as HTMLElement).dataset.state).toBe("playing");
    expect(frame).toHaveFocus();
  });

  it("names other hosts without the privacy note, and works untitled", () => {
    render(<VideoEmbed url="https://vimeo.com/123" />);
    expect(screen.getByText("Plays from Vimeo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play the video" })).toBeInTheDocument();
  });

  it("says the video isn't available, with a safe link to the host", () => {
    const { container } = render(<VideoEmbed url={URL} unavailable className="hero" />);
    expect(screen.getByText("This video isn’t available right now.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Watch on the host ↗/ });
    expect(link).toHaveAttribute("href", URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("(opens in a new tab)");
    expect(container.firstElementChild?.className).toContain("hero");
  });

  it("never frames an unsupported or non-https link", () => {
    const { container } = render(<VideoEmbed url="http://example.com/v.mp4" />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText("This video isn’t available right now.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows starting and playing for the catalogue without contacting the host", () => {
    const { container, rerender } = render(<VideoEmbed url={URL} title="T" state="starting" />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<VideoEmbed url={URL} title="T" state="playing" />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector(".player")).not.toBeNull();
  });
});
