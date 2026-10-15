# 02 · Decisions and trade-offs

Each entry records the context, the options considered, what was chosen, and what was given up. The binding list for the build is [`docs/handover/09-decisions.md`](../handover/09-decisions.md); this file keeps the reasoning.

## Product

### Rebuild as a platform, not a bigger page
- **Context.** Every edit to the old site was a code change, and nothing could be drafted or previewed.
- **Options.**
  1. Tidy the single file.
  2. Use a hosted headless CMS: Sanity, Contentful, or a Git-based CMS.
  3. Build a purpose-made CMS, "Studio", on Supabase.
- **Chosen.** Studio on Supabase.
  - The editing experience is the product: labelled results with private evidence, a homepage built from widgets, publish checks, and drafts that never leak.
  - Supabase gives Postgres with row-level security, auth, storage, functions and cron, without running a server.
- **Trade-off.** More to build than wiring up a hosted CMS, and in return the editor fits exactly one user.

### Honest numbers
- **Context.** Targets and projections looked like results, and the site and résumé disagreed.
- **Chosen.** Every number carries one of five labels: Achieved, Target, Projected, Baseline or Output. An Achieved result can't be published without a private evidence note. Tenure and counts carry no label.
- **Trade-off.** Some numbers look less impressive with a "Target" label. Trust is worth more to a hiring manager.
- **In the build.** The five labels are component C5. `publishProject` drops every outcome's evidence before anything reaches a page, and a test checks that published views never carry `evidence`, `todo` or `facts`.

### V0: new design, current content, published
- **Context.** The owner wanted the new design live without first rewriting everything.
- **Options.**
  1. Import everything as drafts and publish item by item. This was the original plan.
  2. Publish the current content at launch.
- **Chosen.** Publish the current content. Disputed facts keep their current values and are listed in Studio as "Worth a check", with the résumé's value as an alternative.
- **Trade-off.** Some figures the audit questioned stay live until the owner decides. Nothing new is invented, and the site is never half-empty.

### Never invent
- **Chosen.** No personal facts, numbers, dates or outcomes are made up. Missing content shows as a clearly marked placeholder in drafts and hides on the live site. This is why the skill sizes start at M: which skills look biggest is the owner's call.
- **In the build.** The rule held under pressure from pixel parity: the boards' illustrative copy lives only in a test fixture (`tests/fixtures/board-content.ts`), never in V0. Where the boards were silent, the gap was recorded as a decision instead of filled in, for example "Use the résumé figure" opening an edit rather than overwriting (D76).

## Design

### Volumes over Operator and Editorial
- **Chosen.** Projects as numbered volumes, in a dark, editorial style. It's distinctive, personal (manga storytelling) and still professional.
- **Trade-off.** It's a stronger aesthetic than a neutral template. The shōnen layer was confined to the hero to keep the content easy to read.

### Ink & Depth for the hero only
- **Chosen.** The hero is a tilting ink panel with parallax layers and aimed speed lines. The rest of the site keeps Round 1's calmer system.
- **Trade-off.** Less spectacle below the fold, more legibility and speed.

### Keep the live nav exactly
- **Chosen.** The glass pill, its rotating ring and the red Let's Talk, copied from the live CSS. Phones get Menu plus Let's Talk, and Menu opens a full-screen menu.
- **Why.** It's the old site's signature, and the owner asked for it explicitly.
- **In the build.** Copied from `src/legacy/portfolio.css`. The boards drew the links without the live site's 2px gap and Let's Talk at 10px on phones; the boards won (D74).

### Shelves that cap, and a list that scales
- **Chosen.** Each homepage shelf shows a lead card plus 1–3 rows, then "See all". `/work` lists everything, with filters, search and paging.
- **Trade-off.** The homepage never shows everything. It stays fast and curated at 9 or 90 projects.

### Skills as a word cloud, sized by the owner
- **Context.** The first redesign showed skills as a four-column table. The owner found it "very tabular".
- **Chosen.** One cloud. Group words are outlined, skills are spread evenly through it, and hovering or tapping a group lights up its skills. Sizes S/M/L/XL are set per skill in Studio.
- **Trade-off.** Clouds can be hard to scan, and size implies importance. Mitigations:
  - groups light up on demand;
  - the markup stays grouped for screen readers;
  - the owner chooses the sizes, and V0 starts them all at M.

### Off duty as a manga page
- **Context.** The redesign's plain cards lost the old site's richness: art, labels, tags and the anime picks.
- **Chosen.** A manga page:
  - ink panels with art from six presets;
  - light caption boxes;
  - tags;
  - the favourites drawn as volume spines on a shelf.
- **Trade-off.** A taller section with more visual weight. It's the most personal part of the site, and it explains the "Volumes" idea.

### One motion system
- **Chosen.**
  - One easing curve, a small set of durations, an 80ms stagger, and fixed distances.
  - A live demo of every animation.
  - Full reduced-motion parity.
  - Transform and opacity only.
- **Trade-off.** Less freedom per animation, much more consistency and a predictable performance budget.
- **In the build.** Every ID in 04 was audited against the code before M2 closed. The audit found four real gaps, among them a skills entrance whose held end frame broke the group highlight, and a phone hero entrance that replayed on every visit because a hidden line never finished animating.

## Architecture

### Prerendered public site, client-only Studio
- **Chosen.** React Router 7 in framework mode. Public routes are prerendered at build. `/studio` is a single-page app. A publish triggers a rebuild through a Vercel deploy hook.
- **Trade-off.** Edits take about a minute to go live. In return there's no server to run, pages load fast, and real HTML reaches search engines and link previews.
- **In the build.** With nothing rendered on a server, two gaps had to be closed in the client: a `/work/<slug>` with no prerendered page now asks the `pm-project` function for an unlisted project (D24) or shows the 404, and the SPA fallback page got a default title so Studio is never untitled before JavaScript runs.

### Draft and published copies on the same row
- **Chosen.** Each content row has a `draft` and a `published` JSON column, plus a revisions table.
  - Visitors get column-level grants on published data only.
  - Publishing is one transaction.
- **Trade-off.** JSON documents need validation in code (schemas), but the model stays small and publishing is atomic.

### The layout is data
- **Chosen.** The homepage is a list of typed sections, each a widget with its own settings and items. Navigation is derived from it.
- **Trade-off.** It needs careful schema versioning, and in return any section can be reordered, hidden or added without code.

### Prototypes and videos are links
- **Chosen.** Prototypes are deployed separately (e.g. Vercel) and framed on click in a sandbox. Videos come from YouTube, Vimeo, Loom or Google Drive.
- **Trade-off.** It relies on other hosts, and Drive videos can't autoplay. In return the site stays light, there are no storage costs, and nothing a prototype runs can read the site.
- **In the build.** Video posters are made at publish from the host's thumbnail (D81), so a video page shows an image before anyone presses play.

## Security

### Studio sign-in: from Google to an email code
- **Context.** The first design used Google sign-in with an email-link backup. The owner preferred a one-time email code: easier, and already proven in their lumina-photography admin.
- **Chosen.** A 6-digit code by email to the owner's existing account.
  - Sign-ups are off from day one.
  - Codes are single-use, last 10 minutes, and can be requested once a minute.
  - Cloudflare Turnstile guards code requests once Supabase's CAPTCHA protection is switched on, after lumina's login sends tokens too; Supabase limits code checks per IP.
  - The owner check runs in the database.
- **Trade-off.**
  - It depends on email delivery, so a custom SMTP sender is needed.
  - A code can be phished, so the email says where it may be used.
  - Guessing is the main risk, which is why the limits are required and CAPTCHA protection is switched on as soon as lumina supports it (Q8).
  - In return there's no Google Cloud project or OAuth consent screen, and no window where anyone could sign up.
- **In the build.** CAPTCHA protection stays off for now, because lumina's sign-in doesn't send Turnstile tokens yet (D54). To make guessing harder without it, codes are 8 digits instead of 6 (D66).

### Share one Supabase project with the photography site
- **Context.** Supabase's free plan allows two active projects, and the owner already uses both. One of them runs lumina-photography, the owner's photography site.
- **Options.**
  1. Pause or delete a project to free a slot.
  2. Put the portfolio inside lumina's project, in its own schema.
  3. Move to Cloudflare (D1, R2, Workers) and build sign-in and access rules in code.
  4. Move to Appwrite Cloud.
- **Chosen** (13 Oct 2026): share lumina's project. The portfolio is mostly text and small images, and prototypes and videos are links, so it needs very little of the shared quota. Its data lives in a `pm` schema, with its own owner table, buckets, functions and migrations. Published images are copied into the site at build, so visitors never use the shared egress.
- **Trade-off.**
  - The two sites share sign-in settings, the email sender, quotas, the service-role key and outages.
  - Turning on CAPTCHA protection needs a small change to lumina's login first.
  - The Supabase CLI's migration history can't be used, so the portfolio runs its own migrations.
  - In return there's no new account and no cost, and lumina's traffic keeps the free project from pausing.
- **In the build.** Everything was built and tested without touching the shared project: migrations, RLS and the Edge Functions run against PGlite with Supabase's roles stubbed, and a lint fails any migration that reaches outside `pm`. The owner's session writes drafts only (D55); visitors read published columns, plus `id` (D56) and `index_allowed` (D82).

### A public repository with nothing to steal
- **Chosen.**
  - No secrets in code or history.
  - The owner's address is supplied at setup as `OWNER_EMAIL`.
  - Public keys only in the browser.
  - The service-role key lives only in Supabase (Edge Functions and Vault, for cron) and in the owner's shell for one-off scripts.
  - `SECURITY.md` explains it all.
- **Trade-off.** Setup needs a few manual steps in dashboards, which are documented in the handover.
- **In the build.** Every phase ended with a security review of its diff, and findings went to the owning agent's inbox. Examples: the homepage's data once carried hidden profile items even though the page didn't render them, and a few content links skipped the safe-link check; both were fixed before merging.

## Process

### An AI-agent-ready handover
- **Context.** The owner wants to avoid explaining every pixel and animation during the build.
- **Chosen.**
  - The boards are HTML and CSS with exact values.
  - A precedence order for when sources disagree.
  - Every animation has an ID and a spec.
  - Every resolved conflict is recorded.
  - A list of what to ask the owner: architecture, blockers and core product decisions only.
- **Trade-off.** A large up-front writing effort, which buys a build that doesn't stall on questions.
- **In the build.** It worked as intended: five agents built in parallel and asked the owner only about accounts, the domain and the shared project (the Q-items in 09). When sources disagreed, the precedence order settled it, and each resolution became a dated decision (D46–D82).
