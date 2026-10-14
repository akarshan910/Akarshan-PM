import { describe, expect, it } from "vitest";

import * as legacy from "~/legacy/content";
import { buildHomeView, letsTalkTarget, listedProjects, publicSections } from "~/lib/site";
import { loadLocalV0 } from "~/lib/sources/local-v0";
import { buildV0Documents } from "~/lib/v0";

const content = loadLocalV0(new Date("2026-10-13T18:00:00Z"));
const home = buildHomeView(content);
const serialized = JSON.stringify(home);

describe("public views never carry drafts or private fields (10 · Security gates)", () => {
  it("leaves out the hidden Shipped shelf and every SugarFit draft", () => {
    expect(home.sections.map((s) => s.id)).not.toContain("shipped");
    const drafts = buildV0Documents(legacy).projects.filter((p) => !p.publish);
    for (const d of drafts) {
      expect(serialized).not.toContain(d.document.overview.title);
      expect(serialized).not.toContain(d.slug);
    }
  });

  it("carries no facts, alternatives, evidence, todo or prompts", () => {
    for (const key of [
      '"facts"',
      '"unconfirmed"',
      '"evidence"',
      '"todo"',
      '"prompts"',
      '"reviewed"',
      '"settings"',
    ]) {
      expect(serialized).not.toContain(key);
    }
    expect(serialized).not.toContain("lockscreen users"); // a résumé alternative from 07
  });

  it("drops hidden items: the Wipro placeholder bullet and the two hidden proof cells", () => {
    expect(serialized).not.toContain("Saved $XXXK");
    const proof = home.sections.find((s) => s.kind === "proof");
    expect(proof?.items.map((i) => i.id)).toEqual(["p-revenue", "p-tenure", "p-users", "p-companies"]);
  });

  it("hides Writing while there are no posts", () => {
    expect(home.sections.map((s) => s.kind)).not.toContain("writing");
  });
});

describe("site chrome", () => {
  it("links the nav in page order with the live labels", () => {
    expect(home.chrome.nav.map((n) => [n.label, n.href])).toEqual([
      ["Work", "/#strategy"],
      ["About", "/#about"],
      ["Exp", "/#experience"],
      ["Skills", "/#skills"],
      ["Testimonial", "/#testimonials"],
    ]);
    expect(home.chrome.letsTalk).toEqual({ href: "/#contact", newTab: false });
  });

  it("falls back from Contact to email to LinkedIn for Let's Talk", () => {
    const p = content.profile;
    expect(letsTalkTarget(p, false)?.href).toBe(`mailto:${p.contact.email ?? ""}`);
    expect(letsTalkTarget({ ...p, contact: { ...p.contact, letsTalk: "linkedin" } }, true)).toEqual({
      href: p.contact.linkedin,
      newTab: true,
    });
    expect(
      letsTalkTarget({ ...p, contact: { showPhone: false, letsTalk: "contact" } }, false),
    ).toBeUndefined();
  });
});

describe("projects", () => {
  it("numbers the five V0 projects in shelf order", () => {
    expect(listedProjects(content).map((p) => [p.volume, p.slug])).toEqual([
      ["01", "puja-engagement-platform"],
      ["02", "word-games-monetisation-strategy"],
      ["03", "arcana-workspace"],
      ["04", "glp-1-digital-scaffold"],
      ["05", "revenue-growth-strategy"],
    ]);
    expect(Object.keys(home.projects)).toHaveLength(5);
  });

  it("keeps hidden sections out entirely", () => {
    const hidden = {
      ...content,
      layout: {
        ...content.layout,
        sections: content.layout.sections.map((s) => (s.id === "about" ? { ...s, visible: false } : s)),
      },
    };
    expect(publicSections(hidden).map((s) => s.id)).not.toContain("about");
  });
});
