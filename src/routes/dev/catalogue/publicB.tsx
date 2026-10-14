import type { ReactNode } from "react";

import { Brush } from "~/components/hero/Brush";
import { FloatingPreview } from "~/components/hero/FloatingPreview";
import { InkPanel } from "~/components/hero/InkPanel";
import { AccordionRow } from "~/components/accordion/AccordionRow";
import { ExperienceList, type ExperienceItem } from "~/components/experience/ExperienceList";
import { ContactBlock } from "~/components/contact/ContactBlock";
import { SiteFooter } from "~/components/footer/SiteFooter";
import { type OffDutyItem, OffDutyPage } from "~/components/offduty/OffDutyPage";
import { type SkillGroup, type SkillSize, SkillsCloud } from "~/components/skills/SkillsCloud";
import type { Testimonial } from "~/components/testimonials/TestimonialCard";
import { Testimonials } from "~/components/testimonials/Testimonials";
import { ProofStrip } from "~/components/proof/ProofStrip";
import { ACCENT_COLOURS } from "~/lib/accents";

import { Specimen, State } from "./Specimen";

/** A full-width state: the Specimen stage is a wrapping flex row. */
function Wide({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ flex: "1 1 100%", minWidth: 0 }}>
      <State label={label}>{children}</State>
    </div>
  );
}

/** The hero text column as the Home board draws it (illustrative copy; the hero itself is M2). */
function HeroText() {
  return (
    <>
      <div
        style={{
          margin: 0,
          fontFamily: "var(--fd)",
          fontStretch: "62%",
          fontWeight: 800,
          fontSize: "clamp(64px, 8.4vw, 126px)",
          lineHeight: 0.86,
          textTransform: "uppercase",
          textShadow: "5px 5px 0 var(--ac)",
        }}
      >
        Akarshan
        <br />
        Kumar<span style={{ color: "var(--ac)", textShadow: "none" }}>.</span>
      </div>
      <Brush />
      <p
        style={{
          margin: "22px 0 0",
          maxWidth: 720,
          fontSize: "clamp(22px, 2.2vw, 30px)",
          lineHeight: 1.28,
          letterSpacing: "-.015em",
          color: "var(--tx2)",
        }}
      >
        I build <span style={{ color: "var(--tx)" }}>AI-native health products</span> — and the{" "}
        <span style={{ color: "var(--tx)" }}>data platforms</span> that prove they work.
      </p>
    </>
  );
}

const FLOATERS = [
  {
    volume: "01",
    title: "3D body scan for GLP-1 users",
    kicker: "Shipped · AI",
    value: "±2–3 pp",
    result: "achieved",
    accent: ACCENT_COLOURS.teal.accent,
    href: "#vol-01",
  },
  {
    volume: "03",
    title: "The CGM journey, end to end",
    kicker: "Shipped · Hardware to app",
    value: "42 → 72",
    result: "achieved",
    accent: ACCENT_COLOURS.sky.accent,
    href: "#vol-03",
  },
  {
    volume: "05",
    title: "Puja engagement platform",
    kicker: "Strategy + prototype",
    value: "+30%",
    result: "target",
    accent: ACCENT_COLOURS.coral.accent,
    href: "#vol-05",
  },
] as const;
/** M-HERO-FLOATERS · REST: x%, y%, rotate°, and each zone's depth. */
const REST = [
  [76, 9, 2, 200],
  [71, 42, -2, 150],
  [76, 73, 1.5, 180],
] as const;

function HeroSpecimen() {
  return (
    <Specimen
      title="C10 · Hero ink panel · C11 · Floating preview"
      board="Home*.dc.html · #top .ink, .fl .tz"
    >
      <Wide label="Rest pose, three floaters at their rest spots">
        <InkPanel
          volumeRange="01—09"
          floaters={FLOATERS.map((f, i) => {
            const [x, y, r, z] = REST[i] ?? REST[0];
            return <FloatingPreview key={f.volume} {...f} x={x} y={y} z={z} r={r} />;
          })}
        >
          <HeroText />
        </InkPanel>
      </Wide>
      <Wide label="Hero motion off, no published volumes, no floaters">
        <InkPanel motion={false}>
          <HeroText />
        </InkPanel>
      </Wide>
      <State label="C11 · value without a label, no kicker">
        <div style={{ position: "relative", width: 300, height: 140 }}>
          <FloatingPreview
            volume="06"
            title="Arcana Workspace"
            value="7"
            accent={ACCENT_COLOURS.slate.accent}
            href="#vol-06"
            x={0}
            y={0}
            z={0}
            r={0}
          />
        </div>
      </State>
      <State label="C11 · projected, baseline, output">
        <div style={{ position: "relative", width: 300, height: 140 }}>
          <FloatingPreview
            volume="09"
            title="Revenue growth strategy"
            kicker="Strategy + prototype"
            value="+$50–65K"
            result="projected"
            accent={ACCENT_COLOURS.lime.accent}
            href="#vol-09"
            x={0}
            y={0}
            z={0}
            r={0}
          />
        </div>
      </State>
    </Specimen>
  );
}

const PROOF = [
  {
    id: "p1",
    value: "230M+",
    label: "devices personalised and served",
    source: "Glance · InMobi",
  },
  {
    id: "p2",
    value: "$2M",
    unit: "ARR",
    label: "unlocked via Tracfone, Japan and Brazil",
    source: "Glance · InMobi",
  },
  { id: "p3", value: "₹3.6 Cr", label: "in month one from a GLP-1 app I built 0→1", source: "Sugar.fit" },
  {
    id: "p4",
    value: "~₹1.5 Cr",
    unit: "/yr",
    label: "saved by in-housing vendor services",
    source: "Sugar.fit",
  },
];
const SPACES = [
  "AI-native health",
  "Hardware-to-app (CGM)",
  "Personalisation & serving",
  "Data platforms",
  "Growth funnels",
  "Monetisation",
  "0→1",
];

function ProofSpecimen() {
  return (
    <Specimen title="C12 · Proof strip cell" board="Home*.dc.html · aria-label=Highlights">
      <Wide label="Four cells with units and sources, then Problem spaces">
        <ProofStrip items={PROOF} spaces={{ label: "Problem spaces", items: SPACES }} />
      </Wide>
      <Wide label="No sources, no units, no chips">
        <ProofStrip items={PROOF.slice(0, 2).map(({ id, value, label }) => ({ id, value, label }))} />
      </Wide>
    </Specimen>
  );
}

const hl = (id: string, bold: string, rest: string) => ({
  id,
  text: (
    <>
      <strong>{bold}</strong> — {rest}
    </>
  ),
});
const EXPERIENCE: ExperienceItem[] = [
  {
    id: "sugarfit",
    company: "Sugar.fit",
    jobTitle: "Product Manager",
    location: "Bengaluru",
    dates: "May 2025 — now",
    summary:
      "Own product for GLP-1, Type 2 diabetes and Active Foods D2C, reporting to the co-founder/CPO. Lead the Central Analytics team: 3 direct reports, 10 analysts across growth, marketing, clinical, ops, product and D2C.",
    highlights: [
      {
        id: "g1",
        title: "AI-native products",
        items: [
          hl("a1", "3D body scan", "±2–3 pp vs BIA (n=110)"),
          hl("a2", "In-house rPPG + PPG", "₹84L–1.2Cr/yr saved"),
          hl("a3", "AI food logging", "62% of logs, +34%"),
          hl("a4", "Support automation", "73% auto-resolved, TAT 80 → 32 h"),
        ],
      },
      {
        id: "g2",
        title: "Data & platforms",
        items: [
          hl("b1", "BigQuery / Dataform", "one KPI truth, $48K/yr saved"),
          hl("b2", "Commerce off Shopify", "self-serve offers and pricing tests"),
          hl("b3", "WhatsApp CRM", "send rate 70% → 98%"),
        ],
      },
      {
        id: "g3",
        title: "Consumer product",
        items: [
          hl("c1", "CGM journey", "CSAT 42 → 72, ₹3.2 Cr saved"),
          hl("c2", "T2D renewals", "+20%, +₹17–20L a month"),
          hl("c3", "GLP-1 app 0→1", "52% renewal"),
          hl("c4", "Active Foods", "AOV +7%, COD returns −25%"),
        ],
      },
    ],
  },
  {
    id: "glance",
    company: "Glance (InMobi Group)",
    jobTitle: "Product Manager",
    location: "Bengaluru",
    dates: "May 2022 — May 2025",
    summary: "Owned personalisation, content experience and the serving stack for 230M+ lockscreen users.",
    highlights: [
      {
        id: "h1",
        items: [
          {
            id: "i1",
            text: (
              <>
                Rebuilt serving-funnel rendering and tracking: <strong>serving +22%, CTR 1.7×</strong>
              </>
            ),
          },
          {
            id: "i2",
            text: (
              <>
                ML-clustered Summaries &amp; Collections: <strong>1.4M DAU, L0 engagement +21%</strong>
              </>
            ),
          },
          {
            id: "i3",
            text: (
              <>
                <strong>$1.4M ARR</strong> via Tracfone; <strong>$600K ARR</strong> from Japan and Brazil
              </>
            ),
          },
          { id: "i4", text: "Owned GDPR readiness that unblocked the EU launch" },
          { id: "i5", text: "A hidden placeholder bullet", hidden: true },
        ],
      },
    ],
  },
  {
    id: "razorpay",
    company: "Razorpay",
    jobTitle: "Senior Product Analyst",
    dates: "Jul — Sep 2021",
    summary: (
      <>
        <strong>+30% sign-ups and +23% MTU</strong> from a redesigned signup funnel and activation flow.
      </>
    ),
  },
  {
    id: "wipro",
    company: "Wipro Analytics",
    jobTitle: "Senior Analyst",
    dates: "Aug 2017 — Jan 2021",
    highlights: [
      {
        id: "h1",
        items: [
          { id: "i1", text: "Data initiatives for Uber GSS operations across 64 languages" },
          { id: "i2", text: "Also Lloyds Banking Group and Capital One" },
        ],
      },
    ],
  },
];
const EDUCATION: ExperienceItem[] = [
  {
    id: "bit",
    company: "BIT Mesra, Ranchi",
    jobTitle: "Integrated M.Sc. Mathematics & Computing, with distinction.",
    dates: "2012 — 2017",
  },
];
const V0_FEATURED: ExperienceItem = {
  id: "v0",
  company: "SugarFit",
  jobTitle: "Senior Product Manager",
  location: "Bengaluru",
  dates: "May 2025 — Present",
  highlights: [
    {
      id: "h1",
      items: ["one", "two", "three", "four", "five"].map((n, i) => ({
        id: `i${i + 1}`,
        text: `Ungrouped bullet ${n}, as V0's entries are`,
      })),
    },
  ],
};

function ExperienceSpecimen() {
  return (
    <Specimen title="C13 · Experience entry · C14 · Accordion row" board="Home*.dc.html · #experience, .acc">
      <Wide label="Featured (grouped: cards), Standard, Compact (summary; joined bullets), Education">
        <ExperienceList entries={EXPERIENCE} education={EDUCATION} />
      </Wide>
      <Wide label="Featured with ungrouped highlights (V0): bullet grid; phones show four, then expand">
        <ExperienceList entries={[V0_FEATURED]} />
      </Wide>
      <Wide label="C14 · accordion row, closed and open">
        <AccordionRow title="Vedantu" subtitle="Senior Product Analyst · 2021">
          <p style={{ margin: 0, color: "var(--tx2)", fontSize: 15, lineHeight: 1.6 }}>
            +800 daily inbound leads from Book Online Demo experiments.
          </p>
        </AccordionRow>
        <AccordionRow title="BIT Mesra" subtitle="M.Sc. Mathematics & Computing · 2012–2017" defaultOpen>
          <p style={{ margin: 0, color: "var(--tx2)", fontSize: 15, lineHeight: 1.6 }}>
            Integrated M.Sc. Mathematics &amp; Computing, with distinction.
          </p>
        </AccordionRow>
      </Wide>
    </Specimen>
  );
}

/** Home.dc.html › this.SK, with the board's example sizes. */
const SK: [string, string, [string, SkillSize][]][] = [
  [
    "Product",
    "Strategy & execution",
    [
      ["User & Market Research", "l"],
      ["Feature Prioritisation", "m"],
      ["Road-mapping", "m"],
      ["Stakeholder Management", "s"],
      ["A/B Testing", "xl"],
      ["Experimentation", "m"],
      ["Data-driven Development", "s"],
    ],
  ],
  [
    "Data",
    "My unfair advantage",
    [
      ["SQL", "xl"],
      ["Web (Clickstream) Analytics", "m"],
      ["Product & Data Analytics", "l"],
      ["Visualization & Story Telling", "s"],
      ["ETL", "m"],
    ],
  ],
  [
    "Design",
    "Pixel-perfect craft",
    [
      ["FigmaMake", "l"],
      ["Prototyping", "m"],
      ["Wireframing", "s"],
      ["Napkin.ai", "s"],
    ],
  ],
  [
    "Tools",
    "The full stack",
    [
      ["Excel", "s"],
      ["Lovable", "m"],
      ["Mixpanel", "l"],
      ["Metabase", "m"],
      ["Tableau", "s"],
      ["Optimizely", "s"],
      ["Redash", "s"],
      ["Superset", "m"],
      ["Figma", "m"],
      ["JIRA", "s"],
      ["Amplitude", "l"],
      ["Airflow", "m"],
    ],
  ],
];
const skillGroups = (regular: boolean): SkillGroup[] =>
  SK.map(([title, subtitle, items], g) => ({
    id: `g${g}`,
    title,
    subtitle,
    items: items.map(([text, size], i) => ({ id: `s${g}-${i}`, text, size: regular ? "m" : size })),
  }));

function SkillsSpecimen() {
  return (
    <Specimen title="C15 · Skills cloud" board="Home*.dc.html · #skills .cloud">
      <Wide label="Sizes set in Studio (example). Hover, focus or click a group word">
        <SkillsCloud groups={skillGroups(false)} />
      </Wide>
      <Wide label="V0: every skill regular">
        <SkillsCloud groups={skillGroups(true)} />
      </Wide>
    </Specimen>
  );
}

/** The Home board's three testimonials, repeated to show paging (illustrative). */
const BOARD_TESTI: [Omit<Testimonial, "id">, Omit<Testimonial, "id">, Omit<Testimonial, "id">] = [
  {
    quote:
      "Akarshan was my PM on multiple projects through the TV Integration with a leading OEM. He brought a lot of user first approaches to the table, which led to deep business as well as user impact. His ability to get everyone on the same page and turn the wheel is what really worked for the product.",
    name: "Anmol Loonia",
    role: "Design Leader, Consumer AI · Glance",
    initials: "AL",
    avatar: { background: "#2A2033", color: "#D9C2F7" },
    linkedin: "https://www.linkedin.com/",
  },
  {
    quote:
      "Akarshan is one of the sharpest product minds I have had the pleasure of working with. His ability to break down complex problems, ask the right questions, and approach every decision with a data-driven mindset made a huge impact on our work.",
    name: "Pallav Srivastava",
    role: "SDE 4 (Android) · Glance",
    initials: "PS",
    avatar: { background: "#2C2A16", color: "#F3DE8A" },
    linkedin: "https://www.linkedin.com/",
  },
  {
    quote:
      "The striking thing about working with him is his Conviction. The conviction that arises out of a detailed and thorough thought process. A great asset to work with.",
    name: "Vishal Gopal",
    role: "Product · Glance",
    initials: "VG",
    avatar: { background: "#10283A", color: "#9ADFFF" },
  },
];
const TESTI: Testimonial[] = Array.from({ length: 7 }, (_, i) => ({
  id: `t${i}`,
  ...(BOARD_TESTI[i % 3] ?? BOARD_TESTI[0]),
}));

function TestiHeading({ count }: { count?: number }) {
  return (
    <>
      <div className="mono" style={{ fontWeight: 500, color: "var(--act)" }}>
        Testimonials{count ? ` · ${count}` : ""}
      </div>
      <h3
        style={{
          margin: "14px 0 0",
          fontFamily: "var(--fd)",
          fontStretch: "68%",
          fontWeight: 800,
          fontSize: "clamp(36px, 4.2vw, 54px)",
          lineHeight: 0.95,
          textTransform: "uppercase",
        }}
      >
        What teammates say.
      </h3>
    </>
  );
}

function TestimonialsSpecimen() {
  return (
    <Specimen title="C16 · Testimonial card" board="Home*.dc.html · #testimonials figure">
      <Wide label="Seven: laptop pages 1–3 of 7; iPad and phone swipe with dots">
        <div style={{ background: "var(--bg2)", padding: "24px 0 24px 24px" }}>
          <TestimonialsHeadingless items={TESTI} />
        </div>
      </Wide>
      <Wide label="Three: no paging; one without a LinkedIn link">
        <div style={{ background: "var(--bg2)", padding: "24px 0 24px 24px" }}>
          <Testimonials heading={<TestiHeading />} items={TESTI.slice(0, 3)} />
        </div>
      </Wide>
    </Specimen>
  );
}

function TestimonialsHeadingless({ items }: { items: Testimonial[] }) {
  return <Testimonials heading={<TestiHeading count={items.length} />} items={items} />;
}

/** Home.dc.html › #offduty, the board's six panels and eight picks. */
const OFF: OffDutyItem[] = [
  {
    id: "anime",
    label: "Passion",
    title: "Anime",
    text: "Big fan of layered storytelling — the kind where every detail from episode 1 pays off in the finale. AoT, Vinland Saga, FMA, and JJK are my benchmarks for what great narrative looks like.",
    tag: "Currently watching",
    ...ACCENT_COLOURS.coral,
    art: "kunai",
    picks: [
      ["Attack on Titan", "Action · Strategy"],
      ["Demon Slayer", "Action · Visual Art"],
      ["Death Note", "Psychological · Thriller"],
      ["Fullmetal Alchemist", "Adventure · Deep"],
      ["Jujutsu Kaisen", "Action · Current"],
      ["One Punch Man", "Comedy · Power"],
      ["Vinland Saga", "Historical · Epic"],
      ["Haikyuu!!", "Sports · Motivation"],
    ].map(([title, note], i) => ({ id: `pick${i}`, title: title ?? "", note: note ?? "" })),
  },
  {
    id: "sketch",
    label: "Creative",
    title: "Sketching",
    text: "I sketch to think — on notebooks, sticky notes, whatever’s nearby. It’s how I get ideas out of my head before they disappear. Mostly rough wireframes and random diagrams.",
    tag: "Product flows",
    ...ACCENT_COLOURS.yellow,
    art: "pencil",
  },
  {
    id: "tt",
    label: "Sport",
    title: "Table Tennis",
    text: "Been playing TT for years — it’s the one sport where I genuinely enjoy losing because it means I’m playing someone better. Best stress relief I’ve found so far.",
    tag: "Competitive player",
    ...ACCENT_COLOURS.sky,
    art: "paddle",
  },
  {
    id: "cook",
    label: "At home",
    title: "Cooking",
    text: "I cook mostly Indian and continental. Weekends I’ll try something new — sometimes it’s great, sometimes it’s a disaster. The kitchen is the one place I’m happy either way.",
    tag: "Weekend chef",
    ...ACCENT_COLOURS.amber,
    art: "pan",
  },
  {
    id: "travel",
    label: "Explorer",
    title: "Travel",
    text: "Love the feeling of landing somewhere new and figuring it out. No rigid itineraries — just a list of things worth seeing and room for whatever happens in between.",
    tag: "Always planning next",
    ...ACCENT_COLOURS.green,
    art: "plane",
  },
  {
    id: "photo",
    label: "Visual",
    title: "Photography",
    text: "Street and travel photography on my phone mostly. Chasing light, interesting faces, and scenes that tell a story without a caption.",
    tag: "Street & travel",
    ...ACCENT_COLOURS.violet,
    art: "camera",
  },
];

function OffDutySpecimen() {
  return (
    <Specimen title="C17 · Off duty page" board="Home*.dc.html · #offduty .opage">
      <Wide label="Six panels, the six art presets, the spine shelf (phones: the rail, dots and shelf)">
        <OffDutyPage items={OFF} />
      </Wide>
      <Wide label="Five: the bottom row stretches to 6 + 6; no picks">
        <OffDutyPage items={OFF.slice(0, 5).map((o) => ({ ...o, picks: [] }))} />
      </Wide>
      <Wide label="Two: the big panel and the side stack; no tag on the second">
        <OffDutyPage items={OFF.slice(0, 2).map((o, i) => (i ? { ...o, tag: "" } : o))} />
      </Wide>
    </Specimen>
  );
}

function ContactSpecimen() {
  return (
    <Specimen title="C18 · Contact block" board="Home*.dc.html · #contact">
      <Wide label="Every link set; Copy email reads Copied for 2s">
        <ContactBlock
          kicker="Thanks for reading"
          title="Let’s build something"
          titleAccent="impactful."
          intro="Open to Senior / Lead PM roles in health-tech, consumer and fintech. Data fluency, clinical context, and the ability to ship — fast."
          email="owner@example.test"
          linkedin="https://www.linkedin.com/"
          github="https://github.com/"
          resume="#resume"
        />
      </Wide>
      <Wide label="Email only: no LinkedIn, GitHub or résumé">
        <ContactBlock
          kicker="Thanks for reading"
          title="Let’s build something"
          titleAccent="impactful."
          email="owner@example.test"
        />
      </Wide>
    </Specimen>
  );
}

function FooterSpecimen() {
  return (
    <Specimen title="C19 · Footer" board="Home*.dc.html · footer">
      <Wide label="Home: credit and last updated">
        <SiteFooter
          year={2026}
          name="Akarshan Kumar"
          credit="Vibe-coded in Bengaluru"
          updated="13 Oct 2026"
        />
      </Wide>
      <Wide label="Case study: back to all work">
        <SiteFooter year={2026} name="Akarshan Kumar" back={{ href: "/work", label: "Back to all work" }} />
      </Wide>
      <Wide label="No credit, no date">
        <SiteFooter year={2026} name="Akarshan Kumar" />
      </Wide>
    </Specimen>
  );
}

/** Catalogue specimens for the public track, part B (C10–C19). Each component adds a <Specimen> here. */
export default function PublicBSpecimens() {
  return (
    <>
      <HeroSpecimen />
      <ProofSpecimen />
      <ExperienceSpecimen />
      <SkillsSpecimen />
      <TestimonialsSpecimen />
      <OffDutySpecimen />
      <ContactSpecimen />
      <FooterSpecimen />
    </>
  );
}
