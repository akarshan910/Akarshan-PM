/**
 * The boards' illustrative content as published documents (08 · Pixel parity, 10 · Default values
 * layer 1), so pages can be compared with their boards. Never used in production: check-env fails a
 * production build with CONTENT_SOURCE set.
 *
 * It starts from the V0 documents, so every shape is a real one, then puts the boards' copy on top:
 * the Home board's profile, headers and nine projects, the case-study boards' project (VOL.05) and
 * WritingPublic's posts. Copy the boards show only in Studio ("Add in Studio", "Your input needed")
 * is left empty, so it hides as it would on the live site.
 */
import * as legacy from "../../src/legacy/content";
import { ACCENT_COLOURS } from "../../src/lib/accents";
import type { ContentSource, PublicContent, PublicPost, PublicProject } from "../../src/lib/content-source";
import { publishPost, publishProfile, publishProject, type Img } from "../../src/lib/published";
import { QA_NOW } from "../../src/lib/qa";
import type { Accent, Block, Post, Profile, Project, ResultType, Section, SiteLayout } from "../../src/lib/types";
import { buildV0Documents } from "../../src/lib/v0";

import { atWidth, fixtureWidth, type FixtureWidth } from "./board-widths";

const v0 = buildV0Documents(legacy);
const at = QA_NOW.toISOString();

// ---------------------------------------------------------------------------------------------
// Projects: Home.dc.html's two shelves, VOL.01–09
// ---------------------------------------------------------------------------------------------

interface CardSpec {
  slug: string;
  sector?: string;
  title: string;
  company: string;
  cardLabel: string;
  summary: string;
  kind: Project["overview"]["kind"];
  accent: Accent;
  outcomes: { value: string; label: string; type: ResultType }[];
  prototype?: boolean;
  /** A V0 project whose story and cover this one keeps. */
  base?: string;
}

const SHIPPED: CardSpec[] = [
  {
    slug: "3d-body-scan-for-glp-1-users",
    sector: "AI",
    title: "3D body scan for GLP-1 users",
    company: "Sugar.fit",
    cardLabel: "AI-native health · 0→1",
    summary:
      "Benchmarked open-source vision models, built the pipeline end to end, and retrained on an Indian dataset we collected.",
    kind: "shipped",
    accent: "teal",
    outcomes: [
      { value: "±2–3 pp", label: "body fat vs 8-electrode BIA (n=110)", type: "achieved" },
      { value: "₹84L–1.2Cr/yr", label: "vendor spend cut, with rPPG and PPG", type: "achieved" },
    ],
  },
  {
    slug: "image-based-food-logging",
    sector: "LLM",
    title: "Image-based food logging",
    company: "Sugar.fit",
    cardLabel: "LLM · Consumer",
    summary: "Gemini Flash names the dish; a verified nutrition catalogue supplies macros, with a model fallback.",
    kind: "shipped",
    accent: "amber",
    outcomes: [{ value: "62%", label: "of all meal logs", type: "achieved" }],
  },
  {
    slug: "the-cgm-journey-end-to-end",
    sector: "Hardware to app",
    title: "The CGM journey, end to end",
    company: "Sugar.fit",
    cardLabel: "Hardware to app",
    summary: "Seven stages, from sensor delivery to the 14-day data experience.",
    kind: "shipped",
    accent: "sky",
    outcomes: [{ value: "42 → 72", label: "CSAT · ₹3.2 Cr saved YoY", type: "achieved" }],
  },
  {
    slug: "the-glp-1-app-0-to-1",
    sector: "0→1",
    title: "The GLP-1 app, 0→1",
    company: "Sugar.fit",
    cardLabel: "Digital health · 0→1",
    summary: "Owned the patient experience end to end with Clinical, Business and Ops.",
    kind: "shipped",
    accent: "violet",
    outcomes: [{ value: "52%", label: "renewal · ₹3.6 Cr month one", type: "achieved" }],
  },
];

const STRATEGY: CardSpec[] = [
  {
    slug: "puja-engagement-platform",
    title: "Puja engagement platform",
    company: "Sri Mandir",
    cardLabel: "Consumer · Strategy + prototype",
    summary: "WhatsApp-native booking, recommendations and a spiritual calendar to lift repeat puja orders.",
    kind: "prototype",
    accent: "coral",
    outcomes: [{ value: "+30%", label: "monthly orders per user", type: "target" }],
    prototype: true,
    base: "puja-engagement-platform",
  },
  {
    slug: "arcana-workspace",
    title: "Arcana Workspace",
    company: "Arcana",
    cardLabel: "Fintech B2B · PRD + prototype",
    summary: "A Bloomberg-style modular launchpad for institutional investors, from PRD to a working prototype.",
    kind: "prototype",
    accent: "slate",
    outcomes: [{ value: "7", label: "priority widgets in V1", type: "output" }],
    prototype: true,
    base: "arcana-workspace",
  },
  {
    slug: "glp-1-digital-scaffold",
    title: "GLP-1 digital scaffold",
    company: "GLP Health",
    cardLabel: "Strategy",
    summary: "From activity tracker to an outcome-driven metabolic platform.",
    kind: "study",
    accent: "green",
    outcomes: [{ value: "64%", label: "of users lose >1 kg today", type: "baseline" }],
    base: "glp-1-digital-scaffold",
  },
  {
    slug: "word-games-monetisation-strategy",
    title: "Word games monetisation",
    company: "Playsimple",
    cardLabel: "Word Trip · Strategy + prototype",
    summary: "Onboarding, IAP and retention mechanics for Word Trip.",
    kind: "prototype",
    accent: "yellow",
    outcomes: [{ value: "6.5M → 8.8M", label: "monthly active users", type: "target" }],
    prototype: true,
    base: "word-games-monetisation-strategy",
  },
  {
    slug: "revenue-growth-strategy",
    title: "FarmVille 3 revenue growth",
    company: "Zynga",
    cardLabel: "FarmVille 3 · Strategy + prototype",
    summary: "Subscription, consumables and community events.",
    kind: "prototype",
    accent: "lime",
    outcomes: [{ value: "+$50–65K", label: "net new revenue a month", type: "projected" }],
    prototype: true,
    base: "revenue-growth-strategy",
  },
];

const PROTOTYPE_URL = "https://prototypes.example.test/";

let blockId = 0;
const bid = () => `fx-b${String(++blockId)}`;
const ul = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

/** The board's feature names in the RICE table (sentence case). */
const RICE_NAMES = [
  "WhatsApp integration",
  "Product education",
  "Puja recommendation engine",
  "Video feed",
  "Spiritual calendar and reminders",
  "Subscription packages",
  "Complementary puja suggestions",
  "Tiered loyalty rewards",
  "Puja and Aashirvaad box authenticity",
];

/** CaseStudy.dc.html, CaseStudyTablet and CaseStudyMobile: VOL.05's chapters, as on the boards. */
function pujaStory(base: Project): Project["story"] {
  const rice = base.story.flatMap((c) => c.blocks).find((b) => b.type === "table");
  const chapter = (id: string, title: string, blocks: Block[]) => ({ id, title, hidden: false, blocks });
  return [
    chapter("c1", "Objective", [
      {
        id: bid(),
        type: "text",
        style: "body",
        body: "<p>Improve <strong>order frequency — monthly puja orders per user</strong> — for Sri Mandir’s puja service.</p>",
      },
      { id: bid(), type: "heading", body: "Assumptions" },
      {
        id: bid(),
        type: "list",
        body: ul([
          "Rituals are performed authentically; the challenge is proving it online.",
          "The tech stack can support personalisation and localisation.",
          "Booking history, inferred location and preferences are available.",
          "Devotees want an ongoing spiritual connection, not only one-off help.",
        ]),
      },
    ]),
    chapter("c2", "Who we’re solving for", [
      {
        id: bid(),
        type: "text",
        style: "body",
        body: "<p>Seven segments, three prioritised for their potential to raise monthly frequency.</p>",
      },
      {
        id: bid(),
        type: "cards",
        columns: 4,
        style: "chips",
        items: [
          { title: "Tech-savvy devotees" },
          { title: "NRIs and distant devotees" },
          { title: "Specific needs" },
          { title: "Non-Hindi/English speakers" },
        ],
      },
      {
        id: bid(),
        type: "cards",
        columns: 3,
        items: [
          {
            kicker: "Priority 1",
            title: "Time-constrained professionals, millennials and Gen Z",
            note: "Receptive to convenient, recurring digital options like subscriptions.",
          },
          {
            kicker: "Priority 2",
            title: "Tech-informed devotees seeking regular practice",
            note: "Already regular; benefit from streamlined flows and personalisation.",
          },
          {
            kicker: "Priority 3",
            title: "Non-technological regular devotees",
            note: "Live on WhatsApp and Facebook; distrust online payments; strong repeat intent.",
          },
        ],
      },
    ]),
    chapter("c3", "What’s broken today", [
      { id: bid(), type: "text", style: "body", body: "<p>From Google Play reviews and app usage.</p>" },
      {
        id: bid(),
        type: "cards",
        columns: 3,
        items: [
          { title: "Generic discovery", note: "No recommendations from history, preferences or what’s popular nearby." },
          { title: "Low awareness", note: "The puja service and its offerings are hard to discover." },
          { title: "Thin trust signals", note: "Payment worries, no social proof, prasad quality, incorrect gotra." },
          { title: "Language barrier", note: "Hindi and English only, leaving regional-language devotees out." },
          { title: "Learning curve", note: "Multi-step flows unlike the WhatsApp and Facebook patterns users know." },
          { title: "No urgency cues", note: "No timers on time-critical pujas; no “most picked” guidance." },
        ],
      },
    ]),
    chapter("c4", "Prioritisation", [
      {
        id: bid(),
        type: "text",
        style: "body",
        body: "<p>Nine candidate features scored on Reach × Impact × Confidence ÷ Effort. The top three became the plan.</p>",
      },
      ...(rice?.type === "table"
        ? [{ ...rice, id: bid(), rows: rice.rows.map((r, i) => r.map((c, j) => (j === 1 ? (RICE_NAMES[i] ?? c) : c))) }]
        : []),
    ]),
    chapter("c5", "The bet: WhatsApp-native booking", [
      {
        id: bid(),
        type: "text",
        style: "body",
        body: "<p>WhatsApp as a dual-purpose channel: bite-sized, conversational product education — and booking without ever leaving the chat.</p>",
      },
      {
        id: bid(),
        type: "journey",
        stages: [
          { title: "Tap the menu" },
          { title: "Browse top pujas" },
          { title: "Pick a package" },
          { title: "Pay via deep link" },
          { title: "Confirmation and tracking" },
        ],
      },
      { id: bid(), type: "metrics", outcomeIds: ["o-60s"] },
    ]),
    chapter("c6", "Recommendations, from cold start", [
      {
        id: bid(),
        type: "text",
        style: "body",
        body: "<p>Collect details like gotra and important dates at the right moment — when a user taps a puja — and always explain the benefit.</p>",
      },
      { id: bid(), type: "heading", body: "No user data yet" },
      {
        id: bid(),
        type: "list",
        body: ul([
          "Most-booked pujas in the user’s city",
          "Upcoming and seasonal festivals",
          "A “What’s trending” strip as social proof",
        ]),
      },
      { id: bid(), type: "heading", body: "When we know the user" },
      {
        id: bid(),
        type: "list",
        body: ul([
          "Gotra, birthdays and anniversaries",
          "Suggestions for important dates",
          "A “For you” carousel from past bookings",
        ]),
      },
    ]),
    // The board's last two chapters hold only Studio prompts, so they're empty and hide.
    chapter("c7", "My role and decisions", []),
    chapter("c8", "Learnings and next steps", []),
  ];
}

const pujaHero: Project["visuals"]["hero"] = {
  type: "prototype",
  url: PROTOTYPE_URL,
  frame: "phone",
  start: "click",
  title: "Seven screens from the PRD, built to be clicked.",
  note: "Prototype built from the PRD v1.0 — dummy data. Opens full screen on mobile.",
  screens: [
    { label: "Home and discovery", startPath: "home" },
    { label: "Recommendations", startPath: "recommendations" },
    { label: "Video feed", startPath: "feed" },
    { label: "Booking flow", startPath: "booking" },
    { label: "WhatsApp booking", startPath: "whatsapp" },
    { label: "Spiritual calendar", startPath: "calendar" },
    { label: "Education and trust", startPath: "trust" },
  ],
};

function project(spec: CardSpec): { slug: string; document: Project } {
  const base = v0.projects.find((p) => p.slug === spec.base)?.document;
  const outcomes = spec.outcomes.map((o, i) => ({ id: `o${String(i + 1)}`, ...o, inStrip: true }));
  const document: Project = {
    schemaVersion: 1,
    overview: {
      title: spec.title,
      company: spec.company,
      cardLabel: spec.cardLabel,
      ...(spec.sector ? { sector: spec.sector } : {}),
      summary: spec.summary,
      kind: spec.kind,
      topics: base?.overview.topics.slice(0, 3) ?? [],
    },
    visuals: {
      accent: spec.accent,
      hero: spec.prototype
        ? { type: "prototype", url: PROTOTYPE_URL, frame: "phone", start: "click" }
        : { type: "image" },
      ...(base?.visuals.cover ? { cover: base.visuals.cover } : {}),
      gallery: [],
    },
    story: base?.story ?? [],
    outcomes,
    headlineOutcomeId: "o1",
    seo: {},
    settings: { redirectOldSlug: false },
  };

  if (spec.slug === "puja-engagement-platform" && base) {
    document.overview = {
      ...document.overview,
      sector: "Devotional consumer app",
      // The case-study boards' longer summary ("How might Sri Mandir…") would break the Home
      // board's card; Home wins, so the case study's header differs there.
      problem:
        "Play Store reviews and app usage pointed to generic discovery, low awareness of the puja service, thin trust signals and Hindi/English-only flows.",
      proposal:
        "WhatsApp-native booking and education, recommendations with a cold-start plan, a video feed and a spiritual calendar — ranked with RICE.",
      topics: ["CRM", "Personalisation", "Vernacular"],
    };
    document.visuals.hero = pujaHero;
    document.story = pujaStory(base);
    document.outcomes = [
      { id: "o1", value: "+30%", label: "orders per user", type: "target", inStrip: true },
      { id: "o2", value: "12%", label: "WhatsApp conversion", type: "target", inStrip: true },
      { id: "o3", value: "5", label: "regional languages", type: "target", inStrip: true },
      {
        id: "o-60s",
        value: "60s",
        label: "From tap to confirmed puja, without leaving WhatsApp.",
        type: "target",
        inStrip: false,
      },
    ];
  }
  return { slug: spec.slug, document };
}

const PROJECTS = [...SHIPPED, ...STRATEGY].map(project);

// ---------------------------------------------------------------------------------------------
// Profile and layout: Home.dc.html, HomeTablet and HomeMobile
// ---------------------------------------------------------------------------------------------

const SKILL_SIZES_BOARD: Record<string, Profile["skills"][number]["items"][number]["size"]> = {
  "User & Market Research": "l",
  "Feature Prioritisation": "m",
  "Road-mapping": "m",
  "Stakeholder Management": "s",
  "A/B Testing": "xl",
  Experimentation: "m",
  "Data-driven Development": "s",
  SQL: "xl",
  "Web (Clickstream) Analytics": "m",
  "Product & Data Analytics": "l",
  "Visualization & Story Telling": "s",
  ETL: "m",
  FigmaMake: "l",
  Prototyping: "m",
  Wireframing: "s",
  "Napkin.ai": "s",
  Excel: "s",
  Lovable: "m",
  Mixpanel: "l",
  Metabase: "m",
  Tableau: "s",
  Optimizely: "s",
  Redash: "s",
  Superset: "m",
  Figma: "m",
  JIRA: "s",
  Amplitude: "l",
  Airflow: "m",
};

const TESTIMONIAL_ROLES: Record<string, string> = {
  "t-anmol-loonia": "Design Leader, Consumer AI · Glance",
  "t-pallav-srivastava": "SDE 4 (Android) · Glance",
  "t-vishal-gopal": "Product · Glance",
};
const TESTIMONIAL_QUOTES: Record<string, string> = {
  "t-anmol-loonia":
    "Akarshan was my PM on multiple projects through the TV Integration with a leading OEM. He brought a lot of user first approaches to the table, which led to deep business as well as user impact. His ability to get everyone on the same page and turn the wheel is what really worked for the product.",
  "t-pallav-srivastava":
    "Akarshan is one of the sharpest product minds I have had the pleasure of working with. His ability to break down complex problems, ask the right questions, and approach every decision with a data-driven mindset made a huge impact on our work.",
  "t-vishal-gopal":
    "The striking thing about working with him is his Conviction. The conviction that arises out of a detailed and thorough thought process. A great asset to work with.",
};
const TESTIMONIAL_ORDER = ["t-anmol-loonia", "t-pallav-srivastava", "t-vishal-gopal"];

const profile: Profile = {
  ...v0.profile,
  title: "Product Manager",
  availability: "Open to Senior / Lead PM roles",
  location: "Bengaluru · IST",
  positioning:
    "I build <strong>AI-native health products</strong> — and the <strong>data platforms</strong> that prove they work.",
  intro:
    "Product manager at Sugar.fit for GLP-1, Type 2 diabetes and Active Foods, leading a 10-analyst Central Analytics team. Before that: personalisation and serving for 230M+ devices at Glance (InMobi).",
  heroButtons: { primary: { label: "See selected work", href: "#shipped" }, resume: true },
  about: {
    body: [
      "Eight years across product and data: four as an analyst at Wipro, Vedantu and Razorpay, then product at Glance and Sugar.fit. M.Sc. in Mathematics &amp; Computing, BIT Mesra.",
    ],
    points: [
      {
        id: "pt-1",
        title: "Start in the data",
        text: "I lead Sugar.fit’s Central Analytics team and own the BigQuery/Dataform platform — one source of truth for org-wide KPIs, self-serve for every pod.",
      },
      {
        id: "pt-2",
        title: "Build when it’s the product",
        text: "Benchmarked open-source models, retrained on our own data and replaced a vitals vendor with in-house rPPG and PPG — lower error, ₹84L–1.2Cr a year saved.",
      },
      {
        id: "pt-3",
        title: "Own the whole journey",
        text: "Seven CGM stages, from sensor delivery to 14-day data, with discovery run on a year of support tickets. CSAT went from 42 to 72.",
      },
    ],
  },
  proof: [
    { id: "p-devices", value: "230M+", label: "devices personalised and served", source: "Glance · InMobi" },
    { id: "p-arr", value: "$2M", unit: "ARR", label: "unlocked via Tracfone, Japan and Brazil", source: "Glance · InMobi" },
    { id: "p-glp", value: "₹3.6 Cr", label: "in month one from a GLP-1 app I built 0→1", source: "Sugar.fit" },
    { id: "p-saved", value: "~₹1.5 Cr", unit: "/yr", label: "saved by in-housing vendor services", source: "Sugar.fit" },
  ],
  spaces: {
    label: "Problem spaces",
    items: [
      "AI-native health",
      "Hardware-to-app (CGM)",
      "Personalisation & serving",
      "Data platforms",
      "Growth funnels",
      "Monetisation",
      "0→1",
    ],
  },
  experience: [
    {
      id: "e-sugarfit",
      company: "Sugar.fit",
      role: "Product Manager",
      location: "Bengaluru",
      dates: "May 2025 — now",
      summary:
        "Own product for GLP-1, Type 2 diabetes and Active Foods D2C, reporting to the co-founder/CPO. Lead the Central Analytics team: 3 direct reports, 10 analysts across growth, marketing, clinical, ops, product and D2C.",
      highlights: [
        {
          id: "h-ai",
          group: "AI-native products",
          items: [
            "<strong>3D body scan</strong> — ±2–3 pp vs BIA (n=110)",
            "<strong>In-house rPPG + PPG</strong> — ₹84L–1.2Cr/yr saved",
            "<strong>AI food logging</strong> — 62% of logs, +34%",
            "<strong>Support automation</strong> — 73% auto-resolved, TAT 80 → 32 h",
          ].map((text, i) => ({ id: `h-ai-${String(i)}`, text })),
        },
        {
          id: "h-data",
          group: "Data & platforms",
          items: [
            "<strong>BigQuery / Dataform</strong> — one KPI truth, $48K/yr saved",
            "<strong>Commerce off Shopify</strong> — self-serve offers and pricing tests",
            "<strong>WhatsApp CRM</strong> — send rate 70% → 98%",
          ].map((text, i) => ({ id: `h-data-${String(i)}`, text })),
        },
        {
          id: "h-consumer",
          group: "Consumer product",
          items: [
            "<strong>CGM journey</strong> — CSAT 42 → 72, ₹3.2 Cr saved",
            "<strong>T2D renewals</strong> — +20%, +₹17–20L a month",
            "<strong>GLP-1 app 0→1</strong> — 52% renewal",
            "<strong>Active Foods</strong> — AOV +7%, COD returns −25%",
          ].map((text, i) => ({ id: `h-consumer-${String(i)}`, text })),
        },
      ],
    },
    {
      id: "e-glance",
      company: "Glance (InMobi Group)",
      role: "Product Manager",
      location: "Bengaluru",
      dates: "May 2022 — May 2025",
      summary: "Owned personalisation, content experience and the serving stack for 230M+ lockscreen users.",
      highlights: [
        {
          id: "h-glance",
          items: [
            "Rebuilt serving-funnel rendering and tracking: <strong>serving +22%, CTR 1.7×</strong>",
            "ML-clustered Summaries &amp; Collections: <strong>1.4M DAU, L0 engagement +21%</strong>",
            "<strong>$1.4M ARR</strong> via Tracfone; <strong>$600K ARR</strong> from Japan and Brazil",
            "NFL on Google NAB: <strong>2.5M Airtel Xstream devices</strong>",
            "Owned GDPR readiness that unblocked the EU launch",
            "Lakmé campaign: <strong>12M impressions, 64% higher ad recall</strong>",
          ].map((text, i) => ({ id: `h-glance-${String(i)}`, text })),
        },
      ],
    },
    {
      id: "e-razorpay",
      company: "Razorpay",
      role: "Senior Product Analyst",
      dates: "Jul — Sep 2021",
      summary:
        "<strong>+30% sign-ups and +23% MTU</strong> from a redesigned signup funnel and activation flow. “Ace in the Race” award for data instrumentation across GST, OCR and merchant verification.",
      highlights: [],
    },
    {
      id: "e-vedantu",
      company: "Vedantu",
      role: "Senior Product Analyst",
      dates: "Jan — Jul 2021",
      summary:
        "<strong>+800 daily inbound leads</strong> from Book Online Demo experiments; micro-concept video retention +17% and ₹7L a month in revenue.",
      highlights: [],
    },
    {
      id: "e-wipro",
      company: "Wipro Analytics",
      role: "Senior Analyst",
      dates: "Aug 2017 — Jan 2021",
      summary:
        "Data initiatives for Uber GSS operations across <strong>64 languages</strong>; cut Uber Eats localisation spend through cost-per-language analysis (amount under NDA). Also Lloyds Banking Group and Capital One.",
      highlights: [],
    },
  ],
  education: [
    {
      id: "ed-bit",
      school: "BIT Mesra, Ranchi",
      degree: "Integrated M.Sc. Mathematics & Computing, with distinction.",
      dates: "2012 — 2017",
    },
  ],
  // Home.dc.html's default Tweak, "sizes set in Studio (example)" (its `SK` table).
  skills: v0.profile.skills.map((g) => ({
    ...g,
    items: g.items.map((i) => ({ ...i, size: SKILL_SIZES_BOARD[i.text] ?? i.size })),
  })),
  testimonials: v0.profile.testimonials.map((t) => {
    const role = TESTIMONIAL_ROLES[t.id];
    return role
      ? {
          ...t,
          role,
          quote: TESTIMONIAL_QUOTES[t.id] ?? t.quote,
          linkedin: `https://www.linkedin.com/in/${t.id.replace(/^t-/, "")}`,
        }
      : t;
  }),
  contact: { ...v0.profile.contact, github: "https://github.com/example" },
  footer: { credit: "Vibe-coded in Bengaluru" },
};

const HEADERS: Record<string, Section["header"]> = {
  shipped: {
    kicker: "Selected work · Shipped",
    title: "Shipped, measured,",
    titleMuted: "explained.",
    intro: "AI-native health at Sugar.fit. Every number is labelled: achieved, target, projected or baseline.",
  },
  strategy: {
    kicker: "Selected work · Strategy & prototypes",
    title: "Decisions,",
    titleMuted: "not features.",
    intro: "Product strategy studies: research, prioritisation and a working prototype you can try.",
  },
  writing: { kicker: "Latest posts", title: "Writing", intro: "[One line on what you write about.]" },
  about: { kicker: "How I work", title: "Analyst first.", titleMuted: "Builder always." },
  experience: { kicker: "Experience", title: "Where I’ve built." },
  skills: {
    kicker: "Skills",
    title: "What I",
    titleMuted: "bring.",
    intro: "Four groups, one cloud. Hover or tap a group to light up its skills.",
  },
  testimonials: { kicker: "Testimonials", title: "What teammates say." },
  offduty: {
    kicker: "Off duty",
    title: "When I’m not",
    titleMuted: "shipping.",
    intro: "The bonus pages at the back of the volume.",
  },
  contact: {
    kicker: "Thanks for reading",
    intro:
      "Open to Senior / Lead PM roles in health-tech, consumer and fintech. Data fluency, clinical context, and the ability to ship — fast.",
  },
};

function boardSection(s: Section): Section {
  const header = HEADERS[s.id];
  const out: Section = { ...s, ...(header ? { header } : {}) };
  switch (s.kind) {
    case "hero":
      return {
        ...out,
        hero: {
          motion: true,
          floaters: {
            items: [
              "3d-body-scan-for-glp-1-users",
              "the-cgm-journey-end-to-end",
              "the-glp-1-app-0-to-1",
              "puja-engagement-platform",
              "arcana-workspace",
              "revenue-growth-strategy",
            ],
            atOnce: 3,
          },
        },
      };
    case "proof":
      return { ...out, items: [...profile.proof.map((p) => ({ id: p.id, visible: true })), { id: "spaces", visible: true }] };
    case "shelf":
      // The Home board shows Shipped first, with the nav's Work link on it.
      return s.id === "shipped"
        ? { ...out, visible: true, nav: { label: "Work" } }
        : {
            ...out,
            items: STRATEGY.map((p) => ({ id: p.slug, visible: true })),
            nav: undefined,
          };
    case "writing":
      // WritingPublic shows the section on its own; Home's boards don't have it.
      return { ...out, visible: false };
    case "experience":
      return { ...out, items: profile.experience.map((e) => ({ id: e.id, visible: true })) };
    case "testimonials":
      return {
        ...out,
        items: [...TESTIMONIAL_ORDER, ...s.items.map((i) => i.id).filter((id) => !TESTIMONIAL_ORDER.includes(id))].map(
          (id) => ({ id, visible: true }),
        ),
      };
    case "contact":
      return { ...out, contact: { closing: "Let’s build something", closingAccent: "impactful." } };
    default:
      return out;
  }
}

const layout: SiteLayout = {
  schemaVersion: 1,
  sections: v0.layout.sections.map(boardSection).map((s) => {
    if (s.nav === undefined) {
      const { nav: _nav, ...rest } = s;
      return rest;
    }
    return s;
  }),
};

// ---------------------------------------------------------------------------------------------
// Posts: WritingPublic.dc.html
// ---------------------------------------------------------------------------------------------

interface PostSpec {
  slug: string;
  title: string;
  excerpt: string;
  topics: string[];
  publishedAt: string;
  /** The board's reading time, which its placeholder copy is too short to produce. */
  minutes: number;
  cover?: string | undefined;
}

const POSTS: PostSpec[] = [
  {
    slug: "your-post",
    title: "[Your latest post title]",
    excerpt: "[The excerpt: one or two lines on what the reader will take away.]",
    topics: ["Product", "AI"],
    publishedAt: "2026-10-12T09:00:00+05:30",
    minutes: 7,
    cover: "puja-engagement-platform",
  },
  ...[2, 3, 4, 5].map(
    (n): PostSpec => ({
      slug: `post-${String(n)}`,
      title: `[Post title ${String(n)}]`,
      excerpt: "[A one- or two-line excerpt.]",
      topics: [["AI"], ["Health-tech"], ["Data"], ["Growth"]][n - 2] ?? [],
      publishedAt: `2026-0${String(11 - n)}-0${String(n)}T09:00:00+05:30`,
      minutes: 5,
      cover: v0.projects[n - 1]?.slug,
    }),
  ),
];

const POST_BODY: Post["blocks"] = [
  {
    id: "pb1",
    type: "text",
    body: "<p>[Your opening paragraph. Body text is 19px with a line of about 68 characters, so long reads stay easy on the eyes in the dark theme.]</p>",
  },
  {
    id: "pb2",
    type: "text",
    body: '<p>[A second paragraph. Links are underlined in red, <a href="/writing">like this</a>, and every number you cite keeps its label:</p>',
  },
  { id: "pb3", type: "fact", value: "+20%", label: "T2D renewal", resultType: "achieved" },
  { id: "pb4", type: "heading", body: "[A section heading]" },
  {
    id: "pb5",
    type: "text",
    body: "<p>[More of your post. Headings use the condensed display face; body stays in Geist.]</p>",
  },
  { id: "pb6", type: "quote", body: "[A line worth quoting.]" },
  { id: "pb7", type: "image", mediaId: "cover-word-games-monetisation-strategy", caption: "[Image caption. Alt text is required in Studio.]" },
  { id: "pb8", type: "text", body: "<p>[Your closing paragraph.]</p>" },
];

// ---------------------------------------------------------------------------------------------
// Publishing, the same way the local-v0 source does
// ---------------------------------------------------------------------------------------------

const COVER = { width: 1600, height: 1000 };
const coverAlt = new Map(v0.covers.map((c) => [`cover-${c.slug}`, c.alt]));

function coverImg(slug: string, accent: Accent): Img | undefined {
  const alt = coverAlt.get(`cover-${slug}`);
  if (alt === undefined) return undefined;
  const src = `/media/v0/${slug}.webp`;
  return {
    src,
    srcset: `${src} ${String(COVER.width)}w`,
    ...COVER,
    alt,
    dominant: ACCENT_COLOURS[accent].ground,
    focal: { x: 0.5, y: 0.5 },
  };
}

const byMediaId = (ref: { mediaId: string }, accent: Accent) => coverImg(ref.mediaId.replace(/^cover-/, ""), accent);

/**
 * The fixture for one parity width (D70): `PM_FIXTURE_WIDTH` picks 834 or 390's condensed copy;
 * unset, it's the laptop boards' copy.
 */
export function loadBoardContent(width: FixtureWidth = fixtureWidth(process.env.PM_FIXTURE_WIDTH)): PublicContent {
  const docs = atWidth(width, { profile, projects: PROJECTS });
  const projects: PublicProject[] = docs.projects.map(({ slug, document }) => ({
    id: slug,
    slug,
    listed: true,
    publishedAt: at,
    firstPublishedAt: at,
    project: publishProject(document, (ref) => byMediaId(ref, document.visuals.accent)),
  }));

  const posts: PublicPost[] = POSTS.map((spec) => {
    const draft: Post = {
      schemaVersion: 1,
      title: spec.title,
      ...(spec.slug === "your-post" ? { subtitle: "[The subtitle, if you wrote one.]" } : {}),
      ...(spec.cover ? { cover: { mediaId: `cover-${spec.cover}` } } : {}),
      blocks: POST_BODY,
      excerpt: spec.excerpt,
      topics: spec.topics,
      showOnHome: true,
      seo: {},
    };
    const published = publishPost(draft, (ref) => byMediaId(ref, "coral"), at);
    return {
      id: spec.slug,
      slug: spec.slug,
      publishedAt: new Date(spec.publishedAt).toISOString(),
      post: { ...published, readingMinutes: spec.minutes },
    };
  });

  return {
    profile: publishProfile(docs.profile, () => undefined),
    layout,
    projects,
    posts,
    updatedAt: at,
  };
}

export const boardsFixture: ContentSource = {
  name: "fixture:boards",
  load: () => Promise.resolve(loadBoardContent()),
};

/** The draft documents, for the schema test. */
export const boardDocuments = { profile, layout, projects: PROJECTS };
