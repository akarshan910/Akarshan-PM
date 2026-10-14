/**
 * Catalogue specimens for the public track, part A (C1–C9). Each component shows every variant and
 * state. The copy is the boards' illustrative copy; the catalogue never ships.
 */
import arcanaCover from "../../../../design/covers/arcana-workspace.webp?url";
import pujaCover from "../../../../design/covers/puja-engagement-platform.webp?url";

import { Button, IconButton } from "~/components/buttons/Button";
import { TextLink } from "~/components/buttons/TextLink";
import { RESULT_LABELS, ResultLabel, type ResultType } from "~/components/labels/ResultLabel";
import { SectionHeader } from "~/components/labels/SectionHeader";
import { AvailabilityChip, Chip, FilterChip, StatusBadge, VolumeTag } from "~/components/labels/Tags";
import { PhoneMenu } from "~/components/nav/PhoneMenu";
import { PillNav } from "~/components/nav/PillNav";
import { ClosingTile } from "~/components/cards/ClosingTile";
import { CompactRow, LeadCard, StandardCard, type ProjectCardData } from "~/components/cards/ProjectCard";
import { Shelf } from "~/components/shelf/Shelf";
import { ACCENT_COLOURS } from "~/lib/accents";
import type { Accent } from "~/lib/types";

import { Specimen, State } from "./Specimen";

const RESULT_TYPES = Object.keys(RESULT_LABELS) as ResultType[];

/** The boards' five links, pointing at the catalogue's own specimens so the live nav can spy on them. */
const BOARD_LINKS = [
  { id: "work", label: "Work", href: "#work" },
  { id: "about", label: "About", href: "#about" },
  { id: "experience", label: "Exp", href: "#experience" },
  { id: "skills", label: "Skills", href: "#skills" },
  { id: "testimonials", label: "Testimonial", href: "#testimonials" },
];
const LIVE_LINKS = [
  { id: "c3-buttons", label: "Buttons", href: "#c3-buttons" },
  { id: "c4-section-header", label: "Header", href: "#c4-section-header" },
  { id: "c5-result-label", label: "Labels", href: "#c5-result-label" },
  { id: "c6-tags-badges-and-chips", label: "Tags", href: "#c6-tags-badges-and-chips" },
  { id: "c7-project-card", label: "Cards", href: "#c7-project-card" },
];
const noop = () => undefined;

function Navigation() {
  return (
    <>
      {/* The live nav: fixed, with the scroll-spy over the specimens below. "C8 · Shelf" stands in for Contact. */}
      <PillNav
        links={LIVE_LINKS}
        heroId="c1-pill-nav"
        contactId="c8-shelf"
        letsTalk={{ href: "#c8-shelf" }}
        skipTo="#c7-project-card"
        email="owner@example.test"
        linkedin="https://www.linkedin.com/"
        resume="#resume"
      />
      <Specimen title="C1 · Pill nav" board="Home.dc.html · nav.pill; src/legacy/portfolio.css #nav">
        <State label="Over the hero · no link active">
          <PillNav position="static" links={BOARD_LINKS} letsTalk={{ href: "#contact" }} current="top" />
        </State>
        <State label="Work current · sliding highlight">
          <PillNav position="static" links={BOARD_LINKS} letsTalk={{ href: "#contact" }} current="work" />
        </State>
        <State label="Skills current">
          <PillNav position="static" links={BOARD_LINKS} letsTalk={{ href: "#contact" }} current="skills" />
        </State>
        <State label="Contact current · Let’s Talk glows">
          <PillNav position="static" links={BOARD_LINKS} letsTalk={{ href: "#contact" }} current="contact" />
        </State>
      </Specimen>
      <Specimen title="C2 · Phone menu" board="HomeMobile.dc.html · nav: menu open (.mmenu)">
        <State label="Open · Work current">
          <div
            style={{
              position: "relative",
              width: "min(390px, calc(100vw - 88px))",
              height: 844,
              overflow: "hidden",
              borderRadius: 24,
              background: "var(--bg)",
            }}
          >
            <PhoneMenu
              id="catalogue-menu"
              contained
              links={BOARD_LINKS}
              current="work"
              letsTalk={{ href: "#contact" }}
              email="owner@example.test"
              linkedin="https://www.linkedin.com/"
              resume="#resume"
              onNavigate={(event) => {
                event.preventDefault();
              }}
              onClose={noop}
            />
          </div>
        </State>
      </Specimen>
    </>
  );
}

function Buttons() {
  return (
    <Specimen title="C3 · Buttons" board="System.dc.html · Components; Home.dc.html · .cta, .cta2">
      <State label="Primary · default">
        <Button href="#work" iconEnd="arrow-down">
          See selected work
        </Button>
      </State>
      <State label="Primary · disabled">
        <Button disabled>Disabled</Button>
      </State>
      <State label="Primary · loading">
        <Button loading loadingLabel="Sending">
          Send
        </Button>
      </State>
      <State label="Secondary">
        <Button variant="secondary" href="#resume" icon="download">
          Résumé (PDF)
        </Button>
      </State>
      <State label="Secondary · compact">
        <Button variant="secondary" size="compact" href="#resume" icon="download">
          Full résumé
        </Button>
      </State>
      <State label="Ghost">
        <Button variant="ghost">Ghost</Button>
      </State>
      <State label="Destructive">
        <Button variant="destructive">Delete project</Button>
      </State>
      <State label="Icon button">
        <IconButton icon="more" label="More actions" />
      </State>
      <State label="Round · disabled, enabled">
        <div style={{ display: "flex", gap: 12 }}>
          <IconButton icon="arrow-left" shape="round" label="Previous testimonials" disabled />
          <IconButton icon="arrow-right" shape="round" label="Next testimonials" />
        </div>
      </State>
      <State label="Primary · phone menu, full width">
        <div style={{ width: 350 }}>
          <Button size="menu" block href="#contact">
            Let’s Talk →
          </Button>
        </div>
      </State>
      <State label="Text link · underline">
        <TextLink href="#work">All work →</TextLink>
      </State>
      <State label="Text link · inline">
        <div style={{ display: "flex", gap: "10px 28px" }}>
          <TextLink variant="inline" href="#linkedin" icon="arrow-out">
            LinkedIn
          </TextLink>
          <TextLink variant="inline" href="#resume" icon="download">
            Résumé (PDF)
          </TextLink>
        </div>
      </State>
    </Specimen>
  );
}

function SectionHeaders() {
  return (
    <Specimen title="C4 · Section header" board="Home.dc.html · #work, #about header rows">
      <State label="Shelf · kicker, two-tone title, intro">
        <div style={{ width: "min(1200px, 80vw)" }}>
          <SectionHeader
            kicker="Selected work · Shipped"
            title="Shipped, measured,"
            titleMuted="explained."
            intro="AI-native health at Sugar.fit. Every number is labelled: achieved, target, projected or baseline."
          />
        </div>
      </State>
      <State label="Wide (About)">
        <div style={{ width: "min(1200px, 80vw)" }}>
          <SectionHeader
            variant="wide"
            kicker="How I work"
            title="Analyst first."
            titleMuted="Builder always."
            intro="Eight years across product and data, then product at Glance and Sugar.fit."
          />
        </div>
      </State>
      <State label="Title only (empty kicker and intro hide)">
        <SectionHeader title="Where I’ve built." />
      </State>
    </Specimen>
  );
}

function ResultLabels() {
  return (
    <Specimen title="C5 · Result label" board="System.dc.html · Result labels; Home.dc.html · .tag-a…o">
      {RESULT_TYPES.map((type) => (
        <State key={type} label={type}>
          <ResultLabel type={type} />
        </State>
      ))}
    </Specimen>
  );
}

function TagsAndChips() {
  return (
    <Specimen title="C6 · Tags, badges and chips" board="Home*.dc.html covers, hero, proof; System.dc.html">
      <State label="Volume tag · lead">
        <VolumeTag number="01" accent="#2DD4BF" size="lead" />
      </State>
      <State label="Volume tag · standard">
        <VolumeTag number="02" accent="#F5A524" />
      </State>
      <State label="Volume tag · compact (phone row)">
        <VolumeTag number="03" accent="#38BDF8" size="compact" />
      </State>
      <State label="Badge · prototype">
        <span style={{ display: "inline-flex", padding: 12, background: "#1C0C0F", borderRadius: 10 }}>
          <StatusBadge kind="prototype" />
        </span>
      </State>
      <State label="Badge · prototype, lead">
        <span style={{ display: "inline-flex", padding: 12, background: "#1C0C0F", borderRadius: 10 }}>
          <StatusBadge kind="prototype" lead />
        </span>
      </State>
      <State label="Badge · status">
        <span style={{ display: "inline-flex", padding: 12, background: "#0D1918", borderRadius: 10 }}>
          <StatusBadge kind="status" label="Shipped · AI" accent="#2DD4BF" />
        </span>
      </State>
      <State label="Chip">
        <div style={{ display: "flex", gap: 10 }}>
          <Chip>AI-native health</Chip>
          <Chip>0→1</Chip>
        </div>
      </State>
      <State label="Availability chip (pulse)">
        <AvailabilityChip>Open to Senior / Lead PM roles</AvailabilityChip>
      </State>
      <State label="Filter chip · selected, not selected">
        <div style={{ display: "flex", gap: 8 }}>
          <FilterChip pressed>All</FilterChip>
          <FilterChip pressed={false}>Shipped</FilterChip>
          <FilterChip pressed={false}>Strategy</FilterChip>
        </div>
      </State>
    </Specimen>
  );
}

/** The Home board's illustrative projects. */
function project(
  n: number,
  accent: Accent,
  rest: Omit<ProjectCardData, "href" | "volume" | "accent" | "ground">,
): ProjectCardData {
  const volume = String(n).padStart(2, "0");
  return { href: `#vol-${volume}`, volume, ...ACCENT_COLOURS[accent], ...rest };
}
const SHIPPED: ProjectCardData[] = [
  project(1, "teal", {
    company: "Sugar.fit",
    cardLabel: "AI-native health · 0→1",
    title: "3D body scan for GLP-1 users",
    summary:
      "Benchmarked open-source vision models, built the pipeline end to end, and retrained on an Indian dataset we collected.",
    status: "Shipped · AI",
    headline: { value: "±2–3 pp", line: "body fat vs 8-electrode BIA (n=110)", type: "achieved" },
    outcomes: [
      { value: "±2–3 pp", line: "body fat vs 8-electrode BIA (n=110)", type: "achieved" },
      { value: "₹84L–1.2Cr/yr", line: "vendor spend cut, with rPPG and PPG", type: "achieved" },
    ],
  }),
  project(2, "amber", {
    company: "Sugar.fit",
    cardLabel: "LLM · Consumer",
    title: "Image-based food logging",
    summary:
      "Gemini Flash names the dish; a verified nutrition catalogue supplies macros, with a model fallback.",
    headline: { value: "62%", line: "of all meal logs", type: "achieved" },
  }),
  project(3, "sky", {
    company: "Sugar.fit",
    cardLabel: "Hardware to app",
    title: "The CGM journey, end to end",
    summary: "Seven stages, from sensor delivery to the 14-day data experience.",
    headline: { value: "42 → 72", line: "CSAT · ₹3.2 Cr saved YoY", type: "achieved" },
  }),
  project(4, "violet", {
    company: "Sugar.fit",
    cardLabel: "Digital health · 0→1",
    title: "The GLP-1 app, 0→1",
    summary: "Owned the patient experience end to end with Clinical, Business and Ops.",
    headline: { value: "52%", line: "renewal · ₹3.6 Cr month one", type: "achieved" },
  }),
];
const STRATEGY: ProjectCardData[] = [
  project(5, "coral", {
    company: "Sri Mandir",
    cardLabel: "Consumer · Strategy + prototype",
    title: "Puja engagement platform",
    summary: "WhatsApp-native booking, recommendations and a spiritual calendar to lift repeat puja orders.",
    prototype: true,
    cover: { src: pujaCover, alt: "The puja booking app on a phone" },
    headline: { value: "+30%", line: "monthly orders per user", type: "target" },
    outcomes: [{ value: "+30%", line: "monthly orders per user", type: "target" }],
  }),
  project(6, "slate", {
    company: "Arcana",
    cardLabel: "Fintech B2B · PRD + prototype",
    title: "Arcana Workspace",
    summary:
      "A Bloomberg-style modular launchpad for institutional investors, from PRD to a working prototype.",
    prototype: true,
    cover: { src: arcanaCover, alt: "The Arcana workspace dashboard" },
    headline: { value: "7", line: "priority widgets in V1", type: "output" },
  }),
  project(7, "green", {
    company: "GLP Health",
    cardLabel: "Strategy",
    title: "GLP-1 digital scaffold",
    summary: "From activity tracker to an outcome-driven metabolic platform.",
    headline: { value: "64%", line: "of users lose >1 kg today", type: "baseline" },
  }),
  project(8, "yellow", {
    company: "Playsimple",
    cardLabel: "Word Trip · Strategy + prototype",
    title: "Word games monetisation",
    summary: "Onboarding, IAP and retention mechanics for Word Trip.",
    prototype: true,
    headline: { value: "6.5M → 8.8M", line: "monthly active users", type: "target" },
  }),
  project(9, "lime", {
    company: "Zynga",
    cardLabel: "FarmVille 3 · Strategy + prototype",
    title: "FarmVille 3 revenue growth",
    summary: "Subscription, consumables and community events.",
    prototype: true,
    headline: { value: "+$50–65K", line: "net new revenue a month", type: "projected" },
  }),
];
const ALL = [...SHIPPED, ...STRATEGY];
const SPECTRUM = ALL.map((p) => p.accent);
const BARE = project(10, "teal", { title: "[Your next project]" });

function Cards() {
  const [lead, second, third] = [SHIPPED[0], SHIPPED[1], STRATEGY[1]] as [
    ProjectCardData,
    ProjectCardData,
    ProjectCardData,
  ];
  return (
    <Specimen title="C7 · Project card" board="Home*.dc.html · #work, #strategy; WorkScale.dc.html">
      <State label="Lead · generated cover, status badge, two results">
        <div style={{ width: "min(1200px, 80vw)" }}>
          <LeadCard project={lead} />
        </div>
      </State>
      <State label="Standard · generated cover">
        <div style={{ width: 384 }}>
          <StandardCard project={second} />
        </div>
      </State>
      <State label="Standard · image, prototype badge">
        <div style={{ width: 384 }}>
          <StandardCard project={third} />
        </div>
      </State>
      <State label="Standard · failed image shows its alt text">
        <div style={{ width: 384 }}>
          <StandardCard
            project={
              {
                ...STRATEGY[3],
                cover: { src: "/missing-cover.webp", alt: "Word Trip’s onboarding" },
              } as ProjectCardData
            }
          />
        </div>
      </State>
      <State label="Standard · empty summary and headline hide">
        <div style={{ width: 384 }}>
          <StandardCard project={BARE} />
        </div>
      </State>
      <State label="Compact row (phones)">
        <div style={{ width: 350, display: "grid", gap: 12 }}>
          <CompactRow project={second} />
          <CompactRow project={third} />
          <CompactRow project={BARE} />
        </div>
      </State>
      <State label="All work tile (laptop, spanning two)">
        <div style={{ width: "min(800px, 80vw)", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <ClosingTile kind="all-work" href="/work" count={9} spectrum={SPECTRUM} span={2} />
        </div>
      </State>
      <State label="See all tile">
        <div style={{ width: 384, display: "grid" }}>
          <ClosingTile kind="see-all" href="/work?shelf=strategy" count={12} more={6} spectrum={SPECTRUM} />
        </div>
      </State>
      <State label="Closing rows (phones)">
        <div style={{ width: 350, display: "grid", gap: 12 }}>
          <ClosingTile kind="all-work" href="/work" count={9} layout="row" />
          <ClosingTile kind="see-all" href="/work?shelf=strategy" count={12} layout="row" />
        </div>
      </State>
    </Specimen>
  );
}

function Shelves() {
  return (
    <Specimen title="C8 · Shelf" board="Home*.dc.html · #work, #strategy; WorkScale.dc.html cap rules">
      <State label="Shipped · 4 projects (iPad gets All work)">
        <div style={{ width: "min(1100px, calc(100vw - 88px))" }}>
          <Shelf
            id="cat-shipped"
            kicker="Selected work · Shipped"
            title="Shipped, measured,"
            titleMuted="explained."
            intro="AI-native health at Sugar.fit. Every number is labelled: achieved, target, projected or baseline."
            projects={SHIPPED}
            rows={2}
            seeAllHref="/work?shelf=shipped"
            totalVolumes={ALL.length}
            spectrum={SPECTRUM}
          />
        </div>
      </State>
      <State label="Strategy · 5 projects (laptop gap of two gets All work)">
        <div style={{ width: "min(1100px, calc(100vw - 88px))" }}>
          <Shelf
            id="cat-strategy"
            kicker="Selected work · Strategy & prototypes"
            title="Decisions,"
            titleMuted="not features."
            intro="Product strategy studies: research, prioritisation and a working prototype you can try."
            projects={STRATEGY}
            rows={2}
            seeAllHref="/work?shelf=strategy"
            totalVolumes={ALL.length}
            spectrum={SPECTRUM}
          />
        </div>
      </State>
      <State label="Over the cap · 9 projects, 1 row (See all 9)">
        <div style={{ width: "min(1100px, calc(100vw - 88px))" }}>
          <Shelf
            id="cat-cap"
            kicker="Selected work · Everything"
            title="Over"
            titleMuted="the cap."
            projects={ALL}
            rows={1}
            seeAllHref="/work?shelf=all"
            totalVolumes={ALL.length}
            spectrum={SPECTRUM}
          />
        </div>
      </State>
      <State label="Empty · the shelf hides, header included">
        <Shelf
          id="cat-empty"
          title="Nothing"
          projects={[]}
          rows={1}
          seeAllHref="/work"
          totalVolumes={0}
          spectrum={[]}
        />
      </State>
    </Specimen>
  );
}

export default function PublicASpecimens() {
  return (
    <>
      <Navigation />
      <Buttons />
      <SectionHeaders />
      <ResultLabels />
      <TagsAndChips />
      <Cards />
      <Shelves />
    </>
  );
}
