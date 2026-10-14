import { describe, expect, it } from "vitest";

import {
  caseStudyFacts,
  caseStudyView,
  chapterAnchor,
  chapterNumber,
  companyLine,
  countWord,
  currentChapter,
  metricsOutcomes,
  readingProgress,
  tableRows,
  type TableBlock,
} from "~/lib/case-study";
import type { PublicContent } from "~/lib/content-source";
import { loadLocalV0 } from "~/lib/sources/local-v0";

const content = loadLocalV0(new Date("2026-10-13T18:00:00Z"));

describe("caseStudyView", () => {
  it("finds a listed project by slug, with its volume and neighbours", () => {
    const view = caseStudyView(content, "arcana-workspace");
    expect(view?.volume).toBe("03");
    expect(view?.accent).toBe("#94A3B8");
    expect(view?.ground).toBe("#121826");
    expect(view?.prev).toMatchObject({ slug: "word-games-monetisation-strategy", volume: "02" });
    expect(view?.next).toMatchObject({ slug: "glp-1-digital-scaffold", volume: "04", accent: "#4ADE80" });
    expect(view?.volumes).toBe(5);
    expect(view?.name).toBe("Akarshan Kumar");
  });

  it("hides prev at the start and next at the end", () => {
    expect(caseStudyView(content, "puja-engagement-platform")?.prev).toBeUndefined();
    expect(caseStudyView(content, "revenue-growth-strategy")?.next).toBeUndefined();
  });

  it("returns null for unknown slugs and unlisted projects", () => {
    expect(caseStudyView(content, "nope")).toBeNull();
    const unlisted: PublicContent = {
      ...content,
      projects: content.projects.map((p) => (p.slug === "arcana-workspace" ? { ...p, listed: false } : p)),
    };
    expect(caseStudyView(unlisted, "arcana-workspace")).toBeNull();
  });

  it("gives a listed project on no visible shelf no volume and no neighbours", () => {
    const first = content.projects[0];
    if (!first) throw new Error("no projects");
    const extra: PublicContent = {
      ...content,
      projects: [...content.projects, { ...first, id: "x", slug: "x" }],
    };
    const view = caseStudyView(extra, "x");
    expect(view?.volume).toBeUndefined();
    expect(view?.prev).toBeUndefined();
    expect(view?.next).toBeUndefined();
  });

  it("returns the published shape only", () => {
    const json = JSON.stringify(caseStudyView(content, "puja-engagement-platform"));
    for (const key of ['"evidence"', '"todo"', '"prompts"', '"reviewed"', '"settings"', '"hidden"']) {
      expect(json).not.toContain(key);
    }
  });
});

describe("facts and lines", () => {
  const overview = content.projects[2]?.project.overview;
  if (!overview) throw new Error("no Arcana");

  it("shows Type as the kind label, Focus as topics, and Read the PRD", () => {
    expect(caseStudyFacts(overview)).toEqual([
      { label: "Company", value: "Arcana · Workspace" },
      { label: "Type", value: "Prototype" },
      { label: "Focus", value: "0→1 · B2B · Prototyping · Workflows · Fintech" },
      { label: "PRD", value: "Read the PRD", href: overview.prdUrl },
    ]);
  });

  it("hides each empty fact on its own and shows the filled ones", () => {
    const full = { ...overview, role: "Lead PM", timeline: "6 weeks", team: "3 engineers", topics: [] };
    const { prdUrl: _prd, ...noPrd } = full;
    expect(caseStudyFacts(noPrd).map((f) => f.label)).toEqual([
      "Company",
      "Type",
      "My role",
      "Timeline",
      "Team",
    ]);
    expect(caseStudyFacts({ ...noPrd, company: "" }).map((f) => f.label)[0]).toBe("Type");
  });

  it("joins company and sector, or shows the company alone", () => {
    expect(companyLine({ ...overview, sector: "Fintech workspace" })).toBe(
      "Arcana · Workspace · Fintech workspace",
    );
    expect(companyLine(overview)).toBe("Arcana · Workspace");
    expect(companyLine({ ...overview, company: "" })).toBe("");
  });

  it("numbers chapters from position", () => {
    expect(chapterNumber(0)).toBe("01");
    expect(chapterNumber(11)).toBe("12");
    expect(chapterAnchor(3)).toBe("ch-04");
  });
});

describe("metrics", () => {
  const outcomes = content.projects[0]?.project.outcomes ?? [];

  it("shows the outcomes marked inStrip by default", () => {
    expect(metricsOutcomes({}, outcomes).map((o) => o.value)).toEqual(["30%", "12%", "5"]);
    expect(metricsOutcomes({ outcomeIds: [] }, outcomes)).toHaveLength(3);
  });

  it("shows only the named outcomes, in the block's order", () => {
    expect(metricsOutcomes({ outcomeIds: ["o4", "missing", "o1"] }, outcomes).map((o) => o.value)).toEqual([
      "+30%",
      "30%",
    ]);
  });
});

describe("tables", () => {
  const rice: TableBlock = {
    id: "t",
    type: "table",
    formula: "rice",
    columns: ["#", "Feature", "Reach", "Impact", "Conf.", "Effort", "RICE"],
    rows: [
      ["1", "WhatsApp integration", "9", "2.5", "85%", "2 mo", "9.6"],
      ["2", "Product education", "7", "2", "65%", "1 mo", "9.1"],
      ["3", "Recommendations", "9", "2.7", "90%", "3 mo", "7.3"],
      ["4", "Video feed", "9", "2.5", "95%", "3 mo", "11.1"],
    ],
    checkFormula: true,
    sortByScore: false,
    highlightTop: 3,
    phoneCards: true,
  };

  it("keeps the entered order, highlights the top three and writes the phone inputs line", () => {
    const rows = tableRows(rice);
    expect(rows.map((r) => r.top)).toEqual([true, true, true, false]);
    expect(rows[0]?.rice).toEqual({
      rank: "1",
      item: "WhatsApp integration",
      score: "9.6",
      inputs: "R 9 · I 2.5 · C 85% · E 2 mo",
    });
  });

  it("sorts by score when asked, and plain tables carry no RICE parts", () => {
    expect(tableRows({ ...rice, sortByScore: true }).map((r) => r.rice?.score)).toEqual([
      "11.1",
      "9.6",
      "9.1",
      "7.3",
    ]);
    const { formula: _formula, ...noFormula } = rice;
    const plain = tableRows({ ...noFormula, highlightTop: 0, rows: [["a"], []] });
    expect(plain.map((r) => [r.top, r.rice])).toEqual([
      [false, undefined],
      [false, undefined],
    ]);
  });

  it("puts rows without a number last when sorting", () => {
    const rows = tableRows({
      ...rice,
      sortByScore: true,
      rows: [
        ["1", "a", "", "", "", "", "—"],
        ["2", "b", "", "", "", "", "2"],
      ],
    });
    expect(rows.map((r) => r.rice?.item)).toEqual(["b", "a"]);
  });

  it("writes counts as words for Show all nine", () => {
    expect(countWord(9)).toBe("nine");
    expect(countWord(30)).toBe("30");
  });
});

describe("scroll", () => {
  it("picks the last chapter whose top has passed the line, else the first", () => {
    const tops = [
      { id: "a", top: 400 },
      { id: "b", top: 900 },
    ];
    expect(currentChapter(tops, 270)).toBe("a");
    expect(
      currentChapter(
        [
          { id: "a", top: -100 },
          { id: "b", top: 200 },
        ],
        270,
      ),
    ).toBe("b");
    expect(currentChapter([], 270)).toBeNull();
  });

  it("measures reading progress through the article", () => {
    expect(readingProgress(100, 3000, 900)).toBe(0);
    expect(readingProgress(-1050, 3000, 900)).toBe(0.5);
    expect(readingProgress(-5000, 3000, 900)).toBe(1);
    expect(readingProgress(-10, 500, 900)).toBe(1);
    expect(readingProgress(10, 500, 900)).toBe(0);
  });
});
