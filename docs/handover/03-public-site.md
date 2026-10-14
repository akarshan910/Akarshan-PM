# 03 · Public site

Every public page, how it's assembled from data, and every state, at laptop (1440), iPad (834) and phone (390).

- **Sizes, spacing, type and colour** are on the boards. This chapter names the board and class for each part, and says what the boards can't: where the data comes from, what hides when it's empty, and how each part behaves.
- **Components** (C1–C21) are specified in [02](02-tokens-and-components.md).
- **Animations** (M-…) are specified in [04](04-motion.md).

## The page shell

Every public page has:

1. **A skip link**, "Skip to work", visible on focus, that jumps to the first shelf on Home and to `<main>` elsewhere.
2. **The pill nav** (C1), or the phone pill with Menu (C1, C2).
3. **`<main>`**, with the page content.
4. **The footer** (C19).

The root element carries `class="va"` and the dark tokens. V0 ships dark only ([09](09-decisions.md), D12). A one-line inline bootstrap adds `js`, and `still` under reduced motion, to `<html>` ([01 · Headers](01-architecture.md#headers)).

**The nav's links come from the layout:** every visible section with a `nav.label`, in page order. On other pages, the links point at `/#<section id>`. On a case study, Work is the current link.

**"Let's Talk →"** always shows, and goes where `contact.letsTalk` says (Studio › Profile & facts):

| Setting | Goes to |
| --- | --- |
| Contact section (V0) | `#contact`, as the live site does. If Contact is hidden, an email instead |
| Email | `mailto:` the contact email |
| LinkedIn | The LinkedIn profile, in a new tab |
| A booking link | `contact.booking`, in a new tab |

If the chosen target is empty, it falls back down the same list: Contact, then email, then LinkedIn. With none of them, it hides.

## Home

`src/routes/home.tsx` renders `site_layout.published.sections` in order. Each section kind maps to one component in `src/components/sections/index.ts`:

```ts
export const SECTIONS: Record<Section['kind'], SectionComponent> = {
  hero: Hero, proof: Proof, shelf: Shelf, writing: WritingSection, about: About, experience: Experience,
  skills: Skills, testimonials: Testimonials, offduty: OffDuty, contact: Contact, text: TextSection, footer: Footer,
};
```

Every section component takes `{ section, profile, projects, posts }` and returns `null` when it has nothing to show.

**A section renders only when all of these are true:**

- `visible` is true;
- it has at least one visible item with content;
- for a shelf, at least one of its projects is published;
- for Writing, at least one published post has "Show on my homepage" on.

**Anchors.** The section's `id` is its DOM id (`#strategy`, `#about`). The legacy anchors `#exp`, `#testi` and `#work` are added too ([07](07-v0-content.md#legacy-links)).

**Headers.** Every section with a `header` renders C4: kicker, the title with its grey second half, and the intro. An empty kicker or intro is left out entirely, not rendered empty.

### Hero

Boards: `Home.dc.html` `#top`, `HomeTablet`, `HomeMobile`. Components: C10 (ink panel), C11 (floating preview), C6 (availability chip). Motion: M-HERO-RISE, M-HERO-BRUSH, M-HERO-TILT, M-HERO-DRIFT, M-HERO-FLOATERS, M-AVAIL-PULSE.

The section is `<section aria-label="Introduction">`.

| Part (layout item) | Data | Empty |
| --- | --- | --- |
| Volume range, the ghost numeral `01—09` | `01` to the number of published, listed volumes, zero-padded | Hidden with no published projects |
| "VOL.00 · Prologue" | Fixed label | — |
| `availability` | `profile.availability` with the pulsing dot | Hidden |
| `location` | `profile.location`, mono | Hidden |
| `name` | `profile.name`, on two lines (first word, then the rest) and a red full stop | Required |
| `brush` | The brush stroke under the name | Item off: hidden |
| `positioning` | `profile.positioning`. `<strong>` renders as the brighter span | Required |
| `intro` | `profile.intro` | Hidden |
| `buttons` | Primary: `heroButtons.primary` (C3 angled CTA). Secondary: "Résumé (PDF)" when `heroButtons.resume` and `contact.resume` is set | Each hides on its own |
| `motion` | `hero.motion`: tilt and speed-line aiming | Off: the panel stays flat |
| `floaters` | `hero.floaters`: published projects only, `atOnce` at a time | Hidden when the list has no published project |

**Floating preview cards** (C11) show `VOL.nn`, the card label (or the company if there's none), the title, and the headline outcome's value with its result label (C5). The outcome's line isn't shown. They're `aria-hidden` with `tabindex="-1"`: decoration that repeats links the shelves already give.

**Per device:**

| Device | Hero |
| --- | --- |
| Laptop | Ink panel with tilt on pointer devices. Up to `atOnce` floaters (max 3) in the zone right of the text |
| iPad | Same panel and drift. One floater at a time, in one of two spots (top right, or beside the buttons) chosen at random each time, using the iPad board's timings |
| Phone | Panel without floaters. Drift on touch; no tilt. Location and intro are hidden, as on the board. The two buttons are full width |

Input decides tilt or drift ([04 · Ground rules](04-motion.md#ground-rules) rule 8); width decides layout.

### Proof strip

Board: `Home*.dc.html` › `aria-label="Highlights"`. Component: C12.

- **Cells:** `profile.proof` items that are visible in the layout, in layout order. The value, then the optional unit, the label, and the optional source line. Proof cells never show a result label.
- **The chips row:** `profile.spaces`, labelled by `spaces.label`. Hidden when empty or switched off. iPad shows the chips without the label. Phones always hide the row, as on the board.
- **Phones** also hide each cell's source line.
- The section is an unlabelled list: `<section aria-label="Highlights"><ul>`.

### Shelf

Boards: `Home*.dc.html` › `#work`, `#strategy`; `WorkScale.dc.html` for the rules. Components: C7, C8, C9.

- **Content:** the shelf's published, visible projects, in layout order. A starred project (`shelf.lead`) moves to the front.
- **The cap:**
  - laptop shows the lead card plus `rows` rows of three;
  - if more projects are left, the last cell becomes "See all N" (to `/work?shelf=<id>`);
  - a gap in the last row gets the "All work" tile;
  - iPad and phones show the same projects in their own layouts: iPad two up, phones as compact rows.
- **Volume numbers** (C9) count published, listed projects across all visible shelves in page order. They're computed at build in `src/lib/volumes.ts`, and the same function feeds cards, `/work`, case studies and floaters.
- **Headline on each card:** `headlineOutcomeId`'s value with its result label (C5).
- **Badge:** covers show the status badge (C6), "Prototype" with the play icon when the project has a prototype.
- **The lead card** ends with "Read the case study →".
- **The "All work" tile** reads "All work · N volumes →", then "Every project in one list, with filters by shelf, company, topic and label." On iPad the second line is "Every project in one list, with filters."
- **Covers:** `Img` with `srcset` and `sizes`. A project without a cover uses the generated cover (C7) in its accent. Below the fold, covers load lazily.

### Writing

Board: `WritingPublic.dc.html` › "Laptop · homepage Writing section" (kicker "Latest posts", title "Writing"). The latest `writing.latest` published posts with "Show on my homepage", newest first. "All posts →" links to `/writing`, and an RSS link shows when `writing.rss` is on. Hidden until there's a post.

### About

Board: `Home.dc.html` › `#about`; iPad and phone versions.

- **Content:** the header, then `profile.about.body` (paragraphs), `about.points` (numbered `01`, `02`… with title and text) and `about.photo`.
- **Empty parts** hide. Without a photo, the text takes the full width. The text column's maximum width stays as on the board.

### Experience

Boards: `Home.dc.html` › `#experience`; `HomeTablet`, `HomeMobile`. Components: C13, C14.

- **Entries:** the visible entries in layout order. The first is Featured, the second Standard, the rest Compact.
- **"Full résumé"** in the header links to `contact.resume`, and hides without one. On phones it sits full width under the entries and reads "Full résumé (PDF)".
- **Hidden highlight items** (`hidden: true`) are left out of the HTML.
- **iPad:** the Featured entry is stacked, with highlight cards two up. The Standard entry is a company row, the role line and one paragraph. Compact entries and Education are accordions (C14, M-ACCORDION).
- **Phones:** the Featured entry shows up to four bullets and an "All {company} highlights" link that expands the rest in place. Other entries are accordions (C14, M-ACCORDION).
- **Education** entries, if any, follow as Compact.

### Skills

Boards: `Home*.dc.html` › `#skills`. Component: C15. Motion: M-SKILLS-REVEAL, M-SKILLS-FOCUS.

- **Content:** the visible groups and every skill in them, in layout and Studio order, at the sizes set in Studio. The interleaved order comes from `src/lib/skills-order.ts` ([02 · C15](02-tokens-and-components.md#c15--skills-cloud)).
- **The hint line** counts the visible skills and groups: "Hover or click a group to light up its skills · 28 skills in 4 groups". On iPad: "Tap a group to light up its skills · 28 skills in 4 groups". On phones: "Tap a group to light it up".
- **Phones** show every group and skill. A phone board's shorter list is only illustrative ([09](09-decisions.md), D15).

### Testimonials

Boards: `Home.dc.html` › `#testimonials`; `HomeTablet` (460px cards); `HomeMobile` (312px cards). Component: C16. Motion: M-TESTI-PAGE.

- **Every** visible testimonial is in the carousel. There's no limit and no separate page ([09](09-decisions.md), D14).
- **Laptop:** three at a time, with prev/next and the "1–3 of 7" counter. The title uses the board's smaller size, `clamp(36px, 4.2vw, 54px)`.
- **iPad and phone:** a snap-scrolling row with dots. The kicker adds the count ("Testimonials · 7"). iPad shows "Swipe →" beside the title.
- **Each card on laptop:** the quote, then initials in a circle in the `tone` accent, the name, the role, the tag, and a LinkedIn icon link when `linkedin` is set. The link's label is "{name} on LinkedIn".
- **Each card on iPad and phone:** the quote, then the name and role as text. No avatar and no LinkedIn link, as on the boards.
- **Accessibility:**
  - the section is a `region` labelled by its title (`aria-labelledby`);
  - prev and next are buttons labelled "Previous testimonials" and "Next testimonials";
  - the counter is a polite live region;
  - on touch layouts each dot is a button labelled "Show testimonial N of M", and the current one has `aria-current="true"`.

### Off duty

Boards: `Home*.dc.html` › `#offduty`. Component: C17. Motion: M-OFF-PANEL, M-OFF-SPINE, M-REVEAL.

- **Content:** the visible items in order, with art, accent, label, title, text and tag.
- **The shelf:** the first item's picks, as spines, under the fixed label "Currently watching / all-time favourites". The list is `<ol aria-label="All-time favourites">`.
- **Phone dots** under the rail are decorative (`aria-hidden="true"`), not buttons.
- **Grids** for 1–6+ items as in C17.

### Contact

Board: `Home.dc.html` › `#contact`; iPad and phone versions. Component: C18.

- **The closing line:** `contact.closing`, then `closingAccent` in `--ac`.
- **Intro:** `header.intro`.
- **Buttons:** "Email me" (`mailto:`) and "Copy email". Copying shows "Copied" for 2 seconds, through a polite live region. There's no toast.
- **Links:** LinkedIn, GitHub and Résumé (PDF). Each hides without its value.
- **Per device:**

  | Device | Buttons and links |
  | --- | --- |
  | Laptop | As above |
  | iPad | Email me, LinkedIn and GitHub, as buttons |
  | Phone | Email me full width, then LinkedIn and GitHub side by side |

  Copy email and Résumé (PDF) are laptop-only.
- **Phone:** shown only when `contact.showPhone` is on and a number is set. V0 has none.
- **Without an email,** the buttons hide.

### Text section

A section added in Studio: the header, then `text.body` as rich text in the 68-character column of the post body ([Writing](#writing-pages)). There's no board of its own; it uses the post body styles from `WritingPublic.dc.html`.

### Footer

C19. "© {year} {name} · {footer.credit}". "Last updated {date}" is the last site publish, formatted "13 Oct 2026". Each item can be hidden in the layout.

- **iPad:** "© {year} {name}" and "Updated {date}". No credit.
- **Phone:** one line, "© {year} {name} · Updated {date}".
- **Case studies:** "© {year} {name}" on the left and a "Back to all work" link to `/work` on the right, instead of the date.

## Phone menu

Board: `HomeMobile.dc.html` and `CaseStudyMobile.dc.html`, tweak "menu open". Component: C2. Motion: M-NAV-MENU.

- **The links:** the nav's links, numbered 01–05, with the current section in red.
- **Below them:** a large Let's Talk, then Email, LinkedIn and Résumé (PDF), each when set.
- **Closing:** ✕ Close in the pill, the "Close menu" button, Esc, choosing a link, or Let's Talk. A link closes the menu, then scrolls.
- **Accessibility:**
  - the menu is `role="dialog"` with `aria-modal="true"` and `aria-label="Site menu"`; its links sit in `<nav aria-label="Sections">`;
  - the pill button has `aria-controls` pointing at the menu and `aria-expanded`. Closed, it reads "Menu" with `aria-label="Open menu"`; open, "Close" with `aria-label="Close menu"`;
  - focus is trapped inside while it's open, and returns to Menu on close;
  - the page behind is `inert`.

## Case study: `/work/:slug`

Boards: `CaseStudy.dc.html` (1440), `CaseStudyTablet.dc.html` (834), `CaseStudyMobile.dc.html` (390, tweaks: menu, chapter picker, prototype states). Motion: M-READ-PROGRESS, M-CHAPTER-RAIL, M-CHAPTER-SHEET, M-PROTO, M-VIDEO, M-IMG-FADE, M-LIGHTBOX.

The page's accent is the project's: `--pa` and `--pg` are set on `<main>` from `visuals.accent`, and every accent use on the page reads them ([02 · Project accents](02-tokens-and-components.md#project-accents)).

**From top to bottom:**

| Part | Data | Empty |
| --- | --- | --- |
| Back link "All work" | `/work` | — |
| Volume tag | `VOL.nn` in the accent (C9) | Unlisted projects have no volume number, so the tag hides |
| Chip | `overview.cardLabel`, in the outlined chip after the volume tag | Hidden |
| Company line | `overview.company`, mono, after the chip. Laptop only | Hidden |
| Title | `overview.title`, as `<h1>` | Required |
| Summary | `overview.summary` | Required |
| Facts row | Company, Type (the `kind` label: "Shipped", "Strategy study" or "Prototype"), My role, Timeline, Focus (`topics` joined with " · "), Team, and a PRD link reading "Read the PRD". iPad uses a 3-column grid | Each fact hides on its own. The boards' "Add in Studio" placeholders appear only in Studio's preview |
| Hero media | `visuals.hero`: the prototype frame, a video, or the cover image | The cover always exists, generated if none was uploaded |
| Prototype heading | The kicker, then `hero.title` as an `h2`, the screens, the buttons, and `hero.note` under the frame. Per device, below | Each hides on its own |
| Summary section | "The problem" (`problem`), "What I proposed" (`proposal`), "Success measures" (outcomes with `inStrip`, value, label and result label) | Each column hides on its own. With all three empty, the section hides |
| Chapters | `story`: chapters that aren't hidden or empty, numbered in order | — |
| Prev / next | The neighbouring projects in volume order, with their volume numbers and titles. Laptop: "← Previous · VOL.04" and "Next · VOL.06 →". iPad: "← VOL.04" and "VOL.06 →". Phone: a section labelled "More volumes" with "Previous" and "Next", then an "All work · N volumes" link | Each hides at its end |

**The prototype heading, per device.** The section is labelled "Interactive prototype" (phone: "Prototype").

| Device | What it shows |
| --- | --- |
| Laptop | The kicker "Interactive prototype", replaced by the chip "Live — tap through the screens" while it runs. `hero.title`, then the `screens` shortcuts as a list, with the current screen highlighted. Buttons: "Explore the prototype", "Exit prototype" while it runs, and "New tab ↗". A round play button over the frame, labelled "Explore the prototype". The fixed line "Nothing loads until you choose to explore. Press Esc to leave." under the buttons |
| iPad | The kicker "Interactive prototype · N screens", `hero.title`, and the screens as one comma-separated line. Full-width "Explore the prototype" and "Open in a new tab ↗". The fixed line "Plays inline in landscape; expands to full screen in portrait." |
| Phone | The kicker "Prototype · N screens", `hero.title`, and "Try the prototype". The fixed line "Opens full screen. Nothing loads until you tap." |

**Chapter navigation:**

| Device | Navigation |
| --- | --- |
| Laptop | A sticky rail on the left: "Chapters · N", then each number and title. The current chapter gets the board's row highlight plus the sliding 3px marker in `--pa` (M-CHAPTER-RAIL). It's a `<nav aria-label="Chapters">`, and the current link has `aria-current="true"`. Scroll-spy follows [04 · M-CHAPTER-RAIL](04-motion.md#m-chapter-rail--chapter-rail-laptop) |
| iPad | A sticky bar under the nav: "01 / 08", the chapter title, and "Chapters ▾". The whole bar is one button labelled "Jump to chapter", and it opens the chapter sheet |
| Phone | The same bar (`.cbar`, 52px). It opens a dropdown sheet under the bar, headed "Chapters · N" (M-CHAPTER-SHEET). Choosing a chapter closes the sheet and scrolls there |

- **Bar accessibility:** the bar button has `aria-expanded` and `aria-controls` pointing at the sheet. The sheet is `<nav aria-label="Chapters">`, and the current row has `aria-current="true"`.
- **Reading progress:** the 3px bar (M-READ-PROGRESS) is fixed to the top edge of the viewport on all three. The rail and the chapter bar also show a 2px progress line in `--pa`.

### Blocks

Each block type has one component in `src/components/case-study/blocks/`. The boards show each one; this table says where.

| Block | Board reference | Notes |
| --- | --- | --- |
| `text` (lead, body) | Chapter 01 "Objective" | Lead is larger and `--tx`; body `--tx2` |
| `heading` | Chapter 06's mono card headings | `h3` |
| `list` | Chapter 01's assumption list | Bullets in the accent. The boxed variant is a `--bg2` box with a 1px `--ln` border, radius 14, a mono label ("Assumptions") and the list inside |
| `quote` | `WritingPublic` post | With an optional cite |
| `callout` | Chapter 04, the "top three" note | Neutral or accent tone |
| `metrics` | The Summary's success measures | Renders the outcomes with `inStrip` |
| `table` (RICE) | Chapter 04 "Prioritisation" | Rows highlighted for the top `highlightTop`, tinted with the accent. On phones, `phoneCards` turns each row into a card: rank, item, score, then the inputs ("R 9 · I 2.5 · C 85% · E 2 mo"), with "· In the plan" on highlighted rows. On iPad and phones only the top five rows show at first: iPad adds a "+ 4 more" row with "Show all nine"; phones add a full-width button with `aria-expanded`, "Show all nine" / "Show the top five". Scores and inputs show as entered |
| `table` (plain) | The same table styles, without highlighting | Scrolls sideways inside its frame on phones, with a fade on the right edge |
| `image`, `gallery`, `beforeafter` | Chapter 05's prototype screens ("Click to enlarge") | Lightbox (M-LIGHTBOX). Captions under the image |
| `video` | `PublicStates` › Video | Poster first ([Media](#media)) |
| `prototype` | Chapter 05's inline prototype | The project's prototype URL plus `startPath` |
| `journey` | Chapter 05 "Tap the menu → … → Confirmation" | Numbered stages; on phones, a vertical list |
| `ownership` | Chapter 07 "My role and decisions" | Columns hide when empty; the "Key decision" row below |
| `cards` | Chapter 02's priority cards and segments | 2, 3 or 4 columns on laptop; 2 on iPad; 1 on phones. Optional kicker line |
| `divider` | — | A hairline with 48px above and below |

## Work list: `/work`

Board: `WorkScale.dc.html` › "Laptop · the work page" and "Mobile · the work page". The empty result is on `PublicStates.dc.html` › "No results on /work".

- **Rows:** every published, listed project, as a dense list. Columns: Vol, Project (title and summary), Company, Shelf, and Headline (value plus result label).
- **Default order** is "Your order": shelf order, then order within the shelf.
- **Filters:**
  - **Shelf:** "All N", then one chip per shelf with its count ("Shipped 4"). Each chip is a button with `aria-pressed`.
  - **Company, Topic, Label:** dropdowns, and several can be picked.
  - **Search:** placeholder "Search work". It covers title, company, summary and topics. Case- and accent-insensitive, with a 150ms debounce.
- **Sort:** Your order, Newest (first published), A–Z.
- **The URL holds the state:** `/work?shelf=strategy&topic=Games&label=target&q=rice&sort=az`. "See all N" on a homepage shelf lands here with `shelf` set. Each change replaces the history entry, not pushes.
- **Paging:** the first 24 rows are in the prerendered HTML. "Load 24 more" (fewer on the last page: "Load {n} more") adds the next ones on the client, and past 100 rows the list virtualises (`@tanstack/react-virtual`). "Showing N of M" is a polite live region.
- **Phones:** the same list as stacked rows. "Filters (n)" opens a bottom sheet with every filter and "Clear filters" at its foot.
- **No results:** the filters as removable chips, the board's message, "Clear filters", and "Keep the search, clear the rest" when a search is active.
- **`?moved=1`** shows the note "That project isn't available any more. Here's everything that is." above the list, dismissible with ✕ ([Page states](#page-states)).

The work page needs JavaScript only for filtering, sorting and loading more. Without it, the first 24 rows are still there.

## Writing pages

Board: `WritingPublic.dc.html` (laptop and phone).

**`/writing`:**

- the header "Writing.", then one line on what the owner writes about: the Writing section's `header.intro`, hidden while empty;
- RSS link;
- topic chips ("All" first), which filter in place and set `?topic=`. On phones they scroll sideways;
- the newest post as a lead, marked "Latest", with its cover, then a plain list of the rest: date, title, excerpt, topic and reading time;
- 20 at a time, then "Older posts" pages at `/writing?page=2` (prerendered).

V0 has no posts, so `/writing` serves the 404 page with a 404 status, and the homepage section hides ([09](09-decisions.md), D19).

**`/writing/:slug`:**

- the reading progress bar;
- "← Writing";
- the meta line (date · reading time · topic), title and subtitle;
- the byline: name, then title and the current company (the first experience entry);
- the cover;
- the body, in one 68-character column, 19px (18px on phones);
- "Share": LinkedIn, X and Copy link;
- "Next post", the next older post.

Cited facts (`fact` blocks) render the value with its result label, as on the board. Links are underlined in `--ac`.

## Media

Board: `PublicStates.dc.html` › Images, Video, Prototypes. Motion: M-IMG-FADE, M-LIGHTBOX, M-VIDEO, M-PROTO.

**Images:**

| State | Behaviour |
| --- | --- |
| Loading | The image's `dominant` colour fills its exact box (width and height attributes, so CLS stays 0), with the slow sheen |
| Loaded | Fades in over 320ms |
| Failed | The alt text stands in, in the same box. Hide the browser's broken-image icon: `onError` swaps the `<img>` for the alt-text box |
| Enlarged | Gallery images open in a lightbox: arrows or swipe, caption and "3 / 7" below, Esc or ✕ to close, focus back to the thumbnail |

**Video** (YouTube, Vimeo, Loom, Google Drive):

| State | Behaviour |
| --- | --- |
| Poster | A poster and a real play button, with the title, length and host ("Plays from YouTube · privacy mode"). Nothing loads from the host before the click |
| Starting | The player's iframe replaces the poster at the same size, with the spinner until it loads |
| Playing | The host's player |
| Unavailable | "This video isn't available right now." with "Watch on the host ↗". Studio's link check also flags it |

Posters come from the host's thumbnail URL, fetched at publish time and stored as media, so visitors don't contact the host before they click. Drive videos have no thumbnail; they use the project's cover.

**Prototypes:**

| State | Behaviour |
| --- | --- |
| Poster | The poster (or the cover) and "Explore the prototype". The prototype isn't requested yet |
| Loading | The sandboxed iframe loads its own address. "Loading the prototype…" with the spinner, in a `role="status"` region. After 15 seconds without a `load` event, it switches to "Didn't load" |
| Running | In its phone, tablet or desktop frame, with "New tab ↗" and "Exit ✕" always visible. Esc exits; focus returns to the poster |
| Didn't load | A `role="alert"` message: "The prototype didn't load." and "Try again, or open it in a new tab." (phones: "Check your connection and try again, or open it in a new tab."), with Try again and New tab. The case study around it stays readable |
| Can't be embedded | When `pm-check-link` found framing blocked, the poster's button is "Open prototype ↗" (new tab) instead, with the note "This prototype opens in a new tab: its host doesn't allow embedding." |
| Phones, and iPad in portrait | Opens as a full-screen sheet. Its header has the prototype's name, "New tab ↗" and a ✕ labelled "Close the prototype" (`CaseStudyMobile` › "prototype open"). iPad in landscape plays inline |

The iframe: `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`, `referrerpolicy="no-referrer"`, `allow="fullscreen"`, `loading="lazy"`, and a `title` such as "Sri Mandir prototype". It's only ever pointed at an `https:` address on another origin ([07 · Legacy links](07-v0-content.md#legacy-links)).

## Page states

Board: `PublicStates.dc.html` › Pages (laptop), and "On phones". Every state keeps the nav and footer, and reads without JavaScript.

| State | When | What it shows | Status |
| --- | --- | --- | --- |
| Not found | Any unknown path, and every draft, scheduled post or deleted page | "404", "This page doesn't exist.", "It may have moved. Everything that's published is one click away.", then See all work, Writing, Home. Writing hides while there are no posts | 404 |
| Moved | A once-public project or post that was unpublished or deleted. The redirect lands on `/work?moved=1` or `/writing?moved=1` | The note above the list, with ✕ | 200 |
| Renamed | An old slug with a redirect | Nothing: a silent 308 to the new address | 308 |
| Draft preview | `/preview/<token>` | The page with the "Draft preview · not public · expires in N days" bar, which can't be closed, and "Only people with this link can see it". Changed blocks are marked "Changed since the live version" | 200, `noindex`, `no-store` |
| Expired preview | An expired or revoked token | "This preview link has expired.", "Preview links last 7 days. Ask for a new one, or see the published work.", then See the published work | 410, `noindex` |
| No results | Filters on `/work` match nothing | [As above](#work-list-work) | 200 |
| Error | A failed client-side load (preview, unlisted, load more) | "Something went wrong.", "This page couldn't load. It's us, not you. Try again in a moment.", then Try again and Go home | — |

**On phones** every state stacks: the Menu + Let's Talk pill, one message, and full-width buttons. The preview bar wraps to two lines.

**Unlisted projects** are served by the `noindex` shell at `/work/:slug` when no prerendered page exists ([01 · Rendering](01-architecture.md#rendering)). It shows the board's loading skeleton, then the project or the 404 state. An unlisted project has no volume number and no prev/next.

## Accessibility, everywhere

- **Landmarks:** `header` (the nav), `main`, `footer`. Each section is a `section` labelled by its heading.
- **Headings:** one `h1` per page. Section titles, case-study chapter titles and the prototype heading are `h2`. Headings inside sections and chapters (cards, `heading` blocks) are `h3`.
- **Result labels** are text, not colour alone ("ACHIEVED"), with the board's fill or outline difference.
- **Links that open a new tab** say so: a visible ↗, plus "(opens in a new tab)" for screen readers.
- **Every image** has alt text or is marked decorative (`alt=""`). Publishing enforces this.
- **Focus** is always visible ([02 · Layout](02-tokens-and-components.md#layout)), and nothing appears only on hover.
- **Reduced motion:** see [04](04-motion.md).
