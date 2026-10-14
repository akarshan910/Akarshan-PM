// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("shows the year, name, credit and last update in every device's wording", () => {
    const { getByRole, container } = render(
      <SiteFooter year={2026} name="Akarshan Kumar" credit="Vibe-coded in Bengaluru" updated="13 Oct 2026" />,
    );
    expect(getByRole("contentinfo")).toHaveTextContent(
      "© 2026 Akarshan Kumar · Vibe-coded in Bengaluru · Updated 13 Oct 2026Last updatedUpdated 13 Oct 2026",
    );
    expect(container.querySelector(".credit")).toHaveTextContent("· Vibe-coded in Bengaluru");
    expect(container.querySelector(".phoneOnly")).toHaveTextContent("· Updated 13 Oct 2026");
    expect(container.querySelector(".last")).toHaveTextContent("Last updated");
    expect(container.querySelector(".ipadOnly")).toHaveTextContent("Updated");
  });

  it("hides the credit and the date when they're empty", () => {
    const { getByRole } = render(<SiteFooter year="2026" name="Akarshan Kumar" />);
    expect(getByRole("contentinfo")).toHaveTextContent(/^© 2026 Akarshan Kumar$/);
  });

  it("links back to all work on a case study, instead of the date and credit", () => {
    const { getByRole, container } = render(
      <SiteFooter
        year={2026}
        name="Akarshan Kumar"
        credit="Vibe-coded in Bengaluru"
        updated="13 Oct 2026"
        back={{ href: "/work", label: "Back to all work" }}
      />,
    );
    expect(getByRole("link", { name: "Back to all work" })).toHaveAttribute("href", "/work");
    expect(container.querySelector(".credit")).toBeNull();
    expect(container.querySelector(".date")).toBeNull();
  });
});
