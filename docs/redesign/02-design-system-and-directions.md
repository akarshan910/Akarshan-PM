# 02 · Design system and directions

## How the direction was chosen

| Round | What was explored | Outcome |
| --- | --- | --- |
| 1 | Three directions: **A · Volumes** (dark, editorial, projects as numbered volumes), B · Operator, C · Editorial | A chosen. Comments applied: keep the live pill nav exactly, drop the AK logo, drop the "Now" card, keep the angled CTA |
| 2 | Eight bold directions after Behance and Dribbble research: liquid glass, cyberpunk HUD, neon night, shōnen manga, cover story, depth field (mouse parallax), desktop OS, kinetic type | Shōnen manga and depth field picked for a mix |
| 3 | Volumes A as the base, with shōnen visual language and depth-field motion. **A · Ink & Depth** (balanced), **B · Chapter Spread** (manga-forward), **C · Volumes Prime** (subtle), plus a shared motion spec | A's hero chosen. The rest of the site stays Round 1 |
| Final | Round 1 Volumes across the site, with the Ink & Depth hero redrawn in Round 1's language | Japanese lettering removed from every board |

Fixed everywhere:

- the live site's pill nav, copied exactly (glass, rotating ring, red "Let's Talk"), on laptop, iPad and mobile. On mobile it holds Menu and Let's Talk, and Menu opens a full-screen menu of the section links with a way to close it;
- the angled-cut CTA;
- no logo or monogram;
- no Japanese or SFX lettering;
- real content only: placeholders like `[Your photo]` or `[your-domain]` mark anything still missing.

## Tokens (Volumes, dark)

| Token | Value | Contrast on `#0B0B0E` | Use |
| --- | --- | --- | --- |
| `bg` | `#0B0B0E` | — | Page |
| `bg2` / `sf` / `sf2` | `#111116` / `#16161C` / `#1D1D24` | — | Cards and surfaces |
| `tx` | `#F2F1EE` | 17.4:1 | Text |
| `tx2` | `#B9B7B1` | 9.8:1 | Secondary text |
| `tx3` | `#8F8D87` | 5.9:1 | Captions, labels |
| `ac` | `#D61F33` | white text 5.1:1 | CTA fill, accents |
| `act` | `#FF5A67` | 6.5:1 | Accent text |

The light theme mirrors these: `#F5F5F3` background, `#141416` text, `#6A6A72` captions (4.9:1) and `#C2182C` accent text.

**Type**

| Role | Font |
| --- | --- |
| Display | Archivo, condensed widths 62 to 75% |
| Text | Geist |
| Labels | Geist Mono |
| Nav | JetBrains Mono, as on the live site |

**Breakpoints**

| Device | Width | Columns | Margins |
| --- | --- | --- | --- |
| Laptop | 1280 and up | 12 | 1200 max content width |
| iPad | 768 to 1279 | 8 | 32px |
| Mobile | 360 to 767 | 4 | 20px |

## The final hero

The hero is the only place the shōnen layer appears. It keeps what made Ink & Depth work and takes everything else from Round 1:

| Kept from Ink & Depth | Taken from Round 1 |
| --- | --- |
| One ink panel: a 2px `tx` border on `bg2` | Round 1 colours, with red `ac` as the only accent |
| Screentone dots, masked to the top right | Archivo for the name, Geist for text, Geist Mono for labels |
| Red speed lines at 16% opacity, aimed at the pointer | The 12-column grid and 1200px content width |
| A brush underline under the name, drawn in once | The live pill nav and the angled-cut CTAs |
| A red offset shadow on the name: 5px on laptop, 4px on iPad, 3px on phones | Round 1 result labels on the floating previews |
| Project cards floating in front of the panel | No SFX lettering and no display font beyond Archivo |

From top to bottom, the panel holds:

1. the "VOL.00 · Prologue" label;
2. the availability and location chips;
3. the name, with the brush underline;
4. the positioning line and the intro;
5. "See selected work" and "Résumé (PDF)".

Studio › Website can hide any of these parts, the floating previews, or the motion.

| | Laptop | iPad | Phone |
| --- | --- | --- | --- |
| Panel motion | Tilts with the pointer | Slow 9s drift | Slow 9s drift |
| Name size | `clamp(64px, 8.4vw, 126px)` | 100px | 66px |
| Floating previews | 1 to 3 at once, set in Studio. Hidden below 1100px wide | One at a time | None |
| Buttons | In a row | In a row | Stacked, full width |
| Location chip | Shown | Shown | Hidden |

**Floating previews.** The cards come from a list in Studio › Website › Hero › Floating previews, so adding a project there adds it to the rotation.

- Each card shows a project's volume, title and headline number with its label, and links to the project.
- A card fades in at a random spot in a zone to the right of the text, so it never covers the name or the buttons.
- It drifts 10 to 18px in a random direction, fades out, and the next project in the list takes its slot.
- Hovering a card holds it in place so it can be clicked.
- Drafts can be added to the list, but they only float once they're published.
- The cards are a pointer shortcut: they're hidden from screen readers and skipped by Tab, since every project is also in the shelves below.

The exact timings are in [Motion](#motion).

## Shelves

Every shelf, current or future, uses one component:

- **Header.** "Selected work · shelf name" in mono, then the shelf's title and intro.
- **Lead card.** The first published project, at full width: the cover on the left, and on the right the details, up to two headline results and "Read the case study".
- **Cards.**

  | Device | Layout |
  | --- | --- |
  | Laptop | Three across |
  | iPad | Two across |
  | Phone | Compact rows |

  Each card has the same parts in the same order: cover with the volume tag top left, an optional badge top right ("Shipped · AI", "▶ Prototype"), meta line, title, one-line summary, and headline number with its label.
- **Closing tile.**
  - When a shelf passes its cap, the last cell becomes "See all N", linking to `/work` filtered to that shelf.
  - When the last row has a gap, an "All work" tile fills it.

  Either way, rows are always complete.

**Project accents.** Each project has one accent from a set of nine: Teal `#2DD4BF`, Amber `#F5A524`, Sky `#38BDF8`, Violet `#A78BFA`, Coral `#FF5A67`, Slate `#94A3B8`, Green `#4ADE80`, Yellow `#FACC15` and Lime `#A3E635`.

- The accent is chosen in Studio.
- It's used for covers, volume tags and chapter numbers, never for body text.
- Text on an accent is always `#0B0B0E`.

## Skills cloud

Skills show as one typographic word cloud, not a table.

- **Group words.** Each group (for example Product, Data, Design, Tools) is a big outlined word in Archivo, with its subtitle in mono above it.
- **Skills.** They are spread evenly through the cloud rather than listed under their group, so the cloud reads as one shape.
- **Sizes.** Each skill has a size, set in Studio: XL, L, M or S.

  | Size | Style |
  | --- | --- |
  | XL | Condensed caps, in white |
  | L | Condensed caps |
  | M | Alternates between Geist and condensed caps, so the texture varies without implying importance |
  | S | Mono caps, in grey |

  Size is emphasis: the owner keeps two or three big and most at M. V0 starts every skill at M.
- **Highlight.** Hovering, focusing or tapping a group name lights up that group's skills. The rest dim to 16%, and the group name fills red. Tapping again clears it.
- **Behind the cloud.** A faint screentone halo, from the hero's vocabulary.
- **Accessibility.** The markup stays grouped: a heading and a list per group. CSS `order` interleaves the words visually, so screen readers still hear each group's skills together.

## Off duty

Off duty is a manga page: the bonus pages at the back of the volume.

- **Panels.** Each hobby is a panel with a 2px ink border, its own accent, line art over speed lines and screentone, and a big outlined number.
- **Caption box.** The label, title, text and a tag sit in a light caption box with an offset shadow in the accent, like a manga narration box.
- **Favourites shelf.** The first hobby gets the big panel. It can carry a shelf of favourites, drawn as volume spines; V0 uses the eight anime picks from the current site.

| Device | Layout |
| --- | --- |
| Laptop | One big panel (7 of 12 columns, two rows), two side panels, then a row of three |
| iPad | The big panel, then two, then three |
| Phone | A swipeable row of panels with dots, and the spine shelf below |

**Art.** It comes from six presets (kunai, pencil, paddle, pan, plane, camera), stroked in the panel's accent. The owner picks a preset and an accent per hobby in Studio.

## Result labels

Every number shows one of these labels. Each label differs by fill or outline, not by colour alone.

| Label | Meaning | Style |
| --- | --- | --- |
| Achieved | Measured after launch; needs private evidence in Studio | Green tint |
| Target | A goal set or given; not measured | Solid outline |
| Projected | A forecast from a model or estimate | Dashed outline |
| Baseline | Where things stood before | Grey fill |
| Output | Something made: screens, a PRD, a prototype | Red tint |

## Motion

Canvas page 6, "Motion & animation", is the reference. It shows every animation on the site as a live demo with its trigger, timing and reduced-motion behaviour. It replaces the Round 3 motion board for the final site.

**Tokens.** Use these and nothing else:

| Token | Values |
| --- | --- |
| Easing | `--eo: cubic-bezier(.2,.8,.2,1)` for anything moving into place. `linear` only for drift, rotation and progress. `ease-in-out` only for breathing loops |
| Durations | 120ms press · 200ms colour, hover and focus · 320ms card and row lift · 560ms entrances and reveals · 700ms tilt and fades · 1.4s brush draw · 2.4 to 9s ambient loops |
| Stagger | 80ms between siblings, five steps at most |
| Distances | 16px rise · 4px card lift and arrow nudge · 2px button lift · 10 to 18px floating drift · ±4° / ±3° hero tilt · ±2° touch drift |

**Hero.**

- **Tilt.** The panel tilts up to ±4° left to right and ±3° up and down, following the pointer, with a 1600px perspective. Inside the panel, four layers shift in 2D:

  | Layer | Shift at the panel's edge |
  | --- | --- |
  | Screentone | −12px, −9px |
  | Outlined volume numerals "01—09" | −8px, −6px |
  | Speed lines, aimed at the pointer | −4px, −3px |
  | Red halftone disc | +6px, +4px |

  The tilt eases over 600ms and the layers over 500ms. Leaving the hero returns it to rest.
- **Load.** The hero's lines rise in over 560ms, 80ms apart, and the brush underline draws in over 1.4s.
- **Floating previews.**
  - Each card fades in over 700ms, stays 4.8 to 6.8s while drifting linearly, then fades out over 700ms.
  - The slot stays empty for 0.3 to 1.3s before the next card appears.
  - Slots start 1.5s apart.
- **Touch.** On iPad and phones the panel drifts (9s, within ±2°) instead of following a pointer. Device tilt isn't used, so there's no motion-permission prompt.

**Elsewhere.**

| Animation | Spec |
| --- | --- |
| Pill nav ring | Turns every 3.5s, `linear` |
| Links | Fade their colour in 220ms. Let's Talk grows to 104% |
| Angled CTA | Lifts 2px on hover, settles to 98% on press |
| Cards | Lift 4px, the cover zooms to 103%, the arrow nudges 4px |
| Rows and the "All work" tile | Fill and nudge |
| Sections | Fade in and rise once, as they enter the viewport |
| Reading progress | Bar follows the scroll directly |
| Chapter marker | Slides in 240ms |
| Prototypes | Poster, spinner, then a 320ms fade |
| Phone menu | Fades in over 240ms. The links rise in 80ms apart, then Let's Talk. Closing is instant |
| Skills cloud | The words rise in over five steps, 80ms apart. The group highlight changes over 200ms |
| Off duty panels | On hover, the panel lifts 4px and its caption shadow deepens (320ms). The art nudges and the speed lines widen (500ms). Spines lift 4px |

**Reduced motion.** The same content with nothing moving:

- no tilt, drift, layer shifts, aiming, rises, reveals, draws, sweeps, pulses or ring;
- floating previews stand still in their rest spots;
- colour and border changes on hover and focus stay, and so does the reading progress bar.

Nothing flashes, with or without the setting.

**Performance.**

- Animate transform and opacity only.
- Read the pointer once per frame and write it to CSS variables, not React state.
- Use at most seven moving layers in the hero.
- Pause loops and floating previews when the hero is off screen or the tab is hidden.
- Freeze the speed lines if the frame rate drops below 45fps.

## Accessibility baseline

- Text contrast at least 4.5:1 (3:1 for 24px and larger).
- Every control is a real button, link or input, with a visible focus ring. Focus shows what hover shows.
- Touch targets are at least 44px.
- Decorative layers (screentone, speed lines, numerals, halftone) are `aria-hidden`.
- Images need alt text before publishing. Decorative images are marked as such.
- Status changes are announced politely: saving, uploads, reordering.
