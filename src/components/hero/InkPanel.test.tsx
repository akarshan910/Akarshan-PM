// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { HERO_SPEED, speed } from "~/motion/speed-lines";

import { Brush } from "./Brush";
import { FloatingPreview } from "./FloatingPreview";
import { InkPanel } from "./InkPanel";

afterEach(cleanup);

describe("InkPanel", () => {
  it("renders the layers, the kicker and the text column", () => {
    const { container, getByText } = render(
      <InkPanel volumeRange="01—09">
        <h1>Name</h1>
      </InkPanel>,
    );
    expect(getByText("VOL.00 · Prologue")).toBeInTheDocument();
    expect(getByText("01—09")).toHaveAttribute("aria-hidden", "true");
    expect(getByText("Name").tagName).toBe("H1");
    const paths = [...container.querySelectorAll("svg path")].map((p) => p.getAttribute("d"));
    expect(paths).toEqual([
      speed(...HERO_SPEED.laptop.args),
      speed(...HERO_SPEED.ipad.args),
      speed(...HERO_SPEED.phone.args),
    ]);
    for (const svg of container.querySelectorAll("svg")) expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("hides the numerals without published volumes, and keeps flat when hero motion is off", () => {
    const { container, queryByText } = render(<InkPanel motion={false} kicker="" />);
    expect(queryByText("01—09")).toBeNull();
    expect(queryByText("VOL.00 · Prologue")).toBeNull();
    expect(container.firstElementChild?.className).toContain("flat");
  });

  it("hands M2 the laptop speed-line path and renders floaters inside the tilt wrapper", () => {
    const ref = createRef<SVGPathElement>();
    const { container } = render(<InkPanel linesRef={ref} floaters={<div data-testid="f" />} />);
    expect(ref.current?.getAttribute("d")).toBe(speed(...HERO_SPEED.laptop.args));
    expect(container.querySelector("[data-ink] > [data-testid='f']")).not.toBeNull();
  });
});

describe("Brush", () => {
  it("draws the board's stroke, decoratively", () => {
    const { container } = render(<Brush />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("viewBox", "0 0 560 34");
    expect(container.querySelector("path")).toHaveAttribute("d", "M6 24 C 130 10, 330 6, 552 14");
  });
});

describe("FloatingPreview", () => {
  const base = {
    volume: "01",
    accent: "#2DD4BF",
    title: "3D body scan for GLP-1 users",
    href: "/work/body-scan",
    x: 76,
    y: 9,
    z: 200,
    r: 2,
  };

  it("is a decorative link that never takes focus", () => {
    const { container, getByText } = render(
      <FloatingPreview {...base} kicker="Shipped · AI" value="±2–3 pp" result="achieved" />,
    );
    const fl = container.firstElementChild as HTMLElement;
    expect(fl).toHaveAttribute("aria-hidden", "true");
    expect(fl.style.left).toBe("76%");
    expect(fl.style.transform).toBe("translateZ(200px) rotate(2deg)");
    const a = container.querySelector("a");
    expect(a).toHaveAttribute("tabindex", "-1");
    expect(a).toHaveAttribute("href", "/work/body-scan");
    expect(getByText("VOL.01")).toHaveStyle({ background: "#2DD4BF" });
    expect(getByText("ACHIEVED")).toBeInTheDocument();
    expect(getByText("Shipped · AI")).toBeInTheDocument();
  });

  it("hides the kicker and the headline row when they're empty", () => {
    const { container, queryByText } = render(<FloatingPreview {...base} />);
    expect(container.querySelectorAll("a > span")).toHaveLength(2);
    expect(queryByText("ACHIEVED")).toBeNull();
  });

  it("shows a value without a label, and each result label", () => {
    const { getByText, rerender } = render(<FloatingPreview {...base} value="7" />);
    expect(getByText("7")).toBeInTheDocument();
    for (const [result, text] of [
      ["target", "TARGET"],
      ["projected", "PROJECTED"],
      ["baseline", "BASELINE"],
      ["output", "OUTPUT"],
    ] as const) {
      rerender(<FloatingPreview {...base} result={result} />);
      expect(getByText(text)).toBeInTheDocument();
    }
  });
});
