import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import * as content from "~/legacy/content";
import { Profile, Project, SiteLayout } from "~/lib/schemas";
import { buildV0Documents, splitHeadline, V0_COVERS } from "~/lib/v0";

import { normaliseSource, strings } from "./trace";

const v0 = buildV0Documents(content);
const project = (slug: string) => {
  const p = v0.projects.find((x) => x.slug === slug);
  if (!p) throw new Error(slug);
  return p.document;
};

describe("buildV0Documents", () => {
  it("passes every schema", () => {
    expect(() => Profile.parse(v0.profile)).not.toThrow();
    expect(() => SiteLayout.parse(v0.layout)).not.toThrow();
    for (const p of v0.projects) expect(() => Project.parse(p.document), p.slug).not.toThrow();
  });

  it("is deterministic and matches the reviewed snapshot", () => {
    expect(buildV0Documents(content)).toEqual(v0);
    expect(v0).toMatchSnapshot();
  });

  it("maps the profile as 07 · Profile says", () => {
    const p = v0.profile;
    expect(p.name).toBe("Akarshan Kumar");
    expect(p.availability).toBe("Open to work · Seeking Senior / Lead PM Roles");
    expect(p.positioning).toBe(
      "Product Manager with <strong>8 years experience</strong> driving <strong>30 Cr+ in annual revenue</strong> across consumer, health-tech, and D2C platforms.",
    );
    expect(p.intro).toBe(
      "Proven track record in 0→1 and 1→100 product journeys across personalization, user experience, growth, and operations.",
    );
    expect(p.heroButtons).toEqual({ primary: { label: "View My Work", href: "#strategy" }, resume: true });
    expect(p.proof.map((x) => `${x.value}${x.unit ?? ""}`)).toEqual([
      "30Cr+",
      "8yr",
      "300M+",
      "5",
      "$1.4M",
      "12M",
    ]);
    expect(p.footer.credit).toBe("Vibe coded with ♥ in Bengaluru");
    expect(p.contact.letsTalk).toBe("contact");
    expect(p.contact.github).toBeUndefined();
    expect(p.education).toBeUndefined();
    expect(p.spaces).toBeUndefined();
  });

  it("hides the Wipro placeholder bullet and nothing else (D18)", () => {
    const hidden = v0.profile.experience.flatMap((e) =>
      e.highlights.flatMap((h) => h.items.filter((i) => i.hidden).map((i) => `${e.id}/${i.id}`)),
    );
    expect(hidden).toEqual(["e-wipro/i2"]);
  });

  it("maps testimonials: two-letter initials, nearest tone, no LinkedIn", () => {
    const t = v0.profile.testimonials;
    expect(t).toHaveLength(7);
    expect(t.find((x) => x.name === "Pranshu Singh")?.initials).toBe("PS");
    expect(t.map((x) => x.tone)).toEqual(["coral", "sky", "amber", "green", "violet", "amber", "sky"]);
    expect(t.every((x) => x.linkedin === undefined)).toBe(true);
  });

  it("lists the Worth a check facts as unconfirmed", () => {
    expect(v0.profile.unconfirmed).toHaveLength(8);
    for (const key of v0.profile.unconfirmed) expect(v0.profile.facts[key]).toBeDefined();
  });

  it("lays out the homepage in 07's order, with the live nav labels", () => {
    const s = v0.layout.sections;
    expect(s.map((x) => x.id)).toEqual([
      "hero",
      "proof",
      "shipped",
      "strategy",
      "writing",
      "about",
      "experience",
      "skills",
      "testimonials",
      "offduty",
      "contact",
      "footer",
    ]);
    expect(s.filter((x) => x.nav).map((x) => x.nav?.label)).toEqual([
      "Work",
      "About",
      "Exp",
      "Skills",
      "Testimonial",
    ]);
    expect(s.find((x) => x.id === "shipped")?.visible).toBe(false);
    expect(
      s
        .find((x) => x.id === "proof")
        ?.items.filter((i) => !i.visible)
        .map((i) => i.id),
    ).toEqual(["p-arr", "p-impressions"]);
    expect(s.find((x) => x.id === "strategy")?.header).toEqual({
      kicker: "Projects",
      title: "Decisions,",
      titleMuted: "not features",
    });
    expect(s.find((x) => x.id === "contact")?.contact).toEqual({
      closing: "Let's build something",
      closingAccent: "impactful",
    });
  });

  it("publishes the five live projects and keeps the four SugarFit drafts private", () => {
    expect(v0.projects.filter((p) => p.publish).map((p) => p.slug)).toEqual(Object.keys(V0_COVERS));
    const drafts = v0.projects.filter((p) => !p.publish);
    expect(drafts.map((p) => p.document.overview.company)).toEqual(Array(4).fill("SugarFit"));
    expect(new Set(drafts.map((p) => p.document.visuals.accent)).size).toBe(4);
  });

  it("uses prototypes only when deployed, and flags the rest as needing a link", () => {
    expect(project("arcana-workspace").visuals.hero.type).toBe("prototype");
    expect(project("arcana-workspace").todo).toBeUndefined();
    expect(project("glp-1-digital-scaffold").todo).toBeUndefined();
    expect(project("puja-engagement-platform").todo).toEqual(["prototype-link"]);

    const deployed = buildV0Documents(content, {
      prototypes: { "puja-engagement-platform": "https://example.vercel.app/sri-mandir/" },
    });
    const puja = deployed.projects.find((p) => p.slug === "puja-engagement-platform")?.document;
    expect(puja?.visuals.hero).toEqual({
      type: "prototype",
      url: "https://example.vercel.app/sri-mandir/",
      frame: "phone",
      start: "click",
    });
    expect(puja?.todo).toBeUndefined();
  });

  it("splits headlines as 07 · Outcomes says", () => {
    expect(splitHeadline("+30% monthly orders")).toEqual({ value: "+30%", label: "monthly orders" });
    expect(splitHeadline("+2.5 kg lost by protocol followers")).toEqual({
      value: "+2.5 kg",
      label: "lost by protocol followers",
    });
    const glp = project("glp-1-digital-scaffold");
    expect(glp.outcomes.find((o) => o.id === glp.headlineOutcomeId)?.value).toBe("+2.5 kg");
  });

  it("turns exactly the two RICE groups into tables, keeping the flagged 5.7 as written", () => {
    const tables = v0.projects.flatMap((p) =>
      p.document.story.flatMap((c) => c.blocks.filter((b) => b.type === "table")),
    );
    expect(tables).toHaveLength(2);
    const puja = tables[0];
    if (puja?.type !== "table") throw new Error("expected a table");
    expect(puja.columns).toEqual(["#", "Feature", "Reach", "Impact", "Conf.", "Effort", "RICE"]);
    expect(puja.rows.find((r) => r[1] === "Subscription Packages")?.[6]).toBe("5.7");
    expect(puja.reviewed).toEqual([]);
  });

  it("keeps Arcana's 143-character summary for Studio to flag (Q6)", () => {
    expect(project("arcana-workspace").overview.summary).toHaveLength(143);
  });
});

// -----------------------------------------------------------------------------------------------
// Nothing invented: every piece of text traces back to the live site, except what 07 names.
// -----------------------------------------------------------------------------------------------

const STRUCTURAL_KEYS = new Set([
  "id",
  "kind",
  "type",
  "accent",
  "tone",
  "art",
  "style",
  "size",
  "mediaId",
  "frame",
  "start",
  "letsTalk",
  "source",
  "href",
  "formula",
  "slug",
  "file",
  "todo",
  "headlineOutcomeId",
  "url",
  "prdUrl",
  "linkedin",
  "email",
]);

/** Labels 07 takes from the boards, the résumé or the build rules rather than the live site. */
const ALLOWED_FROM_07 = new Set([
  "Akarshan Kumar", // the hero name written normally (07 · Profile)
  "Shipped",
  "Strategy & prototypes",
  "Latest posts",
  "Writing",
  "Entry:",
  "Exit:",
  "Conf.",
  "3D body scan for GLP-1 users",
  "Image-based food logging",
  "The CGM journey, end to end",
  "The GLP-1 app, 0→1",
  "SugarFit",
  ...Object.values(V0_COVERS),
]);

function textLeaves(value: unknown, key = "", out: string[] = []): string[] {
  if (STRUCTURAL_KEYS.has(key) || key === "facts" || key === "unconfirmed" || key === "floaters") return out;
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) textLeaves(v, key, out);
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) textLeaves(v, k, out);
  return out;
}

describe("V0 documents invent nothing", () => {
  const corpus = [
    normaliseSource(readFileSync("tests/fixtures/legacy-app.tsx.txt", "utf8")),
    strings(content).join(" "),
  ]
    .join("\n")
    .toLowerCase();

  it("every piece of text is on the live site or named in 07", () => {
    const pieces = textLeaves(v0)
      .flatMap((s) => s.replace(/<[^>]+>/g, "\n").split(/\n| · /))
      .map((s) => s.trim())
      .filter((s) => s !== "" && !ALLOWED_FROM_07.has(s));
    const missing = [...new Set(pieces)].filter((s) => !corpus.includes(s.toLowerCase()));
    expect(missing).toEqual([]);
  });
});

describe("V0 mappings fail loudly instead of inventing", () => {
  const cases = content.CASES as unknown as { id: number; tags: string[] }[];

  it("throws on a live project 07 doesn't map", () => {
    const changed = { ...content, CASES: [...cases, { ...cases[0], id: 99 }] } as unknown as typeof content;
    expect(() => buildV0Documents(changed)).toThrow(/live project 99/);
  });

  it("throws on a topic 07 doesn't map", () => {
    const changed = {
      ...content,
      CASES: [{ ...cases[0], tags: ["unmapped"] }, ...cases.slice(1)],
    } as unknown as typeof content;
    expect(() => buildV0Documents(changed)).toThrow(/topic "unmapped"/);
  });
});
