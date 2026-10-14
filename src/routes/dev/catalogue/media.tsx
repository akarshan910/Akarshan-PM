import { type CSSProperties, type ReactNode, useState } from "react";

import { Image } from "~/components/media/Image";
import { Lightbox, type LightboxItem } from "~/components/media/Lightbox";
import { PrototypeEmbed } from "~/components/media/PrototypeEmbed";
import type { ImageData } from "~/components/media/types";
import { VideoEmbed } from "~/components/media/VideoEmbed";
import { ErrorState } from "~/components/states/ErrorState";
import { ExpiredPreview } from "~/components/states/ExpiredPreview";
import { MovedNote } from "~/components/states/MovedNote";
import { NoResults } from "~/components/states/NoResults";
import { NotFound } from "~/components/states/NotFound";
import { ChangedMark, PreviewBar } from "~/components/states/PreviewBar";
import { ACCENT_COLOURS } from "~/lib/accents";

import { Specimen, State } from "./Specimen";

// Dev-only: the V0 covers, imported from design/ so nothing is copied into public/.
import arcana from "../../../../design/covers/arcana-workspace.webp";
import glp from "../../../../design/covers/glp-1-digital-scaffold.webp";
import puja from "../../../../design/covers/puja-engagement-platform.webp";
import revenue from "../../../../design/covers/revenue-growth-strategy.webp";
import words from "../../../../design/covers/word-games-monetisation-strategy.webp";

const cover = (src: string, alt: string, dominant: string): ImageData => ({
  src,
  width: 1600,
  height: 1000,
  alt,
  dominant,
});

const PUJA = cover(puja, "Puja engagement platform cover", ACCENT_COLOURS.coral.ground);
const GALLERY: LightboxItem[] = [
  { image: PUJA, caption: "Booking" },
  { image: cover(glp, "GLP-1 digital scaffold cover", ACCENT_COLOURS.violet.ground), caption: "Scaffold" },
  { image: cover(revenue, "Revenue growth strategy cover", ACCENT_COLOURS.lime.ground) },
  { image: cover(arcana, "Arcana workspace cover", ACCENT_COLOURS.teal.ground), caption: "Workspace" },
  { image: cover(words, "Word games monetisation strategy cover", ACCENT_COLOURS.amber.ground) },
];

/** Board copy: the catalogue may use it; the site never does. */
const PROTO = "https://prototypes.example/sri-mandir";
const NAME = "Sri Mandir prototype";
const CARD: CSSProperties = { width: "min(340px, calc(100vw - 88px))" };
const WIDE: CSSProperties = { width: "min(690px, calc(100vw - 88px))" };
const PHONE: CSSProperties = { width: "min(390px, calc(100vw - 88px))" };
const SHEET_LABELS = { loading: "loading", running: "open", error: "didn’t load" } as const;

function Card({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div style={wide ? WIDE : CARD}>{children}</div>;
}

/** The board's `.page` frame around a page state. */
function Page({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <div
      style={{
        ...WIDE,
        minHeight: 340,
        padding: center ? "40px clamp(16px, 3vw, 40px)" : "84px clamp(16px, 3vw, 40px) 40px",
        border: "1px solid rgba(242,241,238,.12)",
        borderRadius: 14,
        background: "#0B0B0E",
        display: center ? "grid" : "block",
        placeItems: center ? "center" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function LightboxDemo() {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
        {GALLERY.map((item, i) => (
          <button
            key={item.image.src}
            type="button"
            aria-label={`Enlarge image ${i + 1} of ${GALLERY.length}`}
            style={{
              padding: 0,
              border: 0,
              background: "none",
              cursor: "zoom-in",
              borderRadius: 10,
              overflow: "hidden",
            }}
            onClick={() => {
              setIndex(i);
            }}
          >
            <Image image={item.image} />
          </button>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--tx3)" }}>Click to enlarge.</p>
      <Lightbox
        items={GALLERY}
        index={index}
        onIndexChange={setIndex}
        onClose={() => {
          setIndex(null);
        }}
      />
    </>
  );
}

/** Catalogue specimens for the media track: C20 Media and C21 Page states, in every state. */
export default function MediaSpecimens() {
  return (
    <>
      <Specimen title="C20 · Image" board="PublicStates.dc.html › Images">
        <State label="Loading">
          <Card>
            <Image image={{ ...PUJA, dominant: "#2A1316" }} state="loading" />
          </Card>
        </State>
        <State label="Loaded">
          <Card>
            <Image image={PUJA} />
          </Card>
        </State>
        <State label="Didn’t load">
          <Card>
            <Image image={{ ...PUJA, alt: "[The image’s alt text is shown in its place]" }} state="failed" />
          </Card>
        </State>
      </Specimen>

      <Specimen title="C20 · Lightbox" board="PublicStates.dc.html › Images › Enlarged · M-LIGHTBOX">
        <State label="Enlarged (open a thumbnail)">
          <Card wide>
            <LightboxDemo />
          </Card>
        </State>
      </Specimen>

      <Specimen title="C20 · Video embed" board="PublicStates.dc.html › Video · M-VIDEO">
        <State label="Poster">
          <Card>
            <VideoEmbed url="https://youtu.be/board-example" title="[Video title]" duration="[3:24]" />
          </Card>
        </State>
        <State label="Starting">
          <Card>
            <VideoEmbed
              url="https://youtu.be/board-example"
              title="[Video title]"
              duration="[3:24]"
              state="starting"
            />
          </Card>
        </State>
        <State label="Playing">
          <Card>
            <VideoEmbed url="https://youtu.be/board-example" title="[Video title]" state="playing" />
          </Card>
        </State>
        <State label="Unavailable">
          <Card>
            <VideoEmbed url="https://youtu.be/board-example" title="[Video title]" unavailable />
          </Card>
        </State>
      </Specimen>

      <Specimen
        title="C20 · Prototype embed"
        board="PublicStates.dc.html › Prototypes · CaseStudy*.dc.html · M-PROTO"
      >
        <State label="Poster">
          <Card>
            <PrototypeEmbed url={PROTO} name={NAME} poster={PUJA} layout="inline" />
          </Card>
        </State>
        <State label="Loading">
          <Card>
            <PrototypeEmbed url={PROTO} name={NAME} poster={PUJA} display="loading" />
          </Card>
        </State>
        <State label="Running">
          <Card>
            <PrototypeEmbed url={PROTO} name={NAME} poster={PUJA} display="running" />
          </Card>
        </State>
        <State label="Didn’t load">
          <Card>
            <PrototypeEmbed url={PROTO} name={NAME} poster={PUJA} display="error" />
          </Card>
        </State>
        <State label="Can’t be embedded">
          <Card>
            <PrototypeEmbed url={PROTO} name={NAME} poster={PUJA} embeddable={false} />
          </Card>
        </State>
        <State label="Case study frame (external controls)">
          <Card>
            <PrototypeEmbed url={PROTO} name={NAME} poster={PUJA} controls="external" layout="inline" />
          </Card>
        </State>
        <State label="Tablet frame">
          <Card>
            <PrototypeEmbed url={PROTO} name={NAME} poster={PUJA} frame="tablet" layout="inline" />
          </Card>
        </State>
        <State label="Desktop frame">
          <Card wide>
            <PrototypeEmbed url={PROTO} name={NAME} poster={PUJA} frame="desktop" layout="inline" />
          </Card>
        </State>
        {(["loading", "running", "error"] as const).map((state) => (
          <State key={state} label={`Phone sheet · ${SHEET_LABELS[state]}`}>
            <div style={PHONE}>
              <PrototypeEmbed
                url={PROTO}
                name={NAME}
                poster={PUJA}
                note="Prototype built from the PRD v1.0 · dummy data"
                display={state}
                displaySheet
              />
            </div>
          </State>
        ))}
      </Specimen>

      <Specimen title="C21 · Page states" board="PublicStates.dc.html › Pages, On phones">
        <State label="Not found (404)">
          <Page>
            <NotFound showWriting />
          </Page>
        </State>
        <State label="Not found · no posts yet">
          <Page>
            <NotFound />
          </Page>
        </State>
        <State label="A project that was unpublished">
          <Page>
            <MovedNote kind="project" />
          </Page>
        </State>
        <State label="Draft preview link">
          <div
            style={{
              ...WIDE,
              border: "1px solid rgba(242,241,238,.12)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <PreviewBar daysLeft={6} />
            <div style={{ padding: "60px 40px 40px", background: "#0B0B0E" }}>
              <ChangedMark />
            </div>
          </div>
        </State>
        <State label="Expired or revoked preview">
          <Page center>
            <ExpiredPreview />
          </Page>
        </State>
        <State label="No results on /work">
          <Page>
            <NoResults
              filters={[
                { id: "shelf", label: "Strategy", kind: "shelf", onRemove: () => undefined },
                { id: "label", label: "Label: Achieved", kind: "filter", onRemove: () => undefined },
                { id: "q", label: "“roadmap”", kind: "search", onRemove: () => undefined },
              ]}
              message="Nothing in Strategy is labelled Achieved and mentions “roadmap”."
              onClear={() => undefined}
              onKeepSearch={() => undefined}
            />
          </Page>
        </State>
        <State label="Something went wrong">
          <Page center>
            <ErrorState headingLevel={2} onRetry={() => undefined} />
          </Page>
        </State>
      </Specimen>
    </>
  );
}
