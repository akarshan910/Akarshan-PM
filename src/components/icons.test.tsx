// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon, ICON_NAMES } from "./icons";

describe("Icon", () => {
  it("draws every icon in the set", () => {
    expect(ICON_NAMES).toHaveLength(41);
    for (const name of ICON_NAMES) {
      const { container } = render(<Icon name={name} />);
      expect(container.querySelector("path, circle"), name).not.toBeNull();
    }
  });

  it("is hidden from assistive tech unless it has a label", () => {
    const { container, getByRole } = render(
      <>
        <Icon name="check" />
        <Icon name="mail" label="Email" size={20} />
      </>,
    );
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(getByRole("img", { name: "Email" })).toHaveAttribute("width", "20");
  });

  it("lets the size prop win over the .ico class", () => {
    const { container } = render(<Icon name="clock" size={30} className="ico extra" />);
    expect(container.querySelector("svg")).toHaveStyle({ width: "30px", height: "30px" });
    expect(container.querySelector("svg")).toHaveClass("ico", "extra");
  });

  it("keeps the Studio glyphs' board shapes", () => {
    const { container } = render(
      <>
        <Icon name="tick" />
        <Icon name="lock" />
      </>,
    );
    expect(container.querySelector("path")).toHaveAttribute("d", "M5 12.5l4.5 4.5L19 7.5");
    expect(container.querySelector("rect")).not.toBeNull();
  });

  it("fills the play icon on cover badges", () => {
    const { container } = render(<Icon name="play" filled />);
    expect(container.querySelector("svg")?.getAttribute("style")?.toLowerCase()).toContain(
      "fill: currentcolor",
    );
  });
});
