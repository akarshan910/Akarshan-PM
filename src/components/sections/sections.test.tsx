// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildHomeView, type HomeView } from "~/lib/site";
import { loadLocalV0 } from "~/lib/sources/local-v0";
import type { Section } from "~/lib/types";

import { avatarColours } from "./Testimonials";
import { formatDate } from "./Footer";
import { splitName, volumeRange } from "./Hero";
import { HomeContext, legacyAnchors, SECTIONS } from "./index";
import { toCardData } from "./cards";

const content = loadLocalV0(new Date("2026-10-13T12:30:00Z"));
const home = buildHomeView(content);

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

function sectionOf(kind: Section["kind"], view: HomeView = home): Section {
  const s = view.sections.find((x) => x.kind === kind);
  if (!s) throw new Error(`no ${kind}`);
  return s;
}

function renderSection(section: Section, view: HomeView = home) {
  const Component = SECTIONS[section.kind];
  return render(
    <HomeContext.Provider
      value={{ anchors: legacyAnchors(view.sections), updatedAt: view.chrome.footer.updatedAt }}
    >
      <Component section={section} profile={view.profile} projects={view.projects} posts={view.posts} />
    </HomeContext.Provider>,
  );
}

/** A copy of the view with one section changed. */
function withSection(kind: Section["kind"], change: (s: Section) => Section): Section {
  return change(structuredClone(sectionOf(kind)));
}

describe("SECTIONS", () => {
  it("has a component for every kind", () => {
    expect(Object.keys(SECTIONS).sort()).toEqual(
      [
        "about",
        "contact",
        "experience",
        "footer",
        "hero",
        "offduty",
        "proof",
        "shelf",
        "skills",
        "testimonials",
        "text",
        "writing",
      ].sort(),
    );
  });

  it("renders every V0 section with its id as the DOM id", () => {
    for (const s of home.sections) {
      if (s.kind === "footer") continue;
      const { container, unmount } = renderSection(s);
      expect(container.querySelector(`#${s.id}`)).not.toBeNull();
      unmount();
    }
  });
});

describe("legacyAnchors", () => {
  it("puts #work on the first shelf, #exp in Experience and #testi in Testimonials", () => {
    expect([...legacyAnchors(home.sections)]).toEqual([
      ["strategy", "work"],
      ["experience", "exp"],
      ["testimonials", "testi"],
    ]);
  });

  it("skips an anchor a section already uses as its id", () => {
    const sections = [
      { id: "work", kind: "shelf" as const },
      { id: "x", kind: "experience" as const },
    ];
    expect([...legacyAnchors(sections)]).toEqual([["x", "exp"]]);
    expect([...legacyAnchors([])]).toEqual([]);
  });

  it("renders each anchor at the start of its section", () => {
    const { container } = renderSection(sectionOf("experience"));
    expect(container.querySelector("#experience > #exp:first-child")).not.toBeNull();
    const t = renderSection(sectionOf("testimonials"));
    expect(t.container.querySelector("#testimonials > #testi:first-child")).not.toBeNull();
    const s = renderSection(sectionOf("shelf"));
    const anchor = s.container.querySelector("#work");
    expect(anchor?.nextElementSibling?.id).toBe("strategy");
  });
});

describe("Hero", () => {
  it("is the Introduction, with the name on two lines and the rich positioning line", () => {
    renderSection(sectionOf("hero"));
    const hero = screen.getByRole("region", { name: "Introduction" });
    const h1 = within(hero).getByRole("heading", { level: 1 });
    expect(h1.innerHTML).toContain("Akarshan<br>Kumar");
    expect(hero.querySelector("p strong")?.textContent).toBe("8 years experience");
    expect(hero.innerHTML).not.toContain("&lt;strong");
    expect(within(hero).getByRole("link", { name: /View My Work/ })).toHaveAttribute("href", "#strategy");
    expect(within(hero).getByRole("link", { name: /Résumé \(PDF\)/ })).toBeInTheDocument();
    expect(within(hero).getByText("Bengaluru, India")).toBeInTheDocument();
    expect(within(hero).getByText("01—05")).toBeInTheDocument();
  });

  it("staggers the visible lines 80ms apart and skips hidden ones", () => {
    const section = withSection("hero", (s) => ({
      ...s,
      items: s.items.filter((i) => i.id !== "intro" && i.id !== "availability" && i.id !== "location"),
    }));
    const { container } = renderSection(section);
    const steps = [...container.querySelectorAll<HTMLElement>(".rise")].map((e) =>
      e.style.getPropertyValue("--i"),
    );
    expect(steps).toEqual(["0", "1", "2"]);
    expect(container.querySelector(".intro")).toBeNull();
  });

  it("gives phones their own steps, skipping the intro and a location-only row they hide", () => {
    const view = structuredClone(home);
    view.profile.availability = undefined;
    const { container } = renderSection(sectionOf("hero"), view);
    const steps = [...container.querySelectorAll<HTMLElement>(".rise")].map((e) => [
      e.style.getPropertyValue("--i"),
      e.style.getPropertyValue("--ip"),
    ]);
    // row (location only), name, positioning, intro, buttons
    expect(steps).toEqual([
      ["0", "0"],
      ["1", "0"],
      ["2", "1"],
      ["3", "2"],
      ["4", "2"],
    ]);
  });

  it("hides empty parts, the brush when it's off, and the buttons without targets", () => {
    const view = structuredClone(home);
    view.profile.availability = undefined;
    delete view.profile.intro;
    delete view.profile.heroButtons.primary;
    delete view.profile.contact.resume;
    const section = withSection("hero", (s) => ({ ...s, items: s.items.filter((i) => i.id !== "brush") }));
    const { container } = renderSection(section, view);
    expect(container.querySelector("svg[viewBox='0 0 560 34']")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelectorAll(".rise")).toHaveLength(3); // the location row, name, positioning
  });

  it("floats only published projects, decoratively, in the laptop and iPad sets", () => {
    const { container } = renderSection(sectionOf("hero"));
    const layers = container.querySelectorAll("[aria-hidden='true'] > a[tabindex='-1']");
    expect(layers).toHaveLength(10); // five projects × two layouts
    expect(container.querySelector(".flLaptop a")).toHaveAttribute("href", "/work/puja-engagement-platform");
    const visible = [...container.querySelectorAll<HTMLElement>(".flLaptop a")].filter(
      (a) => a.style.opacity === "1",
    );
    expect(visible).toHaveLength(3);
    const pad = [...container.querySelectorAll<HTMLElement>(".flIpad a")].filter(
      (a) => a.style.opacity === "1",
    );
    expect(pad).toHaveLength(1);
  });

  it("drops the floaters with no published project, and keeps the panel flat with motion off", () => {
    const section = withSection("hero", (s) => ({
      ...s,
      hero: { motion: false, floaters: { items: ["nope"], atOnce: 3 } },
    }));
    const { container } = renderSection(section);
    expect(container.querySelector(".flLaptop")).toBeNull();
    expect(container.querySelector(".flat")).not.toBeNull();
  });

  it("splits names and counts volumes", () => {
    expect(splitName("Akarshan Kumar")).toEqual(["Akarshan", "Kumar"]);
    expect(splitName("  Cher ")).toEqual(["Cher", ""]);
    expect(splitName("Ana de la Cruz")).toEqual(["Ana", "de la Cruz"]);
    expect([0, 1, 5, 12].map(volumeRange)).toEqual(["", "01", "01—05", "01—12"]);
  });
});

describe("Proof", () => {
  it("is an unlabelled list of the visible cells, in layout order", () => {
    renderSection(sectionOf("proof"));
    const region = screen.getByRole("region", { name: "Highlights" });
    const cells = within(region).getAllByRole("listitem");
    expect(cells.map((c) => c.textContent)).toEqual([
      "30 Cr+Annual Revenue Driven",
      "8 yrProduct Experience",
      "300 M+Users Served",
      "5Companies Built At",
    ]);
  });

  it("hides with nothing to show", () => {
    const { container } = renderSection(withSection("proof", (s) => ({ ...s, items: [] })));
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Shelf", () => {
  it("shows the lead and the rest, the All work tile with the volume count", () => {
    renderSection(sectionOf("shelf"));
    const shelf = screen.getByRole("region", { name: /Decisions/ });
    expect(within(shelf).getAllByRole("heading", { level: 3 }).length).toBeGreaterThanOrEqual(5);
    expect(within(shelf).getAllByRole("link", { name: /All work · 5 volumes/ }).length).toBeGreaterThan(0);
  });

  it("hides when none of its projects is published", () => {
    const { container } = renderSection(
      withSection("shelf", (s) => ({ ...s, items: [{ id: "gone", visible: true }] })),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("maps a project to card data with its accent, headline and prototype flag", () => {
    const entry = Object.values(home.projects)[0];
    if (!entry) throw new Error("no project");
    const card = toCardData(entry);
    expect(card.href).toBe(`/work/${entry.slug}`);
    expect(card.volume).toBe("01");
    expect(card.cover?.src).toMatch(/\.webp$/);
    expect(card.outcomes?.length).toBeLessThanOrEqual(2);
    expect(card.headline?.value).toBe(card.outcomes?.[0]?.value);
  });
});

describe("About", () => {
  it("renders the body paragraphs with their emphasis and the numbered points", () => {
    renderSection(sectionOf("about"));
    const about = screen.getByRole("region", { name: /Building products that/i });
    expect(about.querySelectorAll("p strong").length).toBeGreaterThan(3);
    const points = within(about).getAllByRole("listitem");
    expect(points).toHaveLength(1);
    expect(within(points[0] as HTMLElement).getByRole("heading", { level: 3 })).toHaveTextContent(
      "Currently building",
    );
  });

  it("hides parts switched off, and the section with nothing left", () => {
    const { container } = renderSection(withSection("about", (s) => ({ ...s, header: {}, items: [] })));
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Experience", () => {
  it("lists the visible entries, with Full résumé in the header and under the list", () => {
    renderSection(sectionOf("experience"));
    const exp = screen.getByRole("region", { name: /Where I've/i });
    expect(within(exp).getAllByRole("article")).toHaveLength(5);
    expect(within(exp).getAllByRole("link", { name: /Full résumé/ })).toHaveLength(2);
    expect(exp.textContent).not.toContain("$XXXK");
  });

  it("hides with no entries", () => {
    const view = structuredClone(home);
    view.profile.education = [];
    const { container } = renderSection(
      withSection("experience", (s) => ({ ...s, items: [] })),
      view,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Skills, Testimonials, Off duty", () => {
  it("renders the cloud with every visible group", () => {
    renderSection(sectionOf("skills"));
    expect(screen.getAllByRole("group")).toHaveLength(4);
    expect(screen.getAllByText(/28 skills in 4 groups/).length).toBeGreaterThan(0);
  });

  it("renders every testimonial, its kicker counting them on touch layouts", () => {
    const { container } = renderSection(sectionOf("testimonials"));
    expect(container.querySelectorAll("figure")).toHaveLength(7);
    expect(screen.getByRole("region", { name: /What teammates/i })).toBeInTheDocument();
    expect(container.querySelector(".count")).toHaveTextContent("· 7");
    expect(screen.queryByRole("link", { name: /on LinkedIn/ })).toBeNull();
  });

  it("mixes the avatar colours from the tone", () => {
    expect(avatarColours("violet")).toEqual({ background: "#272238", color: "#cfbffc" });
  });

  it("renders the Off duty page with the favourites shelf", () => {
    renderSection(sectionOf("offduty"));
    expect(screen.getAllByRole("list", { name: "All-time favourites" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("article")).toHaveLength(6);
  });

  it("each hides with nothing to show", () => {
    for (const kind of ["skills", "testimonials", "offduty"] as const) {
      const { container, unmount } = renderSection(withSection(kind, (s) => ({ ...s, items: [] })));
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});

describe("Contact", () => {
  it("renders the closing line with its red half and the rich intro", () => {
    renderSection(sectionOf("contact"));
    const contact = screen.getByRole("region", { name: /Let's build something impactful/i });
    expect(contact.querySelector("p strong")).toHaveTextContent("senior PM roles");
    expect(within(contact).getByRole("link", { name: /Email me/ })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:/),
    );
    expect(within(contact).queryByRole("link", { name: /GitHub/ })).toBeNull();
  });

  it("hides each link whose layout item is off", () => {
    renderSection(withSection("contact", (s) => ({ ...s, items: s.items.filter((i) => i.id !== "email") })));
    expect(screen.queryByRole("link", { name: /Email me/ })).toBeNull();
    expect(screen.getAllByRole("link", { name: /LinkedIn/ }).length).toBeGreaterThan(0);
  });

  it("hides with nothing at all", () => {
    const view = structuredClone(home);
    view.profile.contact = { showPhone: false, letsTalk: "contact" };
    const { container } = renderSection(
      withSection("contact", (s) => ({ ...s, header: {}, items: [] })),
      view,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Text section", () => {
  const text = (body: string): Section => ({
    id: "text-1",
    kind: "text",
    visible: true,
    items: [],
    header: { kicker: "Notes", title: "A text", titleMuted: "section" },
    text: { body },
  });

  it("renders the sanitised body under its header", () => {
    renderSection(text("<p>Hello <strong>you</strong></p><script>alert(1)</script><ul><li>a</li></ul>"));
    const region = screen.getByRole("region", { name: "A text section" });
    expect(region.querySelector("p strong")).toHaveTextContent("you");
    expect(region.innerHTML).not.toContain("script");
    expect(within(region).getByRole("list")).toBeInTheDocument();
  });

  it("hides while the body is empty", () => {
    const { container } = renderSection(text("<p> </p>"));
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Footer", () => {
  it("shows the year, name, credit and the last publish date", () => {
    renderSection(sectionOf("footer"));
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("© 2026 Akarshan Kumar · Vibe coded with ♥ in Bengaluru");
    expect(footer).toHaveTextContent(/Last updated.*13 Oct 2026/);
  });

  it("freezes the date under ?qa=1 and formats dates in IST", () => {
    window.history.replaceState(null, "", "/?qa=1");
    const view = structuredClone(home);
    view.chrome.footer.updatedAt = "2027-02-01T00:00:00Z";
    renderSection(sectionOf("footer"), view);
    expect(screen.getByRole("contentinfo")).toHaveTextContent("13 Oct 2026");
    expect(formatDate("2026-09-30T20:00:00Z")?.text).toBe("1 Oct 2026");
    expect(formatDate("nope")).toBeNull();
  });

  it("hides the credit and the date when their items are off", () => {
    renderSection(withSection("footer", (s) => ({ ...s, items: [] })));
    expect(screen.getByRole("contentinfo").textContent).toBe("© 2026 Akarshan Kumar");
  });
});

describe("server rendering", () => {
  it("prerenders every section without touching the browser", () => {
    const html = renderToString(
      <HomeContext.Provider value={{ anchors: legacyAnchors(home.sections) }}>
        {home.sections.map((s) => {
          const C = SECTIONS[s.kind];
          return (
            <C key={s.id} section={s} profile={home.profile} projects={home.projects} posts={home.posts} />
          );
        })}
      </HomeContext.Provider>,
    );
    expect(html).toContain('id="hero"');
    expect(html).toContain('id="exp"');
    expect(html).not.toContain("rv-wait");
  });
});
