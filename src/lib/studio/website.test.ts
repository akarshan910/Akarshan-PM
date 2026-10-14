import { describe, expect, it } from "vitest";

import { publishProfile } from "../published";
import { must, testRepo } from "./test-helpers";
import {
  addTextSection,
  canNav,
  FLOATERS,
  isDraftItem,
  itemName,
  LATEST,
  MOTION,
  movedIds,
  moveKid,
  moveSection,
  moveToShelf,
  navDefault,
  navLinks,
  outlineKids,
  patchSection,
  pinned,
  placeKid,
  placeSection,
  removeSection,
  RSS,
  sectionCount,
  sectionName,
  sectionNote,
  setKidVisible,
  setNav,
  setSectionVisible,
  siteChanges,
  type Ctx,
} from "./website";

async function seed() {
  const { repo } = testRepo();
  const [p, l, rows] = await Promise.all([repo.profile.get(), repo.layout.get(), repo.projects.list()]);
  const ctx: Ctx = { profile: p.draft, projects: new Map(rows.map((r) => [r.id, r])), postCount: 0 };
  return { layout: l.draft, live: must(l.published), ctx, profile: p };
}
const sec = (l: Awaited<ReturnType<typeof seed>>["layout"], id: string) =>
  must(l.sections.find((s) => s.id === id));
const noImg = () => undefined;

describe("website model", () => {
  it("names sections and items, and knows what's pinned or in the nav", async () => {
    const { layout, ctx } = await seed();
    expect(layout.sections.map(sectionName)).toEqual([
      "Hero",
      "Proof strip",
      "Shipped",
      "Strategy & prototypes",
      "Writing",
      "About",
      "Experience",
      "Skills",
      "Testimonials",
      "Off duty",
      "Contact",
      "Footer",
    ]);
    expect(sectionName({ id: "t", kind: "text", visible: true, items: [] })).toBe("Text section");
    expect(sectionName({ id: "s", kind: "shelf", visible: true, items: [], header: { title: "X" } })).toBe(
      "X",
    );
    expect(sectionName({ id: "s", kind: "shelf", visible: true, items: [] })).toBe("Shelf");
    expect(layout.sections.filter(pinned).map((s) => s.id)).toEqual(["hero", "footer"]);
    expect(layout.sections.filter((s) => !canNav(s)).map((s) => s.id)).toEqual(["hero", "proof", "footer"]);
    expect(itemName(sec(layout, "proof"), "p-users", ctx)).toBe("300M+ Users Served");
    expect(itemName(sec(layout, "proof"), "spaces", ctx)).toBe(ctx.profile.spaces?.label || "Problem spaces");
    expect(itemName(sec(layout, "proof"), "nope", ctx)).toBe("nope");
    expect(itemName(sec(layout, "experience"), "e-glance", ctx)).toBe("Glance (InMobi Group)");
    expect(itemName(sec(layout, "skills"), "g-data", ctx)).toBe("Data");
    expect(itemName(sec(layout, "offduty"), "o-anime", ctx)).toBe("Anime");
    expect(itemName(sec(layout, "contact"), "github", ctx)).toBe("GitHub");
    expect(itemName(sec(layout, "strategy"), "arcana-workspace", ctx)).toBe("Arcana Workspace");
    expect(itemName(sec(layout, "strategy"), "gone", ctx)).toBe("Untitled project");
    expect(itemName(sec(layout, "experience"), "gone", ctx)).toBe("New role");
    expect(itemName(sec(layout, "skills"), "gone", ctx)).toBe("Skill group");
    expect(itemName(sec(layout, "testimonials"), "gone", ctx)).toBe("Testimonial");
    expect(itemName(sec(layout, "offduty"), "gone", ctx)).toBe("Off duty item");
    expect(itemName(sec(layout, "writing"), "x", ctx)).toBe("x");
  });

  it("builds the outline's items, counts and notes", async () => {
    const { layout, ctx } = await seed();
    const hero = outlineKids(sec(layout, "hero"), ctx);
    expect(hero.map((k) => k.name).slice(-2)).toEqual(["Speed lines + tilt", "Floating previews"]);
    expect(hero.find((k) => k.id === FLOATERS)?.visible).toBeNull();
    expect(hero.find((k) => k.id === MOTION)?.visible).toBe(true);
    const writing = outlineKids(sec(layout, "writing"), ctx);
    expect(writing.map((k) => [k.id, k.visible])).toEqual([
      [LATEST, null],
      [RSS, true],
    ]);
    const shipped = outlineKids(sec(layout, "shipped"), ctx);
    expect(shipped.every((k) => k.draft && k.chip === "Draft" && k.visible === false)).toBe(true);
    expect(isDraftItem(sec(layout, "strategy"), "arcana-workspace", ctx)).toBe(false);
    expect(isDraftItem(sec(layout, "about"), "text", ctx)).toBe(false);
    expect(outlineKids(sec(layout, "testimonials"), ctx)[0]?.chip).toBe("Homepage");
    expect(sectionCount(sec(layout, "proof"), ctx)).toBe("5/7");
    expect(sectionCount(sec(layout, "shipped"), ctx)).toBe("0/4");
    expect(sectionCount(sec(layout, "writing"), ctx)).toBe("");
    expect(sectionNote(sec(layout, "writing"), ctx)).toBe("No posts yet");
    expect(sectionNote(sec(layout, "writing"), { ...ctx, postCount: 1 })).toBeNull();
    expect(sectionNote(sec(layout, "shipped"), ctx)).toBe("Nothing live yet");
    expect(sectionNote(sec(layout, "strategy"), ctx)).toBeNull();
  });

  it("moves sections inside the pinned ends, and items within a section", async () => {
    const { layout } = await seed();
    expect(moveSection(layout, "hero", 1)).toBeNull();
    expect(moveSection(layout, "proof", -1)).toBeNull();
    expect(moveSection(layout, "contact", 1)).toBeNull();
    expect(moveSection(layout, "nope", 1)).toBeNull();
    const up = must(moveSection(layout, "testimonials", -1));
    expect(up.sections.map((s) => s.id).indexOf("testimonials")).toBe(7);
    expect(placeSection(layout, "skills", 0).sections[1]?.id).toBe("skills");
    expect(placeSection(layout, "skills", 99).sections.at(-2)?.id).toBe("skills");
    expect(placeSection(layout, "hero", 3)).toBe(layout);
    const k = must(moveKid(layout, "strategy", "arcana-workspace", -1));
    expect(
      sec(k, "strategy")
        .items.map((i) => i.id)
        .slice(0, 3),
    ).toEqual(["puja-engagement-platform", "arcana-workspace", "word-games-monetisation-strategy"]);
    expect(moveKid(layout, "strategy", "puja-engagement-platform", -1)).toBeNull();
    expect(moveKid(layout, "nope", "x", 1)).toBeNull();
    expect(sec(placeKid(layout, "strategy", "revenue-growth-strategy", 0), "strategy").items[0]?.id).toBe(
      "revenue-growth-strategy",
    );
    expect(placeKid(layout, "strategy", "nope", 0)).toEqual(layout);
    const moved = moveToShelf(layout, "strategy", "shipped", "arcana-workspace");
    expect(sec(moved, "shipped").items.at(-1)).toEqual({ id: "arcana-workspace", visible: true });
    expect(sec(moved, "strategy").items.some((i) => i.id === "arcana-workspace")).toBe(false);
    expect(moveToShelf(layout, "strategy", "shipped", "nope")).toBe(layout);
  });

  it("switches eyes, nav links and sections", async () => {
    const { layout } = await seed();
    expect(sec(setSectionVisible(layout, "hero", false), "hero").visible).toBe(true);
    expect(sec(setSectionVisible(layout, "offduty", false), "offduty").visible).toBe(false);
    expect(sec(setKidVisible(layout, "hero", MOTION, false), "hero").hero?.motion).toBe(false);
    expect(sec(setKidVisible(layout, "writing", RSS, false), "writing").writing?.rss).toBe(false);
    expect(
      sec(setKidVisible(layout, "contact", "github", false), "contact").items.find((i) => i.id === "github")
        ?.visible,
    ).toBe(false);
    expect(sec(setNav(layout, "skills", null), "skills").nav).toBeUndefined();
    expect(sec(setNav(layout, "offduty", "Hobbies"), "offduty").nav).toEqual({ label: "Hobbies" });
    expect(navDefault(sec(layout, "strategy"))).toBe("Strategy & pro");
    expect(navLinks(layout).map((n) => n.label)).toEqual(["Work", "About", "Exp", "Skills", "Testimonial"]);
    const added = addTextSection(layout);
    expect(added.name).toBe("Text section 1");
    expect(added.layout.sections.at(-3)?.id).toBe("text-1");
    const again = addTextSection(added.layout);
    expect(again.id).toBe("text-2");
    expect(removeSection(again.layout, "text-1").sections.some((s) => s.id === "text-1")).toBe(false);
    expect(removeSection(layout, "hero").sections[0]?.id).toBe("hero");
    const noContact = { ...layout, sections: layout.sections.filter((s) => s.kind !== "contact") };
    expect(addTextSection(noContact).layout.sections.at(-2)?.id).toBe("text-1");
    expect(patchSection(layout, "nope", (s) => s)).toEqual(layout);
  });

  it("finds what moved, as the board does", () => {
    expect(movedIds(["a", "c", "b", "d"], ["a", "b", "c", "d"])).toEqual(["b"]);
    expect(movedIds(["d", "a", "b", "c"], ["a", "b", "c", "d"])).toEqual(["d"]);
    expect(movedIds([], ["a"])).toEqual([]);
  });

  it("lists the changes in the board's words", async () => {
    const { layout, live, ctx, profile } = await seed();
    expect(siteChanges(layout, live, ctx)).toEqual([]);
    expect(siteChanges(layout, null, ctx)).toEqual(["First publish of the homepage"]);
    let d = must(moveSection(layout, "testimonials", -1));
    d = must(moveSection(d, "testimonials", -1));
    d = must(moveSection(d, "testimonials", -1));
    d = setSectionVisible(d, "offduty", false);
    d = setNav(d, "experience", "Experience");
    d = setNav(d, "offduty", "Hobbies");
    d = setNav(d, "skills", null);
    d = setKidVisible(d, "contact", "github", false);
    d = must(moveKid(d, "strategy", "arcana-workspace", -1));
    d = moveToShelf(d, "strategy", "shipped", "revenue-growth-strategy");
    d = patchSection(d, "strategy", (s) => ({
      ...s,
      shelf: { name: "Strategy", rows: 1 },
      header: { ...s.header, title: "New", kicker: "K", intro: "Hi" },
    }));
    d = patchSection(d, "writing", (s) => ({ ...s, writing: { latest: 2, rss: false } }));
    d = patchSection(d, "contact", (s) => ({ ...s, contact: { closing: "Hello" } }));
    d = patchSection(d, "hero", (s) => ({
      ...s,
      hero: {
        motion: false,
        floaters: { items: ["arcana-workspace", "3d-body-scan-for-glp-1-users"], atOnce: 2 },
      },
    }));
    const added = addTextSection(d);
    d = added.layout;
    const liveText = {
      ...live,
      sections: [
        ...live.sections.slice(0, -1),
        {
          id: "text-9",
          kind: "text" as const,
          visible: true,
          items: [],
          header: { title: "Old" },
          text: { body: "<p>a</p>" },
        },
        ...live.sections.slice(-1),
      ],
    };
    const changes = siteChanges(
      {
        ...d,
        sections: [
          ...d.sections.slice(0, -1),
          {
            id: "text-9",
            kind: "text",
            visible: true,
            items: [],
            header: { title: "Old" },
            text: { body: "<p>b</p>" },
          },
          ...d.sections.slice(-1),
        ],
      },
      liveText,
      ctx,
    );
    expect(changes).toEqual(
      expect.arrayContaining([
        "Added Text section 1",
        "Moved Testimonials above About",
        "Hid Off duty",
        "Navigation: renamed Exp to Experience",
        "Navigation: added Off duty",
        "Navigation: removed Skills",
        "Contact: hid GitHub",
        // A swap reads either way; the board marks the later one as moved.
        "Strategy: moved Word games monetisation strategy above GLP-1 digital scaffold",
        "Moved Revenue growth strategy to Shipped",
        "Strategy: 1 row on the homepage",
        "Renamed Strategy & prototypes to Strategy",
        "Edited Strategy title",
        "Edited Strategy label",
        "Edited Strategy intro",
        "Writing: latest 2 posts",
        "Writing: hid RSS link",
        "Edited closing line",
        "Hero: hid speed lines + tilt",
        "Floating previews: added 3D body scan for GLP-1 users",
        "Floating previews: removed Puja engagement platform",
        "Floating previews: 2 at once",
        "Edited Old",
      ]),
    );
    expect(siteChanges(removeSection(added.layout, "offduty"), live, ctx)).toContain("Removed Off duty");
    expect(siteChanges(setSectionVisible(layout, "shipped", true), live, ctx)).toEqual(["Showed Shipped"]);
    expect(
      siteChanges(
        patchSection(layout, "proof", (s) => ({ ...s, items: [...s.items, { id: "p-new", visible: true }] })),
        live,
        ctx,
      ),
    ).toEqual(["Proof strip: added p-new"]);

    // Profile edits that a site publish sends live.
    const liveProfile = must(profile.published);
    const same = siteChanges(layout, live, ctx, {
      draft: publishProfile(profile.draft, noImg),
      live: liveProfile,
    });
    expect(same).toEqual([]);
    const edited = publishProfile(
      {
        ...profile.draft,
        positioning: "New line",
        availability: "Open",
        intro: "Intro",
        about: { ...profile.draft.about, body: ["New"] },
      },
      noImg,
    );
    expect(siteChanges(layout, live, ctx, { draft: edited, live: liveProfile })).toEqual([
      "Edited hero availability",
      "Edited hero positioning line",
      "Edited hero intro",
      "Edited About text",
    ]);
    const other = publishProfile({ ...profile.draft, name: "Someone" }, noImg);
    expect(siteChanges(layout, live, ctx, { draft: other, live: liveProfile })).toEqual([
      "Edited Profile & facts",
    ]);
  });
});
