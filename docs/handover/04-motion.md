# 04 · Motion

Every animation on the site and in Studio is listed here. Each one has an ID, its trigger, what moves, the exact timing and easing, what reduced motion does, and how to build it.

The live reference is `Motion.dc.html`: hover, scroll inside the demos, press Replay, and switch Reduced motion on. The page boards carry the same animations in context: `Home*`, `CaseStudy*`, `PublicStates` and `Studio*`.

## Which board wins

Several boards show the same animation, and a few disagree. The rule:

1. **`Motion.dc.html` wins** for any animation it specifies.
2. **Page boards win** for animations only they show, such as the phone chapter sheet. They also win for anything about layout.
3. **Device-specific values on a page board win** over the Motion board's general value for that device. An example is the iPad floating-preview timings.

The conflicts found so far are already resolved in the [table at the end](#resolved-conflicts) and in [09-decisions](09-decisions.md), D20.

## Tokens

Put these in `tokens.css`. Animations use these values only.

| Token | Value | Use |
| --- | --- | --- |
| `--eo` | `cubic-bezier(.2,.8,.2,1)` | Every movement: fast start, soft landing |
| `linear` | — | Only drift, rotation (spinners, the nav ring) and progress (sheens, bars) |
| `ease-in-out` | — | Only breathing loops: touch drift, availability pulse |
| `ease` | — | Only the floating-preview fade (`opacity .7s ease`) and the live nav's own transitions, copied verbatim |
| Spring | `cubic-bezier(.34,1.26,.64,1)` | Only the nav's sliding highlight, copied from the live site |

**Durations:**

| Duration | Use |
| --- | --- |
| 120ms | Press |
| 200ms | Colour, hover and focus, the skills highlight |
| 220ms | Nav link hover; Studio toasts and dialogs |
| 240ms | Arrow nudge, chapter marker, phone menu fade |
| 320ms | Card and row lift, Off duty panel and spine lift, image fade, prototype fade |
| 500ms | Off duty art and speed lines on hover |
| 560ms | Entrances and reveals, including the skills cloud |
| 600ms | Hero tilt, cover zoom |
| 700ms | Floating-preview fade |
| 1.4s | Brush draw |
| 2.4s | Availability pulse |
| 3.5s | Nav ring |
| 4s | Body-scan sweep |
| 9s | Touch drift |

**Stagger:** 80ms between siblings, at most five steps (0, 80, 160, 240, 320ms). The sixth sibling onwards uses 320ms.

**Distances:**

| Distance | Use |
| --- | --- |
| 16px | Rise, on entrances and reveals |
| 4px | Card lift, arrow nudge |
| 2px | Button lift |
| 10–18px | Floating-preview drift on laptop (8–14px on iPad) |
| ±4° | Hero tilt, left–right |
| ±3° | Hero tilt, up–down |
| ±2° / ±1.5° | Touch drift, left–right / up–down |

## Ground rules

These apply to every animation:

1. **Reduced motion.** When `prefers-reduced-motion: reduce` matches, put the class `still` on the site root (`<html>`). Every rule below says what `.still` does.
   - Colour and border changes on hover and focus stay, because they carry meaning.
   - The reading-progress bar stays.
   - Nothing flashes, with or without the setting.
2. **The owner's switches** (Studio › Website › Hero):
   - **Hero motion off:** removes M-HERO-TILT and M-HERO-DRIFT for every visitor. The panel stays flat and the speed lines hold their rest pose.
   - **Floating previews hidden:** removes M-HERO-FLOATERS.

   A visitor's reduced-motion setting always wins over these.
3. **Transform and opacity only.** There are two exceptions, both copied as they are:
   - the availability pulse animates `box-shadow` on an 8px dot;
   - the nav ring animates a registered custom property.
4. **Pointer reads.** Read the pointer once per frame, inside `requestAnimationFrame`. Write it to CSS custom properties on the hero element, not to React state. React re-renders nothing while the pointer moves.
5. **Pause off screen.** An `IntersectionObserver` on the hero, plus `visibilitychange`, pauses the hero when it's off screen or the tab is hidden:
   - add `.paused`, which sets `animation-play-state: paused` on the drift, pulse and brush;
   - clear the floating-preview timers.

   Resume from the rest pose when the hero is visible again.
6. **Frame-rate guard.** While the pointer moves over the hero, keep a rolling average of the last 60 frame intervals. If it falls below 45fps (an average above 22.2ms), stop re-aiming the speed lines for the rest of the page view. Tilt and layers carry on, because they're compositor-only.
7. **No JavaScript, no hiding.** Content must be readable with JavaScript off and for crawlers.
   - An inline script in `<head>` adds `js` to `<html>`.
   - Initial "hidden" states, such as reveals, apply only under `html.js`.
8. **Input, not width, decides pointer versus touch.**
   - `(hover: hover) and (pointer: fine)` gets M-HERO-TILT.
   - Everything else gets M-HERO-DRIFT.

   Width still decides the layout, including how many floating previews show.
9. **Where the code lives.** Put the code in `src/motion/`: `reduced-motion.ts` (the `still` class, a `useReducedMotion()` hook, live updates on change), `tilt.ts`, `speed-lines.ts`, `floaters.ts`, `reveal.ts`, plus `keyframes.css`. Every keyframe name from the boards lives in one file.

---

## On load

### M-HERO-RISE · Hero entrance

**Where:** the hero's text column, on every device.

**Trigger:** the first page view of a session.

**Motion:** each visible line fades in and rises 16px, in this order:

1. the availability and location row;
2. the name;
3. the positioning line;
4. the intro;
5. the buttons.

Hidden lines are skipped, so the delays stay 80ms apart (`index × 80ms`).

```css
@keyframes vaRise { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
.rise { animation: vaRise .56s var(--eo) both; }       /* delay set inline: 0, 80, 160, 240, 320ms */
```

**Once per session:**

- An inline `<head>` script reads `sessionStorage['va:intro']`, inside try/catch.
- If the key is set, the script adds `no-intro` to `<html>`, and `.no-intro .rise { animation: none }`.
- The hero sets the key once the animation ends.

Back-navigation within the app doesn't replay it.

**Reduced:** shown in place, no movement.

**Boards:** `Home.dc.html` (`.rise` with delays 0, 80, 160, 240 and 320ms); `Motion.dc.html` › Hero entrance. The iPad and phone boards put `.rise` on only the first two lines; apply it to all of them ([D20](09-decisions.md)).

### M-HERO-BRUSH · Brush underline

**Trigger:** page load, after the name.

**Motion:** the red stroke under the name draws from left to right.

```css
@keyframes vaInkDraw { from { stroke-dashoffset: 900 } to { stroke-dashoffset: 0 } }
.brush { stroke-dasharray: 900; animation: vaInkDraw 1.4s var(--eo) .4s both; }
```

The path is `M6 24 C 130 10, 330 6, 552 14`, with `stroke: #D61F33; stroke-width: 8; stroke-linecap: round`, in a `0 0 560 34` viewBox.

- **Laptop:** drawn at 520×32px.
- **iPad and phone:** scaled to the name's width, as on their boards.

It follows the once-per-session rule of M-HERO-RISE.

**Reduced:** drawn from the start (`animation: none; stroke-dasharray: none`).

## Scroll

### M-REVEAL · Section reveal

**Where:** every homepage section after the hero; case-study chapters; `/work` and `/writing` lists. The nav, footer and anything inside the first viewport at load are excluded.

**Trigger:** the section's top passes 85% of the viewport height. Use an `IntersectionObserver` with `rootMargin: '0px 0px -15% 0px'`. It happens once, then the observer disconnects for that section.

**Motion:** the section fades in and rises 16px.

- Its direct content blocks follow with the 80ms stagger, at most five steps. The blocks are the header, then each card, row, entry or item, in DOM order.
- Mark them with `data-reveal-step` (0 to 4).

```css
html.js .rv:not(.in) { opacity: 0; transform: translateY(16px); }
.rv { transition: opacity .56s var(--eo), transform .56s var(--eo); transition-delay: calc(var(--step, 0) * 80ms); }
```

**Reduced:** everything is visible from the start. No `.rv` hidden state is applied, and there are no transitions.

**Boards:** `Motion.dc.html` › Section reveal (`.mo .rv` / `.rv.in`). The page boards draw the final state.

## Hero

<a id="m-hero-tilt"></a>

### M-HERO-TILT · Depth tilt and speed lines (pointer)

**Where:** the hero on devices with a fine pointer that can hover.

**Trigger:** `pointermove` over the hero `<section>` (the full-bleed section, padding included). `pointerleave` returns everything to rest.

**Maths** (from `Home.dc.html` › `heroMove`, `renderVals`):

```ts
// r = section.getBoundingClientRect()
const rx = clamp01((e.clientX - r.left) / r.width);
const ry = clamp01((e.clientY - r.top) / r.height);
const mx = rx * 2 - 1, my = ry * 2 - 1;          // -1 … 1
const fx = rx * 1200,  fy = ry * 680;            // speed-line focus, in the SVG's 1200×680 viewBox
// at rest (pointer outside, or before the first move):
const REST = { mx: 0.2, my: -0.1, fx: 820, fy: 230 };
```

| Element | Transform | Transition |
| --- | --- | --- |
| Wrapper (`.wrap` inside the hero) | `perspective: 1600px; perspective-origin: 50% 40%` | — |
| `.ink`, the panel | `rotateX(calc(var(--my) * -3deg)) rotateY(calc(var(--mx) * 4deg))` | `transform .6s var(--eo)` |
| L1 screentone | `translate3d(calc(var(--mx) * -12px), calc(var(--my) * -9px), 0)` | `transform .5s var(--eo)` |
| L2 outlined numerals | `translate3d(calc(var(--mx) * -8px), calc(var(--my) * -6px), 0)` | same |
| L3 speed-line SVG | `translate3d(calc(var(--mx) * -4px), calc(var(--my) * -3px), 0)` | same |
| L4 red halftone disc | `translate3d(calc(var(--mx) * 6px), calc(var(--my) * 4px), 0)` | same |
| Floating previews | Outer `translateZ({z}px) rotate({r}deg)`. They tilt with the panel because they're inside `.ink` with `transform-style: preserve-3d` | — |

**Speed lines re-aim** every frame: `path.setAttribute('d', speed(fx, fy, 130, 220, 360, 1600))`. The `d` change itself isn't transitioned. Port `speed()` verbatim from `Home.dc.html`:

```ts
export function speed(fx: number, fy: number, count: number, rMin: number, rMax: number, R: number) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const j = Math.sin(i * 12.9898) * 43758.5453;
    const rnd = j - Math.floor(j);
    const r0 = rMin + rnd * (rMax - rMin);
    const w = 0.006 + rnd * 0.012;
    const ax = fx + Math.cos(t) * r0, ay = fy + Math.sin(t) * r0;
    const bx = fx + Math.cos(t - w) * R, by = fy + Math.sin(t - w) * R;
    const cx = fx + Math.cos(t + w) * R, cy = fy + Math.sin(t + w) * R;
    d += 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + 'L' + bx.toFixed(1) + ' ' + by.toFixed(1) + 'L' + cx.toFixed(1) + ' ' + cy.toFixed(1) + 'Z';
  }
  return d;
}
```

The SVG is `viewBox="0 0 1200 680" preserveAspectRatio="xMidYMid slice"`, `fill="#D61F33" fill-opacity=".16"`.

**Prerender the rest pose** into the static HTML, so the first paint matches the board without JavaScript:

- `--mx: .2; --my: -.1`;
- the path computed from `speed(820, 230, …)`.

**Reduced, or hero motion off:** the panel is flat (`--mx: 0; --my: 0`), the layers sit at 0, and the speed lines hold `speed(820, 230, …)`. No listeners are attached.

**Unit test:** `speed(820,230,130,220,360,1600)` must match a snapshot. Generate the snapshot by running the board's function with the same arguments.

### M-HERO-DRIFT · Touch drift

**Where:** the hero on touch or no-hover devices, which covers the iPad and phone boards.

**Trigger:** always.

**Motion:** the panel sways. No device-orientation permission is ever requested.

```css
@keyframes vaInkDrift { 0%,100% { transform: rotateX(-1.5deg) rotateY(2deg) } 50% { transform: rotateX(1.5deg) rotateY(-2deg) } }
.ink.drift { animation: vaInkDrift 9s ease-in-out infinite; }
```

**Perspective** on the hero section: 1200px on iPad, 900px on phones. The layers don't shift on touch devices.

**Speed lines are static on touch devices.** Compute the path once at build:

- iPad: `speed(600, 170, 120, 150, 260, 1100)` in a `0 0 786 700` viewBox;
- phone: `speed(280, 110, 90, 90, 160, 760)` in a `0 0 362 540` viewBox.

**Reduced, or hero motion off:** still.

## <a id="m-hero-floaters"></a>M-HERO-FLOATERS · Floating previews

**Where:**

- laptop: 1, 2 or 3 at once, set in Studio, default 3;
- iPad: 1;
- phones: none.

**Data:** Studio › Website › Hero › "Projects that float". This is an ordered list of project ids.

- At render, keep only published, public projects, in that order.
- An empty result hides the floaters.

Each card shows:

| Element | Source |
| --- | --- |
| `VOL.NN` tag | Accent fill |
| Kicker | The project's card label |
| Title | The project title |
| Numeral and label | The headline outcome |
| Link | `/work/:slug` |

**Card and layer** (`.fl` outer, `.tz` inner):

- `.fl`: `position: absolute; left: {x}%; top: {y}%; width: 262px; pointer-events: none; transform: translateZ({z}px) rotate({r}deg)`. The percentages are of the `.ink` box.
- `.tz`: `transform: translate({tx}px, {ty}px) scale(.9)`, `opacity`, a per-phase `transition` and `will-change: opacity, transform`.
- `pointer-events: auto` only while the card is visible.

**Laptop scheduler.** Port `startFloat`, `spawn`, `leave`, `pick`, `hold` and `release` from `Home.dc.html` verbatim. Drive `.tz` styles with refs, not state.

```ts
const ZONES = [ { x: [70, 80], y: [3, 15],  z: 200 },     // slot 0, top right
                { x: [66, 76], y: [37, 47], z: 150 },     // slot 1, middle right
                { x: [70, 80], y: [69, 77], z: 180 } ];   // slot 2, lower right
const REST  = [ [76, 9, 2], [71, 42, -2], [76, 73, 1.5] ]; // x%, y%, rotate° at rest
// N slots on screen = Studio's "On screen at once": slots 0 … N-1.
```

1. **Start, from the rest pose.**
   - Each slot shows items `0 … N-1` at its `REST` position, at full opacity.
   - Each picks a random direction `a ∈ [0, 2π)` and distance `d ∈ [10, 18]`, then drifts to `(cos a·d, sin a·d)` with `transition: opacity .7s ease, transform 6000ms linear`.
   - Set `next = N % items.length`.
   - Slot `i` first leaves at `2600 + i × 1500` ms.
2. **Leave.**
   - If the card is held (hovered), mark it `held` and stop.
   - Otherwise fade it to `opacity: 0` (`.7s ease`).
   - 700ms later the slot is in its gap. After a further random `300–1300` ms, spawn.
3. **Spawn.**
   - Choose the next item round-robin from `next`, skipping any item shown in another slot.
   - Place the card at a random `x`, `y` inside the slot's zone, with rotation `r ∈ [−2.5°, 2.5°]`, `translate(0, 0)` and `opacity: 0`, with no transition.
   - 60ms later, set `opacity: 1` and translate to `(cos a·d, sin a·d)`, where `d ∈ [10, 18]`, with `transition: opacity .7s ease, transform {dwell + 700}ms linear`. The dwell is a random integer `4800–6800` ms.
   - After the dwell, leave.
4. **Hold.** `mouseenter` on a visible card holds it. On `mouseleave`, if it was `held`, it leaves 900ms later.

**iPad scheduler.** Port it from `HomeTablet.dc.html`. It has one slot and different values:

| Setting | iPad value |
| --- | --- |
| Areas | `[{x:[60,66], y:[3,9]}, {x:[64,68], y:[79,84]}]`, one chosen at random per spawn |
| Rest pose | `x 66%, y 82%, r 2°` |
| Outer transform | `translateZ(90px)` |
| Scale | `.88` |
| Drift | 8–14px |
| Dwell | 4800–6400ms |
| First leave | 3200ms after start, drifting from rest over 6000ms |
| Gap after the 700ms fade | `500–1400` ms |
| Item order | Round-robin from item 1 |
| Hover hold | None |

**Accessibility:**

- `.fl` is `aria-hidden="true"` and the link inside it has `tabindex="-1"`. The same projects are reachable in the shelves.
- Floaters never take focus.

**Reduced:** the first N cards stand still at their `REST` positions at full opacity. Nothing is scheduled. The iPad card stands at its rest pose.

**Hero motion off:** floaters still run, because they're switched separately. Hiding the floaters stops them.

**Paused** off screen or when the tab is hidden. On resume, restart from the rest pose.

**Tests:**

- With fake timers: three slots never show the same item at once.
- Hover holds a card past its dwell.
- Reduced motion schedules nothing.
- Unpublished ids are skipped.

### M-AVAIL-PULSE · Availability pulse

**Where:** the green dot in the hero's availability chip, while availability is on.

```css
@keyframes vaPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(60,203,139,.55) } 50% { box-shadow: 0 0 0 6px rgba(60,203,139,0) } }
.live { animation: vaPulse 2.4s ease-in-out infinite; }
```

**Reduced:** dot only. Paused off screen.

## Navigation and controls

### M-NAV-RING · Pill nav ring

**Always on.** A light ring circles the glass pill. Copy the live CSS exactly: `#nav::before` and `#nav::after` with `animation: navShimmer 3.5s linear infinite`, driven by `@property --shimmer-angle`. Browsers without `@property` show a static ring, which is acceptable.

**Reduced:** the ring stands still.

### M-NAV-LINK · Link hover

`.nl { transition: all .22s }`, copied verbatim. On hover, the colour goes to `#F0EEF8` and the background to `rgba(240,238,248,.1)`.

**Reduced:** unchanged, because it's a colour change.

### M-NAV-PILL · Sliding active highlight

`#nav-pill` moves under the active link:

```css
transition: left .32s cubic-bezier(.34,1.26,.64,1), width .32s cubic-bezier(.34,1.26,.64,1);
```

- No transition on first paint or on resize.
- Its `opacity` switches between 0 (over the hero or contact) and 1 without a transition, as on the live site.
- Scroll-spy rules are in [02 › C1](02-tokens-and-components.md#c1--pill-nav).

**Reduced:** the pill jumps (`transition: none`).

### M-NAV-CONTACT · Let's Talk

```css
.n-contact { transition: background .22s, transform .22s, font-weight .15s, box-shadow .3s; }
.n-contact:hover { background: #FF4D5E; transform: scale(1.04); }
.n-contact.active { font-weight: 700; box-shadow: 0 0 20px rgba(232,39,58,.6), 0 0 40px rgba(232,39,58,.3); transform: scale(1.04); }
```

`.active` applies while Contact is the current section.

**Reduced:** no scale. The background and glow stay.

### M-NAV-MENU · Phone menu

**Open:**

- the sheet fades in: `animation: mmIn .24s var(--eo) both` (opacity 0 to 1);
- links rise in: `animation: mmRise .56s var(--eo) both`, with delays 0, 80, 160, 240 and 320ms;
- Let's Talk rises with a 320ms delay.

`mmRise` is the same 16px rise as `vaRise`.

**Close:** instant, as on the board.

- Focus returns to the Menu button.
- The pill's icon swaps from menu to close with no animation.

**Reduced:** no animation.

**Boards:** `Motion.dc.html` › Phone menu; `HomeMobile.dc.html` › `.mmenu`, `.mm-l`, `.mm-cta`.

### M-CTA · Angled CTA

```css
.cta { transition: background-color .2s var(--eo), transform .2s var(--eo); }
.cta:hover { background: #E42A3F; transform: translateY(-2px); }
.cta:active { transform: scale(.98); transition-duration: .12s; }
.cta:focus-visible { outline: none; box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #D61F33; }  /* no movement */
```

**Reduced:** colour change only. No lift or press scale.

**Boards:** `Motion.dc.html` › Angled CTA. Its 200ms replaces the `.25s` in `Home.dc.html` ([D20](09-decisions.md)).

### M-BTN2 · Secondary button

`transition: border-color .2s var(--eo)`. On hover the border goes to `--tx3`. Unchanged under reduced motion.

### M-ACCORDION · Experience accordion (iPad and phone)

There's no board timing for this, so these are decided values:

- the chevron rotates 180° over 200ms `--eo`;
- the panel opens at once, and its content fades in over 200ms;
- height is never animated.

**Reduced:** no rotation or fade.

### M-TESTI-PAGE · Testimonials paging

No board timing either, so these are decided too.

**Laptop prev/next:** the three cards cross-fade.

- Out: 200ms opacity.
- In: 200ms opacity with the 80ms stagger.
- The "1–3 of 7" counter updates.

**iPad and phone:** native horizontal scroll with `scroll-snap-type: x mandatory`. Tapping a dot scrolls smoothly to its card. The active dot changes width over 200ms `--eo`.

**Reduced:** instant swaps and `scroll-behavior: auto`.

## Skills and Off duty

### M-SKILLS-REVEAL · Skills cloud entrance

**Trigger:** the cloud scrolls into view, once (the same observer as [M-REVEAL](#m-reveal--section-reveal)).

**Motion:** every word rises 16px and fades in: `animation: vaRise .56s var(--eo) both`. The delay is `(visual index % 5) × 80ms`, so the words arrive in five waves, across the whole cloud. The visual index is the word's place in the interleaved order, group words included.

```css
.cloud.go .cw { animation: vaRise .56s var(--eo) both; animation-delay: calc(var(--i5) * 80ms); }  /* --i5: index % 5, set inline */
```

**Reduced:** the words are in place from the start.

**Boards:** `Motion.dc.html` › Skills cloud (`.mcl`, `mskWords`). The `Home*` boards show the cloud at rest.

### M-SKILLS-FOCUS · Group highlight

**Trigger:** hover or focus a group word (a preview), or click or tap it (pins it, and a second click unpins it). Pointer leave clears an unpinned preview. On touch there's no hover, so tap pins.

**Motion:** colour and opacity only.

```css
.cw                  { transition: opacity .2s var(--eo), color .2s var(--eo); }
.cw.g button         { transition: color .2s var(--eo), -webkit-text-stroke-color .2s var(--eo); }
.cloud.lit .cw:not(.g):not(.on) { opacity: .16; }
.cloud.lit .cw.on    { color: var(--tx); }
.cloud.lit .cw.xl.on { color: #FF5A67; }
.cw.g.on button      { color: #D61F33; -webkit-text-stroke-color: #D61F33; }
```

**Reduced:** unchanged. It's colour, not movement, and it carries information.

**Boards:** `Home*.dc.html` › `.cloud`, `.cw`; `Motion.dc.html` › Skills cloud.

### M-OFF-PANEL · Off duty panel hover

**Trigger:** hover a panel, or focus inside it, on devices with hover. Wrap the hover rules in `@media (hover: hover)`, and add the same rules for `:focus-within`.

```css
.op      { transition: transform .32s var(--eo); }
.op-cap  { transition: box-shadow .32s var(--eo); }
.op-ico, .op-sl { transition: transform .5s var(--eo); }
.op:hover          { transform: translateY(-4px); }
.op:hover .op-cap  { box-shadow: 8px 8px 0 var(--pa); }
.op:hover .op-ico  { transform: translate(-6px, -4px) rotate(-3deg); }
.op:hover .op-sl   { transform: scale(1.04); }
```

If an `.op-ico` already has a positioning transform on the board, compose the two: put the hover transform on an inner `<g>`.

**Reduced:** no transitions and no transforms. The caption shadow stays at 5px.

**Boards:** `Motion.dc.html` › Off duty panels (`.mop`); `Home*.dc.html` › `.op`.

### M-OFF-SPINE · Spine lift

**Trigger:** hover a spine on devices with hover.

```css
.sp       { transition: transform .32s var(--eo); }
.sp:hover { transform: translateY(-4px); }
```

The spine's own lift (its `padding-top`) is layout, not motion, and doesn't change.

**Reduced:** none.

**Boards:** as M-OFF-PANEL (`.msp i`, `.sp`).

## Cards and lists

### M-CARD · Card hover

**Trigger:** hover, or `:focus-visible` on a project card. Wrap the hover rules in `@media (hover: hover)`; keep focus everywhere.

```css
.card       { transition: transform .32s var(--eo), border-color .32s var(--eo); }
.card:hover { transform: translateY(-4px); border-color: var(--ln2); }
.card .cv   { transition: transform .6s var(--eo); }      .card:hover .cv { transform: scale(1.03); }  /* cover zooms inside its clipped frame */
.card .go   { transition: transform .24s var(--eo); }     .card:hover .go { transform: translateX(4px); }
```

**Reduced:** border change only.

### M-ROW · Rows and the All work tile

| Element | Hover change | Timing |
| --- | --- | --- |
| Rows (`.lrow`, `/work` rows, phone `.row`) | Fill `--bg2` | 200ms |
| Their arrow (`.go`) | `translateX(4px)` | 240ms |
| Dashed tiles (`.see-all`, `.all-row`) | Border `--tx3`, background `--bg2` | 320ms `--eo` |

**Reduced:** colour change only.

### M-COVER-SCAN · Body-scan sweep

This is a scan line on the VOL.01 body-scan cover illustration (`@keyframes vaScan`, 4s `--eo`, looping). **It isn't built in V0.** Covers are uploaded images (PNG, JPG, WebP or GIF), and the site can't animate inside them. That project is also a hidden draft at launch. See [09](09-decisions.md), D16.

## Reading and media

### M-READ-PROGRESS · Reading progress

**Where:** case studies and posts.

**Motion:** a 3px bar fixed to the top edge of the viewport, full width.

- Track `rgba(242,241,238,.08)`, fill `#D61F33`.
- The fill is `transform: scaleX(p)` with `transform-origin: left`.
- `p` is scroll progress through the article body, from 0 to 1.
- It updates on scroll inside `requestAnimationFrame`, with no easing.

**Reduced:** the same, because it carries information.

The case-study rail and the iPad chapter bar also show a 2px progress line in the project accent. It's driven by the same `p`.

### M-CHAPTER-RAIL · Chapter rail (laptop)

**Where:** the case study's sticky left rail.

**Motion:** a 3px marker in the project accent slides along the list's left edge to the current chapter row: `transform: translateY(…)`, `.24s var(--eo)`.

- The current row also gets the board's highlight: `--bg2` fill, `--tx` text and an accent number. That change is instant.
- **Current chapter:** the last chapter whose top has passed 30% of the viewport, using an `IntersectionObserver`.
- **Clicking a chapter** scrolls to it with `scroll-margin-top: 96px` (128px on phones, as on the boards).

**Reduced:** the marker jumps.

**Boards:** `Motion.dc.html` › Chapter rail (`.ind`); `CaseStudy.dc.html` › `nav.toc`.

### M-CHAPTER-SHEET · Chapter picker (iPad and phone)

The sticky chapter bar (`.cbar`, 52px) opens a dropdown sheet under it:

```css
@keyframes csDown { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: none } }
.sheet { animation: csDown .26s cubic-bezier(.2,.8,.2,1) both; }
```

The chevron rotates 180°. Choosing a chapter closes the sheet and scrolls there.

**Reduced:** no animation. **Board:** `CaseStudyMobile.dc.html` › `chapter picker`.

### M-PROTO · Prototype load

| State | What visitors see |
| --- | --- |
| Poster | The poster image and the "Explore the prototype" CTA. Nothing is requested |
| Loading | Inside the device frame: a centred spinner and the mono label "Loading the prototype…". The spinner is 26px (28 on phones), a 2px border `rgba(242,241,238,.15)` with `border-top-color: #F2F1EE`, at `0.8s linear infinite` |
| Running | The `<iframe>`'s `load` event fades it in: `opacity 0→1`, `.32s var(--eo)`. "Exit ✕" and "New tab ↗" are always visible |
| Didn't load | No `load` within 15s, or a network error. The message, "Try again" and "New tab ↗". The case study stays readable |
| Can't embed | Known at publish. "Open prototype ↗" opens a new tab |

- **Esc** exits, and focus returns to the poster button.
- **Phones:** the prototype opens as a full-screen sheet: `@keyframes csUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }`, `.3s var(--eo)`.

**Reduced:** the spinner turns once every 2.4s; there's no fade and no sheet rise.

**Boards:** `Motion.dc.html` › Prototype load; `PublicStates.dc.html` › Prototypes; `CaseStudyMobile.dc.html` › the prototype states. The laptop case study board's skeleton and red bar are replaced by the spinner ([D20](09-decisions.md)).

### M-VIDEO · Video start

Pressing the poster's play button swaps in the host's player at the same size. The spinner shows until the iframe's `load` event.

**Reduced:** same, with the slower spinner.

### M-IMG-FADE · Image load

While an image loads, its box holds the exact aspect ratio, filled with its dominant colour. For covers that's the accent's cover ground. A slow sheen passes over it:

```css
.shim { position: absolute; inset: 0; background: linear-gradient(100deg, transparent 30%, rgba(242,241,238,.07) 50%, transparent 70%);
        background-size: 200% 100%; animation: psShim 1.6s linear infinite; }
@keyframes psShim { from { background-position: 200% 0 } to { background-position: -200% 0 } }
```

On `load`, the image fades in: `opacity .32s var(--eo)`. Prerendered images that are already complete at hydration skip the fade. Failed images show their alt text in place.

**Reduced:** no sheen and no fade.

**Board:** `PublicStates.dc.html` › Images.

### M-LIGHTBOX · Gallery lightbox

There's no board timing, so these are decided values:

- **Open:** the backdrop fades in over 200ms. The image fades in from `scale(.98)` over 320ms `--eo`.
- **Close:** a 200ms fade.
- **Inside:** arrows or swipe move between images, Esc or ✕ closes, and focus returns to the thumbnail.

**Reduced:** instant.

## Studio

Studio uses the same curve, more quietly. Its values are in the Studio boards.

| ID | What | Spec |
| --- | --- | --- |
| M-ST-ENTER | Toasts, dialogs, menus and the sign-in card entering | `@keyframes stUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }`, `.22s var(--eo)` |
| M-ST-FLASH | A moved row or section | Background `#FFF1C9` fading to transparent over 1s, once (`stFlashA` and `stFlashB` alternate so a second move replays it) |
| M-ST-RING | A chapter or block moved by keyboard in the story editor | `stRingA`/`stRingB`: `box-shadow 0 0 0 3px #F5A524` to transparent, 1s |
| M-ST-SWITCH | Switches | Track `background .15s`, knob `left .15s` |
| M-ST-DRAG | A dragged row | Lifts to `scale(1.012)` with a shadow. `.prow` transition `box-shadow .18s, transform .18s, background-color .18s` |
| M-ST-SPIN | Saving and upload spinners, "Email me a code" while it sends, and the code boxes while checking | `stSpin .8s linear infinite`. Reduced: 2.4s |
| M-ST-SHIM | Loading skeletons | `stShim 1.3s linear infinite`, `#ECEBE7`→`#F6F5F2` |
| M-ST-PULSE | The "Saving…" dot | `stPulse` opacity `1 → .35 → 1` |
| M-ST-ROW | Row hover | `background-color .15s` |
| M-ST-OTP | The code boxes on the sign-in page | Border and focus ring: `transition: border-color .2s var(--eo), box-shadow .2s var(--eo)`. The empty box with the caret shows a 2×28px caret: `stBlink 1s steps(1) infinite` (`50% { opacity: 0 }`). Each step of the sign-in card (email, code, signed in) enters with M-ST-ENTER. Reduced: no blink, no entrance |
| M-ST-POP | The topic picker's dropdown, and other popovers | `@keyframes msUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }`, `.22s cubic-bezier(.2,.8,.2,1)`. Closes instantly. Reduced: none |

**Studio under reduced motion:** the boards use `.st * { animation-duration: .01ms !important }`, plus no transitions on rows, blocks and switches. Spinners still turn, once every 2.4s.

---

## Resolved conflicts

These are binding through [09-decisions](09-decisions.md), D20.

| Topic | Board A | Board B | Build |
| --- | --- | --- | --- |
| CTA hover duration | `Home.dc.html`: `.25s` | `Motion.dc.html`: 200ms, plus a 120ms press | 200ms hover, 120ms press to `scale(.98)` |
| Hero entrance on iPad and phone | `.rise` on the chips and name only | Motion: every hero line | Every visible line, 80ms apart |
| Prototype loading | `CaseStudy.dc.html`: skeleton, a 1.1s red bar, a `.36s` fade with `scale(.985)` | Motion and PublicStates: spinner 0.8s, fade 320ms, opacity only | Spinner and label inside the frame; 320ms opacity fade |
| Reading progress | `CaseStudy.dc.html`: 2px in `--pa` | Motion, WritingPublic, CaseStudyMobile: 3px `#D61F33` | 3px `#D61F33` everywhere |
| Chapter rail | `CaseStudy.dc.html`: a highlighted row, no marker | Motion: a sliding 3px marker | Both: the board's row highlight plus the sliding 3px marker in `--pa` |
| All work tile hover | `Home.dc.html`: no transition | Motion: 320ms | 320ms |
| iPad floaters | `HomeTablet.dc.html`: drift 8–14px, dwell 4.8–6.4s, gap 0.5–1.4s | Motion: drift 10–18px, dwell 4.8–6.8s, gap 0.3–1.3s | iPad uses its own board's values; laptop uses Motion's |
