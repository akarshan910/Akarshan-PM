# Handoff: where the build is, and how to carry on

This file lets a new session pick up the build without any memory of earlier sessions. Read it after [`CLAUDE.md`](CLAUDE.md), then follow the reading order below. Keep it current: update the **Status** and **Next** sections in the same commit as the work.

_Last updated: 14 Oct 2026._

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
| M2 · Public site on local data | **In progress.** See below |
| M3 · Supabase | Not started. Local-only work can start; owner input needed before the shared project is touched |
| M4 · Studio | Not started |
| M5 · Publishing and SEO | Not started |
| M6 · QA and launch | Not started |
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
- **Case-study view helper, started.** `src/lib/case-study.ts` has the view logic for `/work/:slug` (finding the project by slug, prev/next and so on), with unit tests. The route and its components aren't built yet.

**Remaining:** see **Next**.

### Stopped tasks to restart

The owner stopped the session on 14 Oct 2026 to save tokens. Nothing is running, and everything finished is pushed. A new session should restart these, in this order:

1. **Case-study track.** Finish `/work/:slug` (Next, item 1) on top of `src/lib/case-study.ts`. Check that the `/work` list needs nothing more (03 · Work list).
2. **Writing, page states and parity track.** Next, items 2–4.

Run each as one agent at a time in the main checkout, pushing after every commit to `claude/elegant-allen-xdmal0` (see How we work).

## Next

Pick up in this order. Each item lists the doc sections and boards to read.

1. **Case study `/work/:slug`.** `src/routes/work.$slug.tsx` is still a placeholder. Build on the view logic in `src/lib/case-study.ts`.
   - **Header and per-device prototype heading:** the header rows, the facts (Type = `PROJECT_KIND_LABELS`), and the prototype heading for each device.
   - **Chapter content:** summary and success measures, then every block type in `src/components/case-study/`.
   - **Chapter navigation:** the chapter rail, the iPad chapter bar, the phone sheet, and the reading progress bar.
   - **Footer:** prev/next, "More volumes" on phones, and "Back to all work".
   - **Motion:** M-CHAPTER-*, M-PROTO and the reading progress.
   - **Sources:** 03 · Case study and Blocks, 04, 06 · Project, 07 · Story; boards `CaseStudy*`, `WorkScale`.
2. **Writing.**
   - Add `publishPost` to `src/lib/published.ts`: reading time is words ÷ 220, the excerpt is the post's own or its first 160 characters, plus `modifiedAt`.
   - Build `/writing`, which returns the 404 page while there are no posts, and `/writing/:slug`.
   - Build the homepage `WritingSection`; the stub is at `src/components/sections/WritingSection.tsx`.
   - Sources: 03 · Writing pages; board `WritingPublic`.
3. **Page states and legacy links.**
   - Build `src/routes/not-found.tsx` with C21, and a root `ErrorBoundary` using `states/ErrorState`.
   - On `/`, redirect `?open=` / `openCase` / `open_case` = 1–5 to `/work/<slug>` (07 · Legacy links). Derive the map from `src/lib/v0.ts`; don't hand-copy it.
4. **Parity tooling (WP2.4, 08 · Pixel parity).**
   - Fill `tests/fixtures/board-content.ts` with the boards' content as published documents: profile, layout, the nine board projects, and posts.
   - Wire `?qa=1` through `src/lib/qa.ts` and add the `parity` Playwright project.
   - The `tests/parity/*.spec.ts` specs need `pixelmatch` and `pngjs`. Add them as dev dependencies, with exact versions and the lockfile.
5. **Close M2:** run the 08 QA pass for what M2 touched, tick the M2 boxes, then run a security review of M2's diff and fix what it finds (every phase so far ended this way).
6. **M3 · Supabase, local first.** See [Environment gotchas](#environment-gotchas) for how to test without Docker images. **Before** anything touches the shared project, stop and ask the owner for Q3, Q4, Q6 and Q10. They must also expose the `pm` schema and run `npm run db:migrate` themselves (10 · Owner touchpoints).

## Decisions made during the build

They're all in [09](docs/handover/09-decisions.md); the build-phase ones are D46–D48. Smaller deviations from the boards, already in the code:

- **Type and touch targets:** type is never under 12px (11 on phones) where boards used 10px. Lightbox buttons, testimonial dots and phone-menu footer links got 44px or 24px targets, to pass axe.
- **Accordion:** it rotates a plus 45°, per 02 and the board, not 04's chevron.
- **Studio:** the switch and fields follow the Studio boards over C22. Save status uses a spinner (M-ST-PULSE). Toasts last 7s and accept a prop.
- **Iframes:**
  - Video iframes send `strict-origin-when-cross-origin`, because YouTube needs a referrer.
  - Prototypes follow 03 exactly (`no-referrer`, four sandbox flags).
  - Every link rendered from props goes through `safeHref()` (`src/lib/links.ts`).
- **Generated cover:** the WorkScale cover without art.
- **Testimonial avatar colours:** derived from the tone (18% accent on `#0B0B0E`, text at 55% accent on white).
- **Content gaps:** the testimonial "tag" isn't rendered (no board shows it). Compact experience entries join bullets with " · ", as on the iPad board.

## How we work

- **Checks before every commit:** `npm run typecheck && npm run lint && npm run format:check && npm run test:coverage && npm run build && npx playwright test`. Coverage floors: `src/lib` 90/85, `src/components` 80/70.
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
| `scripts/` | `check-env.ts` (pre-build gates), `check-build.ts` (post-build gates), `copy-fonts.ts`, `copy-local-covers.ts` |
| `tests/unit`, `tests/e2e`, `tests/fixtures` | Vitest, Playwright, fixtures |

## Environment gotchas

- **Playwright:** Chromium is preinstalled at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, and `playwright.config.ts` uses it. Never run `playwright install`.
- **The catalogue:** `/dev/components` exists in dev and typegen only. A production build leaves it out unless `CATALOGUE=1`, and `check-env` fails a production build where `CATALOGUE` or `CONTENT_SOURCE` is set.
- **`ssr: false` + prerender:** every route with a `loader` needs at least one prerendered page, so `/writing/:slug` is registered only when posts exist (always for typegen). `/404` is prerendered for the host to serve; unknown SPA paths use the catch-all.
- **Fonts and covers:** a Vite plugin copies them into `public/` on start, so dev and build both work. `public/fonts` and `public/media` are git-ignored.
- **Supabase locally:**
  - The cloud sandbox has the Docker CLI, and `dockerd` can be started by hand.
  - But pulling the Supabase images failed: ECR answered "Data limit exceeded" and Docker Hub returned 429.
  - PostgreSQL 16 binaries are at `/usr/lib/postgresql/16/bin`. The fallback plan is to test migrations and RLS on a plain local Postgres with Supabase's roles (`anon`, `authenticated`, `service_role`) and `auth.uid()` stubbed, and to run the full `supabase start` stack in GitHub Actions.
  - Never run `supabase db push`, `db reset --linked`, `db pull` or `migration repair` against the shared project.
- **The design canvas** is a private artifact in the original account. A new account can't open it, but every board is mirrored in `design/boards/` with previews in `design/previews/`, and those are the source of truth.
