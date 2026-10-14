# 02 · Tokens and components

Sources:

- `System.dc.html`: the token swatches, type scale, grid and component states.
- `Home.dc.html`: the CSS the site actually uses.
- `src/legacy/portfolio.css`: the live site's stylesheet, kept read-only as the source for the live nav, which is copied exactly. Nothing imports it.

Where this chapter quotes CSS, it is copied from those files. If a value here ever disagrees with its board, the board wins, except where [09-decisions](09-decisions.md) says otherwise.

## Keep the board names

Name the CSS custom properties exactly as the boards do: `--bg`, `--tx2`, `--eo` and so on. Board CSS can then be pasted into a component module unchanged. That is the cheapest way to stay pixel-exact.

`src/styles/tokens.css` holds:

- the `.va` block as `:root`;
- the `.va.light` block as `:root[data-theme="light"]`.

V0 ships dark only (see [09](09-decisions.md), D12). The light values are still defined, so the theme can be switched on later without new tokens.

## Colour

| Token | Dark | Light | Used for |
| --- | --- | --- | --- |
| `--bg` | `#0B0B0E` | `#F5F5F3` | Page background |
| `--bg2` | `#111116` | `#EEEEEA` | Banded sections (About, Testimonials), card fill, row hover |
| `--sf` | `#16161C` | `#FFFFFF` | Floating cards, popovers, menus |
| `--sf2` | `#1D1D24` | `#F0F0EC` | Baseline label, skeleton base, Studio pressed states |
| `--ln` | `rgba(242,241,238,.09)` | `rgba(20,20,22,.10)` | Hairlines, resting card borders |
| `--ln2` | `rgba(242,241,238,.18)` | `rgba(20,20,22,.22)` | Strong lines, secondary-button border, card hover border |
| `--tx` | `#F2F1EE` (17.4:1) | `#141416` (16.9:1) | Text |
| `--tx2` | `#B9B7B1` (9.8:1) | `#4A4A51` (8.1:1) | Secondary text, body copy |
| `--tx3` | `#8F8D87` (5.9:1) | `#6A6A72` (4.9:1) | Captions, meta, mono labels |
| `--ac` | `#D61F33` | `#D61F33` | Accent fill: primary CTA, brush, name shadow, the name's period. White text on it is 5.1:1 |
| `--act` | `#FF5A67` (6.5:1) | `#C2182C` (5.6:1) | Accent as text: kickers, focus ring, Studio links |
| `--ok` | `#3CCB8B` | `#3CCB8B` | Positive fill: availability dot, Published dot |
| `--okt` | `#9BE7C4` | `#0F7A4A` | Positive text: Achieved label, availability chip |
| `--nav` | `rgba(11,11,14,.94)` | `rgba(245,245,243,.94)` | Sticky bars, such as the case-study chapter bar |
| `--tone` | `rgba(242,241,238,.14)` | `rgba(20,20,22,.12)` | Screentone dots in the ink panel |
| `--eo` | `cubic-bezier(.2,.8,.2,1)` | same | The one easing curve for movement. See [04](04-motion.md) |

The contrast ratios in brackets are measured against `--bg`.

**Fixed colours.** These are not themed:

| Value | Where |
| --- | --- |
| `#E42A3F` | Primary CTA hover |
| `#2A2A31` on `#6E6C68` text | Primary CTA disabled |
| `#E8273A`, `#FF4D5E` | Let's Talk fill and hover, from the live nav |
| `#F0EEF8`, `rgba(240,238,248,.75)` | Nav text, active and resting |
| `#F2B53A`, `#F2C66B`, `rgba(242,181,58,.12)` | Warning: field border, text, chip fill. Studio and slot placeholders |
| `#FF8A93`, `rgba(255,90,103,.45)` | Destructive button text and border |
| `#FFF1C9` | Studio's "moved here" row flash |

### Project accents

There are nine, one per project, chosen in Studio. Use them for covers, volume tags, chapter and step numbers, and the floating-preview tag. Never use them for body text.

| Name | Accent | Cover ground | Dark ink on the accent |
| --- | --- | --- | --- |
| Teal | `#2DD4BF` | `#0D1918` | 10.6:1 |
| Amber | `#F5A524` | `#1A140A` | 9.6:1 |
| Sky | `#38BDF8` | `#0A1620` | 9.2:1 |
| Violet | `#A78BFA` | `#130F1F` | 7.2:1 |
| Coral | `#FF5A67` | `#1C0C0F` | 6.5:1 |
| Slate | `#94A3B8` | `#121826` | 7.7:1 |
| Green | `#4ADE80` | `#0E1F14` | 11.3:1 |
| Yellow | `#FACC15` | `#1F1A06` | 12.8:1 |
| Lime | `#A3E635` | `#141F06` | 13.0:1 |

- **Text on an accent fill** is always `#0B0B0E`. Some early boards tint it per accent, for example `#04211D` on Teal. Use `#0B0B0E` everywhere.
- **The cover ground** is the dark background behind a cover's artwork. It is also the placeholder colour while a cover loads.
- **Derived tints** use `color-mix()` from the accent `--pa`:
  - highlighted RICE rows: `color-mix(in srgb, var(--pa) 8%, transparent)`;
  - priority card borders: `… 35% …`;
  - the outlined cover number: `-webkit-text-stroke: 1px` at `… 35% …`.

  The early laptop and iPad case-study boards hard-code these tints from `#E8273A`. Replace the hard-coded value with the project's accent. The phone case study already does this.

Light theme: an accent used as text (chapter numbers, step numbers) is under 3:1 on `#F5F5F3` for all nine accents. If the light theme is ever switched on, that needs a darker variant. The issue is logged in [09](09-decisions.md), D12. It doesn't affect V0.

### Studio tokens

Studio is a light interface with its own token set. Its root class on every Studio board is `.st`, and it uses the same fonts and accent. Put it in `src/styles/studio.css`, scoped to the Studio shell, so it never loads on the public site.

| Token | Value | Used for |
| --- | --- | --- |
| `--bg` | `#F4F4F2` | Studio background |
| `--sf` | `#FFFFFF` | Cards, panels, inputs |
| `--sf2` | `#F9F9F7` | Row hover, inset areas |
| `--ln` | `#E4E3DF` | Hairlines |
| `--ln2` | `#D2D0CA` | Input borders, button borders |
| `--tx`, `--tx2`, `--tx3` | `#141416`, `#4A4A51`, `#6A6A72` | Text |
| `--ac` | `#D61F33` | Publish CTA, the brand "S." mark |
| `--ok`, `--okbg` | `#0F7A4A`, `#E6F4EC` | Saved, Published |
| `--warn`, `--warnbg` | `#8A5A00`, `#FFF4DB` | Needs input, unconfirmed, near a limit |
| `--err`, `--errbg` | `#B42318`, `#FDECEA` | Errors, over a limit, destructive |

Studio components, copied from `StudioDashboard.dc.html` and the other Studio boards:

- `.nav` sidebar items: 40px tall, radius 8. Hover `#EFEEEA`; active `#EAE9E4`.
- `.card`: radius 14, 1px `--ln`.
- `.cta`: the angled publish button, 42px tall, padding `0 18px`, 8px cut, `--fd` 75% 700, 14px, `letter-spacing: .1em`; hover `#E42A3F`.
- `.btn`: 42px tall, padding `0 16px`, radius 8, white, 1px `--ln2`, `500 14px` `--fu`. Hover border `#B9B7B1`.
- `.chip`: 24px tall, padding `0 8px`, radius 6, 12px 500.
- `.mono`: 12px, `letter-spacing: .06em`.
- Focus: `outline: 2px solid var(--tx); outline-offset: 2px` (3px on the sign-in screen).
- Sign-in buttons: `.pbtn` 52px, radius 10, `#141416` fill, `500 16px` (disabled `#B9B7B1`); `.btn2` 46px, radius 10, 1px `--ln2`.
- Skeleton: `.shim`, `#ECEBE7`→`#F6F5F2`, 1.3s linear.

## Type

Fonts, all self-hosted WOFF2 under `public/fonts/`:

| Token | Family | Notes |
| --- | --- | --- |
| `--fd` | `'Archivo','Arial Narrow',sans-serif` | Variable, `wdth` 62–125 and `wght` 100–900. Always set `font-stretch`: 62%, 68%, 70% or 75%, as the board does |
| `--fu` | `'Geist',system-ui,sans-serif` | Interface and reading |
| `--fm` | `'Geist Mono',ui-monospace,monospace` | Labels, data, kickers |
| — | `'JetBrains Mono',monospace` | Nav pill only, copied from the live site |

Set `-webkit-font-smoothing: antialiased` on the root.

Scale, as laptop / iPad / phone, from `System.dc.html`:

| Role | Size | Line height | Face |
| --- | --- | --- | --- |
| display-xl, the hero name | 136 / 92 / 72. The pages use `clamp(64px, 8.4vw, 126px)`, 100px and 66px | .86 | `--fd` 62% 800, uppercase |
| h1, case-study title | 88 / 64 / 44. Page: `clamp(52px, 6.4vw, 92px)` | .96–.98 | `--fd` 75% 700 |
| h2, section title | 64 / 48 / 38 (System lists 36; HomeMobile `.h2` is 38). Page: `clamp(40px, 5vw, 64px)` | .95 | `--fd` 68% 800, uppercase |
| h3, card title | 40 / 32 / 28. Lead card `clamp(30px, 3vw, 42px)`, standard card 28px | 1.02–1.05 | `--fd` 75% 700 |
| lead, hero positioning | 32 / 26 / 22. Page: `clamp(22px, 2.2vw, 30px)`, 25px, 20px | 1.28–1.3 | `--fu` 400, `letter-spacing: -.015em` |
| reading, case study and posts | 19 / 18 / 17. Measure 680px | 1.65 | `--fu` |
| body · small | 16 · 14 | 1.6 | `--fu` |
| meta and mono labels | 12, never smaller (11 on tags and the phone kicker) | — | `--fm`, `letter-spacing: .08em`, uppercase, `--tx3` |
| numeral | 52 / 46 / 38 on the pages (System lists 52 / 44 / 40) | 1 | `--fd` 62% 800 |

Where the page boards use a fluid `clamp()`, build the `clamp()`. The scale table shows the sizes it resolves to at 1440, 834 and 390.

## Layout

| Device | Width | Grid | Notes |
| --- | --- | --- | --- |
| Laptop | ≥ 1280 (designed at 1440) | 12 columns, 24 gutter. `.wrap` is `max-width: 1312px` with `padding-inline: clamp(20px, 4vw, 56px)` | Hover adds detail; nothing is hover-only |
| iPad | 768–1279 (designed at 834) | Portrait: 8 columns, 20 gutter, 32 margin. Landscape (1024+) uses the laptop grid with 40 margins | Touch targets 44px |
| Phone | 360–767 (designed at 390) | 4 columns, 16 gutter, 20 margin | One column. Full-width primary actions. Bottom sheets instead of popovers |

Breakpoints in CSS:

```css
/* phone */   @media (max-width: 767px) { … }
/* iPad */    @media (min-width: 768px) and (max-width: 1279px) { … }
/* laptop */  @media (min-width: 1280px) { … }
```

Between breakpoints the layout is fluid. Check at 360, 390, 430, 768, 834, 1024, 1280, 1440 and 1920 ([08](08-qa.md)).

**The live site's ≤900px nav rule doesn't carry over.** The iPad board keeps all five links at 834. See [09](09-decisions.md), D9.

**Spacing** uses a 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. The boards sometimes use 10, 14, 18, 20, 22, 28 or 36 inside components; copy those as written.

**Radius:**

| Radius | Used for |
| --- | --- |
| 4 | Labels and tags |
| 6 | Volume tag, badge |
| 8 | Controls |
| 10–14 | Tiles, inner covers, cover frames |
| 16–18 | Panels, About and testimonial cards |
| 20–22 | Card shells (lead 22, standard 20) |
| 999 | Chips and status |
| 2 | The CTAs |

**Elevation:** lines first, shadow only for overlays.

| Level | Treatment |
| --- | --- |
| e0, resting | Hairline `--ln` |
| e1, hover | Lifts 4px, border `--ln2` |
| e2, overlays | Floating previews, dialogs, sheets and toasts. Previews use `0 24px 48px rgba(0,0,0,.45)`; dialogs and sheets use `0 24px 64px rgba(0,0,0,.55)`; toasts use `0 24px 64px rgba(0,0,0,.45)` |

**Focus.** Use `outline: 2px solid var(--act); outline-offset: 3px` on links and buttons. The angled CTA is the exception: it uses an inner ring, `box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #D61F33`, because its cut corners would clip an outline.

## Icons

One set, used across the site and Studio:

- 24px grid, `stroke-width: 1.75`, round caps and joins, `fill: none`, `stroke: currentColor`.
- Size with the `.ico` class: 18px on the site and in Studio (every `.st .ico` is 18px), 20px on the System board's samples, 14–16px inline.

The 24 icons and their path data are in the `icons` array in `System.dc.html`:

arrow-right, arrow-out, arrow-down, download, play, pause, expand, menu, close, sun, moon, check, alert, info, upload, image, video, prototype, grip, trash, copy, eye, link, plus.

Boards also use these, which must be in `icons.tsx` too: arrow-left `M19 12H5M11 18l-6-6 6-6`, mail `M3 6h18v12H3zM3 7l9 6 9-6`, chevron-down `M6 9l6 6 6-6`, chevron-left `M15 6l-6 6 6 6`, chevron-right `M9 6l6 6-6 6`, image-off `M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M3 3l18 18`, alert-circle (circle r9 + `M12 8v5M12 16h.01`), clock `M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z`, rss `M5 5a14 14 0 0114 14M5 11a8 8 0 018 8M6 18h.01`, more (three r1.2 dots at y12). The play icon on cover badges is filled (`fill: currentColor`).

Put them in `src/components/icons.tsx` as one component that takes a `name` prop. Decorative icons get `aria-hidden="true"`.

---

## Components

Each component is listed with its board selector, variants and states, and a pointer to its motion in [04](04-motion.md). Build each one under `src/components/`, and show every variant and state on `/dev/components`.

### C1 · Pill nav

Copy it exactly from the live site. The boards reproduce it.

**Desktop and iPad.** Five links, a separator, then Let's Talk. The boards order the links Work, About, Exp, Skills, Testimonial, which matches the new section order. The live site has About first. Use the boards' order, and take the labels from Studio (see [05](05-studio.md#website-builder)).

**Phones.** Menu, a separator, then Let's Talk. Menu opens C2.

**Position.** `position: fixed; top: 28px; left: 50%; transform: translateX(-50%); z-index: 5000`. On phones, `top: 16px` and `max-width: calc(100vw - 24px)`.

**CSS.** Copy it verbatim from `src/legacy/portfolio.css`:

- `#nav`, `#nav::before`, `#nav::after`, `@property --shimmer-angle`, `@keyframes navShimmer`;
- `#nav.on-light-bg` and its children;
- `.n-links` (`gap: 2px`), `.nl`, `.nl:hover`, `.nl.on`, `.n-sep`;
- `#nav-pill`;
- `.n-contact`, `.n-contact.active`, `.n-contact:hover`.

Rename the selectors to CSS-module classes if you like, but don't change a value.

Where the boards and the live CSS differ, the live CSS wins:

- the boards draw the active link as a static background, but the live site uses the sliding `#nav-pill`;
- the boards have no 2px gap between links.

The phone pill gives its buttons `padding: 10px 18px` instead of 8px, for a 44px touch target (`HomeMobile.dc.html`).

**Behaviour.** Port `updatePill` and `updateNavSection` from the old app, kept at `tests/fixtures/legacy-app.tsx.txt`:

1. **Pill position.** `#nav-pill` sits under the `.nl.on` link: `left` = link left − nav left, `width` = link width.
   - It animates `left` and `width` over `.32s cubic-bezier(.34,1.26,.64,1)`.
   - It skips the transition on first paint and on resize.
2. **Scroll-spy.** The current section is the last one whose top is at or above the nav's bottom edge plus 10px.
   - **Hero:** no link active, pill `opacity: 0`.
   - **Contact:** no link active, pill hidden, and `.n-contact` gets `.active` (glow and `scale(1.04)`).
   - **Any other section:** its link gets `.on`, the pill moves to it, and `opacity: 1`.
3. **Clicks.** A link click sets `.on` immediately, moves the pill and smooth-scrolls to the section. Smooth scrolling is turned off for reduced motion.
4. **Light variant.** The live site switches to `on-light-bg` over light sections. The new design has no light sections in the dark theme, so the variant follows the theme instead: dark theme never; light theme always. `Home.dc.html`'s `.va.light .pill` rules match `on-light-bg`.
5. **Performance.** Use one passive scroll listener with `requestAnimationFrame`, or an `IntersectionObserver` over the section elements. Read layout once per frame.

**Sections tracked:** `top` (the hero) and `contact`, plus every visible section that has a nav link. The ids come from the section list in Studio.

**Accessibility:**

- `<nav aria-label="Primary">`;
- the active link gets `aria-current="true"`;
- a skip link, "Skip to work", is the first focusable element (`Home.dc.html`, line 1 of the body).

**Motion:** M-NAV-RING, M-NAV-LINK, M-NAV-PILL, M-NAV-CONTACT.

### C2 · Phone menu

Board: `HomeMobile.dc.html` with the `nav: menu open` Tweak, and `CaseStudyMobile.dc.html` with `state: menu open`. The CSS is `.mmenu`, `.mm-k`, `.mm-l`, `.mm-n`, `.mm-cta`, `.mm-foot` and `.mm-x`.

**Layer.** A full-screen dialog under the pill (z-index below the nav), so the pill stays tappable. Background `rgba(11,11,14,.97)` with `backdrop-filter: blur(24px)`, padding `88px 20px 24px`.

**Contents, top to bottom:**

1. The "Menu" kicker (mono, 11px).
2. The section links, numbered 01–05:
   - Archivo 62% 800, 44px, uppercase, `min-height: 64px`, hairline between them.
   - The current section gets `aria-current="true"`, which shows `--tx` text, a red number and an 8px red dot on the right. The dot is always `#FF5A67`.
3. The Let's Talk CTA: full width, 54px, the angled CTA.
4. A footer row: Email · LinkedIn · Résumé (PDF).
5. A "✕ Close menu" button.

**Open and close:**

- Tapping Menu opens the dialog. The pill button becomes "✕ Close", with `aria-expanded="true"` and `aria-label="Close menu"`.
- These close it: the pill button again, "Close menu", Esc, tapping a link (which then scrolls to its section) or Let's Talk.
- On close, focus returns to the Menu button.
- While open:
  - focus is trapped inside;
  - the page behind doesn't scroll (`overflow: hidden` on `html`);
  - the menu links' `aria-current` follows the scroll-spy.

**Motion:** M-NAV-MENU.

### C3 · Buttons

| Variant | Class on the board | Spec |
| --- | --- | --- |
| Primary, the angled CTA | `.cta` | 52px tall (54 inside the phone menu). Padding `0 28px`, `--ac` fill, white text. `--fd` 75% 600, 15px, `letter-spacing: .14em`, uppercase. `clip-path: polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))` |
| Secondary | `.cta2` | 52px tall, padding `0 26px`, 1px `--ln2` border, transparent, `--tx` text, `--fd` 75% 500, 15px |
| Secondary, compact | `.cta2` with inline overrides | 44px tall, padding `0 18px`, 14px. "Full résumé" in Experience |
| Ghost | System board | 44px tall, padding `0 14px`, 15px 500, `--tx2` |
| Destructive | System board | `.cta2` with border `rgba(255,90,103,.45)` and text `#FF8A93` |
| Icon button | System board | 44×44, radius 8, 1px `--ln` |
| Round arrow button | Testimonials | 44×44, radius 999, 1px `--ln2`. Disabled: `--ln` border, `--tx3` icon |

States, from `System.dc.html`:

- **Hover:** primary `#E42A3F` and up 2px; secondary border `--tx3`.
- **Press:** primary `scale(.98)`.
- **Focus:** the inner ring.
- **Disabled:** `#2A2A31` fill with `#6E6C68` text, `aria-disabled`.
- **Loading:** a 14px spinner (2px ring, `rgba(255,255,255,.35)` with a white top) before the label. The label changes to the in-progress verb, for example "Sending".

On phones, full-width buttons are `display: flex; width: 100%`.

**Motion:** M-CTA, M-BTN2.

### C4 · Section header

```
[kicker]             mono 12px, 500, --act
[Title, second half] h2 page size; the second half wraps in a span coloured --tx3
                      ("Shipped, measured, <span>explained.</span>")
[intro]              15–17px, 1.6, --tx3 or --tx2, max-width 420–480px. On laptop it sits right-aligned beside the title
```

Layout: `display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px 32px; margin-bottom: 40px` on laptop (About 48 with gap `32px 64px`; Skills and Off duty 30; Testimonials 36). The kicker-to-title gap is 14px (laptop), 12px (iPad `.h2`, 48px) and 10px (phone `.h2`, 38px). The shelves show no intro on iPad or phones. On iPad and phones it stacks: kicker, `.h2`, then the intro.

The two-tone split is stored data: Studio keeps the title in two fields, `title` and `titleMuted`. Never split strings automatically.

### C5 · Result label

Every number on the site carries one, except tenure and counts ([07](07-v0-content.md#outcomes)).

| Label | Class | Style |
| --- | --- | --- |
| ACHIEVED | `.tag-a` | `rgba(60,203,139,.12)` fill, `--okt` text |
| TARGET | `.tag-t` | 1px solid `--ln2`, `--tx2` text |
| PROJECTED | `.tag-p` | 1px dashed `--ln2`, `--tx2` text |
| BASELINE | `.tag-b` | `--sf2` fill, `--tx2` text |
| OUTPUT | `.tag-o` | `rgba(255,90,103,.12)` fill, `--act` text |

Shared: `padding: 3px 8px; border-radius: 4px; font: 600 11px var(--fm); letter-spacing: .08em`. On phones the padding is `2px 7px`.

The text is uppercase in the markup. Give each label a visually hidden expansion, for example "Achieved: measured after launch", so screen readers get the meaning.

**Attribution** (my ownership, team result, business outcome) shows on outcomes in the case study when it's set ([05](05-studio.md#outcomes)).

### C6 · Tags, badges and chips

| Element | Spec |
| --- | --- |
| Volume tag (covers) | `padding: 6px 10px` (lead) or `5px 9px` (standard), radius 6, accent fill, `#0B0B0E` text, `--fm` 12px 600, `letter-spacing: .08em`, `VOL.NN`. Phone rows use a compact `NN` at 11px |
| Status badge (cover, top right) | `.badge`: `rgba(0,0,0,.5)` fill, `#F2F1EE` text, 12–13px 500, radius 6, play icon plus "Prototype"; or a dot plus "Shipped · AI" |
| Chip | `.chip`: 30px tall (32 on iPad), padding `0 12px`, radius 999, 1px `--ln`, 13px `--tx2`. Problem spaces, segments |
| Availability chip | 32px tall (30px tall and 12px text on phones), padding `0 14px 0 12px`, radius 999, border `rgba(60,203,139,.35)`, fill `rgba(60,203,139,.08)`, `--okt` 13px 500. An 8px `--ok` dot with M-AVAIL-PULSE |
| Filter chip | The System board's "All / Shipped / Strategy": 32px, radius 999. Selected: `--tx` fill with `--bg` text. Not selected: 1px `--ln2` border |

### C7 · Project card

Data comes from one published project:

- volume number, accent, cover with alt text and focal point;
- company, card label, title, summary;
- the headline outcome (value, line, label) and up to two outcomes for the lead card;
- the prototype flag;
- the slug.

The whole card is one link to `/work/:slug`.

| Variant | Where | Spec (board) |
| --- | --- | --- |
| **Lead** | First on each shelf, full width | Laptop: flex row, padding 16, radius 22, `--bg2`. Cover `flex: 999 1 520px` at 16:10, radius 14. Text column `flex: 1 1 340px`, gap 18: meta, h3, 17px summary, then the results list (up to two outcomes in a hairline-divided box, value bold and line `--tx2`, label on the right), then "Read the case study →". The cover adds the big outlined number at the bottom right (200px, accent stroke at 35%). iPad: block, cover 16:9, results in two columns. Phone: cover 4:3, one result |
| **Standard** | Laptop 3 up, iPad 2 up | Column, padding `14px 14px 22px`, radius 20, `--bg2`, gap 20. Cover 4:3, radius 12. Body padding `0 6px`, gap 10: meta, h3 28px (26 on iPad), 15px summary (laptop only), then the headline row: numeral 26px (24 on iPad), line 14px, label |
| **Compact row** | Phones, after the lead | `.row`: grid `96px 1fr`, gap 14, padding 10, radius 16, `--bg2`. A 96px cover thumb with radius 10 and the compact `NN` tag. Title 16px 600, then the headline line 13px plus the label |
| **See all N** | The last cell when a shelf is over its cap | `.see-all`: dashed `--ln2`, radius 20, padding 22. "See all N" with "K more on the work page, with filters, search and sort." Links to `/work?shelf=<key>` |
| **All work · N** | Fills the empty cells of the last row | Same frame. The spectrum bar is nine accent bars in project order, 120px tall (max-width 360, gap 6; iPad 110px, gap 5, tile padding 20, gap 16) at `opacity: .85`. Lead-cover status badge: padding `6px 10px`, fill `rgba(0,0,0,.45)`, inset 18 (iPad 16, phone 12), 7px accent dot. "All work · N volumes →" in `--fd` 68% 800, 44px; on iPad 30px. Links to `/work` |
| **Phone closing row** | Phones | `.all-row`: dashed, radius 16, padding `18px 16px`. "All work · N volumes" or "See all N" |

Rules that apply to every variant:

- The meta line is `{company} · {card label}`, mono.
- If a project has no headline outcome, the headline row hides. If its summary is empty, the summary hides.
- **Cover loading:** the cover ground colour holds the exact aspect-ratio box, then the image fades in (M-IMG-FADE).
- **Laptop hover:** M-CARD for cards, M-ROW for rows and tiles. On touch devices the hover styles don't apply (`@media (hover: hover)`).

### C8 · Shelf

The standard shelf, which every shelf uses:

1. Section header (C4). The kicker is `Selected work · {shelf name}`.
2. The lead card: the first published project in the shelf's order, unless another is starred.
3. A grid of standard cards:
   - laptop: `repeat(auto-fit, minmax(300px, 1fr))` with gap 24, which resolves to 3 up at 1440 (`Home.dc.html`);
   - iPad: 2 up with gap 20;
   - phones: compact rows with gap 12.
4. The closing tile (see C7).

The cap logic is copied from `WorkScale.dc.html`'s `renderVals`:

```ts
// rows = 1, 2 or 3, set per shelf in Studio
const cap = 1 + 3 * rows;
const overflow = count > cap;
const shown = overflow ? cap - 1 : count;         // the last cell becomes "See all N"
const gap = overflow ? 0 : (3 - ((shown - 1) % 3)) % 3; // empty cells in the last laptop row
// overflow → push SeeAll(count, shelfKey)
// else if gap > 0 → push AllWork(totalPublished), spanning `gap` columns
```

- **iPad** shows the same projects as the laptop, in 2-up rows. Recompute the closing tile for 2 columns: `gap2 = (2 - ((shown - 1) % 2)) % 2`, tile shown only when `gap2 > 0`.
- **Phones** show the same projects as compact rows, then the closing row when there's overflow or a laptop gap. That keeps the three sizes showing the same set.
- **Empty shelf:** with nothing published, the shelf hides completely, header included.

### C9 · Volume numbering

`src/lib/volumes.ts`:

- Number published projects on listed shelves `01, 02, …`, in shelf order and then in each shelf's project order.
- Drafts, unlisted and unpublished projects get no number.
- The number is computed at build time, never stored.
- Links use the slug, so renumbering never breaks a link.

### C10 · Hero ink panel

Covered in full in [03](03-public-site.md#hero) and [04](04-motion.md). The parts:

| Part | Board class | Layer |
| --- | --- | --- |
| Panel | `.ink` (tilt wrapper) and `.ink-panel` | 2px `--tx` border, `--bg2` |
| Screentone | `.tone`, mask `radial-gradient(ellipse at 80% 26%, #000 0%, transparent 58%)` | L1 |
| Outlined numerals | `01—09`. Archivo 62% 900, 260 / 190 / 120px, 1.5px `--ln2` stroke | L2 |
| Speed lines | SVG path from `speed()`, `#D61F33` at `fill-opacity: .16` | L3 |
| Red halftone disc | `.tone-r`, 380 / 300 / 220px | L4 |
| VOL.00 kicker | `VOL.00 · Prologue`, mono, `--act` | — |
| Brush underline | SVG path `M6 24 C 130 10, 330 6, 552 14`, stroke `#D61F33`, width 8, round cap | — |
| Floating previews | `.fl` and `.tz` | Above the panel, `translateZ` |

The numerals text `01—09` is decorative. Keep it as on the board: it doesn't follow the project count.

### C11 · Floating preview card

`.tz` inside `.fl`:

- width 262, padding `12px 14px 14px`, radius 14, `--sf` fill, 1px `--ln2`;
- shadow `0 24px 48px rgba(0,0,0,.45)`; on hover `0 28px 56px rgba(0,0,0,.55), 0 0 0 1px var(--tx3)`.

Contents:

1. The tag row: the `VOL.NN` tag (`padding: 3px 7px`, accent fill, `#0B0B0E`, 11px) and the mono kicker (10px).
2. The title: `--fd` 75% 700, 20px.
3. The headline row: the numeral (`--fd` 70% 800, 20px) and the label.

The whole card is a link. It's `aria-hidden` and `tabindex="-1"` because the same projects are reachable in the shelves. Scale is `.9` on laptop, `.88` on iPad.

The scheduler is M-HERO-FLOATERS.

### C12 · Proof strip cell

Laptop:

- Grid `repeat(auto-fit, minmax(240px, 1fr))`, 1px gaps in `--ln`.
- Each cell is `--bg` with padding `32px 28px 30px`. The first cell has no left padding and the last has no right padding.
- Inside: the numeral (52px), an optional unit span (30px, `--tx3`), the line (15px `--tx2`, `margin-top: 10px`) and the source (mono, `margin-top: 10px`).

iPad and phones: 2 × 2 at 46px and 38px. The phone hides the source line and the unit span; its line is 14px/1.4.

Below the cells, the "Problem spaces" row: a mono label and chips (C6). The phone board hides it. iPad shows the chips without the label (gap 8, padding `20px 0 24px`).

### C13 · Experience entry

| Kind | Laptop | iPad | Phone |
| --- | --- | --- | --- |
| **Featured** (current role) | `article`, flex: left column 220–280px (dates mono `--act`, company 22px 600, role 15px `--tx2`), right column (summary 17px, then up to three highlight cards: `--bg2`, radius 14, padding 18, mono heading, a list of `bold — rest`) | Stacked; company and dates on one line; highlight cards 2 up | Stacked; up to four bullets and an "All {company} highlights" link |
| **Standard** | Same columns; summary plus a bulleted grid (`repeat(auto-fit,minmax(300px,1fr))`, 2px `--ln2` left rule on each item) | Company row, role line, one-paragraph summary | Accordion row (C14) |
| **Compact** (older roles) | Same columns, 19px company, one paragraph | Accordion row (C14) | Accordion row (C14) |
| **Education** | Compact, no role | Accordion row | Accordion row |

The kind follows position, as on the boards: the first visible entry is Featured, the second Standard, the rest Compact. Studio has no setting for it.

A Featured entry shows highlight cards only when its highlights are grouped (a group title plus items). Ungrouped highlights render as the Standard bullet grid. All V0 entries are ungrouped ([07](07-v0-content.md#experience)).

### C14 · Accordion row

`.acc`:

- `min-height: 56px`, padding `16px 0` (iPad `22px 0`), bottom hairline;
- `600 16px/1.3 var(--fu)` (iPad 18px); the subtitle is 13–15px 400 `--tx3`;
- a `plus` icon on the right (`M12 5v14M5 12h14`), rotated 45° while open (M-ACCORDION).
- Subtitle 400: on phones 13px `--tx3` on its own line (`display: block; margin-top: 2px`); on iPad 15px `--tx2`, inline after "·". iPad row font `600 18px/1.2`.

A `button` with `aria-expanded` and `aria-controls`. Expanding shows the entry's summary and bullets, in the phone Featured layout.

**Motion:** M-ACCORDION.

### C15 · Skills cloud

Boards: `Home*.dc.html` › `#skills` (CSS `.cloud`, `.cg`, `.cw`, `.sk-hint`; script `skVals`). The Studio side is in `StudioSite.dc.html` with the "skill group selected" tweak.

**Structure.** Semantic and grouped in the DOM, interleaved visually:

```html
<div class="cloud [lit]">
  <div class="cg" role="group" aria-labelledby="skg-0">          <!-- display: contents -->
    <h3 class="cw g [on]" style="order: 0"><span class="cw-sub">Strategy & execution</span>
      <button id="skg-0" aria-pressed="false">Product</button></h3>
    <ul role="list">                                               <!-- display: contents -->
      <li role="listitem" class="cw m" style="order: 3">User & Market Research</li> …
```

Keep the explicit `role`s: some browsers drop list semantics from `display: contents` elements.

**Order.** Every skill gets an even-spread key, then group words are dropped in at even steps:

```ts
// key: (index within group + 0.5) / group length; sort by key, then by group index
// then insert group g's word before position Math.round(g * n / G)  (n = skill count, G = group count)
```

`Home.dc.html`'s `this.SKO` holds the order computed this way for the V0 groups. Unit-test against it.

**Sizes.** Per skill, set in Studio. Laptop / iPad / phone:

| Tier | Style | Size |
| --- | --- | --- |
| Group word | `--fd` 62% 900, uppercase, transparent fill, 1.5px `--tx3` stroke | 104 / 72 / 50px |
| XL | `--fd` 62% 900, uppercase, `--tx` | 64 / 46 / 34px |
| L | `--fd` 68% 800, uppercase, `--tx` | 40 / 30 / 24px |
| M | Geist 500, `--tx2`. Every other M word, in visual order, uses `.alt`: `--fd` 75% 600, uppercase | 24 / 20 / 17px |
| S | `--fm` 500, uppercase, `letter-spacing: .08em`, `--tx3` | 13 / 12 / 11px |

The group's subtitle is mono 11px in `--act`, above the word.

**Layout.**

- Gap: `14px 30px` / `10px 20px` / `8px 14px`.
- Padding: `40px 0 6px` / `28px 0 4px` / `22px 0 2px`.
- The halo behind is `.cloud::before`: screentone masked by a radial ellipse.

**Highlight.**

- Hovering, focusing or clicking a group word sets the active group. Hover is a preview; click pins (`aria-pressed`), and a second click clears it.
- With an active group, the root gets `.lit`:
  - other words drop to `opacity: .16`;
  - the active group's words go to `--tx`, and its XL words to `#FF5A67`;
  - the active group word fills `#D61F33`;
  - other group words dim their stroke to `--ln2` and their subtitle to `.3`.
- Transitions: `opacity .2s var(--eo), color .2s var(--eo)`.
- Under the cloud, the hint reads: "Hover or click a group to light up its skills · N skills in G groups" on laptop, "Tap a group to light up its skills · N skills in G groups" on iPad, and "Tap a group to light it up" on phones.

**Motion:** M-SKILLS-REVEAL, M-SKILLS-FOCUS.

### C16 · Testimonial card

`figure`:

- padding 28 (iPad 24, phone 20), radius 18 (phone 16), `--bg`, 1px `--ln`;
- `blockquote` 16px (phone 15), line height 1.65, `--tx2`, with curly quotes;
- `figcaption`: a 40px initials avatar (the testimonial's own colour pair, 14px 600), name 15px 600, role 13px `--tx3`, and an arrow-out link to LinkedIn (`aria-label="{name} on LinkedIn"`) when there's a URL. Laptop figure: `display:flex; flex-direction:column; gap:24px`, figcaption `margin-top:auto`.
- **On iPad and phones the figcaption has no avatar and no LinkedIn link:** iPad shows "Name · Role" on one line (14px, name 600, rest `--tx3`, `margin-top: 20px`); phones show the name, then the role on its own line (13px `--tx3`, `margin-top: 16px`).

The Testimonials header uses its own h2 size: `clamp(36px, 4.2vw, 54px)` / 40 / 32, with the kicker "Testimonials · N" on iPad and phones and a mono "Swipe →" hint (13px `--tx3`) on iPad. Laptop prev/next are labelled "Previous testimonials" / "Next testimonials".

Layout:

- **Laptop:** three per page with "1–3 of 7" and prev/next round buttons (C3). Paging moves by three.
- **iPad:** a swipe rail of 460px cards (gap 16) with dots. The active dot is 24×6 `--tx`; the others are 6×6 `--ln2`.
- **Phone:** a rail of 312px cards (gap 12), active dot 20×6.

The rail uses `scroll-snap-type: x mandatory`. Dots are buttons labelled "Show testimonial N of M", and the current one has `aria-current="true"` (the boards draw them as spans; build them as buttons).

**Motion:** M-TESTI-PAGE.

### C17 · Off duty page

Boards: `Home*.dc.html` › `#offduty` (CSS `.opage`, `.op*`, `.spines`, `.sp*`). The Studio side is in `StudioSite.dc.html` with the "off duty item selected" tweak.

**Panel** (`article.op`):

- `position: relative; overflow: hidden; border: 2px solid var(--tx); background: var(--pg)`.
- `--pa` is the item's accent and `--pg` its cover ground (the [accent table](#project-accents)).

Layers, bottom to top:

1. **Screentone.** `.op-tone`, masked at the art's focus.
2. **Speed lines.** `.op-sl`, an SVG from `speed()` around the art's focus: 70 lines, inner radius `min(w,h)·.18–.32`, outer `max(w,h)·1.6`. Accent fill at `fill-opacity .14`.
3. **Number.** `.op-num`, the outlined two-digit item number: `--fd` 62% 900, stroke `color-mix(in srgb, var(--pa) 50%, transparent)`.
4. **Art.** `.op-ico`, one of six line-art presets (`kunai`, `pencil`, `paddle`, `pan`, `plane`, `camera`; paths in `Home.dc.html`), in a `-80 -70 160 140` box, stroke `--pa` 2.2px.
5. **Caption box.** `.op-cap`:
   - fill `#F2F1EE`, text `#0B0B0E`, `2px solid #0B0B0E`, `box-shadow: 5px 5px 0 var(--pa)`;
   - contents: the label (mono 11px 600, `#4A4A51`), the title (`--fd` 68% 800, uppercase), the text (14px, line height 1.5, `#2A2A30`) and the tag;
   - the tag is mono 11px 600 on `#0B0B0E` with an accent dot.

**Spine shelf.** On the first item, when it has picks: `.op-shelf` at the bottom of the panel, over a gradient to `rgba(11,11,14,.88)`.

- The label reads "Currently watching / all-time favourites".
- Then `ol.spines` with a 3px `--tx` shelf line.
- Each spine (`li.sp`): 46px wide (44 on iPad, 42 on phones), `--sf` fill, 1px `--ln2` sides, and a 7px top border in its colour.
- Inside each spine: a mono number, then the title (`--fd` 75% 700, 14px, `writing-mode: vertical-rl`) and the note (mono 9px, vertical) side by side.
- Spine colours cycle through Coral, Amber, Sky, Violet, Teal, Yellow, Green, Slate.
- Heights come from the content plus a deterministic lift: `padding-top` cycles 6, 18, 0, 22, 10, 4, 16, 8px.

**Grid.**

| Device | Columns | Rows | Placement |
| --- | --- | --- | --- |
| Laptop | 12, gap 12 | 278 / 278 / 340px | Item 1: columns 1–7, rows 1–2. Items 2–3: columns 8–12, one row each. Items 4–6: four columns each, row 3 |
| iPad | 6, gap 10 | 560 / 300 / 450px | Item 1: full width. Items 2–3: three columns each. Items 4–6: two columns each |
| Phone | — | — | A horizontal rail of 300px panels (`scroll-snap-type: x mandatory`, gap 12, bleeding off the right edge). Each panel has a 170px art band with the caption box overlapping it by 30px. Decorative dots below (20×6 active, 6×6 `--ln2`, gap 6, `aria-hidden`). The spine shelf follows the rail and scrolls sideways |

Exact caption, art and number positions per panel size are inline on the boards.

**More than six items.** On laptop and iPad, after the sixth, items continue in rows of three (laptop) or two (iPad), using the bottom-row panel size. Phones keep adding to the rail.

**Fewer than six:**

| Items | Layout |
| --- | --- |
| 1 | The big panel alone, full width |
| 2–3 | The big panel plus the side stack |
| 4–5 | The bottom row stretches to fill: 2 → 6 + 6 columns, 1 → 12 |

**Accessibility.**

- Each panel is an `article` labelled by its title.
- The art, numbers and speed lines are `aria-hidden`.
- The spines are an ordered list with the label "All-time favourites".

**Motion:** M-OFF-PANEL, M-OFF-SPINE, and M-REVEAL on the panels.

### C18 · Contact block

On laptop and iPad it's centred: kicker, display title (`clamp(56px, 8vw, 112px)`, 88, 60; the second half in `--ac`), intro, buttons, and a row of text links. On phones it's left-aligned.

The laptop contact block has its own speed-line background:

- an SVG, `opacity: .16`, `#D61F33` lines;
- static: it doesn't move with the pointer.

Buttons:

| Size | Buttons |
| --- | --- |
| Laptop | "Email me" (`mailto:`), "Copy email" (copies to the clipboard; the button label changes to "Copied" for 2 seconds, announced through a polite live region; no toast), then links: LinkedIn, GitHub, Résumé (PDF) |
| iPad | Email me, LinkedIn, GitHub |
| Phone | Email me full width, then LinkedIn and GitHub in a `1fr 1fr` grid, gap 10, `padding: 0`. Title 60px |

Any link without a URL hides. Copy email and Résumé (PDF) are laptop-only, as on the boards.

### C19 · Footer

- **Laptop:** 80px tall, a hairline above, 13px `--tx3`. Left: "© {year} {name} · {credit}". Right: "Last updated {date}" in mono 12px.
- **iPad:** padding `24px 32px`, "© {year} {name}" left, "Updated {date}" mono 12px right. **Phone:** padding 20, one line "© {year} {name} · Updated {date}".
- **iPad and phones:** a shorter version of the same.

"Last updated" is the date of the last site publish.

### C20 · Media

All of these are specified in [03](03-public-site.md#media) with their states from `PublicStates.dc.html`:

- image: loading, loaded, failed;
- lightbox;
- video embed: poster, starting, playing, unavailable;
- prototype embed: poster, loading, running, error, can't embed, phone sheet.

### C21 · Page states

Specified in [03](03-public-site.md#page-states):

- 404;
- the moved-project note;
- the draft preview bar;
- an expired preview;
- no results;
- error.

### C22 · Form controls (System board)

`System.dc.html` › Components. Used by the public site's filters and dialogs, and as the dark counterparts of Studio's controls.

- **Text field:** 44px, padding `0 14px`, radius 8, 1px `--ln2`, `--bg` fill, `400 15px` (a slug field uses `--fm`); label `500 14px`, gap 6. Error: border `#FF5A67`, ring `0 0 0 3px rgba(255,90,103,.18)`. Warning: border `#F2B53A`, message 13px `#F2C66B` with the alert icon at 16px.
- **Segmented control:** `role="radiogroup"`, padding 4, radius 10, 1px `--ln`, `--bg`; items 36px, padding `0 14px`, radius 7, 14px `--tx2`; selected `--sf2`, `--tx`, `inset 0 0 0 1px --ln2`.
- **Switch:** 44×26, radius 999, on `#D61F33`, 20px white knob inset 3.
- **Checkbox:** 20×20, radius 5, `#D61F33`, check 14px at stroke 2.5.
- **Status pills:** 28px, padding `0 10px`, radius 999, 13px 500, 7px dot. Published `rgba(60,203,139,.12)` / `--okt`; Draft `--sf2` / `--tx2` with a hollow 1.5px `#8F8D87` dot; Unpublished changes `rgba(242,181,58,.12)` / `#F2C66B`.
- **Toast:** padding `12px 14px`, radius 12, `--sf2`, 1px `--ln2`, 22px round icon.
- **Dark skeleton** `.shim`: `#1D1D24` → `#26262E`, 480px, 1.4s linear.

## Studio components

Most Studio pieces are simple enough to copy from their board's CSS: the shell, rows, switches, toasts and dialogs. [05 · Studio](05-studio.md) names the board and class for each. Two shared components carry more behaviour, so they're specified here.

### S1 · Topic picker

Board: `StudioWriting.dc.html` › Post settings › Topics (tweaks "writing a draft", "many topics", "topics dropdown open"; CSS `.tpadd`, `.ms-*`). The same component is used for a project's topics in `EditorOverview`.

**The vocabulary** is every topic already used by posts (or by projects, for the project editor), from [06](06-backend.md#topics). It's case-insensitive: "ai" and "AI" are one topic, and the first spelling wins. The label above the field shows the count: "12 topics".

**Up to 8 topics in the vocabulary: chips.**

- Every topic is a toggle chip (`aria-pressed`), 30px tall, with a 1px border, inside `role="group"` labelled "Topics".
- A dashed "+ Add topic" input (`.tpadd`) follows the chips: 118px wide, growing to 168px on focus (`width .2s`).
- Enter adds the typed topic, or selects the existing one if it matches.
- The hint below: "Tap to choose. Type a new one and press Enter. Past 8 topics, this becomes a dropdown with search."

**More than 8: a multi-select dropdown.**

- **The field** (`.ms-field`, min height 44px) holds the selected topics as dark chips (`.ms-chip`, 26px), each with a ✕ button labelled "Remove {topic}".
- **The trigger** (`.ms-trig`) fills the rest of the field and reads "Choose topics" when none are selected, "Add topics" otherwise, with a ▾. It has `aria-haspopup="listbox"` and `aria-expanded`.
- **The popover** (`.ms-pop`) opens under the field:
  - a search input that's also the combobox (`role="combobox"`, `aria-controls="tp-list"`, `aria-activedescendant`), placeholder "Search or create a topic";
  - the list (`role="listbox"`, `aria-multiselectable="true"`, max height 232px, scrolls): one option per topic, each with a checkbox mark, its name, and its use count on the right in mono 11px: "1 post", "N posts", or "new" for a topic no post uses yet ("project" and "projects" in the project editor);
  - selected topics first, then alphabetical; the search filters by substring;
  - "No topic matches “x”." when nothing matches;
  - "+ Create “x”" (`.ms-create`) whenever the query doesn't exactly match a topic, ignoring case;
  - the footer: "N selected · ↑ ↓ to move, Enter to choose" and a Done button.
- **Keyboard:** ↑ and ↓ move the active option, Enter toggles it (or creates the query when no option is active), Esc closes and returns focus to the trigger. Tab moves to Done.
- **Clicking outside** closes the popover. Choices apply immediately; there's no cancel.

**Both modes:**

- Changes autosave with the rest of the post.
- A polite live region announces "Added {topic}", "Created and added {topic}" or "Removed {topic}".
- A new topic is trimmed, has its inner spaces collapsed, and is at most 32 characters.
- **The cap:** a post or project holds at most 8 topics ([06](06-backend.md#topics)). At 8, unselected chips and options are disabled (`aria-disabled="true"`), "+ Create" and Enter do nothing, and the polite live region says "Up to 8 topics per post." ("per project" in the project editor). Removing one re-enables them.
- **In the project editor,** this component replaces the chip-and-input control drawn on `EditorOverview` ("Add a topic and press Enter"), per D23.
- **Motion:** M-ST-POP for the popover; the input's width transition. See [04 · Studio](04-motion.md#studio).

### S2 · Code input

Board: `StudioLogin.dc.html` (tweaks "enter code" to "wait to resend"; CSS `.otp`, `.box`).

**Structure.** One real input over six visual boxes, so paste, autofill and screen readers see a normal field:

```html
<div class="otp">
  <div class="box">4</div> … six boxes, aria-hidden …
  <input id="otp-in" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6"
         aria-invalid="false" aria-describedby="otp-h">
</div>
```

- Codes are 8 digits since [09](09-decisions.md) D66: read "6" and "six" in this section as 8 and eight, with eight boxes.
- A visible `<label for="otp-in">6-digit code</label>` sits above the grid, and `.otp` itself is `role="group" aria-label="6-digit code"`. The hint below is `#otp-h`: "Paste the code, or type it. It signs you in as soon as all six digits are in." The error alerts above the boxes are `role="alert"`.
- `.otp`: a 6-column grid, gap 10px. The CSS sets 22px above, but the board overrides it inline to `margin-top: 8px` under the label; build 8px.
- `.box`: 64px tall, radius 12, 1px `--ln2`, white, Geist Mono 600 28px.
- The input covers the grid with `opacity: 0` and `font-size: 16px`, which stops iOS zooming in.

**Box states:**

| State | Style |
| --- | --- |
| Next to fill | `.cur`: border `--tx`, ring `0 0 0 3px rgba(20,20,22,.12)`, a blinking 2×28px caret |
| Wrong code | `.bad`: border `--err`, ring `0 0 0 3px rgba(180,35,24,.12)` |
| Checking, or locked | `.off`: fill `#F1F0EC`, digits in `--tx3`, input disabled |

**Behaviour:**

- Non-digits are dropped, so a pasted "482 913" becomes "482913".
- Six digits submit after 150ms, with no button press needed. The "Sign in" button does the same. It's `aria-disabled` until six digits are in, and while locked. While checking, it shows the spinner and "Checking code…".
- Typing after a wrong or expired code clears the error and returns to the normal state. Only "wrong code" uses `.bad`; "code expired" shows its alert with normal boxes.
- **Motion:** M-ST-OTP and M-ST-SPIN.
