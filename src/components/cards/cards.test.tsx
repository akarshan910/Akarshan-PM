// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Shelf } from "../shelf/Shelf";
import { ClosingTile } from "./ClosingTile";
import { Cover } from "./Cover";
import { CompactRow, LeadCard, StandardCard, type ProjectCardData } from "./ProjectCard";

const base: ProjectCardData = {
  href: "/work/puja",
  volume: "05",
  accent: "#FF5A67",
  ground: "#1C0C0F",
  company: "Sri Mandir",
  cardLabel: "Strategy + prototype",
  title: "Puja engagement platform",
  summary: "WhatsApp-native booking.",
  prototype: true,
  headline: { value: "+30%", line: "monthly orders per user", type: "target" },
  outcomes: [
    { value: "+30%", line: "monthly orders per user", type: "target" },
    { value: "7", type: "output" },
    { value: "ignored", type: "baseline" },
  ],
};
const bare: ProjectCardData = { href: "/work/x", accent: "#2DD4BF", ground: "#0D1918", title: "Untitled" };

describe("LeadCard (C7)", () => {
  it("is one link with meta, title, summary, up to two results and the read-more line", () => {
    render(<LeadCard project={base} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/work/puja");
    expect(screen.getByRole("heading", { level: 3, name: "Puja engagement platform" })).toBeInTheDocument();
    expect(screen.getByText("Sri Mandir · Strategy + prototype")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp-native booking.")).toBeInTheDocument();
    expect(screen.getAllByText("VOL.05")).toHaveLength(1);
    expect(screen.getByText("Prototype")).toBeInTheDocument();
    // Two results, drawn for laptop/phone and for iPad.
    expect(screen.getAllByText("Target: a goal set in the plan, not yet measured")).toHaveLength(2);
    expect(screen.getAllByText("Output: what was produced")).toHaveLength(2);
    expect(screen.queryByText("ignored")).toBeNull();
    expect(screen.getByText("Read the case study")).toBeInTheDocument();
  });

  it("hides every empty part", () => {
    const { container } = render(<LeadCard project={bare} />);
    expect(container.querySelector("p")).toBeNull();
    expect(screen.queryByText(/VOL\./)).toBeNull();
    expect(container.querySelector("[class*=results]")).toBeNull();
    expect(container.querySelector("[class*=meta]")).toBeNull();
    expect(container.querySelector("[class*=bigNum]")).toBeNull();
  });

  it("shows a status badge when there's no prototype", () => {
    render(<LeadCard project={{ ...base, prototype: false, status: "Shipped · AI" }} />);
    expect(screen.getByText("Shipped · AI")).toBeInTheDocument();
  });
});

describe("StandardCard and CompactRow (C7)", () => {
  it("renders the headline row and hides it without one", () => {
    const { rerender, container } = render(<StandardCard project={base} />);
    expect(screen.getByText("monthly orders per user")).toBeInTheDocument();
    rerender(<StandardCard project={bare} />);
    expect(container.querySelector("[class*=headline]")).toBeNull();
    expect(container.querySelector("p")).toBeNull();
  });

  it("draws the generated cover's number when there's no image", () => {
    const { container } = render(<StandardCard project={base} />);
    expect(container.querySelector("[class*=num][aria-hidden=true]")?.textContent).toBe("05");
  });

  it("renders a compact row with the NN tag and the headline", () => {
    render(<CompactRow project={base} />);
    expect(screen.getByText("05").parentElement?.textContent).toBe("Volume 05");
    expect(screen.getByText(/\+30% monthly orders per user/)).toBeInTheDocument();
    cleanup();
    const { container } = render(<CompactRow project={bare} />);
    expect(container.querySelector("[class*=rowLine]")).toBeNull();
  });
});

describe("Cover (M-IMG-FADE)", () => {
  const image = { src: "/c.webp", alt: "The booking app", focal: { x: 0.25, y: 0.5 } };

  it("loads, then fades in, at the focal point", () => {
    const { container } = render(<Cover image={image} accent="#fff" ground="#000" lazy={false} />);
    const img = screen.getByRole("img", { name: "The booking app" });
    expect(img).toHaveAttribute("data-state", "loading");
    expect(img).toHaveAttribute("loading", "eager");
    expect(img).toHaveStyle({ objectPosition: "25% 50%" });
    expect(container.querySelector("[class*=shim]")).not.toBeNull();
    fireEvent.load(img);
    expect(img).toHaveAttribute("data-state", "loaded");
    expect(container.querySelector("[class*=shim]")).toBeNull();
  });

  it("shows the alt text when the image fails", () => {
    render(<Cover image={image} accent="#fff" ground="#000" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("The booking app")).toBeInTheDocument();
  });

  it("skips the fade for an image already complete at hydration", () => {
    const complete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
    Object.defineProperty(HTMLImageElement.prototype, "complete", { get: () => true, configurable: true });
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", { get: () => 10, configurable: true });
    render(<Cover image={{ src: "/c.webp", alt: "x" }} accent="#fff" ground="#000" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("data-state", "loaded");
    expect(img).toHaveAttribute("data-instant");
    if (complete) Object.defineProperty(HTMLImageElement.prototype, "complete", complete);
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", { get: () => 0, configurable: true });
  });
});

describe("ClosingTile (C7)", () => {
  it("renders All work with the spectrum, spanning the gap", () => {
    const { container } = render(
      <ClosingTile kind="all-work" href="/work" count={9} spectrum={["#2DD4BF", "#F5A524"]} span={2} />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/work");
    expect(link).toHaveStyle({ gridColumn: "span 2" });
    expect(screen.getByText(/All work · 9 volumes/)).toBeInTheDocument();
    expect(container.querySelectorAll("[class*=bar]")).toHaveLength(2);
    expect(screen.getByText(/filters by shelf, company, topic and label/)).toBeInTheDocument();
  });

  it("renders See all with how many more, and the phone rows", () => {
    render(<ClosingTile kind="see-all" href="/work?shelf=s" count={12} more={6} />);
    expect(screen.getByText("6 more on the work page, with filters, search and sort.")).toBeInTheDocument();
    cleanup();
    render(<ClosingTile kind="all-work" href="/work" count={1} layout="row" />);
    expect(screen.getByText("All work · 1 volume")).toBeInTheDocument();
    cleanup();
    render(<ClosingTile kind="see-all" href="/work?shelf=s" count={12} layout="row" />);
    expect(screen.getByRole("link", { name: "See all 12" })).toBeInTheDocument();
  });
});

describe("Shelf (C8)", () => {
  const make = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ ...bare, href: `/work/p${i}`, title: `Project ${i}` }));
  const props = { id: "strategy", title: "Decisions,", rows: 1 as const, seeAllHref: "/work?shelf=strategy" };

  it("hides completely when nothing is published", () => {
    const { container } = render(<Shelf {...props} projects={[]} totalVolumes={0} spectrum={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the header, lead, cards and rows, labelled by its title", () => {
    render(
      <Shelf
        {...props}
        kicker="Selected work · Strategy"
        projects={make(3)}
        totalVolumes={9}
        spectrum={[]}
      />,
    );
    expect(screen.getByRole("region", { name: "Decisions," })).toHaveAttribute("id", "strategy");
    expect(screen.getAllByRole("heading", { level: 3, name: "Project 0" })).toHaveLength(1);
    // Standard cards for laptop and iPad, compact rows for phones.
    expect(screen.getAllByRole("heading", { level: 3, name: "Project 1" })).toHaveLength(2);
    // Two cards in a row of three: one empty cell gets All work on laptop; iPad has none; phones get the row.
    expect(screen.getAllByRole("link", { name: /All work · 9 volumes/ })).toHaveLength(2);
  });

  it("turns the last cell into See all past the cap", () => {
    render(<Shelf {...props} projects={make(6)} totalVolumes={9} spectrum={[]} eagerCovers />);
    expect(screen.queryByRole("heading", { name: "Project 3" })).toBeNull();
    const seeAll = screen.getAllByRole("link", { name: /See all 6/ });
    // Laptop, iPad and the phone row.
    expect(seeAll).toHaveLength(3);
    for (const link of seeAll) expect(link).toHaveAttribute("href", "/work?shelf=strategy");
  });

  it("shows the lead alone with no grid", () => {
    const { container } = render(<Shelf {...props} projects={make(1)} totalVolumes={1} spectrum={[]} />);
    expect(container.querySelector("[class*=grid]")).toBeNull();
    expect(container.querySelector("[class*=rows]")).toBeNull();
  });
});
