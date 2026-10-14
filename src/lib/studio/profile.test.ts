import { describe, expect, it } from "vitest";

import { factValue } from "./facts";
import {
  aboutToRich,
  factNote,
  initialsOf,
  moveItem,
  openCount,
  openFacts,
  ordered,
  pickFact,
  placeholderItems,
  plainLength,
  prependItem,
  profileChecks,
  proofText,
  removeItem,
  removeLayoutItem,
  richToAbout,
  sectionItems,
  setItemVisible,
  shift,
  sinceLabel,
  titleOptions,
} from "./profile";
import { must, testRepo } from "./test-helpers";

async function seed() {
  const { repo } = testRepo();
  const [p, l] = await Promise.all([repo.profile.get(), repo.layout.get()]);
  return { profile: p.draft, layout: l.draft };
}

describe("profile helpers", () => {
  it("offers the two job titles, résumé first, and swaps on a pick", async () => {
    const { profile } = await seed();
    const opts = must(titleOptions(profile));
    expect(opts.map((o) => [o.value, o.source, o.which])).toEqual([
      ["Product Manager", "resume", "alternative"],
      ["Senior Product Manager", "current-site", "live"],
    ]);
    expect(opts[0]?.label).toBe("As on your résumé (SugarFit, since May 2025)");
    expect(opts[1]?.label).toBe("As on your current site");

    const picked = pickFact(profile, "title", "alternative");
    expect(picked.title).toBe("Product Manager");
    expect(picked.unconfirmed).not.toContain("title");
    expect(picked.facts.title).toEqual({
      source: "resume",
      alternative: { value: "Senior Product Manager", source: "current-site" },
    });
    // The other card is still there, so the choice can change.
    const back = pickFact(picked, "title", "alternative");
    expect(back.title).toBe("Senior Product Manager");
    expect(must(titleOptions(back))[0]?.which).toBe("alternative");

    const kept = pickFact(profile, "title", "live");
    expect(kept.title).toBe("Senior Product Manager");
    expect(kept.unconfirmed).not.toContain("title");
    expect(titleOptions({ ...profile, facts: {} })).toBeNull();
    const noRoles = must(titleOptions({ ...profile, experience: [] }));
    expect(noRoles[0]?.label).toBe("As on your résumé");
  });

  it("lists every open fact with its live value and the résumé's", async () => {
    const { profile } = await seed();
    const facts = openFacts(profile);
    expect(facts.map((f) => f.where)).toEqual([
      "title",
      "availability",
      "proof",
      "proof",
      "proof",
      "experience",
      "experience",
      "experience",
    ]);
    const users = must(facts.find((f) => f.key === "proof.p-users.value"));
    expect(users).toMatchObject({ live: "300M+", alternative: "230M+ lockscreen users", itemId: "p-users" });
    expect(factNote(users)).toBe(
      "Your current site says “300M+”. Your résumé says “230M+ lockscreen users”.",
    );
    const revenue = must(facts.find((f) => f.key === "proof.p-revenue.value"));
    expect(revenue.alternative).toBeUndefined();
    expect(factNote(revenue)).toMatch(/^On your current site, but not in your résumé/);
    const bullet = must(facts.find((f) => f.key.endsWith("i4.text")));
    expect(bullet).toMatchObject({ experienceId: "e-sugarfit", itemId: "i4" });
    expect(factNote({ ...bullet, live: "<strong>A</strong> &amp; B" })).toContain("“A & B”");
    expect(must(facts.find((f) => f.key === "availability")).live).toBe(
      "Open to work · Seeking Senior / Lead PM Roles",
    );
    expect(
      openFacts({ ...profile, availability: undefined }).find((f) => f.key === "availability")?.live,
    ).toBe("");
    expect(openFacts({ ...profile, unconfirmed: ["proof.p-gone.value"] }).map((f) => f.live)).toEqual([""]);
  });

  it("finds and removes the placeholder, and counts what's open", async () => {
    const { profile } = await seed();
    const ph = placeholderItems(profile);
    expect(ph).toEqual([expect.objectContaining({ experienceId: "e-wipro", itemId: "i2" })]);
    expect(openCount(profile)).toBe(9);
    const fixed = removeItem(profile, "e-wipro", "i2");
    expect(placeholderItems(fixed)).toEqual([]);
    expect(fixed.experience.find((e) => e.id === "e-wipro")?.highlights[0]?.items.map((i) => i.id)).toEqual([
      "i1",
      "i3",
    ]);
    expect(openCount(fixed)).toBe(8);
  });

  it("writes the checklist with the D5 summary", async () => {
    const { profile } = await seed();
    const open = profileChecks(profile);
    expect(open.summary).toBe("9 to confirm. The live value stays until you pick one.");
    expect(open.checks.map((c) => c.text)).toEqual([
      "Job title: résumé and site disagree",
      "300M+ or the résumé figure?",
      "30Cr+: still true?",
      "$1.4M or the résumé figure?",
      expect.stringMatching(/^Experience: “Launched & scaled GLP-1 app to 50L MRR with 35%…”$/),
      expect.stringMatching(/^Experience: “Improved NPS/),
      expect.stringMatching(/^Experience: “Scaled Active Foods/),
      "Experience shows a “$XXXK” placeholder",
      "Availability: still true?",
      "Phone number hidden on the site",
    ]);
    let done = removeItem(profile, "e-wipro", "i2");
    for (const k of profile.unconfirmed) done = pickFact(done, k, "live");
    const all = profileChecks({ ...done, contact: { ...done.contact, showPhone: true } });
    expect(all.summary).toBe("All confirmed. Ready to publish.");
    expect(all.checks.every((c) => c.ok)).toBe(true);
    expect(all.checks.map((c) => c.text)).toEqual(
      expect.arrayContaining([
        "Job title: Senior Product Manager",
        "300M+ confirmed",
        "No placeholders left",
        "Availability confirmed",
        "Phone number shown on the site",
      ]),
    );
    expect(profileChecks({ ...done, availability: undefined }).checks.map((c) => c.text)).toContain(
      "Availability hidden",
    );
  });

  it("turns About paragraphs into one rich field and back", () => {
    expect(aboutToRich(["A <strong>b</strong>", "C"])).toBe("<p>A <strong>b</strong></p><p>C</p>");
    expect(richToAbout("<p>A <strong>b</strong></p><p> </p><ul><li>C</li></ul>")).toEqual([
      "A <strong>b</strong>",
      "C",
    ]);
    expect(richToAbout("Loose text")).toEqual(["Loose text"]);
    expect(richToAbout("")).toEqual([]);
  });

  it("orders, switches and moves layout items", async () => {
    const { profile, layout } = await seed();
    const tst = ordered(layout, "testimonials", profile.testimonials);
    expect(tst.every((t) => t.visible)).toBe(true);
    const ids = tst.map((t) => t.id);
    const off = setItemVisible(layout, "testimonials", must(ids[0]), false);
    expect(sectionItems(off, "testimonials")[0]).toEqual({ id: ids[0], visible: false });
    const added = setItemVisible(layout, "testimonials", "t-new", true);
    expect(sectionItems(added, "testimonials").at(-1)).toEqual({ id: "t-new", visible: true });
    const moved = moveItem(off, "testimonials", ids, must(ids[0]), 1);
    expect(sectionItems(moved, "testimonials").slice(0, 2)).toEqual([
      { id: ids[1], visible: true },
      { id: ids[0], visible: false },
    ]);
    expect(moveItem(layout, "testimonials", ids, must(ids[0]), -1)).toBe(layout);
    expect(moveItem(layout, "testimonials", ids, "nope", 1)).toBe(layout);
    const top = prependItem(layout, "experience", "e-new");
    expect(sectionItems(top, "experience")[0]).toEqual({ id: "e-new", visible: true });
    expect(
      ordered(top, "experience", [...profile.experience, { ...must(profile.experience[0]), id: "e-new" }])[0]
        ?.id,
    ).toBe("e-new");
    expect(
      ordered(layout, "experience", [{ ...must(profile.experience[0]), id: "e-loose" }]).map((x) => x.id),
    ).toEqual(["e-loose"]);
    expect(sectionItems(removeLayoutItem(top, "experience", "e-new"), "experience")[0]?.id).toBe(
      "e-sugarfit",
    );
    expect(sectionItems({ ...layout, sections: [] }, "proof")).toEqual([]);
    // Proof items keep the layout's visibility (two are off in V0).
    expect(
      ordered(layout, "proof", profile.proof)
        .filter((x) => !x.visible)
        .map((x) => x.id),
    ).toEqual(["p-arr", "p-impressions"]);
  });

  it("formats the small things", async () => {
    const { profile } = await seed();
    expect(proofText(must(profile.proof[0]))).toBe("30Cr+");
    expect(proofText({ id: "x", value: "5", label: "l" })).toBe("5");
    expect(sinceLabel("May 2025 — Present")).toBe("since May 2025");
    expect(sinceLabel("2012 – 2017")).toBe("since 2012");
    expect(sinceLabel("")).toBe("");
    expect(plainLength("<strong>8 years</strong> &amp; more")).toBe(14);
    expect(initialsOf("Shreyasi  Ghosh")).toBe("SG");
    expect(initialsOf("Cher")).toBe("C");
    expect(shift([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(shift([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(factValue(profile, "title")).toBe("Senior Product Manager");
  });
});
