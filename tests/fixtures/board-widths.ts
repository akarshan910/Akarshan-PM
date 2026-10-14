/**
 * The iPad and phone boards' copy (D70). HomeTablet, HomeMobile, CaseStudyTablet and CaseStudyMobile
 * condense the laptop boards' text, so each parity build (PM_FIXTURE_WIDTH=834 or 390) puts that
 * width's strings over the base fixture. Only copy changes here, never structure: every document
 * still passes its schema, and 1440 (or no width) is the base fixture as it is.
 */
import type { Block, Profile, Project, ResultType, SiteLayout } from "../../src/lib/types";

export type FixtureWidth = 1440 | 834 | 390;

export function fixtureWidth(value: string | undefined): FixtureWidth {
  return value === "834" ? 834 : value === "390" ? 390 : 1440;
}

interface Docs {
  profile: Profile;
  layout: SiteLayout;
  projects: { slug: string; document: Project }[];
}

type Card = { cardLabel?: string; summary?: string; outcomes?: { value?: string; label: string; type?: ResultType }[] };

const ul = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const bold = (lead: string, rest: string) => `<strong>${lead}</strong> — ${rest}`;

// ---------------------------------------------------------------------------------------------
// Cards on the shelves (HomeTablet, HomeMobile)
// ---------------------------------------------------------------------------------------------

const CARDS: Record<834 | 390, Record<string, Card>> = {
  834: {
    "image-based-food-logging": { cardLabel: "LLM", outcomes: [{ label: "of meal logs" }] },
    "the-cgm-journey-end-to-end": { outcomes: [{ label: "CSAT" }] },
    "the-glp-1-app-0-to-1": { outcomes: [{ label: "renewal" }] },
    "arcana-workspace": { cardLabel: "Fintech B2B", outcomes: [{ label: "widgets in V1" }] },
    "glp-1-digital-scaffold": { outcomes: [{ label: "lose >1 kg today" }] },
    "word-games-monetisation-strategy": { cardLabel: "Word Trip", outcomes: [{ label: "MAU" }] },
    "revenue-growth-strategy": { cardLabel: "FarmVille 3", outcomes: [{ label: "a month" }] },
  },
  390: {
    "3d-body-scan-for-glp-1-users": {
      cardLabel: "AI-native health",
      summary:
        "Benchmarked open-source vision models, built the pipeline end to end, and retrained on an Indian dataset.",
      outcomes: [{ label: "vs 8-electrode BIA" }],
    },
    "image-based-food-logging": { cardLabel: "LLM", outcomes: [{ label: "of meal logs" }] },
    "the-cgm-journey-end-to-end": { outcomes: [{ value: "CSAT 42 → 72", label: "" }] },
    "the-glp-1-app-0-to-1": { outcomes: [{ label: "renewal" }] },
    // HomeMobile's strategy lead has no summary line.
    "puja-engagement-platform": {
      cardLabel: "Strategy + prototype",
      summary: "",
      outcomes: [{ label: "orders per user" }],
    },
    "arcana-workspace": { cardLabel: "Fintech B2B", outcomes: [{ label: "widgets in V1" }] },
    "glp-1-digital-scaffold": { outcomes: [{ label: "lose >1 kg today" }] },
    "word-games-monetisation-strategy": { cardLabel: "Word Trip", outcomes: [{ label: "MAU" }] },
    "revenue-growth-strategy": { cardLabel: "FarmVille 3", outcomes: [{ label: "a month" }] },
  },
};

function applyCard(doc: Project, card: Card) {
  if (card.cardLabel) doc.overview.cardLabel = card.cardLabel;
  if (card.summary !== undefined) doc.overview.summary = card.summary;
  card.outcomes?.forEach((o, i) => {
    const target = doc.outcomes[i];
    if (!target) return;
    target.label = o.label;
    if (o.value) target.value = o.value;
  });
}

// ---------------------------------------------------------------------------------------------
// Profile (HomeTablet, HomeMobile)
// ---------------------------------------------------------------------------------------------

function profileAt(width: 834 | 390, p: Profile): Profile {
  const out = structuredClone(p);
  type Cell = Profile["proof"][number];
  /** Sets a proof cell's copy; `drop` removes the unit or source the phone board doesn't show. */
  const proof = (id: string, patch: Partial<Cell>, drop: ("unit" | "source")[] = []) => {
    const cell = out.proof.find((c) => c.id === id);
    if (!cell) return;
    Object.assign(cell, patch);
    for (const key of drop) delete cell[key];
  };
  const entry = (id: string) => out.experience.find((e) => e.id === id);
  const testimonial = (id: string, patch: Partial<Profile["testimonials"][number]>) => {
    const t = out.testimonials.find((x) => x.id === id);
    if (t) Object.assign(t, patch);
  };

  if (width === 834) {
    proof("p-arr", { label: "via Tracfone, Japan and Brazil" });
    proof("p-glp", { label: "in month one, GLP-1 app built 0→1" });
    out.about.body = [
      "Eight years across product and data: four as an analyst at Wipro, Vedantu and Razorpay, then product at Glance and Sugar.fit. M.Sc. Mathematics &amp; Computing, BIT Mesra.",
    ];
    const [a, b, c] = out.about.points ?? [];
    if (a)
      a.text =
        "Lead Sugar.fit’s Central Analytics team and own the BigQuery/Dataform platform — one source of truth for org-wide KPIs.";
    if (b) b.text = "Replaced a vitals vendor with in-house rPPG and PPG — lower error, ₹84L–1.2Cr a year saved.";
    if (c) c.text = "Seven CGM stages, from sensor delivery to 14-day data. CSAT went from 42 to 72.";
    const sugar = entry("e-sugarfit");
    if (sugar) {
      sugar.summary =
        "Own product for GLP-1, Type 2 diabetes and Active Foods D2C. Lead Central Analytics: 3 direct reports, 10 analysts.";
      sugar.highlights = [
        {
          id: "h-ai",
          group: "AI-native products",
          items: [
            bold("3D body scan", "±2–3 pp vs BIA"),
            bold("rPPG + PPG", "₹84L–1.2Cr/yr saved"),
            bold("Food logging", "62% of logs"),
            bold("Support", "73% auto-resolved"),
          ].map((text, i) => ({ id: `h-ai-${String(i)}`, text })),
        },
        {
          id: "h-consumer",
          group: "Consumer & platforms",
          items: [
            bold("CGM journey", "CSAT 42 → 72"),
            bold("T2D renewals", "+20%"),
            bold("GLP-1 app", "52% renewal"),
            bold("BigQuery", "$48K/yr saved"),
          ].map((text, i) => ({ id: `h-consumer-${String(i)}`, text })),
        },
      ];
    }
    const glance = entry("e-glance");
    if (glance) {
      glance.dates = "2022 — 2025";
      // HomeTablet draws the compact entry: the role line, then the highlights joined.
      glance.location = "personalisation and serving for 230M+ users";
      delete glance.summary;
      glance.highlights = [
        {
          id: "h-glance",
          items: [
            "Serving +22%, CTR 1.7×",
            "Summaries &amp; Collections, 1.4M DAU",
            "$2M ARR",
            "NFL on Google NAB",
            "GDPR for the EU launch",
          ].map((text, i) => ({ id: `h-glance-${String(i)}`, text })),
        },
      ];
    }
    for (const [id, dates] of [
      ["e-razorpay", "2021"],
      ["e-vedantu", "2021"],
      ["e-wipro", "2017–2021"],
    ] as const) {
      const e = entry(id);
      if (e) e.dates = dates;
    }
    const school = out.education?.[0];
    if (school) {
      school.degree = "M.Sc. Mathematics & Computing";
      school.school = "BIT Mesra";
      school.dates = "2012–2017";
    }
    testimonial("t-anmol-loonia", {
      quote:
        "His ability to get everyone on the same page and turn the wheel is what really worked for the product. He is the perfect team player.",
    });
    testimonial("t-pallav-srivastava", {
      quote: "One of the sharpest product minds I have had the pleasure of working with.",
      role: "SDE 4 · Glance",
    });
  } else {
    proof("p-devices", { label: "devices served at Glance" }, ["source"]);
    proof("p-arr", { value: "$2M", label: "ARR unlocked at Glance" }, ["unit", "source"]);
    proof("p-glp", { label: "GLP-1 app, month one" }, ["source"]);
    proof("p-saved", { label: "a year saved by in-housing" }, ["unit", "source"]);
    out.about.body = [
      "Four years as an analyst, then product at Glance and Sugar.fit. M.Sc. Mathematics &amp; Computing, BIT Mesra.",
    ];
    const [a, b, c] = out.about.points ?? [];
    if (a) a.text = "Lead Central Analytics; own the BigQuery/Dataform platform and its KPI truth.";
    if (b) b.text = "In-house rPPG and PPG beat the vendor — ₹84L–1.2Cr a year saved.";
    if (c) c.text = "Seven CGM stages end to end. CSAT went from 42 to 72.";
    const sugar = entry("e-sugarfit");
    if (sugar) {
      sugar.dates = "2025 — now";
      sugar.summary =
        "GLP-1, Type 2 diabetes and Active Foods D2C. Lead Central Analytics: 3 direct reports, 10 analysts.";
      // Phones show the first four highlights, then "All Sugar.fit highlights".
      const first = [
        bold("3D body scan", "±2–3 pp vs BIA (n=110)"),
        bold("AI food logging", "62% of meal logs"),
        bold("CGM journey", "CSAT 42 → 72, ₹3.2 Cr saved"),
        bold("T2D renewals", "+20%, +₹17–20L a month"),
      ];
      const rest = sugar.highlights
        .flatMap((h) => h.items)
        .filter((i) => !/3D body scan|AI food logging|CGM journey|T2D renewals/.test(i.text));
      sugar.highlights = [
        {
          id: "h-phone",
          items: [...first.map((text, i) => ({ id: `h-phone-${String(i)}`, text })), ...rest],
        },
      ];
    }
    for (const [id, dates] of [
      ["e-glance", "2022–2025"],
      ["e-razorpay", "2021"],
      ["e-vedantu", "2021"],
      ["e-wipro", "2017–2021"],
    ] as const) {
      const e = entry(id);
      if (e) e.dates = dates;
    }
    const school = out.education?.[0];
    if (school) {
      school.school = "BIT Mesra";
      school.degree = "M.Sc. Mathematics & Computing";
      school.dates = "2012–2017";
    }
    testimonial("t-anmol-loonia", {
      quote:
        "His ability to get everyone on the same page and turn the wheel is what really worked for the product.",
      role: "Design Leader · Glance",
    });
    testimonial("t-pallav-srivastava", {
      quote: "One of the sharpest product minds I have had the pleasure of working with.",
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// The case study, VOL.05 (CaseStudyTablet, CaseStudyMobile)
// ---------------------------------------------------------------------------------------------

function setText(doc: Project, chapterId: string, blockIndex: number, body: string) {
  const block = doc.story.find((c) => c.id === chapterId)?.blocks[blockIndex];
  if (block?.type === "text" || block?.type === "list") block.body = body;
}

function blocksOf(doc: Project, chapterId: string): Block[] {
  return doc.story.find((c) => c.id === chapterId)?.blocks ?? [];
}

function pujaAt(width: 834 | 390, doc: Project) {
  if (width === 834) {
    doc.overview.problem =
      "Generic discovery, low awareness, thin trust signals and Hindi/English-only flows.";
    doc.overview.proposal =
      "WhatsApp-native booking and education, recommendations, a video feed and a spiritual calendar — ranked with RICE.";
    const labels = ["orders/user", "WhatsApp conversion", "languages"];
    labels.forEach((label, i) => {
      const o = doc.outcomes[i];
      if (o) o.label = label;
    });
    setText(
      doc,
      "c1",
      2,
      ul([
        "Rituals are authentic; the challenge is proving it online.",
        "The stack can support personalisation and localisation.",
        "Booking history, location and preferences are available.",
        "Devotees want ongoing connection, not only one-off help.",
      ]),
    );
    const c2 = doc.story.find((c) => c.id === "c2");
    if (c2) {
      setText(doc, "c2", 0, "<p>Seven segments, three prioritised.</p>");
      c2.blocks = c2.blocks.filter((b) => !(b.type === "cards" && b.style === "chips"));
      const cards = c2.blocks.find((b) => b.type === "cards");
      if (cards?.type === "cards")
        cards.items = [
          { kicker: "Priority 1", title: "Time-constrained professionals and Gen Z" },
          { kicker: "Priority 2", title: "Devotees seeking regular practice" },
          { kicker: "Priority 3", title: "Non-technological regular devotees" },
        ];
    }
    const c3 = doc.story.find((c) => c.id === "c3");
    if (c3) {
      c3.blocks = c3.blocks.filter((b) => b.type !== "text");
      const grid = c3.blocks.find((b) => b.type === "cards");
      if (grid?.type === "cards")
        grid.items = [
          { title: "Generic discovery", note: "No recommendations from history or location." },
          { title: "Low awareness", note: "The puja service is hard to discover." },
          { title: "Thin trust signals", note: "Payments, prasad quality, incorrect gotra." },
          { title: "Language barrier", note: "Hindi and English only." },
          { title: "Learning curve", note: "Unfamiliar multi-step flows." },
          { title: "No urgency cues", note: "No timers or “most picked” guidance." },
        ];
    }
    setText(doc, "c4", 0, "<p>Reach × Impact × Confidence ÷ Effort. The top three became the plan.</p>");
    const table = blocksOf(doc, "c4").find((b) => b.type === "table");
    if (table?.type === "table") {
      const short: Record<number, string> = { 2: "Recommendation engine", 4: "Spiritual calendar" };
      table.rows = table.rows.map((r, i) => r.map((c, j) => (j === 1 ? (short[i] ?? c) : c)));
    }
    setText(doc, "c5", 0, "<p>Conversational education and booking, without leaving the chat.</p>");
    const journey = blocksOf(doc, "c5").find((b) => b.type === "journey");
    if (journey?.type === "journey")
      journey.stages = ["Tap the menu", "Browse pujas", "Pick a package", "Pay via link", "Confirmation"].map(
        (title) => ({ title }),
      );
    const metric = doc.outcomes.find((o) => o.id === "o-60s");
    if (metric) metric.label = "From tap to confirmed puja, in WhatsApp.";
    const c6 = doc.story.find((c) => c.id === "c6");
    if (c6) {
      c6.blocks = c6.blocks.filter((b) => b.type !== "text");
      const lists = c6.blocks.filter((b) => b.type === "list");
      const [first, second] = lists;
      if (first?.type === "list")
        first.body = ul(["Most-booked in the user’s city", "Upcoming festivals", "What’s trending"]);
      if (second?.type === "list")
        second.body = ul(["Gotra and important dates", "Date-based suggestions", "A “For you” carousel"]);
    }
  } else {
    const labels = ["monthly orders per user", "WhatsApp conversion", "regional languages"];
    labels.forEach((label, i) => {
      const o = doc.outcomes[i];
      if (o) o.label = label;
    });
    setText(
      doc,
      "c1",
      0,
      "<p>Improve <strong>order frequency</strong>: monthly puja orders per user, for Sri Mandir’s puja service.</p>",
    );
    setText(
      doc,
      "c5",
      0,
      "<p>WhatsApp as a dual-purpose channel: bite-sized product education, and booking without ever leaving the chat.</p>",
    );
    const metric = doc.outcomes.find((o) => o.id === "o-60s");
    if (metric) metric.label = "from tap to confirmed puja";
    setText(
      doc,
      "c6",
      0,
      "<p>Collect details like gotra and important dates at the right moment, when a user taps a puja, and always explain the benefit.</p>",
    );
  }
}

/** The documents for one parity width: the base for 1440, the condensed copy for 834 and 390. */
export function atWidth<T extends Docs>(width: FixtureWidth, docs: T): T {
  if (width === 1440) return docs;
  const projects = docs.projects.map(({ slug, document }) => {
    const doc = structuredClone(document);
    const card = CARDS[width][slug];
    if (card) applyCard(doc, card);
    if (slug === "puja-engagement-platform") pujaAt(width, doc);
    return { slug, document: doc };
  });
  // Contact's intro is one sentence on both condensed boards.
  const layout: SiteLayout = {
    ...docs.layout,
    sections: docs.layout.sections.map((s) =>
      s.kind === "contact" && s.header
        ? {
            ...s,
            header: { ...s.header, intro: "Open to Senior / Lead PM roles in health-tech, consumer and fintech." },
          }
        : s,
    ),
  };
  return { ...docs, profile: profileAt(width, docs.profile), layout, projects };
}
