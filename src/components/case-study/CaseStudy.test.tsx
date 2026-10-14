// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { caseStudyView, type CaseStudyView } from "~/lib/case-study";
import type { BlockPublished, ProjectPublished } from "~/lib/published";
import { loadLocalV0 } from "~/lib/sources/local-v0";

import { Block } from "./blocks/Block";
import { CaseStudyNeighbours } from "./CaseStudyNeighbours";
import { CaseStudyPage } from "./CaseStudyPage";
import { CaseStudyContext } from "./context";

const content = loadLocalV0(new Date("2026-10-13T18:00:00Z"));

function v0(slug: string): CaseStudyView {
  const view = caseStudyView(content, slug);
  if (!view) throw new Error(`no ${slug}`);
  return view;
}

const IMG = {
  src: "/media/a.webp",
  srcset: "/media/a.webp 800w",
  width: 800,
  height: 600,
  alt: "Home screen",
  dominant: "#222",
};

const RICE: Extract<BlockPublished, { type: "table" }> = {
  id: "t1",
  type: "table",
  columns: ["#", "Feature", "Reach", "Impact", "Conf.", "Effort", "RICE"],
  rows: Array.from({ length: 9 }, (_, i) => [
    String(i + 1),
    `Feature ${i + 1}`,
    "9",
    "2",
    "85%",
    "2 mo",
    String(9 - i),
  ]),
  formula: "rice",
  checkFormula: true,
  sortByScore: false,
  highlightTop: 3,
  phoneCards: true,
};

function project(overrides: Partial<ProjectPublished> = {}): ProjectPublished {
  const base = v0("puja-engagement-platform").project;
  return {
    ...base,
    overview: {
      ...base.overview,
      cardLabel: "Strategy assignment + prototype",
      sector: "Devotional consumer app",
      problem: "Generic <strong>discovery</strong>.",
      proposal: "",
      role: "Lead PM",
    },
    ...overrides,
  };
}

function view(p: ProjectPublished, extra: Partial<CaseStudyView> = {}): CaseStudyView {
  return { ...v0("puja-engagement-platform"), project: p, ...extra };
}

function renderBlock(block: BlockPublished, p: ProjectPublished = project()) {
  return render(
    <CaseStudyContext.Provider value={{ project: p }}>
      <Block group={{ kind: "block", block }} />
    </CaseStudyContext.Provider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CaseStudyPage", () => {
  it("renders the header, facts, summary and numbered chapters with the accent on <main>", () => {
    const { container } = render(<CaseStudyPage view={view(project())} />);
    const main = container.querySelector("main");
    expect(main?.style.getPropertyValue("--pa")).toBe(v0("puja-engagement-platform").accent);
    expect(screen.getByRole("heading", { level: 1, name: "Puja engagement platform" })).toBeInTheDocument();
    expect(screen.getByText("VOL.01")).toBeInTheDocument();
    expect(screen.getByText("Strategy assignment + prototype")).toBeInTheDocument();
    expect(screen.getByText("Sri Mandir · Devotional consumer app")).toBeInTheDocument();
    expect(screen.getByText("My role").nextSibling).toHaveTextContent("Lead PM");
    expect(screen.queryByText("Timeline")).toBeNull();

    // The Summary: "What I proposed" is empty, so it hides.
    const summary = screen.getByRole("region", { name: "Summary" });
    expect(within(summary).getByText("discovery").tagName).toBe("STRONG");
    expect(within(summary).queryByText("What I proposed")).toBeNull();
    expect(within(summary).getByText("Success measures")).toBeInTheDocument();

    const chapters = container.querySelectorAll("article section");
    expect(chapters[0]?.id).toBe("ch-01");
    expect(chapters[1]?.id).toBe("ch-02");
    const rail = screen.getAllByRole("navigation", { name: "Chapters" })[0];
    expect(rail).toHaveTextContent(`Chapters · ${chapters.length}`);
    expect(within(rail as HTMLElement).getAllByRole("link")[0]).toHaveAttribute("aria-current", "true");
  });

  it("hides the summary, the volume tag and the chapters when there's nothing to show", () => {
    const base = project();
    const p: ProjectPublished = {
      ...base,
      overview: { ...base.overview, problem: "", proposal: "", cardLabel: "", company: "", sector: "" },
      outcomes: [],
      story: [],
    };
    const { volume: _volume, ...rest } = view(p);
    render(<CaseStudyPage view={rest} />);
    expect(screen.queryByRole("region", { name: "Summary" })).toBeNull();
    expect(screen.queryByText(/^VOL\./)).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Chapters" })).toBeNull();
  });

  it("links the PRD in a new tab", () => {
    const base = project();
    const p = { ...base, overview: { ...base.overview, prdUrl: "https://docs.example/prd" } };
    render(<CaseStudyPage view={view(p)} />);
    const link = screen.getByRole("link", { name: /Read the PRD/ });
    expect(link).toHaveAttribute("href", "https://docs.example/prd");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("follows the reader: the current chapter and the reading progress", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => frames.push(fn));
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    const { container } = render(<CaseStudyPage view={view(project())} />);
    const sections = [...container.querySelectorAll<HTMLElement>("article section")];
    sections.forEach((s, i) => {
      s.getBoundingClientRect = () => ({ top: i < 2 ? 100 : 900 }) as DOMRect;
    });
    const article = container.querySelector("article");
    if (article) article.getBoundingClientRect = () => ({ top: -500, height: 2000 }) as DOMRect;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      for (const f of frames.splice(0)) f(0);
    });
    expect(container.querySelector("main")?.style.getPropertyValue("--read")).not.toBe("0");
    const rail = screen.getAllByRole("navigation", { name: "Chapters" })[0] as HTMLElement;
    expect(within(rail).getAllByRole("link")[1]).toHaveAttribute("aria-current", "true");
  });

  it("opens and closes the chapter sheet from the bar", async () => {
    const user = userEvent.setup();
    render(<CaseStudyPage view={view(project())} />);
    const bar = screen.getByRole("button", { name: "Jump to chapter" });
    const sheet = document.getElementById(bar.getAttribute("aria-controls") ?? "");
    expect(bar).toHaveAttribute("aria-expanded", "false");
    expect(sheet).not.toBeVisible();

    await user.click(bar);
    expect(bar).toHaveAttribute("aria-expanded", "true");
    expect(sheet).toBeVisible();
    await user.keyboard("{Escape}");
    expect(bar).toHaveAttribute("aria-expanded", "false");
    expect(bar).toHaveFocus();

    await user.click(bar);
    fireEvent.pointerDown(document.body);
    expect(bar).toHaveAttribute("aria-expanded", "false");

    await user.click(bar);
    const links = within(sheet as HTMLElement).getAllByRole("link");
    await user.click(links[1] as HTMLElement);
    expect(bar).toHaveAttribute("aria-expanded", "false");
  });
});

describe("hero", () => {
  it("shows the cover when the hero is an image", () => {
    const { container } = render(
      <CaseStudyPage view={view(project({ visuals: { ...project().visuals, hero: { type: "image" } } }))} />,
    );
    expect(container.querySelector("img, [class*='cv']")).not.toBeNull();
    expect(screen.queryByRole("region", { name: "Interactive prototype" })).toBeNull();
  });

  it("shows the video poster, loading nothing from the host", () => {
    const p = project({
      visuals: {
        ...project().visuals,
        hero: { type: "video", url: "https://www.youtube.com/watch?v=abc123", title: "Walkthrough" },
      },
    });
    const { container } = render(<CaseStudyPage view={view(p)} />);
    expect(screen.getByRole("region", { name: "Video" })).toBeInTheDocument();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("draws the prototype heading per device; nothing loads until the visitor explores", async () => {
    vi.stubGlobal("open", vi.fn());
    const user = userEvent.setup();
    const p = project({
      visuals: {
        ...project().visuals,
        hero: {
          type: "prototype",
          url: "https://prototypes.example/sri",
          frame: "phone",
          start: "click",
          title: "Seven screens from the PRD, built to be clicked.",
          note: "Dummy data.",
          screens: [
            { label: "Home", startPath: "home" },
            { label: "Booking", startPath: "booking" },
          ],
        },
      },
    });
    const { container } = render(<CaseStudyPage view={view(p)} />);
    const region = screen.getByRole("region", { name: "Interactive prototype" });
    expect(within(region).getByText("Interactive prototype · 2 screens")).toBeInTheDocument();
    expect(within(region).getByText("Prototype · 2 screens")).toBeInTheDocument();
    expect(within(region).getByText("Home, Booking")).toBeInTheDocument();
    expect(within(region).getAllByText("Dummy data.").length).toBeGreaterThan(0);
    expect(container.querySelector("iframe")).toBeNull();

    await user.click(
      within(region).getAllByRole("button", { name: "Explore the prototype" })[0] as HTMLElement,
    );
    const frame = container.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute("src")).toContain("home");
    expect(within(region).getAllByRole("button", { name: /Exit prototype/ }).length).toBeGreaterThan(0);

    await user.click(within(region).getByRole("button", { name: "Booking" }));
    expect(container.querySelector("iframe")?.getAttribute("src")).toContain("booking");
    expect(within(region).getByRole("button", { name: "Booking" })).toHaveAttribute("aria-current", "true");

    await user.click(within(region).getAllByRole("button", { name: /Exit prototype/ })[0] as HTMLElement);
    expect(container.querySelector("iframe")).toBeNull();

    await user.click(within(region).getByRole("button", { name: /Try the prototype/ }));
    expect(container.querySelector("iframe") ?? document.querySelector("iframe")).not.toBeNull();
  });
});

describe("blocks", () => {
  it("renders text, lead, quote, callout and divider", () => {
    const { container } = render(
      <CaseStudyContext.Provider value={{ project: project() }}>
        <Block
          group={{
            kind: "block",
            block: { id: "a", type: "text", body: "<p>Body <strong>bold</strong></p>", style: "body" },
          }}
        />
        <Block
          group={{ kind: "block", block: { id: "b", type: "text", body: "<p>Lead</p>", style: "lead" } }}
        />
        <Block
          group={{
            kind: "block",
            block: { id: "c", type: "quote", body: "A line worth quoting.", cite: "Someone" },
          }}
        />
        <Block
          group={{
            kind: "block",
            block: { id: "d", type: "callout", body: "<p>Top three</p>", tone: "accent" },
          }}
        />
        <Block group={{ kind: "block", block: { id: "e", type: "divider" } }} />
        <Block group={{ kind: "block", block: { id: "f", type: "heading", body: "Assumptions" } }} />
        <Block group={{ kind: "block", block: { id: "g", type: "list", body: "<ul><li>One</li></ul>" } }} />
      </CaseStudyContext.Provider>,
    );
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("A line worth quoting.").closest("blockquote")).not.toBeNull();
    expect(screen.getByText("Someone").tagName).toBe("CITE");
    expect(container.querySelector("[data-tone='accent']")).toHaveTextContent("Top three");
    expect(container.querySelector("hr")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 3, name: "Assumptions" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("One");
  });

  it("draws a heading followed by a list as one box", () => {
    render(
      <CaseStudyContext.Provider value={{ project: project() }}>
        <Block
          group={{
            kind: "boxes",
            id: "h",
            boxes: [
              {
                heading: { id: "h", type: "heading", body: "No user data yet" },
                list: { id: "l", type: "list", body: "<ul><li>Trending</li></ul>" },
              },
            ],
          }}
        />
      </CaseStudyContext.Provider>,
    );
    expect(screen.getByRole("heading", { name: "No user data yet" }).parentElement).toHaveTextContent(
      "Trending",
    );
  });

  it("shows the outcomes a metrics block names, or those in the strip", () => {
    const p = project();
    const named = p.outcomes[0];
    if (!named) throw new Error("no outcomes");
    renderBlock({ id: "m", type: "metrics", outcomeIds: [named.id] }, p);
    expect(screen.getByText(named.value)).toBeInTheDocument();
    expect(screen.getAllByText(/TARGET|ACHIEVED|PROJECTED|BASELINE|OUTPUT/)).toHaveLength(1);
  });

  it("renders nothing for a metrics block with no outcomes", () => {
    const { container } = renderBlock({ id: "m", type: "metrics", outcomeIds: ["missing"] });
    expect(container).toBeEmptyDOMElement();
  });

  it("highlights the top RICE rows and shows all nine on request", async () => {
    const user = userEvent.setup();
    const { container } = renderBlock(RICE);
    const table = container.querySelector("table");
    expect(table).toHaveAttribute("data-collapsed");
    expect(container.querySelectorAll("tr[data-top]")).toHaveLength(3);
    expect(screen.getByText("+ 4 more")).toBeInTheDocument();
    expect(screen.getAllByText("R 9 · I 2 · C 85% · E 2 mo")).toHaveLength(9);
    expect(screen.getAllByText("· In the plan")).toHaveLength(3);

    const phone = screen.getAllByRole("button", { name: "Show all nine" }).at(-1);
    expect(phone).toHaveAttribute("aria-controls");
    await user.click(phone as HTMLElement);
    expect(table).not.toHaveAttribute("data-collapsed");
    expect(screen.getByRole("button", { name: "Show the top five" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Show the top five" }));
    expect(table).toHaveAttribute("data-collapsed");

    await user.click(screen.getAllByRole("button", { name: "Show all nine" })[0] as HTMLElement);
    expect(table).not.toHaveAttribute("data-collapsed");
  });

  it("renders a plain table without highlights or phone cards", () => {
    const { container } = renderBlock({
      id: "p",
      type: "table",
      columns: ["Metric", "Before", "After"],
      rows: [["CSAT", "42", "72"]],
      checkFormula: false,
      sortByScore: false,
      highlightTop: 0,
      phoneCards: false,
    });
    expect(container.querySelector("tr[data-top]")).toBeNull();
    expect(container.querySelector("ol")).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Before" })).toBeInTheDocument();
  });

  it("renders nothing for an empty table", () => {
    const { container } = renderBlock({ ...RICE, rows: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it("opens images in the lightbox and returns focus to the thumbnail", async () => {
    const user = userEvent.setup();
    renderBlock({ id: "i", type: "image", media: { ...IMG, caption: "Click to enlarge" } });
    expect(screen.getByText("Click to enlarge").tagName).toBe("FIGCAPTION");
    const thumb = screen.getByRole("button", { name: "Enlarge: Home screen" });
    await user.click(thumb);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(thumb).toHaveFocus();
  });

  it("lays out galleries and before/after pairs", () => {
    renderBlock({
      id: "g",
      type: "gallery",
      media: [IMG, { ...IMG, alt: "" }, { ...IMG, caption: "Pay in chat" }],
    });
    expect(screen.getAllByRole("button", { name: /Enlarge/ })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Enlarge image 2" })).toBeInTheDocument();
    expect(screen.getByText("Swipe for more · tap to enlarge")).toBeInTheDocument();
    expect(screen.getByText("Pay in chat")).toBeInTheDocument();
  });

  it("renders the video and prototype blocks, and skips a prototype block without a prototype", () => {
    renderBlock({
      id: "v",
      type: "video",
      url: "https://www.youtube.com/watch?v=abc123",
      title: "Demo",
      duration: "2:10",
      poster: IMG,
    });
    expect(screen.getByText(/Demo/)).toBeInTheDocument();

    const none = renderBlock(
      { id: "p", type: "prototype" },
      project({ visuals: { ...project().visuals, hero: { type: "image" } } }),
    );
    expect(none.container).toBeEmptyDOMElement();

    renderBlock(
      { id: "p2", type: "prototype", startPath: "booking" },
      project({
        visuals: {
          ...project().visuals,
          hero: {
            type: "prototype",
            url: "https://prototypes.example/sri",
            frame: "phone",
            start: "click",
            note: "Dummy",
          },
        },
      }),
    );
    expect(screen.getAllByRole("button", { name: "Explore the prototype" }).length).toBeGreaterThan(0);
  });

  it("numbers journey stages", () => {
    renderBlock({
      id: "j",
      type: "journey",
      stages: [{ title: "Tap the menu" }, { title: "Pay", note: "Deep link" }],
    });
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("1Tap the menu");
    expect(items[1]).toHaveTextContent("2PayDeep link");
    const empty = renderBlock({ id: "j2", type: "journey", stages: [] });
    expect(empty.container).toBeEmptyDOMElement();
  });

  it("hides empty ownership columns, and the whole block when empty", () => {
    renderBlock({ id: "o", type: "ownership", mine: "The RICE model", team: "", decision: "WhatsApp first" });
    expect(screen.getByText("I owned")).toBeInTheDocument();
    expect(screen.queryByText("I partnered on")).toBeNull();
    expect(screen.getByText("Key decision and trade-off")).toBeInTheDocument();
    const empty = renderBlock({ id: "o2", type: "ownership", mine: "" });
    expect(empty.container).toBeEmptyDOMElement();
    renderBlock({ id: "o3", type: "ownership", mine: "", decision: "Only a decision" });
    expect(screen.getByText("Only a decision")).toBeInTheDocument();
  });

  it("draws cards as priority cards, a hairline grid or chips", () => {
    const { container } = renderBlock({
      id: "c",
      type: "cards",
      columns: 3,
      items: [{ kicker: "Priority 1", title: "Professionals", note: "Busy" }, { title: "Devotees" }],
    });
    expect(screen.getByText("Priority 1")).toBeInTheDocument();
    expect(container.querySelector("[style*='--cols']")).not.toBeNull();

    const grid = renderBlock({
      id: "h",
      type: "cards",
      columns: 3,
      items: [{ title: "Generic discovery", note: "No recs" }, { title: "Low awareness" }],
    });
    expect(grid.container.querySelector("[style*='--last']")).not.toBeNull();
    expect(screen.getByText("Generic discovery")).toBeInTheDocument();

    renderBlock({ id: "s", type: "cards", columns: 2, style: "chips", items: [{ title: "NRIs" }] });
    expect(screen.getByText("NRIs").tagName).toBe("LI");

    const empty = renderBlock({ id: "e", type: "cards", columns: 2, items: [] });
    expect(empty.container).toBeEmptyDOMElement();
  });

  it("throws outside the case-study context", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Block group={{ kind: "block", block: { id: "m", type: "metrics" } }} />)).toThrow();
  });
});

describe("CaseStudyNeighbours", () => {
  it("links prev and next with their volumes, and All work on phones", () => {
    render(<CaseStudyNeighbours view={v0("arcana-workspace")} />);
    expect(screen.getByText("← Previous · VOL.02")).toBeInTheDocument();
    expect(screen.getByText("VOL.04 →")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /All work · 5 volumes/ })).toHaveAttribute("href", "/work");
    expect(screen.getAllByRole("link", { name: /Word games/ })[0]).toHaveAttribute(
      "href",
      "/work/word-games-monetisation-strategy",
    );
  });

  it("hides each at its end, and everything for an unlisted project", () => {
    render(<CaseStudyNeighbours view={v0("puja-engagement-platform")} />);
    expect(screen.queryByText(/Previous/)).toBeNull();
    const { prev: _p, next: _n, volume: _v, ...unlisted } = v0("arcana-workspace");
    const { container } = render(<CaseStudyNeighbours view={{ ...unlisted, volumes: 0 }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
