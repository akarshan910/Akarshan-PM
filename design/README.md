# Design

These are the design files for the portfolio and its CMS, Studio: every exploration and every final board. They come from the owner's design canvas and were exported on 13 Oct 2026.

- **`boards/`:** the 48 boards, as `.dc.html` source. Two of them, `HomeLower` and `HomeTabletLower`, only re-show the bottom of the tall Home boards.
- **`previews/`:** a WebP render of each board except the two viewing aids, `HomeLower` and `HomeTabletLower`, so you can browse them on GitHub.
- **`canvas.json`:** how the canvas lays them out: pages, sizes and titles.
- **`covers/`:** the five V0 project covers, rendered from the Home board's cards ([07 · Covers](../docs/handover/07-v0-content.md#covers)).
- **`tools/render-board.mjs`:** renders any board, in any Tweaks state, to static HTML and a PNG, for reading and for the pixel-parity checks ([08](../docs/handover/08-qa.md#pixel-parity)).

The canvas itself is private to the owner. If a board changes there, the owner refreshes this folder, and the canvas stays the source.

## The final design at a glance

| | |
| --- | --- |
| ![Home, laptop](previews/Home.webp) | ![Home, phone](previews/HomeMobile.webp) |
| Home at 1440 | Home at 390 |

The final direction is **Volumes with the Ink & Depth hero**:

- every project is a numbered volume with its own accent;
- the hero is a manga ink panel that tilts toward the pointer, with project previews drifting beside it.

## How to read a board

Each `*.dc.html` file is plain HTML and CSS, plus a small template layer and one script class. Browsers can't open them directly, because they run inside the canvas runtime. Read them as source, where every value you need is written out, or render one with `node design/tools/render-board.mjs <board> <out> '{"state":"…"}'` to see it.

| Part | What it is | What you take from it |
| --- | --- | --- |
| `<style>` in `<helmet>` | The board's CSS. Tokens are custom properties on the root class (`.va` site, `.st` Studio, `.r3`/`.mo` motion and explorations) | Exact colours, sizes, radii, shadows, keyframes, durations, easings and media queries |
| Inline `style="…"` | Per-element layout | Exact padding, gaps, font sizes, grid columns, aspect ratios |
| `{{name}}` | A value computed by the script's `renderVals()` | Which values change: state, content or motion |
| `<sc-for list="{{items}}" as="x">` | A loop | Repeated components and their data shape |
| `<sc-if value="{{flag}}">` | A conditional | Which states exist and what each one shows |
| `onClick="{{fn}}"`, `onMouseMove`, `onKeyDown`, … | Event handlers, written as React props | The interaction and what it changes |
| `<script type="text/x-dc" data-props='…'>` | The board's logic: a class with `state`, lifecycle methods and handlers. `data-props` lists the **Tweaks**, which are the named states the board can show | The exact algorithms and timings, such as the floating-preview scheduler or the skills-cloud order |

**Example: the floating previews in `Home.dc.html`.**

- The card is `class="fl"`.
- The CSS is `.va .fl`.
- The scheduler is `spawn(i)` and holds:
  - the zones (`this.ZONES`);
  - the dwell, 4800–6800ms;
  - the fade, `opacity .7s ease`;
  - the drift, 10–18px, linear;
  - the gap between cards, 300–1300ms.

[`docs/handover/04-motion.md`](../docs/handover/04-motion.md#m-hero-floaters) restates it. When two sources disagree, [`CLAUDE.md`](../CLAUDE.md) sets the order.

## Board copy versus real content

Copy on the boards is illustrative. Most boards were drawn with copy based on the owner's résumé, and the Skills and Off duty sections use the current site's real content.

V0 of the rebuilt site launches with the current site's content. [`docs/handover/07-v0-content.md`](../docs/handover/07-v0-content.md) maps it, section by section.

**Text in square brackets** marks something missing, for example `[Your photo]` or `[your-domain]`. It never ships: the field either gets real content or hides.

## Every board

### Final site (canvas page 4)

| Board | What it shows | Tweaks |
| --- | --- | --- |
| [System](boards/System.dc.html) · [preview](previews/System.webp) | Design system: colour, type, grid, components, icons | — |
| [Home](boards/Home.dc.html) · [preview](previews/Home.webp) | `/` at 1440: hero, proof strip, shelves, About, Experience, the Skills cloud, Testimonials, the Off duty manga page, Contact | theme, motion, skill sizes |
| [HomeTablet](boards/HomeTablet.dc.html) · [preview](previews/HomeTablet.webp) | `/` at 834 | motion, skill sizes |
| [HomeMobile](boards/HomeMobile.dc.html) · [preview](previews/HomeMobile.webp) | `/` at 390, including the phone menu | menu open, motion, skill sizes |
| [HomeLower](boards/HomeLower.dc.html), [HomeTabletLower](boards/HomeTabletLower.dc.html) | Viewing aids only: the bottom of `Home` and `HomeTablet` (Testimonials to the footer), because the canvas shows at most 8,000px of a board. They import the full boards; build from `Home` and `HomeTablet` | the same tweaks |
| [CaseStudy](boards/CaseStudy.dc.html) · [preview](previews/CaseStudy.webp) | `/work/:slug` at 1440 | theme |
| [CaseStudyTablet](boards/CaseStudyTablet.dc.html) · [preview](previews/CaseStudyTablet.webp) | `/work/:slug` at 834 | — |
| [CaseStudyMobile](boards/CaseStudyMobile.dc.html) · [preview](previews/CaseStudyMobile.webp) | `/work/:slug` at 390 | menu, chapter picker, prototype states, motion |
| [WorkScale](boards/WorkScale.dc.html) · [preview](previews/WorkScale.webp) | How shelves scale (drag the project-count slider); `/work` on laptop and phone | — |
| [WritingPublic](boards/WritingPublic.dc.html) · [preview](previews/WritingPublic.webp) | Writing on the homepage, `/writing`, `/writing/:slug` | — |
| [PublicStates](boards/PublicStates.dc.html) · [preview](previews/PublicStates.webp) | Media states and page states: 404, moved, preview, expired, empty, error | — |

### Studio, the CMS (canvas page 5)

| Board | What it shows | Tweaks |
| --- | --- | --- |
| [StudioLogin](boards/StudioLogin.dc.html) · [preview](previews/StudioLogin.webp) | Sign in with a 6-digit email code | every sign-in state |
| [StudioAuthFlow](boards/StudioAuthFlow.dc.html) · [preview](previews/StudioAuthFlow.webp) | Every sign-in and sign-out path, on laptop and phone | — |
| [StudioDashboard](boards/StudioDashboard.dc.html) · [preview](previews/StudioDashboard.webp) | `/studio` | populated, empty, loading |
| [StudioSite](boards/StudioSite.dc.html) · [preview](previews/StudioSite.webp) | The Website builder: sections, widgets, nav, floating previews, skill sizes, Off duty panels | each panel and state |
| [StudioProjects](boards/StudioProjects.dc.html) · [preview](previews/StudioProjects.webp) | `/studio/projects` | every list state |
| [EditorOverview](boards/EditorOverview.dc.html) · [preview](previews/EditorOverview.webp) | Project editor › Overview: basics, case-study summary, your part, links | save and publish states |
| [EditorVisuals](boards/EditorVisuals.dc.html) · [preview](previews/EditorVisuals.webp) | › Visuals: top of the page, accent colour, cover, gallery, video, prototype | upload and link states |
| [EditorCaseStudy](boards/EditorCaseStudy.dc.html) · [preview](previews/EditorCaseStudy.webp) | › Story: chapters and blocks | block builder states |
| [EditorOutcomes](boards/EditorOutcomes.dc.html) · [preview](previews/EditorOutcomes.webp) | › Outcomes: labelled numbers | achieved without evidence, new result, no results, save and publish states |
| [EditorSettings](boards/EditorSettings.dc.html) · [preview](previews/EditorSettings.webp) | › URL & SEO | redirect, preview link, unlisted, delete |
| [StudioWriting](boards/StudioWriting.dc.html) · [preview](previews/StudioWriting.webp) | `/studio/writing` | draft, many topics, topics dropdown open, no posts yet, publish dialog, scheduled, published |
| [StudioMedia](boards/StudioMedia.dc.html) · [preview](previews/StudioMedia.webp) | `/studio/media` | uploading, needs alt text, delete blocked, empty filter |
| [StudioProfile](boards/StudioProfile.dc.html) · [preview](previews/StudioProfile.webp) | Profile & facts | confirm states |
| [StudioPreview](boards/StudioPreview.dc.html) · [preview](previews/StudioPreview.webp) | Draft preview and share links | devices, compare, share |
| [StudioStates](boards/StudioStates.dc.html) · [preview](previews/StudioStates.webp) | Every system state | — |
| [StudioTablet](boards/StudioTablet.dc.html) · [preview](previews/StudioTablet.webp) | Studio on iPad | — |
| [StudioMobile](boards/StudioMobile.dc.html) · [preview](previews/StudioMobile.webp) | Studio on phones | — |

### Motion (canvas page 6)

| Board | What it shows |
| --- | --- |
| [Motion](boards/Motion.dc.html) · [preview](previews/Motion.webp) | Every animation as a live demo with its spec: tokens, hero, navigation, phone menu, skills cloud, Off duty panels, cards, reading and media, Studio |

### How we got here: the explorations (canvas pages 1–3 and the archive)

| Round | Boards | What was tried |
| --- | --- | --- |
| Round 1: three directions | [Main](boards/Main.dc.html) and [DevicesA](boards/DevicesA.dc.html) (A · Volumes), [DirectionB](boards/DirectionB.dc.html)/[DevicesB](boards/DevicesB.dc.html) (B · Operator), [DirectionC](boards/DirectionC.dc.html)/[DevicesC](boards/DevicesC.dc.html) (C · Editorial) | Volumes was chosen: a nod to the owner's love of layered manga storytelling, where each project is a volume |
| Round 2: eight bold directions | [Glass](boards/R2Glass.dc.html), [Cyber](boards/R2Cyber.dc.html), [Neon](boards/R2Neon.dc.html), [Manga](boards/R2Manga.dc.html), [Cover](boards/R2Cover.dc.html), [Depth](boards/R2Depth.dc.html), [OS](boards/R2OS.dc.html), [Kinetic](boards/R2Kinetic.dc.html) | How far the visual language could stretch while keeping the original pill nav |
| Round 3: mixes | [Ink & Depth](boards/R3Ink.dc.html), [Chapter Spread](boards/R3Spread.dc.html), [Volumes Prime](boards/R3Prime.dc.html), [motion spec](boards/R3Motion.dc.html) | Volumes plus shōnen ink plus depth-field parallax. Ink & Depth became the hero |

The story of how the design and the platform evolved is in [`docs/story/`](../docs/story/README.md).
