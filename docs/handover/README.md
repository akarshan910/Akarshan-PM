# Engineering handover: Volumes portfolio and Studio CMS

This is the build spec for **V0**: the final design with the current site's content, and every section editable in Studio. The owner will rewrite the content in Studio after launch.

Read this file first, then the chapter for the area you're working on. The working rules are in [`/CLAUDE.md`](../../CLAUDE.md).

## Chapters

| # | Chapter | What it covers |
| --- | --- | --- |
| 01 | [Architecture](01-architecture.md) | Stack, routes, folder structure, rendering and deploys, environment variables |
| 02 | [Tokens and components](02-tokens-and-components.md) | Every design token and shared component, with exact values |
| 03 | [Public site](03-public-site.md) | Every page, section and state, at laptop, iPad and phone |
| 04 | [Motion](04-motion.md) | Every animation: trigger, properties, timing, easing, reduced motion, implementation |
| 05 | [Studio](05-studio.md) | Every Studio screen and interaction, including sign-in by email code |
| 06 | [Backend](06-backend.md) | Supabase schema, RLS, storage, Edge Functions, cron, publishing, preview, SEO |
| 07 | [V0 content](07-v0-content.md) | How the current site's content maps into Studio for the cold start |
| 08 | [QA](08-qa.md) | Pixel-parity procedure, motion checks, accessibility and performance budgets |
| 09 | [Decisions](09-decisions.md) | What's decided, and what still needs the owner |

The design-phase documents stay valid and are referenced throughout:

- [`docs/redesign/02`](../redesign/02-design-system-and-directions.md): design system and motion summary.
- [`docs/redesign/03`](../redesign/03-cms-architecture.md): data model, RLS, publishing, media, auth.
- [`docs/redesign/04`](../redesign/04-acceptance-criteria.md): acceptance criteria.

Where this handover adds detail, the handover wins.

## Design files

The canvas is the owner's private design file. Its boards are mirrored in [`design/boards/`](../../design/boards), with a preview image of each in [`design/previews/`](../../design/previews). [`design/README.md`](../../design/README.md) explains how to read them. They are HTML with exact CSS, so measurements, colours, type and timings can be copied directly.

| Board | Route or screen | States in the board's Tweaks |
| --- | --- | --- |
| `System.dc.html` | Design system: tokens, type, grid, components | — |
| `Home.dc.html` | `/` at 1440 | skills: V0 sizes or sizes set in Studio; theme dark or light; motion full or reduced |
| `HomeTablet.dc.html` | `/` at 834 | skills; motion |
| `HomeMobile.dc.html` | `/` at 390, including the phone menu | skills; menu open; motion |
| `CaseStudy.dc.html` | `/work/:slug` at 1440 | theme |
| `CaseStudyTablet.dc.html` | `/work/:slug` at 834 | — |
| `CaseStudyMobile.dc.html` | `/work/:slug` at 390 | menu, chapter picker, prototype states, motion |
| `WorkScale.dc.html` | Shelf scaling rules, `/work` at laptop and phone | interactive slider and filters |
| `WritingPublic.dc.html` | Homepage Writing section, `/writing`, `/writing/:slug`, laptop and phone | — |
| `PublicStates.dc.html` | Media states and page states: 404, moved, preview, expired, empty, error | — |
| `Motion.dc.html` | Every animation, as a live demo with its spec | Replay; reduced motion |
| `R3Ink.dc.html` | Where the hero came from (reference only) | — |

The other boards in `design/boards/` are earlier rounds (`Main`, `Direction*`, `Devices*`, `R2*`, `R3*`). They're history, not spec: never build from them.
| `StudioLogin.dc.html` | `/studio/login`: sign-in by email code | email, sending code, bot check, enter code, code typed, checking, wrong code, expired, too many tries, wait to resend, signed in, signed out, offline, deep link, not the owner |
| `StudioAuthFlow.dc.html` | Every sign-in and sign-out path as a storyboard, plus the rules for codes, limits and the owner check | — |
| `StudioDashboard.dc.html` | `/studio` | populated, empty, loading |
| `StudioSite.dc.html` | `/studio/website`: Website builder | default, reordered, widget hidden, shelf selected, skill group selected, off duty item selected, phone preview, publish dialog |
| `StudioProjects.dc.html` | `/studio/projects` | dragging, layout changed, menu open, delete confirm, filtered, no results, loading, error |
| `EditorOverview.dc.html` | `/studio/projects/:id` › Overview | offline, save failed, validation, publish states |
| `EditorVisuals.dc.html` | › Visuals | uploading, missing alt text, publish blocked, video, Drive, prototype link states |
| `EditorCaseStudy.dc.html` | › Story | add block, empty chapter, re-ranked, text selected, dragging chapter, saving, offline, save failed, publish |
| `EditorOutcomes.dc.html` | › Outcomes | achieved without evidence, new result, no results, saving, offline, save failed, publish |
| `EditorSettings.dc.html` | › URL & SEO | redirect, previews, unlisted, preview link, unpublish or delete |
| `StudioWriting.dc.html` | `/studio/writing` | writing a draft, many topics, topics dropdown open, no posts, publish dialog, scheduled, published |
| `StudioMedia.dc.html` | `/studio/media` | uploading, needs alt text, delete blocked, empty filter |
| `StudioProfile.dc.html` | `/studio/website/profile`: Profile & facts | default, all confirmed, availability off, testimonial limit (superseded, see D14), publish with open items |
| `StudioPreview.dc.html` | Draft preview: device switcher, changes, share link | desktop, tablet, phone, compare, share open |
| `StudioStates.dc.html` | Every system state: saving, toasts, dialogs, session, conflicts, uploads, empty, loading | — |
| `StudioTablet.dc.html` | Studio at iPad portrait and landscape | — |
| `StudioMobile.dc.html` | Studio on phones | — |

## Milestones

Build in this order. Each milestone ends with the [QA](08-qa.md) pass for what it touched. Tick the boxes in the same commit as the work.

### M0 · Foundation

- [ ] Ask the owner the questions marked "before M0" in [09-decisions](09-decisions.md). Keep working on anything that doesn't depend on the answers.
- [ ] TypeScript strict, ESLint and Prettier, Vitest, Playwright, plus `typecheck`, `lint`, `test`, `build` and `e2e` scripts.
- [ ] React Router 7 framework mode: prerendered public routes, `/studio/*` as a client-only SPA. See [01](01-architecture.md#rendering).
- [ ] Folder structure, per [01](01-architecture.md#folders).
- [ ] `tokens.css` with every token from [02](02-tokens-and-components.md), in dark and light.
- [ ] Self-hosted fonts:
  - Archivo variable, `wdth` 62–125 and `wght` 100–900;
  - Geist;
  - Geist Mono;
  - JetBrains Mono for the nav.
- [ ] CI on GitHub Actions: typecheck, lint, test and build on every push, plus a secret scan (gitleaks) that fails the build on a finding.
- [ ] Replace the Figma Make `package.json` with the new stack, and commit `package-lock.json`.
- [ ] `.env.example` with the variable names from [01](01-architecture.md#environment) and empty values.
- [ ] Move the current site's content out of `src/app/App.tsx` into `src/legacy/content.ts`, verbatim. Nothing renders it any more; it feeds the V0 seed. See [07](07-v0-content.md#extraction).

### M1 · Components

Every component lives under `src/components/`, matches its board, and has a dev-only catalogue page at `/dev/components`.

- [ ] Pill nav, copied exactly from the live site:
  - glass, rotating ring and Let's Talk;
  - the sliding active highlight and scroll-spy;
  - the contact glow;
  - the phone pill with Menu, and the menu sheet.
- [ ] Angled CTA (primary), secondary button, text link.
- [ ] Section header: kicker, title with a two-tone second half, intro.
- [ ] Result labels: Achieved, Target, Projected, Baseline, Output.
- [ ] Volume tag, badge, chip, availability chip with pulse.
- [ ] Project card: lead, standard, compact phone row, and the See all / All work tile.
- [ ] Generated cover, used when a project has no cover image yet.
- [ ] Shelf: header, lead, grid, closing tile, cap logic.
- [ ] Experience entry, accordion row, testimonial card, contact block, footer.
- [ ] Skills cloud: interleaved order, five tiers, group highlight by hover, focus and tap. See [02 · C15](02-tokens-and-components.md#c15--skills-cloud).
- [ ] Off duty page: manga panels with the six art presets, caption boxes, the spine shelf, and the phone rail. See [02 · C17](02-tokens-and-components.md#c17--off-duty-page).
- [ ] Media: image (loading, loaded, failed), lightbox, video embed (poster, starting, playing, unavailable), prototype embed (poster, loading, running, error, can't embed, phone sheet).
- [ ] Page states: 404, moved project note, draft preview bar, expired preview, no results, error.

### M2 · Public site on local V0 data

Build every page against a local JSON copy of the V0 seed (from M0's extraction) before any backend exists.

- [ ] Home with every section in the V0 order, at 1440, 834 and 390.
- [ ] Hero: ink panel, layers, speed lines, brush, floating previews, tilt and drift.
- [ ] Proof strip, Strategy & prototypes shelf (Shipped stays hidden in V0), About, Experience, Skills, Testimonials, Off duty, Contact, footer.
- [ ] Motion layer, all of [04](04-motion.md), with reduced-motion variants.
- [ ] `/work` list: filters, search, sort, load 24 at a time.
- [ ] `/work/:slug` case study for all five V0 projects, every block type, at all three sizes.
- [ ] `/writing` and `/writing/:slug`. V0 has no posts, so `/writing` returns the 404 page and the homepage section is hidden.
- [ ] 404, error and empty states.
- [ ] Redirect old `?open=<id>` links to `/work/<slug>`.

### M3 · Supabase

- [ ] Read [06 · The shared project](06-backend.md#the-shared-project). The Supabase project also runs lumina-photography.
- [ ] `npm run db:migrate` and `supabase/pm/migrations/`: the `pm` schema with every table, policy, column grant and index in [06](06-backend.md#schema). Expose `pm` in the Data API settings.
- [ ] The `pm-media-draft` and `pm-media-public` buckets, with the policies in [06](06-backend.md#storage).
- [ ] Sign-in by email code, as in [06](06-backend.md#auth):
  - sign-ups off;
  - the owner created by `npm run setup:owner`, reading `OWNER_EMAIL` from the local shell;
  - the `owners` table and the `is_owner()` check;
  - Turnstile in Studio; Supabase's CAPTCHA protection switched on once lumina's login sends tokens ([09](09-decisions.md), Q8);
  - the code-only email template and custom SMTP.
- [ ] V0 seed script loads profile, layout and projects from `src/legacy/content.ts`. See [07](07-v0-content.md).
- [ ] The build reads published content from Supabase at prerender time and stops using the local JSON.

### M4 · Studio

- [ ] Shell:
  - 240px sidebar on laptop, 72px rail on iPad, bottom tabs on phones;
  - the account menu;
  - save status.
- [ ] Sign-in by email code and every path on `StudioAuthFlow`. See [05](05-studio.md#sign-in).
- [ ] Dashboard.
- [ ] Website builder: outline, order, show or hide, nav labels, section settings, floating previews, skill sizes, off duty items, add section, live preview, publish website.
- [ ] Profile & facts, with confirm states.
- [ ] Projects list: order, lead star, menu, filters, layout publish bar.
- [ ] Project editor: Overview, Visuals, Story, Outcomes, URL & SEO, with autosave, conflict, offline and publish checks.
- [ ] Writing: list, editor, settings with the topic picker, schedule, publish.
- [ ] Media library.
- [ ] Draft preview and share links.
- [ ] Every state on `StudioStates`.
- [ ] iPad and phone layouts.

### M5 · Publishing and SEO

- [ ] Edge Functions:
  - `publish` (site, project, post);
  - `preview`;
  - `check-link`;
  - `post-scheduler`;
  - `purge`.
- [ ] A Vercel deploy hook rebuilds after every publish.
- [ ] Per-page metadata:
  - title, description and canonical;
  - Open Graph image;
  - `BlogPosting` data for posts.
- [ ] `sitemap.xml`, `robots.txt`, `/writing/rss.xml`.
- [ ] `noindex` on drafts, previews, unlisted pages and `/studio`.
- [ ] Slug redirects.

### M6 · QA and launch

- [ ] The full [QA](08-qa.md) pass at all three sizes, motion, accessibility and performance.
- [ ] The owner's launch checklist in [09-decisions](09-decisions.md#launch-checklist-owner):
  - domain;
  - SMTP sender and Turnstile keys;
  - `npm run setup:owner`, then a first sign-in;
  - prototypes deployed;
  - GitHub security settings.
- [ ] Remove `dist/` from git, the two duplicate prototype files at the repo root, and any dependencies nothing uses.

### M7 · The wiki

Written last, once the site and Studio are live and stable. The plan and the page list are in [`docs/story/03-wiki-plan.md`](../story/03-wiki-plan.md).

- [ ] Add "The build" entries to [`docs/story/01-evolution.md`](../story/01-evolution.md): what was built, what changed from the plan, and why.
- [ ] Update [`docs/story/02-decisions.md`](../story/02-decisions.md) with how each decision played out.
- [ ] Write every page in `docs/wiki/`, then push them to the GitHub wiki once the owner has turned it on.
- [ ] Update the root `README.md`: the live link, the status table, and links to the wiki.

## Definition of done, for every item

1. **Pixel parity.** It matches its board at 1440, 834 and 390, checked with the [QA](08-qa.md) procedure. Any intentional difference is written down in [09-decisions](09-decisions.md).
2. **States.** Every state shown on the board, or listed in the chapter, exists and is reachable.
3. **Motion.** Every animation listed for it in [04](04-motion.md) runs with the exact values, and its reduced-motion variant works.
4. **Keyboard and screen readers.** It works by keyboard alone with visible focus, and the labels match the board's `aria-*` attributes.
5. **Checks.** Typecheck, lint, unit tests and build pass. Playwright covers the item's main path.
6. **Content.** No invented content. Empty fields hide cleanly.
