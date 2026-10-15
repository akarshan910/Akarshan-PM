# Handoff: where the build is, and how to carry on

This file lets a new session pick up the build without any memory of earlier sessions. Read it after [`CLAUDE.md`](CLAUDE.md), then follow the reading order below. Keep it current: update the **Status** and **Next** sections in the same commit as the work.

_Last updated: 15 Oct 2026._

## Start here

1. **Branch.** All work is on `claude/elegant-allen-xdmal0`. `main` is the **live site** and stays untouched until launch (M6), when the branch is merged ([09](docs/handover/09-decisions.md), D46). Check it out: `git fetch origin && git checkout claude/elegant-allen-xdmal0`.
2. **Read, in this order:**
   1. [`CLAUDE.md`](CLAUDE.md): rules, sources of truth, security, when to ask the owner.
   2. This file: status, what's next, how we work, gotchas.
   3. [`docs/handover/README.md`](docs/handover/README.md): milestones with ticked boxes, definition of done, the board table.
   4. [`docs/handover/10-execution-plan.md`](docs/handover/10-execution-plan.md): phases, default values, architecture rules, security gates, owner touchpoints.
   5. The chapter for the area you're working on (01–09) and its boards in [`design/boards/`](design/boards) ([`design/README.md`](design/README.md) explains them).
3. **Set up:** `npm ci`, then check everything passes: `npm run typecheck && npm run lint && npm run format:check && npm run test:coverage && npm run build && npx playwright test`.

## The owner's standing instructions

- Build the design exactly; it's final. Don't nitpick-ask about pixels, copy on boards, timings: they're in the boards and docs.
- **Stop and ask the owner** only when you need their input to unblock, or **before anything touches the shared Supabase project** (it also runs their lumina-photography site).
- Never invent personal facts, numbers, roles, dates or outcomes. The repo is public: no secrets, ever.
- Keep `main` as the live site until launch (D46). Don't open pull requests unless asked.
- Commit messages end with the two trailer lines used throughout the history (`Co-Authored-By: …` and `Claude-Session: …`); if your session provides its own attribution lines, use those instead. No model names in commits.

## Status

| Milestone | State |
| --- | --- |
| M0 · Foundation | **Done.** Stack, routing, tokens, fonts, CI, security gates, legacy content frozen, shared content core |
| M1 · Components | **Done.** Every C1–C22, S1, S2 and Studio primitive, on `/dev/components` (dev only) |
| M2 · Public site on local data | **Done** (merged 15 Oct 2026), except closing the pixel-parity sections (about 49 of 75 pass). See Next |
| M3 · Supabase | **Built and tested locally** (merged 15 Oct 2026): `pm` schema with RLS, buckets, the six `pm-` Edge Functions, `db:migrate`, `db:lint`, `setup:owner`, `seed:v0`, PGlite tests (`npm run test:db`). The Supabase content source (`CONTENT_SOURCE=supabase`, WP3.5) is built and tested; local-v0 stays the default until go-live. Not done: every go-live step on the shared project, which the owner runs (`supabase/README.md`) |
| M4 · Studio | **Built** (merged 16 Oct 2026): every screen, the review fixes and the Supabase-backed repo (security-reviewed against the real migrations). Open: iPad and phone (QA's pass); resumable uploads before launch (D80) |
| M5 · Publishing and SEO | **Built** (merged 16 Oct 2026): the `pm-` functions with posters and deploy-only retry, cron, per-page metadata, sitemap, robots, RSS, media copied at build, redirects, the unlisted shell, and the host's routes and headers as Vercel Build Output (per-page CSP hashes, D83). The cron and deploy hook switch on with the owner's go-live |
| M6 · QA and launch | **In progress.** The no-leaks CI job against a local Supabase, the full 08 pass (QA: accessibility, devices, parity, performance; security: no-leaks and security checks), then the owner's launch checklist below |
| M7 · Wiki | Not started |

### M2 in detail

**Done:**

- **Data layer.**
  - `src/lib/published.ts` defines the published shape and `publishProject`/`publishProfile`.
  - `src/lib/content-source.ts` and `src/lib/content.server.ts` choose the source with `CONTENT_SOURCE`: `local-v0` (the default), `fixture:boards`, or `supabase` (M3).
  - `src/lib/sources/local-v0.ts` serves the V0 content.
  - `src/lib/site.ts` builds the views, and that's where drafts and hidden parts are removed.
- **Page shell.** `src/routes/public-layout.tsx` provides the skip link and pill nav, with the chrome from the loader.
- **Prerendering.** `react-router.config.ts` prerenders `/`, `/work`, `/writing`, `/404` and every `/work/<slug>`. The post route is registered only once posts exist; see Gotchas.
- **Home.** `src/routes/home.tsx` and `src/components/sections/*` render every section at 1440/834/390. The hero motion (rise, brush, tilt, drift, floaters, pause) is in `src/motion/*`, and scroll reveals are included.
- **Rich text.** `src/lib/rich-text.ts` and `src/components/rich/RichText.tsx` form the only path for `Inline`/`Rich` strings. The renderer is allowlist-based and tested with XSS payloads.
- **/work list.** Commit `4885a85`: filters, search, sort and paging. See `src/lib/work-list.ts` and `src/components/work/`.
- **Case study `/work/:slug`.** `src/routes/work.$slug.tsx` renders `src/components/case-study/` on the view from `src/lib/case-study.ts`:
  - the header and facts, the prototype heading per device (or a video or the cover), and the Summary;
  - the chapter rail with its sliding marker (laptop), and the chapter bar and sheet (iPad and phones);
  - reading progress, prev/next, "More volumes" on phones, and every block type in `blocks/`.
  - It's checked by eye against the three boards with V0 content. Pixel parity waits for the board fixture (Next, item 4), and Playwright hasn't run on it yet (see Gotchas).

Also merged: `/writing` and `/writing/:slug`, the 404, error and empty states, `?open=` legacy redirects, the boards fixture with `CONTENT_SOURCE=fixture:boards` and `?qa=1`, and the M2 QA pass (accepted differences in D60).

**Remaining:** see **Next**.

### How the work is running (15 Oct 2026)

Five agents work in parallel, each in its own git worktree and branch (`claude/agent-portfolio-*`, `-studio-*`, `-security-*`, `-qa-*`, `-review-*`). They coordinate through the git-ignored folder `.agents/` in the main checkout: each has a `progress.md` and an `inbox/`, so work survives a session ending. Only the review agent merges agent branches into `claude/elegant-allen-xdmal0`, after the full checks; the others merge the integration branch back. A new session resumes from its agent's `progress.md` and inbox.

## Next

Pick up in this order. Each item lists the doc sections to read.

1. **M6 · the full 08 pass**, split by owner:
   - QA: accessibility, devices (including Studio at 834 and 390, the last M4 box), performance budgets (01 · Performance budget) and pixel parity with `npm run parity`; portfolio closes the parity sections still failing.
   - Security: the no-leaks job (CI `no-leaks`, against a local Supabase) and 08 · Security checks, including a CSP check against `.vercel/output/config.json`.
   - Review: keeps every CI job green, merges, ticks the M6 boxes.
2. **Dev dependencies:** move vitest 3 to the current major with `@vitest/coverage-v8` (dev-only advisories; `npm audit --omit=dev` is clean).
3. **M7 · the wiki**, once the site is live and stable (portfolio).
4. **The owner's launch checklist** below.

## Launch checklist (the owner, in order)

Everything else is built and checked; these steps need the owner's accounts or decisions. Details for steps 4–5 are in [`supabase/README.md`](supabase/README.md) › Going live and › Check it works; the reasons are in [09](docs/handover/09-decisions.md).

1. **Decide the open items:**
   - the sign-in email sender (D53): lumina's existing Resend SMTP (recommended) or Supabase's built-in sender (development only);
   - Studio's own rich-text field and reordering instead of TipTap and dnd-kit (D69, recommended: keep);
   - the three nav reds (Q5): keep the live values with an accessibility exception, or the slightly darker AA values;
   - optional: HEIC conversion outside Safari (D80; today Studio asks for a JPG).
2. **Prototypes:** deploy the three prototypes as one Vercel project and fill `scripts/v0-prototypes.json` (`seed:v0` reads it in step 4).
3. **Vercel site project:** the "Other" preset with `npm run build` (the build writes `.vercel/output`, D83). Its production branch is `main`.
4. **Supabase, the 18 go-live steps** in `supabase/README.md`, in order: expose `pm`, switch on `pg_cron` and `pg_net`, `db:migrate` (dry run first), Vault, the deploy hook, function secrets, deploy the six functions by name, Auth settings (sign-ups off, 8-digit codes, 10-minute links, the template, the sender from step 1), rate limits with CAPTCHA off (D54), `setup:owner`, `seed:v0`, the Vercel environment variables (`CONTENT_SOURCE=supabase`), redeploy.
5. **Check it works** (`supabase/README.md`): cron runs, an 8-digit code arrives, a publish rebuilds the site, a preview link works and revokes, lumina's sign-in still works.
6. **Launch:** approve merging `claude/elegant-allen-xdmal0` into `main` (D46). Review does the merge; `main` deploys.
7. **Content:** sign in to Studio and work through every "Worth a check" item on the dashboard.
8. **Accounts:** GitHub secret scanning with push protection, Dependabot, private vulnerability reporting and branch protection on `main`; 2-Step Verification on the owner's mailbox (it's the key to Studio).
9. **After launch:** remove `dist/` from git, delete the old prototype copies in `public/` and at the repo root, take down the old site's Vercel project if it's separate, and check the résumé PDF's own metadata (PDFs upload unchanged).

## Decisions made during the build

They're all in [09](docs/handover/09-decisions.md); the build-phase ones are D46–D83 (D49–D54 and D66 answer Q2, Q3, Q4, Q6, Q8, Q9 and Q10; D55–D59 are M3's; D61–D65 are M4's). Smaller deviations from the boards, already in the code:

- **Type and touch targets:** type is never under 12px (11 on phones) where boards used 10px, except Let's Talk on phones (10px, D74). Lightbox buttons, testimonial dots and phone-menu footer links got 44px or 24px targets, to pass axe.
- **Accordion:** it rotates a plus 45°, per 02 and the board, not 04's chevron.
- **Studio:** the switch and fields follow the Studio boards over C22. Save status uses a spinner (M-ST-PULSE). Toasts last 7s and accept a prop.
- **Iframes:**
  - Video iframes send `strict-origin-when-cross-origin`, because YouTube needs a referrer.
  - Prototypes follow 03 exactly (`no-referrer`, four sandbox flags).
  - Every link rendered from props goes through `safeHref()` (`src/lib/links.ts`).
- **Generated cover:** the WorkScale cover without art.
- **Testimonial avatar colours:** derived from the tone (18% accent on `#0B0B0E`, text at 55% accent on white).
- **Case study:**
  - On phones the Summary also shows "The problem" and "What I proposed", stacked above the measures; the phone board shows only the measures, but 03 hides them only when empty.
  - The accent colours "· In the plan" and the current row in the chapter sheet (the board's coral `#FF5A67` was its accent).
  - Cards with kickers draw as priority cards; cards without draw as the hairline grid (chapter 03), and as a numbered list on phones.
  - On iPad, RICE tables drop the `#` column into the item ("1 · …") and shorten the input headers to R, I, C and E, as on the board.
- **Content gaps:** the testimonial "tag" isn't rendered (no board shows it). Compact experience entries join bullets with " · ", as on the iPad board.

## How we work

- **Checks before every commit:** `npm run typecheck && npm run lint && npm run format:check && npm run test:coverage && npm run test:db && npm run db:lint && npm run build && npx playwright test`. CI also type-checks the Edge Functions with Deno. Coverage floors: `src/lib` 90/85, `src/components` 80/70.
- **Push after every commit** to `claude/elegant-allen-xdmal0`. Cloud containers get reset, and unpushed work is lost.
- **Small commits,** one milestone item at a time, ticking the README boxes in the same commit.
- **Pixel parity:**
  - Render a board with `node design/tools/render-board.mjs <board> <outdir> '<tweaks json>'`.
  - Screenshot the page at 1440, 834 and 390, and compare section by section.
  - Copy board CSS values, never eyeball new ones.
- **Layers** (ESLint enforces them):
  - `src/lib` is plain TypeScript, with no React.
  - Public code never imports Studio (`src/components/studio`, `src/routes/studio`).
  - Public loaders return views from `src/lib/site.ts`, never raw documents.
- **Subagents:**
  - Parallel agents in git worktrees are fast, but a container reset destroyed three tracks' unpushed worktrees once.
  - Usage limits also stop agents midway.
  - Prefer one agent at a time in the main checkout, pushing after each commit. If you do use worktrees, merge and push often.
- **After each phase:** run a security review of the phase's diff and fix what it finds (done for M0 and M1).

## Code map

| Path | What it holds |
| --- | --- |
| `src/legacy/content.ts` | The live site's text, frozen verbatim. A test traces every string to `tests/fixtures/legacy-app.tsx.txt` |
| `src/legacy/portfolio.css` | The live stylesheet, read-only; the pill nav is copied from it |
| `src/lib/schemas.ts`, `types.ts` | Zod schemas (06) and inferred types; link rules `isSafeLink`, `isHttpsUrl`, `isRelativePath` |
| `src/lib/defaults.ts` | Factories for every new document (10 · Default values, layer 3) |
| `src/lib/v0.ts` | `buildV0Documents()`: 07's mapping, fails loudly instead of inventing |
| `src/lib/published.ts` | Published shape and publish functions |
| `src/lib/content-source.ts`, `content.server.ts`, `sources/` | Content sources and the single loader entry |
| `src/lib/site.ts` | Public views: the line drafts never cross |
| `src/lib/links.ts`, `rich-text.ts`, `qa.ts`, `volumes.ts`, `shelf.ts`, `accents.ts`, `skills-order.ts`, `work-list.ts`, `case-study.ts` | Pure helpers |
| `src/components/**` | Components, one folder per area; `studio/` is Studio-only |
| `src/motion/` | Keyframes, reduced motion, tilt, floaters, reveal, pause, speed lines |
| `src/routes/` | Pages; `public-layout.tsx` is the shell; `dev/` is the catalogue (never ships) |
| `scripts/` | `check-env.ts` (pre-build gates), `check-build.ts` (post-build gates), `copy-fonts.ts`, `copy-local-covers.ts`, `migrate.ts`, `migration-lint.ts`, `setup-owner.ts`, `seed-v0.ts`, `sync-functions-lib.ts` |
| `supabase/` | `pm/migrations/` (schema, RLS, cron), `functions/` (the `pm-` Edge Functions and `_shared/`), `tests/` (PGlite), `README.md` (the owner's go-live steps) |
| `tests/unit`, `tests/e2e`, `tests/fixtures` | Vitest, Playwright, fixtures |

## Environment gotchas

- **Playwright on the owner's Mac:** `chromium_headless_shell-1194` is installed (the owner approved the download on 15 Oct 2026). Port 5173 there belongs to another project, so `playwright.config.ts` serves the preview on 4310 and the dev server on 4311. Set `PW_PORT_BASE` to run several worktrees at once, and `PW_REUSE=1` to reuse a server you started yourself.
- **Playwright in the cloud sandbox:** Chromium is preinstalled at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, and `playwright.config.ts` uses it. Never run `playwright install`.
- **The catalogue:** `/dev/components` exists in dev and typegen only. A production build leaves it out unless `CATALOGUE=1`, and `check-env` fails a production build where `CATALOGUE` or `CONTENT_SOURCE` is set.
- **`ssr: false` + prerender:** every route with a `loader` needs at least one prerendered page, so `/writing/:slug` is registered only when posts exist (always for typegen). `/404` is prerendered for the host to serve; unknown SPA paths use the catch-all.
- **Fonts and covers:** a Vite plugin copies them into `public/` on start, so dev and build both work. `public/fonts` and `public/media` are git-ignored.
- **Supabase locally:**
  - The cloud sandbox has the Docker CLI, and `dockerd` can be started by hand.
  - But pulling the Supabase images failed: ECR answered "Data limit exceeded" and Docker Hub returned 429.
  - PostgreSQL 16 binaries are at `/usr/lib/postgresql/16/bin`. The fallback plan is to test migrations and RLS on a plain local Postgres with Supabase's roles (`anon`, `authenticated`, `service_role`) and `auth.uid()` stubbed, and to run the full `supabase start` stack in GitHub Actions.
  - Never run `supabase db push`, `db reset --linked`, `db pull` or `migration repair` against the shared project.
- **The design canvas** is a private artifact in the original account. A new account can't open it, but every board is mirrored in `design/boards/` with previews in `design/previews/`, and those are the source of truth.
