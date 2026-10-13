# 02 · Design system and directions

## How the direction was chosen

| Round | What was explored | Outcome |
| --- | --- | --- |
| 1 | Three directions: **A · Volumes** (dark, editorial, projects as numbered volumes), B · Operator, C · Editorial | A chosen. Comments applied: keep the live pill nav exactly, drop the AK logo, drop the "Now" card, keep the angled CTA |
| 2 | Eight bold directions after Behance and Dribbble research: liquid glass, cyberpunk HUD, neon night, shōnen manga, cover story, depth field (mouse parallax), desktop OS, kinetic type | Shōnen manga and depth field picked for a mix |
| 3 | Volumes A as the base, with shōnen visual language and depth-field motion. **A · Ink & Depth** (balanced), **B · Chapter Spread** (manga-forward), **C · Volumes Prime** (subtle, most shippable), plus a shared motion spec | Awaiting your pick |

Fixed across every direction:

- the live site's pill nav, copied exactly (glass, rotating ring, red "Let's Talk"), on laptop, iPad and mobile. On mobile it holds Menu and Let's Talk;
- the angled-cut CTA;
- no logo or monogram;
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

The Round 3 shōnen layer adds:

- **Ink**: 3px `#F2F1EE` panel borders.
- **Screentone**: dot patterns at 8 to 16% opacity.
- **Title treatment**: a dark outer stroke with an 8px red offset shadow.
- **SFX lettering**: Dela Gothic One, decorative only and hidden from screen readers.

Text never sits directly on halftone: it goes in a solid caption box or panel.

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

## Result labels

Every number shows one of these labels. Each label differs by fill or outline, not by colour alone.

| Label | Meaning | Style |
| --- | --- | --- |
| Achieved | Measured after launch; needs private evidence in Studio | Green tint |
| Target | A goal set or given; not measured | Solid outline |
| Projected | A forecast from a model or estimate | Dashed outline |
| Baseline | Where things stood before | Grey fill |
| Output | Something made: screens, a PRD, a prototype | Red tint |

## Motion and interaction

The full spec is on the canvas (Round 3, "Motion & interaction"). In short:

- **Depth model.** Seven layers, from screentone at −300px to proof chips at +220px. Inside clipped panels, layers move in 2D; outside, they use real `translateZ`.
- **Timing.** One easing curve, `cubic-bezier(.2,.8,.2,1)`:
  - tilt follows the pointer within ±6° over 600ms;
  - spines pull out in 320ms;
  - covers land with a 420ms impact pop.
- **Touch.** Nothing is hover-only. Tap once to preview, again to open. Device tilt drives the parallax after permission, otherwise a slow 9s drift.
- **Reduced motion.** No tilt, drift, speed-line aiming, pops or ring animation. Same content, composed rest pose.
- **No flashing.** The impact pop brightens one small element, never the screen, at most 3 times a second.
- **Performance.**
  - Animate transform and opacity only, with at most seven moving layers.
  - Read the pointer once per frame.
  - In React, write pointer values to CSS variables instead of re-rendering.
  - Freeze the speed lines if the frame rate drops below 45fps.

## Accessibility baseline

- Text contrast at least 4.5:1 (3:1 for 24px and larger).
- Every control is a real button, link or input, with a visible focus ring. Focus shows what hover shows.
- Touch targets are at least 44px.
- Decorative layers, SFX and halftone are `aria-hidden`.
- Images need alt text before publishing. Decorative images are marked as such.
- Status changes are announced politely: saving, uploads, reordering.
