// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ExperienceEntry } from "./ExperienceEntry";
import { type ExperienceItem, ExperienceList, kindAt } from "./ExperienceList";

afterEach(cleanup);

const bullets = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `i${i}`, text: <>Bullet {i + 1}</> }));

const ENTRIES: [ExperienceItem, ExperienceItem, ExperienceItem] = [
  {
    id: "a",
    company: "Sugar.fit",
    jobTitle: "Product Manager",
    location: "Bengaluru",
    dates: "May 2025 — now",
    highlights: [{ id: "h1", items: bullets(5) }],
  },
  {
    id: "b",
    company: "Glance",
    jobTitle: "Product Manager",
    dates: "2022 — 2025",
    summary: "Owned personalisation.",
    highlights: [{ id: "h1", items: [...bullets(2), { id: "x", text: "Hidden placeholder", hidden: true }] }],
  },
  {
    id: "c",
    company: "Razorpay",
    jobTitle: "Senior Product Analyst",
    dates: "2021",
    highlights: [{ id: "h1", items: bullets(2) }],
  },
];

describe("kindAt", () => {
  it("follows position: Featured, Standard, then Compact", () => {
    expect([0, 1, 2, 5].map(kindAt)).toEqual(["featured", "standard", "compact", "compact"]);
  });
});

describe("ExperienceList", () => {
  it("renders each entry as an article, with the kind by position and education last", () => {
    const { container } = render(
      <ExperienceList
        entries={ENTRIES}
        education={[{ id: "e", company: "BIT Mesra", jobTitle: "M.Sc. Mathematics", dates: "2012 — 2017" }]}
      />,
    );
    const articles = container.querySelectorAll("article");
    expect([...articles].map((a) => a.className)).toEqual([
      "entry featured",
      "entry standard",
      "entry compact",
      "entry education",
    ]);
  });

  it("leaves hidden highlight items out of the HTML", () => {
    render(<ExperienceList entries={ENTRIES} />);
    expect(screen.queryByText("Hidden placeholder")).toBeNull();
  });

  it("renders nothing without entries", () => {
    const { container } = render(<ExperienceList entries={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ExperienceEntry", () => {
  it("Featured, ungrouped: the bullet grid, and on phones an expandable rest", async () => {
    const user = userEvent.setup();
    const { container } = render(<ExperienceEntry kind="featured" {...ENTRIES[0]} />);
    expect(screen.getByText("Product Manager · Bengaluru")).toBeInTheDocument();
    const list = container.querySelector("ul");
    expect(list).toHaveClass("bullets", "grid");
    expect(within(list as HTMLElement).getAllByRole("listitem")).toHaveLength(5);
    expect(container.querySelectorAll("li.extra")).toHaveLength(1);
    const more = screen.getByRole("button", { name: "All Sugar.fit highlights" });
    expect(more).toHaveAttribute("aria-controls", list?.id);
    expect(more).toHaveAttribute("aria-expanded", "false");
    await user.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(container.querySelector("article")).toHaveClass("expanded");
  });

  it("Featured, grouped: highlight cards, plus the flat list for phones; no more button for four or fewer", () => {
    const { container } = render(
      <ExperienceEntry
        kind="featured"
        company="Sugar.fit"
        summary="Own product."
        highlights={[
          { id: "g1", title: "AI-native products", items: bullets(2) },
          { id: "g2", title: "Data & platforms", items: bullets(2) },
          { id: "g3", title: "Empty", items: [{ id: "z", text: "gone", hidden: true }] },
        ]}
      />,
    );
    expect(container.querySelectorAll(".card")).toHaveLength(2);
    expect(screen.getByText("AI-native products")).toHaveClass("cardTitle");
    expect(screen.queryByText("Empty")).toBeNull();
    expect(container.querySelector("ul.bullets")).toHaveClass("hideLaptop", "hideIpad");
    expect(screen.getByText("Own product.")).toHaveClass("summary");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("Standard: summary and grid on laptop, one paragraph on iPad, an accordion on phones", () => {
    const { container } = render(<ExperienceEntry kind="standard" {...ENTRIES[1]} />);
    const button = screen.getByRole("button", { name: /Glance\s*Product Manager · 2022 — 2025/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button.parentElement).toHaveClass("phone");
    expect(container.querySelector(".summary")).toHaveClass("hideIpad");
    expect(container.querySelector(".para")).toHaveClass("hideLaptop", "hidePhone");
    expect(container.querySelector(".para")).toHaveTextContent("Owned personalisation.");
    expect(container.querySelector("ul")).toHaveClass("grid", "hideIpad");
  });

  it("Compact: the bullets joined into one paragraph on laptop, and an accordion on iPad and phones", () => {
    const { container } = render(<ExperienceEntry kind="compact" {...ENTRIES[2]} />);
    expect(screen.getByRole("button").parentElement).toHaveClass("touch");
    expect(container.querySelector(".para")).toHaveTextContent("Bullet 1 · Bullet 2");
    expect(container.querySelector(".para")).toHaveClass("hideIpad", "hidePhone");
    expect(container.querySelector("ul")).toHaveClass("hideLaptop");
    expect(container.querySelector(".summary")).toBeNull();
  });

  it("Compact with a summary shows it everywhere it collapses", () => {
    const { container } = render(<ExperienceEntry kind="compact" company="Vedantu" summary="+800 leads." />);
    expect(container.querySelector(".summary")).toHaveClass("hideLaptop");
    expect(container.querySelector(".para")).toHaveTextContent("+800 leads.");
    expect(container.querySelector("ul")).toBeNull();
    expect(container.querySelector(".dates")).toBeNull();
  });

  it("Education: the degree as its paragraph and subtitle, with no role line", () => {
    const { container } = render(
      <ExperienceEntry
        kind="education"
        company="BIT Mesra"
        jobTitle="M.Sc. Mathematics"
        dates="2012 — 2017"
      />,
    );
    expect(
      screen.getByRole("button", { name: /BIT Mesra\s*M.Sc. Mathematics · 2012 — 2017/ }),
    ).toBeInTheDocument();
    expect(container.querySelector(".role")).toBeNull();
    expect(container.querySelector(".para")).toHaveTextContent("M.Sc. Mathematics");
  });

  it("Education without a degree shows no paragraph", () => {
    const { container } = render(<ExperienceEntry kind="education" company="School" />);
    expect(container.querySelector(".para")).toBeNull();
    expect(screen.getByRole("button", { name: "School" })).toBeInTheDocument();
  });
});
