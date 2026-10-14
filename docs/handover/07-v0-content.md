# 07 · V0 content

V0 launches the final design filled with **the current site's content, published**. The owner then rewrites it section by section in Studio. This was decided on 13 Oct 2026 ([09](09-decisions.md), D5).

The rules:

- **Verbatim.** Text is copied exactly as it is on the live site, including spelling ("Personalization", "SugarFit") and punctuation. The only changes allowed are the ones this chapter lists: casing of project titles, splitting a string into two fields, and HTML entities turned into characters (`&rarr;` → `→`, `&amp;` → `&`, `&mdash;` → `—`).
- **Nothing invented.** A field the current site doesn't fill stays empty and hides. The boards' copy is illustrative and is never used as content, except for the few section labels listed here.
- **Disputed facts stay live**, with the résumé's value stored as an alternative and listed under "Worth a check" in Studio ([Worth a check](#worth-a-check)).

## Extraction

M0 moves the content out of `src/app/App.tsx` into `src/legacy/content.ts`, unchanged, before the old app is deleted. Nothing renders it any more; it feeds the seed.

| Export | From `App.tsx` | Notes |
| --- | --- | --- |
| `CASES` | The `CASES` array, verbatim | Remove the two TypeScript casts (`as string[]`, `as { v: string; l: string; c: string }[]`) on Arcana's empty legacy fields |
| `TESTIMONIALS` | The `testimonials` array, verbatim | |
| `HERO` | The `{/* HERO */}` JSX: the four stats, the open-to-work pill and role, the name, title, location, tagline and the two buttons' labels and links | Copy text nodes; keep `<strong>` |
| `ABOUT` | `{/* ABOUT */}`: the three paragraphs, the "Currently building" box and the four KPI cells | Keep `<strong>` |
| `SKILLS` | `{/* SKILLS */}`: four groups with title, subtitle and items | |
| `EXPERIENCE` | `{/* EXPERIENCE */}`: five entries with dates, company, location, role and bullets | Location without the 📍 |
| `HOBBIES`, `ANIME_PICKS` | `{/* HOBBIES */}` and `{/* Anime Picks */}` | |
| `CONTACT` | `{/* CONTACT */}`: kicker, closing words, paragraph, links | |
| `FOOTER` | The typewriter text in the `useEffect` | `"VIBE CODED WITH ♥ IN BENGALURU"` |
| `NAV` | The nav links' labels | About, Skills, Exp, Work, Testimonial |

A unit test snapshots `content.ts`, so any later edit to it is deliberate.

`scripts/seed-v0.ts` then builds the documents below and writes them through the same Zod schemas and the same publish logic as Studio, so V0 content passes the same checks. Two exceptions are allowed only in the seed: the Arcana summary length ([09](09-decisions.md), Q6) and the flagged RICE row ([Projects](#projects)). Both are listed under "Needs input" on the dashboard, not as facts ([Worth a check](#worth-a-check)).

**The seed's inputs:**

- `src/legacy/content.ts`;
- `design/covers/*.webp`, the five cover images ([Covers](#covers));
- `scripts/v0-prototypes.json`, the deployed prototype addresses, filled in once they're deployed ([Legacy links](#legacy-links)). These are public URLs, so the file is committed.

It runs with the service-role key in the owner's shell (`npm run seed:v0`), once, against an empty `pm` schema. Running it twice fails rather than duplicating anything.

## Profile

| Field | V0 value | Source |
| --- | --- | --- |
| `name` | Akarshan Kumar | The hero name, written normally (the live site splits it into AKAR / SHAN / KUMAR for styling) |
| `title` | Senior Product Manager | The hero title row. **Worth a check** |
| `location` | Bengaluru, India | The hero title row |
| `availability` | Open to work · Seeking Senior / Lead PM Roles | The pill and the role beside it, joined with " · ". **Worth a check** |
| `positioning` | `Product Manager with <strong>8 years experience</strong> driving <strong>30 Cr+ in annual revenue</strong> across consumer, health-tech, and D2C platforms.` | The tagline's first sentence |
| `intro` | `Proven track record in 0→1 and 1→100 product journeys across personalization, user experience, growth, and operations.` | The tagline's second sentence |
| `heroButtons` | `primary: { label: 'View My Work', href: '#strategy' }`, `resume: true` | The hero buttons. The résumé button uses the board's label, "Résumé (PDF)" |
| `about.body` | The three paragraphs, with `<strong>` as on the site | About |
| `about.points` | One point: title "Currently building", text `<strong>GLP, Active Foods D2C & Product Analytics</strong> at SugarFit. Scaling AOV by 7% via upsell/cross-sell, reducing RTO by 25%, and improving NPS from 35→52.` | The "Currently building" box |
| `about.photo` | Empty | The live site has none |
| `proof` | Below | The hero stats, then About's KPI cells |
| `spaces` | Empty, so the chips row hides | The live site has no equivalent ([09](09-decisions.md), D32) |
| `experience` | [Below](#experience) | |
| `education` | Empty | Not on the live site |
| `skills` | Four groups, every skill at size M ([09](09-decisions.md), D21) | Skills |
| `testimonials` | The seven, in order | `testimonials` |
| `offDuty` | Six items and the eight picks | Hobbies |
| `contact.email` | The address in the live `mailto:` link | Contact |
| `contact.linkedin` | `https://linkedin.com/in/akarshan910` | Contact |
| `contact.github` | Empty | Not on the live site |
| `contact.phone`, `showPhone` | Empty, off | Not on the live site |
| `contact.letsTalk` | `'contact'` | The live Let's Talk scrolls to Contact |
| `contact.resume.url` | The Google Drive link used by "Download Resume" and "Download CV" | Hero and Contact |
| `footer.credit` | Vibe coded with ♥ in Bengaluru | The footer typewriter, in sentence case. The new footer doesn't type it out |

### Proof

| id | value | unit | label | Visible | Source |
| --- | --- | --- | --- | --- | --- |
| `p-revenue` | 30 | Cr+ | Annual Revenue Driven | Yes | Hero stat. **Worth a check** |
| `p-tenure` | 8 | yr | Product Experience | Yes | Hero stat |
| `p-users` | 300 | M+ | Users Served | Yes | Hero stat. **Worth a check** |
| `p-companies` | 5 | | Companies Built At | Yes | Hero stat |
| `p-arr` | $1.4 | M | ARR generated via 110M lockscreen impressions | No | About KPI. **Worth a check** |
| `p-impressions` | 12 | M | Impressions on nationwide brand campaigns | No | About KPI |

- No `source` and no `type`: the live site gives neither, and the proof cells don't show a label.
- About's other two KPIs ("30 Cr+" and "8 yr") repeat the hero stats, so they aren't copied twice.
- The two hidden items keep the strip to one full row of four. They're one switch away in Studio ([09](09-decisions.md), D30).

### Experience

Five entries, in the live order. Every highlight is ungrouped, so each entry renders as bullets ([02 · C13](02-tokens-and-components.md#c13--experience-entry)).

| id | company | role | dates | location | Bullets |
| --- | --- | --- | --- | --- | --- |
| `e-sugarfit` | SugarFit | Senior Product Manager | May 2025 — Present | Bengaluru | 5 |
| `e-glance` | Glance (InMobi Group) | Product Manager | May 2022 — May 2025 | Bengaluru | 5 |
| `e-razorpay` | Razorpay | Senior Product Analyst | Jul 2021 — Sep 2021 | Bengaluru | 2 |
| `e-vedantu` | Vedantu Innovations | Senior Product Analyst | Jan 2021 — Jul 2021 | Bengaluru | 2 |
| `e-wipro` | Wipro Analytics | Senior Analyst | Aug 2017 — Jan 2021 | Bengaluru | 3, one hidden |

- **Bullets are verbatim**, as `items` of one ungrouped highlight (`id: 'h1'`), with ids `i1`, `i2`, … in order.
- **No `summary`.** The live site has none. SugarFit's first bullet reads like a summary, but it stays a bullet.
- **The Wipro bullet "Saved $XXXK by optimizing Uber Eats' language portfolio…"** is copied with `hidden: true`. It's a live placeholder, so it doesn't show ([09](09-decisions.md), D18).

### Skills

| id | title | subtitle | Items, all size `m` |
| --- | --- | --- | --- |
| `g-product` | Product | Strategy & execution | User & Market Research, Feature Prioritisation, Road-mapping, Stakeholder Management, A/B Testing, Experimentation, Data-driven Development |
| `g-data` | Data | My unfair advantage | SQL, Web (Clickstream) Analytics, Product & Data Analytics, Visualization & Story Telling, ETL |
| `g-design` | Design | Pixel-perfect craft | FigmaMake, Prototyping, Wireframing, Napkin.ai |
| `g-tools` | Tools | The full stack | Excel, Lovable, Mixpanel, Metabase, Tableau, Optimizely, Redash, Superset, Figma, JIRA, Amplitude, Airflow |

28 skills in 4 groups. The owner picks sizes later; the Home boards' "V0: every skill regular" tweak shows the launch look.

### Testimonials

All seven, in the live order: Shreyasi Ghosh, Vishal Gopal, Pallav Srivastava, Rajesh Mainali, Anmol Loonia, Pranshu Singh, Joseph Werede.

- `quote`, `name`, `role` and `tag` are verbatim.
- `initials` are the first two characters of the live value, which is what the live card shows. Pranshu Singh's live value is "PS2", so it becomes "PS".
- `tone` maps the live card colour to the nearest accent:

  | Live colour | Accent |
  | --- | --- |
  | `#E8273A` | Coral |
  | `#00D4FF`, `#38bdf8` | Sky |
  | `#F0C040`, `#fb923c` | Amber |
  | `#4ade80` | Green |
  | `#c084fc` | Violet |

- `linkedin` is empty for all seven. The live cards link to `https://linkedin.com`, not to a profile, so the icon hides.

### Off duty

| id | label | title | tag | accent | art |
| --- | --- | --- | --- | --- | --- |
| `o-anime` | Passion | Anime | Currently watching | Coral | kunai |
| `o-sketching` | Creative | Sketching | Product flows | Yellow | pencil |
| `o-tt` | Sport | Table Tennis | Competitive player | Sky | paddle |
| `o-cooking` | At home | Cooking | Weekend chef | Amber | pan |
| `o-travel` | Explorer | Travel | Always planning next | Green | plane |
| `o-photo` | Visual | Photography | Street & travel | Violet | camera |

- `text` is each card's paragraph, verbatim.
- Accents and art are the ones on the Home boards, which were drawn for these six.
- **Picks**, on `o-anime`, in order, title and note verbatim: Attack on Titan (Action · Strategy), Demon Slayer (Action · Visual Art), Death Note (Psychological · Thriller), Fullmetal Alchemist (Adventure · Deep), Jujutsu Kaisen (Action · Current), One Punch Man (Comedy · Power), Vinland Saga (Historical · Epic), Haikyuu!! (Sports · Motivation).

## Layout

The `site_layout` document, in page order:

| Section id | kind | visible | Nav label | Header: kicker · title · grey half | Items and settings |
| --- | --- | --- | --- | --- | --- |
| `hero` | hero | Yes | — | — | All parts on. `motion: true`. Floating previews: the five projects, 3 at once |
| `proof` | proof | Yes | — | — | The six proof ids, the last two hidden; `spaces` (empty, so it hides) |
| `shipped` | shelf | **No** | — | · Shipped · | `name: 'Shipped'`, rows 2. The four SugarFit drafts ([09](09-decisions.md), D17) |
| `strategy` | shelf | Yes | Work | Projects · Decisions, · not features | `name: 'Strategy & prototypes'`, rows 2. The five projects in live order |
| `writing` | writing | Yes | — | Latest posts · Writing · | Latest 3, RSS on. Hidden until the first post |
| `about` | about | Yes | About | About · Building products that · matter. | text, points |
| `experience` | experience | Yes | Exp | Experience · Where I've · built | The five entries |
| `skills` | skills | Yes | Skills | Skills · What I · bring | The four groups |
| `testimonials` | testimonials | Yes | Testimonial | Testimonials · What teammates · say | The seven |
| `offduty` | offduty | Yes | — | Hobbies · When I'm · not shipping | The six items |
| `contact` | contact | Yes | — | Thanks for stopping by · — | Closing "Let's build something" with "impactful" in red. Intro `Open to <strong>senior PM roles</strong> in health tech, consumer, or fintech. Data fluency, clinical context, ability to ship — fast.` |
| `footer` | footer | Yes | — | — | credit, updated |

- **Headers** come from the live site's headings, split where the live site changes colour ([09](09-decisions.md), D31). The live kickers' dashes ("— About") are dropped, because the design draws its own. CSS uppercases titles, so they're stored in sentence case.
- **No intros.** The live sections have none, so `header.intro` is empty everywhere except Contact.
- **The nav** shows Work, About, Exp, Skills, Testimonial, in page order: the live nav's labels.
- **The Shipped shelf's** only header text is its name, "Shipped". The owner writes the rest when the first SugarFit project is ready.
- **Writing's** kicker and title are the board's, because the live site has no Writing section. It stays hidden until a post is published.

## Projects

Five published projects in the `strategy` shelf, and four drafts in `shipped`.

### Overview and visuals

| Live id | slug | `title` | `company` | `kind` | `accent` | `topics` |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `puja-engagement-platform` | Puja engagement platform | Sri Mandir | study | Coral | CRM, Personalization, Monetization, Engagement, Prototyping |
| 2 | `word-games-monetisation-strategy` | Word games monetisation strategy | Word Trip · Playsimple | study | Yellow | Monetization, Retention, Mobile, Games, Engagement |
| 3 | `arcana-workspace` | Arcana Workspace | Arcana · Workspace | prototype | Slate | 0→1, B2B, Prototyping, Workflows, Fintech |
| 4 | `glp-1-digital-scaffold` | GLP-1 digital scaffold | GLP Health | study | Green | Engagement, Personalization, Monetization |
| 5 | `revenue-growth-strategy` | Revenue growth strategy | FarmVille 3 · Zynga | study | Lime | Monetization, Mobile, Games, Engagement, Retention |

- **Titles** are the live titles in sentence case, keeping proper nouns: Arcana Workspace, GLP-1. Only the casing changes.
- **`summary`** is the live `desc`, verbatim. Arcana's is 143 characters, 3 over the limit ([09](09-decisions.md), Q6).
- **`topics`** are the live filter tags. The tags with a live filter label use it (Monetization, Workflows, Personalization, Prototyping, Engagement). The rest are written as shown: CRM, Retention, Mobile, Games, 0→1, B2B, Fintech.
- **Accents** are the ones the Home board gives these five.
- **Empty:** `cardLabel`, `problem`, `proposal`, `role`, `timeline` and `team`. The live site doesn't have them, and they hide.
- **`prdUrl`:** Arcana's live `prdLink` (a Google Doc). The others are empty.
- **`visuals.cover`:** `design/covers/<slug>.webp` with its alt text ([Covers](#covers)). The media row's focal point is the centre.
- **`visuals.hero`:** the prototype, if it's deployed:

  | Project | Prototype | Frame |
  | --- | --- | --- |
  | Puja engagement platform | `sri_mandir_prototype.html`, once deployed | phone |
  | Word games monetisation strategy | `word_trip_prototype.html`, once deployed | phone |
  | Arcana Workspace | `https://workspace-nu-liard.vercel.app/` (live today) | desktop |
  | Revenue growth strategy | `farmville3_prototype.html`, once deployed | tablet (it's a landscape, 844px-wide prototype) |
  | GLP-1 digital scaffold | None | — |

  `start: 'click'`, no separate poster (the cover is used). A project whose prototype isn't deployed yet gets `{ type: 'image' }` and `todo: ['prototype-link']`, so it appears under "Needs input" on the dashboard. GLP-1 has no prototype and no `todo`.

- **SEO:** empty, so the title and summary are used.
- The live `content.tags` (for example "WhatsApp Business API", "Trust Design") and `volJp` aren't carried over ([09](09-decisions.md), D32).

### Outcomes

Each live `kpis` entry becomes an outcome with `inStrip: true`. `value` and `label` are the live `v` and `l`, verbatim. The live `impact` line becomes one more outcome with `inStrip: false`, and it's the `headlineOutcomeId`: the number on cards, rows and floating previews.

No outcome is Achieved, so none needs evidence. Each label below follows the live label's own wording: "target", "goal", "baseline", "projected", or a count of work produced.

| Project | value | label | type |
| --- | --- | --- | --- |
| Puja engagement platform | 30% | Monthly orders per user uplift target | Target |
| | 12% | WhatsApp conversion rate goal | Target |
| | 5 | Regional languages in Phase 1 | Target |
| | **+30%** | **monthly orders** (headline) | Target |
| Word games monetisation strategy | 50% | Day 1 retention target (vs 35% baseline) | Target |
| | 3.5% | IAP conversion (2.5% → 3.5%) | Target |
| | 8.8M | MAU target (6.5M → 8.8M) | Target |
| | **+1.35×** | **MAU in 12mo** (headline) | Target |
| Arcana Workspace | 7 | Priority widgets designed | Output |
| | V1 | Full PRD → prototype shipped | Output |
| | ∞ | Workspace configurations possible | Output |
| | **0→1** | **shipped** (headline) | Output |
| GLP-1 digital scaffold | 64% | Users currently losing >1 kg — baseline to improve | Baseline |
| | 2.5kg | Additional loss for protocol followers vs non-followers | Baseline |
| | 25% | Fitness MAU — structural engagement gap to close | Baseline |
| | **+2.5 kg** | **lost by protocol followers** (headline) | Baseline |
| Revenue growth strategy | $50-65K | Projected net incremental monthly revenue | Projected |
| | $2.10+ | ARPU target (from $2.00 baseline) | Target |
| | 5 | Features across 4 player segments | Output |
| | **+5%** | **monthly revenue (~$50K)** (headline) | Projected |

The headline's value is the live `impact` text up to the first space, or up to "kg" for "+2.5 kg". The label is the rest. `credit` is empty: the live site doesn't say who did what.

### Story

Each live `customSections` entry becomes one chapter, in order. The chapter title is the section's `title`, verbatim; the number comes from its position. Inside a chapter, blocks are created in this order:

| Live field | Becomes |
| --- | --- |
| `body` | A `text` block, `style: 'lead'` if it's the chapter's first block, else `body`. Wrapped in `<p>` |
| `items` | A `list` block: `<ul>` with one `<li>` per item, HTML kept |
| `subsections` | See below |
| `widgets` | A `cards` block, 3 columns: `title` = `name`, `note` = `rationale` |
| `journeys` | For each journey: a `heading` (`name`), a `text` block `<p><strong>Entry:</strong> {entry}</p>`, a `journey` block with one stage per step (`title` = the step, no note), and a `text` block `<p><strong>Exit:</strong> {exit}</p>` |
| `metricGroups` | See below |

**Subsections.** If every subsection in the chapter has exactly one item, and no item has HTML or runs over 200 characters, they become one `cards` block: `title` = the subsection title, `note` = its item. Columns: 2 for 2 or 4 cards, otherwise 3. In every other case, each subsection becomes a `heading` (its title) followed by a `list` block (its items, HTML kept).

**Metric groups.** Each group becomes:

1. a `heading` with the group's `name`;
2. a `text` block (`body`) with the `subtitle`, if there is one;
3. then either a RICE table or cards.

**RICE tables.** A group is a RICE table when its subtitle is "Reach × Impact × Confidence ÷ Effort", every `definition` matches `Reach: r · Impact: i · Confidence: c% · Effort: e mo`, and every `why` matches `RICE Score s — Priority #p`. It becomes a `table` block:

- `formula: 'rice'`, `checkFormula: true`, `sortByScore: false` (the live order is already the priority order), `highlightTop: 3`, `phoneCards: true`;
- columns `#`, the group name's first word ("Feature", "Initiative"), `Reach`, `Impact`, `Conf.`, `Effort`, `RICE`;
- one row per metric: `p`, `metric`, `r`, `i`, `c%`, `e mo`, `s`, all as written on the live site.

That applies to Sri Mandir's "Feature Priority Ranking" and Word Trip's "Initiative Priority Ranking". **Sri Mandir's "Subscription Packages" row** shows 5.7 but its inputs give 11.3 ([audit](../redesign/01-audit.md)). The seed keeps 5.7, leaves the row out of `reviewed`, and publishes anyway, so Studio flags "1 row needs a look" and the owner decides.

**Every other group** becomes a `cards` block, 3 columns (2 when it has 4 or fewer items): `title` = `metric`, `note` = `definition`, then a line break and `why` when there is one.

Chapters are never hidden in V0. A chapter whose blocks are all empty doesn't exist in the live data.

### The SugarFit drafts

Four draft projects in the hidden `shipped` shelf, `kind: 'shipped'`, company "SugarFit" (the live site's spelling), with titles only:

1. 3D body scan for GLP-1 users
2. Image-based food logging
3. The CGM journey, end to end
4. The GLP-1 app, 0→1

These titles come from the owner's résumé, as summarised on the Home boards. They're drafts, so nothing about them is public. Every other field is empty. The owner fills them in and publishes them one by one; the Shipped shelf appears once the first is published and the owner switches the shelf on.

## Covers

`design/covers/` holds the five V0 covers: the art from the Home board's Strategy & prototypes cards, rendered at 1600×1000 (16:10) without the volume tag or badge, as WebP. The seed uploads each through the same pipeline as Studio, which makes the 480, 960 and 1600 widths and the Open Graph crop.

| File | Alt text |
| --- | --- |
| `puja-engagement-platform.webp` | A phone screen with a red header and a green booking button, over speed lines |
| `word-games-monetisation-strategy.webp` | A row of letter tiles above a circle of linked letters |
| `arcana-workspace.webp` | A dashboard of panels with a rising price chart |
| `glp-1-digital-scaffold.webp` | A falling weight curve towards a target line |
| `revenue-growth-strategy.webp` | Bar chart where the last two bars are projected, rising to a target point |

Covers are uploaded images from here on: the owner can replace any of them in Studio › Projects › Visuals.

## Legacy links

**Case-study links.** The live site opens case studies with `?open=<id>` (also `openCase` and `open_case`). `scripts/write-vercel-config.ts` writes permanent redirects with Vercel's `has` query matcher:

| Query | Redirects to |
| --- | --- |
| `open=1`, `openCase=1`, `open_case=1` | `/work/puja-engagement-platform` |
| `…=2` | `/work/word-games-monetisation-strategy` |
| `…=3` | `/work/arcana-workspace` |
| `…=4` | `/work/glp-1-digital-scaffold` |
| `…=5` | `/work/revenue-growth-strategy` |

These five redirects are fixed in the config, not in `slug_redirects`. If a slug changes later, the normal slug redirect chains from there.

**Section links.** The live anchors were `#about`, `#skills`, `#exp`, `#work`, `#testi` and `#contact`. The new section ids keep `#about`, `#skills` and `#contact`. For the other three, the home page adds an empty anchor with the old id at the start of the matching section: `#exp` in Experience, `#testi` in Testimonials, `#work` on the first visible shelf.

**Prototypes.** The three local prototypes are deployed outside this site, so they run on their own origin and can never read the site's storage or Studio's session ([09](09-decisions.md), D11):

1. Deploy `public/sri_mandir_prototype.html`, `public/word_trip_prototype.html` and `public/farmville3_prototype.html` as one Vercel project, a folder each.
2. Put the production addresses in `scripts/v0-prototypes.json`: `{ "puja-engagement-platform": "https://…", "word-games-monetisation-strategy": "https://…", "revenue-growth-strategy": "https://…" }`.
3. Run the seed, or add the links later in Studio.

The old paths (`/sri_mandir_prototype.html` and the others) redirect permanently to the deployed addresses once they're known, so old shared links keep working. After launch, delete the copies in `public/` and at the repo root ([09](09-decisions.md#launch-checklist-owner), launch checklist item 11).

## Worth a check

The seed writes these keys into `profile.unconfirmed`, with the résumé's value as `alternative` where there is one. Studio lists them on the dashboard and in Profile & facts ("Worth a check"). The live value stays until the owner picks.

| Fact | Live value (V0) | Alternative | Source of the alternative |
| --- | --- | --- | --- |
| `title` | Senior Product Manager | Product Manager | Résumé |
| `availability` | Open to work · Seeking Senior / Lead PM Roles | None: confirm it's still true | — |
| `proof.p-users` | 300M+ Users Served | 230M+ lockscreen users | Résumé |
| `proof.p-revenue`, and the same figure in `positioning` and the About paragraph | 30 Cr+ annual revenue | None: the résumé doesn't state it | — |
| `proof.p-arr`, and the Glance bullet | $1.4M ARR via Tracfone | $2M total: $1.4M via Tracfone, plus $600K from Japan and Brazil | Résumé |
| SugarFit bullet `i4` | GLP-1 app to 50L MRR with 35% renewal rate | ₹3.6 Cr in month one, 52% renewal | Résumé |
| SugarFit bullet `i3`, and the About point | NPS 35→52 | Post-first-sensor CSAT 42 → 72 (of 100) | Résumé |
| SugarFit bullet `i2` | Active Foods D2C to 40L/month; AOV +7%; RTO −25% | AOV +7%; returns −25% (COD) and −17% (prepaid); 5% of carts recovered | Résumé |

**Also listed** under "Needs input", not as facts:

- the Sri Mandir RICE row;
- Arcana's summary length;
- any project without its prototype link;
- the four SugarFit drafts;
- the skill sizes ("All skills are size M").

The audit's full comparison is in [`docs/redesign/01-audit.md`](../redesign/01-audit.md#site-vs-résumé).

## After launch: the owner's list

Nothing here blocks V0. It's what the owner does in Studio afterwards:

1. Resolve every "Worth a check" item.
2. Set skill sizes.
3. Fill the SugarFit drafts and publish them; switch the Shipped shelf on.
4. Add role, timeline and team to each case study, and write "The problem" and "What I proposed".
5. Add a profile photo, education, GitHub and testimonial LinkedIn links, if wanted.
6. Write section intros.
7. Publish the first post, which switches on Writing.
