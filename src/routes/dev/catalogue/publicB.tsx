import type { ReactNode } from "react";

import { Brush } from "~/components/hero/Brush";
import { FloatingPreview } from "~/components/hero/FloatingPreview";
import { InkPanel } from "~/components/hero/InkPanel";
import { SiteFooter } from "~/components/footer/SiteFooter";
import { ProofStrip } from "~/components/proof/ProofStrip";

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
    accent: "#2DD4BF",
    href: "#vol-01",
  },
  {
    volume: "03",
    title: "The CGM journey, end to end",
    kicker: "Shipped · Hardware to app",
    value: "42 → 72",
    result: "achieved",
    accent: "#38BDF8",
    href: "#vol-03",
  },
  {
    volume: "05",
    title: "Puja engagement platform",
    kicker: "Strategy + prototype",
    value: "+30%",
    result: "target",
    accent: "#FF5A67",
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
            accent="#94A3B8"
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
            accent="#A3E635"
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
      <FooterSpecimen />
    </>
  );
}
