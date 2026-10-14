import { describe, expect, it } from "vitest";

import { defaultLayout, emptyProfile, newPost, newProject } from "~/lib/defaults";
import { MAX_TOPICS, Post, Profile, Project, SiteLayout } from "~/lib/schemas";

const issues = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : (result.error?.issues.map((i) => i.message) ?? []);

describe("SiteLayout rules", () => {
  it("keeps the hero first and visible, the footer last, and ids unique", () => {
    const layout = defaultLayout();
    const [hero, ...rest] = layout.sections;
    if (!hero) throw new Error("no hero");

    expect(issues(SiteLayout.safeParse({ ...layout, sections: [...rest, hero] }))).toEqual(
      expect.arrayContaining(["The hero is always first.", "The footer is always last."]),
    );
    expect(
      issues(SiteLayout.safeParse({ ...layout, sections: [{ ...hero, visible: false }, ...rest] })),
    ).toContain("The hero always shows.");
    const dup = { ...layout, sections: [hero, { ...hero, kind: "proof" as const }, ...rest] };
    expect(issues(SiteLayout.safeParse(dup))).toContain('Duplicate section id "hero".');
  });

  it("limits nav labels to 14 characters", () => {
    const layout = defaultLayout();
    const about = layout.sections[5];
    if (!about) throw new Error("no about");
    layout.sections[5] = { ...about, nav: { label: "A label too long" } };
    expect(SiteLayout.safeParse(layout).success).toBe(false);
  });
});

describe("documented limits (06, D39)", () => {
  it("rejects a project title over 80 characters but accepts 61–80", () => {
    const p = newProject();
    expect(Project.safeParse({ ...p, overview: { ...p.overview, title: "x".repeat(80) } }).success).toBe(
      true,
    );
    expect(Project.safeParse({ ...p, overview: { ...p.overview, title: "x".repeat(81) } }).success).toBe(
      false,
    );
  });

  it("rejects a positioning line over 220 characters", () => {
    const p = emptyProfile();
    expect(Profile.safeParse({ ...p, positioning: "x".repeat(220) }).success).toBe(true);
    expect(Profile.safeParse({ ...p, positioning: "x".repeat(221) }).success).toBe(false);
  });

  it("caps topics at 8 on posts and projects", () => {
    const topics = Array.from({ length: MAX_TOPICS + 1 }, (_, i) => `t${i}`);
    expect(Post.safeParse({ ...newPost(), topics }).success).toBe(false);
    const p = newProject();
    expect(Project.safeParse({ ...p, overview: { ...p.overview, topics } }).success).toBe(false);
  });

  it("accepts only https links, or empty in a draft", () => {
    const p = newProject();
    const withHero = (url: string) => ({
      ...p,
      visuals: { ...p.visuals, hero: { type: "video" as const, url } },
    });
    expect(Project.safeParse(withHero("")).success).toBe(true);
    expect(Project.safeParse(withHero("https://www.youtube.com/watch?v=x")).success).toBe(true);
    expect(Project.safeParse(withHero("http://example.com")).success).toBe(false);
    expect(Project.safeParse(withHero("javascript:alert(1)")).success).toBe(false);
    expect(Project.safeParse({ ...p, overview: { ...p.overview, prdUrl: "http://x.com" } }).success).toBe(
      false,
    );
  });
});
