/**
 * Catalogue specimens for the public track, part A (C1–C9). Each component shows every variant and
 * state. The copy is the boards' illustrative copy; the catalogue never ships.
 */
import { Button, IconButton } from "~/components/buttons/Button";
import { TextLink } from "~/components/buttons/TextLink";
import { RESULT_LABELS, ResultLabel, type ResultType } from "~/components/labels/ResultLabel";
import { SectionHeader } from "~/components/labels/SectionHeader";
import { AvailabilityChip, Chip, FilterChip, StatusBadge, VolumeTag } from "~/components/labels/Tags";

import { Specimen, State } from "./Specimen";

const RESULT_TYPES = Object.keys(RESULT_LABELS) as ResultType[];

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

export default function PublicASpecimens() {
  return (
    <>
      <Buttons />
      <SectionHeaders />
      <ResultLabels />
      <TagsAndChips />
    </>
  );
}
