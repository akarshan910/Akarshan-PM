import { describe, expect, it } from "vitest";

import { Profile, Project, SiteLayout } from "~/lib/schemas";
import { buildHomeView, listedProjects } from "~/lib/site";
import { writingIndex } from "~/lib/writing";

import { boardDocuments, boardsFixture, loadBoardContent } from "../fixtures/board-content";

describe("the boards fixture (08 · Pixel parity)", () => {
  it("is made of documents that pass the schemas", () => {
    expect(Profile.safeParse(boardDocuments.profile).error?.issues).toBeUndefined();
    expect(SiteLayout.safeParse(boardDocuments.layout).error?.issues).toBeUndefined();
    for (const p of boardDocuments.projects) {
      expect(Project.safeParse(p.document).error?.issues, p.slug).toBeUndefined();
    }
  });

  it("numbers the nine board projects in shelf order", async () => {
    const content = await boardsFixture.load();
    expect(listedProjects(content).map((p) => [p.volume, p.project.overview.title])).toEqual([
      ["01", "3D body scan for GLP-1 users"],
      ["02", "Image-based food logging"],
      ["03", "The CGM journey, end to end"],
      ["04", "The GLP-1 app, 0→1"],
      ["05", "Puja engagement platform"],
      ["06", "Arcana Workspace"],
      ["07", "GLP-1 digital scaffold"],
      ["08", "Word games monetisation"],
      ["09", "FarmVille 3 revenue growth"],
    ]);
  });

  it("shows the Home board's sections, and Writing only on its own pages", () => {
    const content = loadBoardContent();
    const home = buildHomeView(content);
    expect(home.sections.map((s) => s.id)).toEqual([
      "hero",
      "proof",
      "shipped",
      "strategy",
      "about",
      "experience",
      "skills",
      "testimonials",
      "offduty",
      "contact",
      "footer",
    ]);
    expect(home.chrome.nav.map((n) => n.label)).toEqual(["Work", "About", "Exp", "Skills", "Testimonial"]);
    const writing = writingIndex(content);
    expect(writing?.posts.map((p) => [p.title, p.readingMinutes])).toEqual([
      ["[Your latest post title]", 7],
      ["[Post title 2]", 5],
      ["[Post title 3]", 5],
      ["[Post title 4]", 5],
      ["[Post title 5]", 5],
    ]);
    expect(writing?.intro).toBe("[One line on what you write about.]");
  });
});
