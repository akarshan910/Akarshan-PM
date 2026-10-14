// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon, ICON_NAMES } from "./icons";

describe("Icon", () => {
  it("draws every icon in the set", () => {
    expect(ICON_NAMES).toHaveLength(34);
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

  it("fills the play icon on cover badges", () => {
    const { container } = render(<Icon name="play" filled />);
    expect(container.querySelector("svg")?.getAttribute("style")?.toLowerCase()).toContain(
      "fill: currentcolor",
    );
  });
});
