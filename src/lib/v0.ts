/**
 * Builds the V0 documents from the live site's content (07 · V0 content). Pure and deterministic:
 * the same input always gives the same documents. It feeds local development (`local-v0`) and the
 * seed (`npm run seed:v0`), so the two can't drift.
 *
 * Nothing here is invented. Text comes from `src/legacy/content.ts`, transformed only as 07
 * allows (title casing, splitting a string, joining two). The few labels 07 takes from the boards
 * or the résumé are named where they're used, and the trace test lists them.
 */
import type * as Legacy from "../legacy/content";
import { firstFreeAccent, newProject } from "./defaults";
import type {
  Accent,
  Block,
  Chapter,
  Outcome,
  Profile,
  Project,
  ResultType,
  Section,
  SiteLayout,
} from "./types";

type LegacyContent = typeof Legacy;

// ---------------------------------------------------------------------------------------------
// The live data's shapes, as far as the builder reads them.
// ---------------------------------------------------------------------------------------------

interface LegacyMetric {
  metric: string;
  definition: string;
  why?: string;
}
interface LegacySection {
  num: string;
  title: string;
  body?: string | null;
  items?: string[] | null;
  subsections?: { title: string; items: string[] }[] | null;
  widgets?: { name: string; rationale: string }[] | null;
  journeys?: { name: string; entry: string; steps: string[]; exit: string }[] | null;
  metricGroups?: { name: string; subtitle?: string; metrics: LegacyMetric[] }[] | null;
}
interface LegacyCase {
  id: number;
  co: string;
  title: string;
  desc: string;
  impact: string;
  tags: string[];
  kpis: { v: string; l: string }[];
  prdLink?: string;
  prototypeUrl?: string;
  content: { prototypeLink?: string; customSections?: LegacySection[] };
}

// ---------------------------------------------------------------------------------------------
// 07's tables
// ---------------------------------------------------------------------------------------------

interface ProjectSpec {
  slug: string;
  title: string;
  kind: Project["overview"]["kind"];
  accent: Accent;
  frame?: "phone" | "tablet" | "desktop";
  /** One type per live KPI, then the headline's type (07 · Outcomes). */
  types: ResultType[];
}

/** 07 · Overview and visuals, keyed by the live id. Titles are the live titles in sentence case. */
const PROJECTS: Record<number, ProjectSpec> = {
  1: {
    slug: "puja-engagement-platform",
    title: "Puja engagement platform",
    kind: "study",
    accent: "coral",
    frame: "phone",
    types: ["target", "target", "target", "target"],
  },
  2: {
    slug: "word-games-monetisation-strategy",
    title: "Word games monetisation strategy",
    kind: "study",
    accent: "yellow",
    frame: "phone",
    types: ["target", "target", "target", "target"],
  },
  3: {
    slug: "arcana-workspace",
    title: "Arcana Workspace",
    kind: "prototype",
    accent: "slate",
    frame: "desktop",
    types: ["output", "output", "output", "output"],
  },
  4: {
    slug: "glp-1-digital-scaffold",
    title: "GLP-1 digital scaffold",
    kind: "study",
    accent: "green",
    types: ["baseline", "baseline", "baseline", "baseline"],
  },
  5: {
    slug: "revenue-growth-strategy",
    title: "Revenue growth strategy",
    kind: "study",
    accent: "lime",
    frame: "tablet",
    types: ["projected", "target", "output", "projected"],
  },
};

/** The live site's case ids → today's addresses, for its `?open=<id>` links (07 · Legacy links). */
export const LEGACY_CASE_SLUGS: Readonly<Record<number, string>> = Object.fromEntries(
  Object.entries(PROJECTS).map(([id, p]) => [Number(id), p.slug]),
);

/** Live filter tags → topics (07): the live filter label where there is one, else as shown. */
const TOPIC_LABELS: Record<string, string> = {
  crm: "CRM",
  personalization: "Personalization",
  monetization: "Monetization",
  engagement: "Engagement",
  prototype: "Prototyping",
  retention: "Retention",
  mobile: "Mobile",
  games: "Games",
  "0→1": "0→1",
  b2b: "B2B",
  workflows: "Workflows",
  fintech: "Fintech",
};

/** 07 · Covers: alt text for each cover in design/covers/. */
export const V0_COVERS: Record<string, string> = {
  "puja-engagement-platform": "A phone screen with a red header and a green booking button, over speed lines",
  "word-games-monetisation-strategy": "A row of letter tiles above a circle of linked letters",
  "arcana-workspace": "A dashboard of panels with a rising price chart",
  "glp-1-digital-scaffold": "A falling weight curve towards a target line",
  "revenue-growth-strategy": "Bar chart where the last two bars are projected, rising to a target point",
};

/** 07 · The SugarFit drafts: titles from the owner's résumé, everything else empty. */
const SUGARFIT_DRAFTS = [
  "3D body scan for GLP-1 users",
  "Image-based food logging",
  "The CGM journey, end to end",
  "The GLP-1 app, 0→1",
];

/** 07 · Testimonials: the live card colour → the nearest accent. */
const TONES: Record<string, Accent> = {
  "#e8273a": "coral",
  "#00d4ff": "sky",
  "#38bdf8": "sky",
  "#f0c040": "amber",
  "#fb923c": "amber",
  "#4ade80": "green",
  "#c084fc": "violet",
};

/** 07 · Off duty: accents and art drawn on the Home boards for these six, in live order. */
const OFF_DUTY: { id: string; accent: Accent; art: Profile["offDuty"][number]["art"] }[] = [
  { id: "o-anime", accent: "coral", art: "kunai" },
  { id: "o-sketching", accent: "yellow", art: "pencil" },
  { id: "o-tt", accent: "sky", art: "paddle" },
  { id: "o-cooking", accent: "amber", art: "pan" },
  { id: "o-travel", accent: "green", art: "plane" },
  { id: "o-photo", accent: "violet", art: "camera" },
];

const EXPERIENCE_IDS = ["e-sugarfit", "e-glance", "e-razorpay", "e-vedantu", "e-wipro"];
const SKILL_GROUP_IDS = ["g-product", "g-data", "g-design", "g-tools"];

/** 07 · Worth a check: the résumé's value, where there is one. */
const WORTH_A_CHECK: { key: string; alternative?: string }[] = [
  { key: "title", alternative: "Product Manager" },
  { key: "availability" },
  { key: "proof.p-users.value", alternative: "230M+ lockscreen users" },
  { key: "proof.p-revenue.value" },
  {
    key: "proof.p-arr.value",
    alternative: "$2M total: $1.4M via Tracfone, plus $600K from Japan and Brazil",
  },
  {
    key: "experience.e-sugarfit.highlights.h1.items.i4.text",
    alternative: "₹3.6 Cr in month one, 52% renewal",
  },
  {
    key: "experience.e-sugarfit.highlights.h1.items.i3.text",
    alternative: "Post-first-sensor CSAT 42 → 72 (of 100)",
  },
  {
    key: "experience.e-sugarfit.highlights.h1.items.i2.text",
    alternative: "AOV +7%; returns −25% (COD) and −17% (prepaid); 5% of carts recovered",
  },
];

/** The Wipro placeholder bullet stays hidden (D18). */
const HIDDEN_BULLET_PREFIX = "Saved $XXXK";

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

function sentenceCase(text: string): string {
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function titleCaseWords(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/→/g, " to ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Every mapping in 07 must match the live data exactly: a gap fails the build instead of inventing a value. */
function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`V0: no mapping for ${what} (see 07 · V0 content)`);
  return value;
}

const ul = (items: readonly string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const hasHtml = (s: string) => /<[a-z][^>]*>/i.test(s);

/** Splits "+30% monthly orders" into value and label; "+2.5 kg …" keeps the unit (07 · Outcomes). */
export function splitHeadline(impact: string): { value: string; label: string } {
  const kg = /^(\S+ kg)\s+(.*)$/.exec(impact);
  if (kg?.[1] && kg[2] !== undefined) return { value: kg[1], label: kg[2] };
  const i = impact.indexOf(" ");
  return i < 0 ? { value: impact, label: "" } : { value: impact.slice(0, i), label: impact.slice(i + 1) };
}

const RICE_SUBTITLE = "Reach × Impact × Confidence ÷ Effort";
const RICE_DEFINITION = /^Reach: (\S+) · Impact: (\S+) · Confidence: (\S+)% · Effort: (\S+) mo$/;
const RICE_WHY = /^RICE Score (\S+) — Priority #(\d+)$/;

function riceRows(metrics: LegacyMetric[]): string[][] | undefined {
  const rows: string[][] = [];
  for (const m of metrics) {
    const d = RICE_DEFINITION.exec(m.definition);
    const w = m.why ? RICE_WHY.exec(m.why) : null;
    if (!d || !w) return undefined;
    const [, r, i, c, e] = d as unknown as [string, string, string, string, string];
    const [, score, priority] = w as unknown as [string, string, string];
    rows.push([priority, m.metric, r, i, `${c}%`, `${e} mo`, score]);
  }
  return rows;
}

// ---------------------------------------------------------------------------------------------
// Story (07 · Story)
// ---------------------------------------------------------------------------------------------

function buildChapter(section: LegacySection): Chapter {
  const chapterId = `c${section.num}`;
  const blocks: Block[] = [];
  const id = () => `${chapterId}-b${blocks.length + 1}`;

  if (section.body) {
    blocks.push({
      id: id(),
      type: "text",
      body: `<p>${section.body}</p>`,
      style: blocks.length === 0 ? "lead" : "body",
    });
  }
  if (section.items) blocks.push({ id: id(), type: "list", body: ul(section.items) });

  const subs = section.subsections ?? [];
  if (subs.length > 0) {
    const asCards = subs.every(
      (s) => s.items.length === 1 && !hasHtml(s.items[0] ?? "") && (s.items[0] ?? "").length <= 200,
    );
    if (asCards) {
      blocks.push({
        id: id(),
        type: "cards",
        columns: subs.length === 2 || subs.length === 4 ? 2 : 3,
        items: subs.map((s) => ({ title: s.title, note: s.items[0] ?? "" })),
      });
    } else {
      for (const s of subs) {
        blocks.push({ id: id(), type: "heading", body: s.title });
        blocks.push({ id: id(), type: "list", body: ul(s.items) });
      }
    }
  }

  if (section.widgets) {
    blocks.push({
      id: id(),
      type: "cards",
      columns: 3,
      items: section.widgets.map((w) => ({ title: w.name, note: w.rationale })),
    });
  }

  for (const j of section.journeys ?? []) {
    blocks.push({ id: id(), type: "heading", body: j.name });
    blocks.push({ id: id(), type: "text", body: `<p><strong>Entry:</strong> ${j.entry}</p>`, style: "body" });
    blocks.push({ id: id(), type: "journey", stages: j.steps.map((title) => ({ title })) });
    blocks.push({ id: id(), type: "text", body: `<p><strong>Exit:</strong> ${j.exit}</p>`, style: "body" });
  }

  for (const g of section.metricGroups ?? []) {
    blocks.push({ id: id(), type: "heading", body: g.name });
    if (g.subtitle) blocks.push({ id: id(), type: "text", body: `<p>${g.subtitle}</p>`, style: "body" });
    const rows = g.subtitle === RICE_SUBTITLE ? riceRows(g.metrics) : undefined;
    if (rows) {
      blocks.push({
        id: id(),
        type: "table",
        columns: [
          "#",
          must(g.name.split(" ")[0], `the first word of ${g.name}`),
          "Reach",
          "Impact",
          "Conf.",
          "Effort",
          "RICE",
        ],
        rows,
        formula: "rice",
        checkFormula: true,
        sortByScore: false,
        highlightTop: 3,
        phoneCards: true,
        reviewed: [],
      });
    } else {
      blocks.push({
        id: id(),
        type: "cards",
        columns: g.metrics.length <= 4 ? 2 : 3,
        items: g.metrics.map((m) => ({
          title: m.metric,
          note: m.why ? `${m.definition}\n${m.why}` : m.definition,
        })),
      });
    }
  }

  return { id: chapterId, title: section.title, hidden: false, blocks };
}

// ---------------------------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------------------------

export interface V0Options {
  /** Deployed prototype addresses by slug (scripts/v0-prototypes.json). Missing = not deployed yet. */
  prototypes?: Record<string, string>;
  /** Maps a project's slug to its row id. The seed passes real ids; tests use the slug. */
  projectId?: (slug: string) => string;
  /** Maps a cover's slug to its media id once uploaded. */
  coverMediaId?: (slug: string) => string;
}

export interface V0Project {
  slug: string;
  /** Published at seed time, or a private draft (the SugarFit four). */
  publish: boolean;
  document: Project;
}

function buildProject(c: LegacyCase, spec: ProjectSpec, options: Required<V0Options>): Project {
  const outcomes: Outcome[] = c.kpis.map((k, i) => ({
    id: `o${i + 1}`,
    value: k.v,
    label: k.l,
    type: must(spec.types[i], `the type of ${spec.slug} outcome ${i + 1}`),
    inStrip: true,
  }));
  const headline = splitHeadline(c.impact);
  const headlineId = `o${outcomes.length + 1}`;
  outcomes.push({
    id: headlineId,
    ...headline,
    type: must(spec.types[outcomes.length], `the type of the ${spec.slug} headline`),
    inStrip: false,
  });

  const prototypeUrl = c.prototypeUrl ?? options.prototypes[spec.slug];
  const hero: Project["visuals"]["hero"] =
    prototypeUrl && spec.frame
      ? { type: "prototype", url: prototypeUrl, frame: spec.frame, start: "click" }
      : { type: "image" };
  const needsPrototype = !prototypeUrl && Boolean(c.content.prototypeLink);

  return {
    schemaVersion: 1,
    overview: {
      title: spec.title,
      company: c.co,
      summary: c.desc,
      kind: spec.kind,
      topics: c.tags.map((t) => must(TOPIC_LABELS[t], `the topic "${t}"`)),
      ...(c.prdLink ? { prdUrl: c.prdLink } : {}),
    },
    visuals: {
      accent: spec.accent,
      hero,
      cover: { mediaId: options.coverMediaId(spec.slug) },
      gallery: [],
    },
    story: (c.content.customSections ?? []).map(buildChapter),
    outcomes,
    headlineOutcomeId: headlineId,
    seo: {},
    settings: { redirectOldSlug: false },
    ...(needsPrototype ? { todo: ["prototype-link"] } : {}),
  };
}

// ---------------------------------------------------------------------------------------------
// Profile (07 · Profile)
// ---------------------------------------------------------------------------------------------

function buildProfile(content: LegacyContent): Profile {
  const { HERO, ABOUT, SKILLS, EXPERIENCE, HOBBIES, ANIME_PICKS, CONTACT, FOOTER } = content;
  const testimonials = content.TESTIMONIALS as readonly {
    name: string;
    initials: string;
    role: string;
    color: string;
    text: string;
    tag: string;
  }[];

  const [first, ...rest] = HERO.tagline.split(". ");
  const stat = (i: number) => must(HERO.stats[i], `hero stat ${i + 1}`);
  const kpi = (i: number) => must(ABOUT.kpis[i], `About KPI ${i + 1}`);
  const proof = (pid: string, s: { value: string; unit: string; label: string }) => ({
    id: pid,
    value: s.value,
    ...(s.unit ? { unit: s.unit } : {}),
    label: s.label,
  });

  const facts: Profile["facts"] = {};
  for (const { key, alternative } of WORTH_A_CHECK) {
    facts[key] = {
      source: "current-site",
      ...(alternative ? { alternative: { value: alternative, source: "resume" as const } } : {}),
    };
  }

  return {
    schemaVersion: 1,
    name: titleCaseWords(`${HERO.name[0]}${HERO.name[1]} ${HERO.name[2]}`),
    title: HERO.title,
    availability: `${HERO.openToWork} · ${HERO.role}`,
    location: HERO.location,
    positioning: `${must(first, "the tagline")}.`,
    intro: rest.join(". "),
    heroButtons: { primary: { label: HERO.buttons.work.label, href: "#strategy" }, resume: true },
    about: {
      body: [...ABOUT.paragraphs],
      points: [
        {
          id: "pt-currently",
          title: ABOUT.currently.label,
          text: `${ABOUT.currently.text} ${ABOUT.currently.sub}`,
        },
      ],
    },
    proof: [
      proof("p-revenue", stat(0)),
      proof("p-tenure", stat(1)),
      proof("p-users", stat(2)),
      proof("p-companies", stat(3)),
      proof("p-arr", kpi(1)),
      proof("p-impressions", kpi(2)),
    ],
    experience: EXPERIENCE.entries.map((e, i) => ({
      id: must(EXPERIENCE_IDS[i], `experience entry ${i + 1}`),
      company: e.company,
      role: e.role,
      location: e.location,
      dates: e.period,
      highlights: [
        {
          id: "h1",
          items: e.points.map((text, j) => ({
            id: `i${j + 1}`,
            text,
            ...(text.startsWith(HIDDEN_BULLET_PREFIX) ? { hidden: true } : {}),
          })),
        },
      ],
    })),
    skills: SKILLS.groups.map((g, i) => {
      const gid = must(SKILL_GROUP_IDS[i], `skill group ${i + 1}`);
      return {
        id: gid,
        title: g.title,
        subtitle: g.subtitle,
        items: g.items.map((text, j) => ({ id: `${gid}-${j + 1}`, text, size: "m" as const })),
      };
    }),
    testimonials: testimonials.map((t) => ({
      id: `t-${slugify(t.name)}`,
      quote: t.text,
      name: t.name,
      initials: t.initials.slice(0, 2),
      role: t.role,
      tone: must(TONES[t.color.toLowerCase()], `the tone for ${t.color}`),
      tag: t.tag,
    })),
    offDuty: HOBBIES.items.map((h, i) => {
      const spec = must(OFF_DUTY[i], `off duty item ${i + 1}`);
      return {
        id: spec.id,
        label: h.label,
        title: h.title,
        text: h.text,
        tag: h.tag,
        accent: spec.accent,
        art: spec.art,
        ...(i === 0
          ? { picks: ANIME_PICKS.picks.map(([title, note], j) => ({ id: `pk${j + 1}`, title, note })) }
          : {}),
      };
    }),
    contact: {
      email: CONTACT.email.href.replace(/^mailto:/, ""),
      linkedin: CONTACT.linkedin.href,
      showPhone: false,
      resume: { url: CONTACT.resume.href },
      letsTalk: "contact",
    },
    footer: { credit: sentenceCase(FOOTER).replace("bengaluru", "Bengaluru") },
    facts,
    unconfirmed: WORTH_A_CHECK.map((w) => w.key),
  };
}

// ---------------------------------------------------------------------------------------------
// Layout (07 · Layout)
// ---------------------------------------------------------------------------------------------

function header(kicker: string, title?: string, titleMuted?: string): NonNullable<Section["header"]> {
  return {
    kicker,
    ...(title ? { title } : {}),
    ...(titleMuted ? { titleMuted } : {}),
  };
}

const on = (ids: readonly string[], hidden: readonly string[] = []) =>
  ids.map((id) => ({ id, visible: !hidden.includes(id) }));

/** Drops the live kicker's dashes: "— About" → "About" (07 · Layout). */
const kicker = (live: string) => live.replace(/^—\s*|\s*—$/g, "");

function buildLayout(
  content: LegacyContent,
  profile: Profile,
  strategy: string[],
  shipped: string[],
): SiteLayout {
  const { ABOUT, EXPERIENCE, SKILLS, TESTIMONIALS_HEADER, HOBBIES, WORK, CONTACT } = content;
  const [closingAccent] = CONTACT.closing.slice(-1);
  return {
    schemaVersion: 1,
    sections: [
      {
        id: "hero",
        kind: "hero",
        visible: true,
        items: on(["availability", "location", "name", "brush", "positioning", "intro", "buttons"]),
        hero: { motion: true, floaters: { items: [...strategy], atOnce: 3 } },
      },
      {
        id: "proof",
        kind: "proof",
        visible: true,
        items: on([...profile.proof.map((p) => p.id), "spaces"], ["p-arr", "p-impressions"]),
      },
      {
        id: "shipped",
        kind: "shelf",
        visible: false,
        header: { title: "Shipped" },
        items: on(shipped),
        shelf: { name: "Shipped", rows: 2 },
      },
      {
        id: "strategy",
        kind: "shelf",
        visible: true,
        nav: { label: "Work" },
        header: header(kicker(WORK.kicker), sentenceCase(WORK.title[0]), WORK.title[1].toLowerCase()),
        items: on(strategy),
        shelf: { name: "Strategy & prototypes", rows: 2 },
      },
      {
        id: "writing",
        kind: "writing",
        visible: true,
        header: { kicker: "Latest posts", title: "Writing" },
        items: [],
        writing: { latest: 3, rss: true },
      },
      {
        id: "about",
        kind: "about",
        visible: true,
        nav: { label: "About" },
        header: header(
          kicker(ABOUT.kicker),
          sentenceCase(ABOUT.heading.slice(0, -1).join(" ")),
          ABOUT.heading.slice(-1).join("").toLowerCase(),
        ),
        items: on(["text", "points", "photo"]),
      },
      {
        id: "experience",
        kind: "experience",
        visible: true,
        nav: { label: "Exp" },
        header: header(
          kicker(EXPERIENCE.kicker),
          sentenceCase(EXPERIENCE.title[0]),
          EXPERIENCE.title[1].toLowerCase(),
        ),
        items: on(profile.experience.map((e) => e.id)),
      },
      {
        id: "skills",
        kind: "skills",
        visible: true,
        nav: { label: "Skills" },
        header: header(kicker(SKILLS.kicker), sentenceCase(SKILLS.title[0]), SKILLS.title[1].toLowerCase()),
        items: on(profile.skills.map((g) => g.id)),
      },
      {
        id: "testimonials",
        kind: "testimonials",
        visible: true,
        nav: { label: "Testimonial" },
        header: header(
          kicker(TESTIMONIALS_HEADER.kicker),
          sentenceCase(TESTIMONIALS_HEADER.title[0]),
          TESTIMONIALS_HEADER.title[1].toLowerCase(),
        ),
        items: on(profile.testimonials.map((t) => t.id)),
      },
      {
        id: "offduty",
        kind: "offduty",
        visible: true,
        header: header(
          kicker(HOBBIES.kicker),
          sentenceCase(HOBBIES.title[0]),
          HOBBIES.title.slice(1).join(" ").toLowerCase(),
        ),
        items: on(profile.offDuty.map((o) => o.id)),
      },
      {
        id: "contact",
        kind: "contact",
        visible: true,
        header: { kicker: kicker(CONTACT.kicker), intro: CONTACT.text },
        items: on(["closing", "email", "linkedin", "github", "resume"]),
        contact: {
          closing: sentenceCase(CONTACT.closing.slice(0, -1).join(" ")),
          ...(closingAccent ? { closingAccent: closingAccent.toLowerCase() } : {}),
        },
      },
      { id: "footer", kind: "footer", visible: true, items: on(["credit", "updated"]) },
    ],
  };
}

// ---------------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------------

export interface V0Documents {
  profile: Profile;
  layout: SiteLayout;
  projects: V0Project[];
  /** Covers for the seed to upload: design/covers/<slug>.webp with its alt text. */
  covers: { slug: string; file: string; alt: string }[];
}

export function buildV0Documents(content: LegacyContent, options: V0Options = {}): V0Documents {
  const opts: Required<V0Options> = {
    prototypes: options.prototypes ?? {},
    projectId: options.projectId ?? ((slug) => slug),
    coverMediaId: options.coverMediaId ?? ((slug) => `cover-${slug}`),
  };

  const cases = content.CASES as unknown as LegacyCase[];
  const live: V0Project[] = cases.map((c) => {
    const spec = must(PROJECTS[c.id], `live project ${c.id}`);
    return { slug: spec.slug, publish: true, document: buildProject(c, spec, opts) };
  });

  // Drafts take the next free accent on their shelf, as Studio's "New project" does (defaults.ts).
  const drafts: V0Project[] = [];
  for (const title of SUGARFIT_DRAFTS) {
    const document = newProject({
      kind: "shipped",
      accent: firstFreeAccent(drafts.map((d) => d.document.visuals.accent)),
    });
    document.overview = { ...document.overview, title, company: "SugarFit" };
    drafts.push({ slug: slugify(title), publish: false, document });
  }

  const profile = buildProfile(content);
  const layout = buildLayout(
    content,
    profile,
    live.map((p) => opts.projectId(p.slug)),
    drafts.map((p) => opts.projectId(p.slug)),
  );

  return {
    profile,
    layout,
    projects: [...live, ...drafts],
    covers: live.map((p) => ({
      slug: p.slug,
      file: `design/covers/${p.slug}.webp`,
      alt: must(V0_COVERS[p.slug], `the cover alt text for ${p.slug}`),
    })),
  };
}
