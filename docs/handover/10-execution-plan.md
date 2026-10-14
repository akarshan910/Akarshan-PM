# 10 · Execution plan

The order of work for building V0: the public site, Studio and the content that fills them. The README's [milestones](README.md#milestones) list *what* to build, and the other chapters say *how it looks and behaves*. This chapter says **in what order, what runs in parallel, which shared code comes first, where every default value comes from, and when the owner is needed.**

Each work package (WP) maps to milestone checkboxes. Tick those boxes in the same commit as the work. Every commit passes `typecheck`, `lint`, `test` and `build`.

## Starting point

- The repo is still the Figma Make export:
  - `package.json` is named `@figma/my-make-file`, with MUI, Emotion and about 30 Radix packages, and only `dev` and `build` scripts;
  - `src/app/App.tsx` (4,113 lines) holds all of the live content;
  - `dist/`, `public/` and two root `*_prototype.html` files are committed.
- Ready to use:
  - the five V0 covers in `design/covers/`;
  - the board renderer `design/tools/render-board.mjs`;
  - every board in `design/boards/`.
- Nothing else exists yet: no tests, no CI, no Supabase code.

## Phases at a glance

| Phase | Milestone | Runs | Rough size | Owner needed |
| --- | --- | --- | --- | --- |
| 0 · Foundation | M0 | Sequential | 1–2 days | Q1 |
| 1 · Components | M1 | Three parallel tracks | 3–4 days | — |
| 2 · Public site on local data | M2 | In parallel with phase 3 | 5–7 days | — |
| 3 · Supabase | M3 | In parallel with phase 2 | 3–4 days | Q3, Q4, Q6, Q10, before the real project is touched |
| 4 · Studio | M4 | Sequential, in the order below | 8–10 days | Q7, Q9 |
| 5 · Publishing and SEO | M5 | After phases 3 and 4 | 3–4 days | Q2 |
| 6 · QA and launch | M6 | After phase 5 | 3 days, plus the owner's checklist | Q5, Q8, launch checklist |
| 7 · Wiki | M7 | After launch | — | Turn on the GitHub wiki |

## Phase 0 · Foundation (M0)

Strictly in this order.

1. **WP0.1 · Freeze the content first.** Copy the content from `src/app/App.tsx` into `src/legacy/content.ts` verbatim, as listed in [07 · Extraction](07-v0-content.md#extraction), and add a Vitest snapshot test for it. This happens before anything is deleted.
2. **WP0.2 · Replace the stack.**
   - A new `package.json`: React 18, React Router 7 (framework mode), TypeScript, ESLint, Prettier, Vitest, Playwright, Zod and supabase-js.
   - Keep only the Radix packages in [01 · Stack](01-architecture.md#stack). Remove MUI, Emotion, `react-slick` and `canvas-confetti` (Q1).
   - Commit `package-lock.json`.
3. **WP0.3 · Routing skeleton:** prerendered public routes and `/studio/*` as a client-only SPA ([01 · Rendering](01-architecture.md#rendering)). Create the [folders](01-architecture.md#folders).
4. **WP0.4 · Tokens and fonts:** `src/styles/tokens.css` in dark and light from [02](02-tokens-and-components.md). Self-host Archivo (variable), Geist, Geist Mono and JetBrains Mono.
5. **WP0.5 · CI:** GitHub Actions running typecheck, lint, test, build and gitleaks. Add `.env.example` with names only. The [security gates](#security-gates) are wired up here.
6. **WP0.6 · Shared content core.** This is pulled forward so the site, Studio, the seed and the Edge Functions all use one implementation:
   - `src/lib/schemas.ts`: Zod schemas for Profile, SiteLayout, Project, Post and Media, exactly as typed in [06](06-backend.md), with every limit (D39). The TypeScript types in `types.ts` are inferred from these.
   - `src/lib/defaults.ts`: the [defaults registry](#layer-3--defaults-for-new-items).
   - `src/lib/v0.ts`: `buildV0Documents(content)`, a pure function from `src/legacy/content.ts` to `{ profile, layout, projects[] }`, following [07](07-v0-content.md).

**Done when:**

- CI is green;
- the old app no longer renders;
- `content.ts` is snapshotted;
- `buildV0Documents()` passes the schemas. The only exceptions are the two the seed allows (Q6 and the flagged RICE row), and both carry a `todo`.

## Phase 1 · Components (M1)

Three tracks run in parallel. Each builds into the dev-only catalogue at `/dev/components`, and is compared with `System.dc.html` and its own board using `render-board.mjs`.

| Track | Components |
| --- | --- |
| A · Public | Pill nav and phone menu; CTA, secondary button and text link; section header, result labels, volume tag, badge, chip and availability chip; project cards, generated cover, shelf with its cap logic; experience entry, accordion row, testimonial card, contact block, footer; skills cloud (C15); off duty page (C17) |
| B · Media and states | Image, lightbox, video and prototype embeds in every state; 404, moved, preview bar, expired, no results, error |
| C · Studio primitives | Form controls (C22), topic picker (S1), code input (S2), toasts, dialogs, save status |

**Done when:** every component shows every state in the catalogue, and axe finds nothing on the catalogue page.

## Phase 2 · Public site on local data (M2)

1. **WP2.1 · Content sources.** Loaders read through one `ContentSource` interface in `src/lib/content-source.ts`. It has three adapters:
   - `local-v0`: the output of `buildV0Documents()`, written to JSON in development;
   - `fixture:boards`: `tests/fixtures/board-content.ts`, for parity checks;
   - `supabase`: added in phase 3.
2. **WP2.2 · Pages:**
   - Home, section by section in V0 order, at 1440, 834 and 390;
   - `/work`;
   - all five case studies, covering every block type;
   - `/writing`, which returns the 404 page in V0;
   - the 404 and error pages;
   - the `?open=` redirects.
3. **WP2.3 · Motion:** every ID in [04](04-motion.md), with its reduced-motion variant.
4. **WP2.4 · Parity:** `?qa=1` freezing and the Playwright `parity` project ([08](08-qa.md#pixel-parity)).

**Done when:** the parity specs pass for every public board at all three widths, and the motion and accessibility checks pass.

## Phase 3 · Supabase (M3)

Everything here is built and tested against a **local** Supabase (`supabase start`) first, so nothing waits on the owner.

1. **WP3.1 · Schema.** `npm run db:migrate` and `supabase/pm/migrations/0001_init.sql`, everything in [06 · Schema](06-backend.md#schema):
   - the tables;
   - the grants, including `service_role`;
   - RLS and owner policies;
   - the column grants for `anon`;
   - `published_slug`, `media.rev`;
   - the indexes.

   The RLS tests are written alongside.
2. **WP3.2 · Storage:** the `pm-media-draft` and `pm-media-public` buckets, with their policies.
3. **WP3.3 · Auth:** sign-in by email code, `npm run setup:owner` (reads `OWNER_EMAIL`), `pm.owners` and `pm.is_owner()`.
4. **WP3.4 · Seed:** `npm run seed:v0` = `buildV0Documents()` + cover uploads + the same publish logic as Studio, against an empty `pm` schema. A second run fails.
5. **WP3.5 · Build from Supabase:** the build's content source becomes `supabase`, reading published rows only.

**Before WP3.1 runs against the shared project,** the owner:

- answers Q3, Q4, Q6 and Q10;
- exposes `pm` in the Data API settings;
- runs `db:migrate` with `PM_DATABASE_URL` set in their shell.

**Done when:**

- the RLS tests pass;
- the seeded site builds from Supabase and matches the `local-v0` build byte for byte;
- the no-leaks markers stay out of the build.

## Phase 4 · Studio (M4)

Build in this order, so each step is usable before the next one starts:

1. The shell: sidebar, rail and tabs, account menu, save status.
2. Sign-in, and every path on `StudioAuthFlow`.
3. The dashboard.
4. The project editor:
   - Overview, Visuals, Story, Outcomes, URL & SEO;
   - autosave, conflicts, offline and the publish checks.
5. The Projects list.
6. The Website builder.
7. Profile & facts, including More fields (D38).
8. Writing.
9. Media.
10. Draft preview and share links.
11. Every state on `StudioStates`.
12. The iPad and phone layouts.

Every write is validated by `schemas.ts`. Everything new is created by `defaults.ts`.

**Done when:**

- every Tweak state on every Studio board can be reached and passes parity at 1440;
- iPad and phone match `StudioTablet` and `StudioMobile`;
- Playwright covers every keyboard path.

## Phase 5 · Publishing and SEO (M5)

- The Edge Functions: `pm-publish` (site, project, post, settings), `pm-preview`, `pm-project`, `pm-check-link`, `pm-post-scheduler`, `pm-purge`.
- The cron jobs, which read the service-role key from Vault.
- `scripts/fetch-media.ts` and the Vercel deploy hook.
- Metadata and Open Graph, `BlogPosting`, the sitemap, robots, RSS, `noindex` rules and slug redirects.

**Done when:**

- `no-leaks.spec.ts` passes;
- a publish from Studio updates the live site within a minute.

## Phase 6 · QA and launch (M6)

- **The full [08](08-qa.md) pass:**
  - parity at 1440, 834, 390 and the in-between widths;
  - motion timings;
  - axe, VoiceOver and NVDA;
  - the Lighthouse budgets;
  - the security checks;
  - real devices.
- **The owner's [launch checklist](09-decisions.md#launch-checklist-owner),** items 1–10, walked through step by step. Q5 and Q8 are decided here.
- **After launch,** item 11: the cleanup.

## Phase 7 · The wiki (M7)

As planned in [`docs/story/03-wiki-plan.md`](../story/03-wiki-plan.md).

## Default values

Content comes in four layers. Each layer has one source and one home in the repo, and none of them borrows from another.

| Layer | Purpose | Source | Lives in | Used by |
| --- | --- | --- | --- | --- |
| 1 · Board fixture | Pixel parity only. Never shipped | The boards' illustrative copy | `tests/fixtures/board-content.ts` | `CONTENT_SOURCE=fixture:boards` and the parity specs. The build fails if it's set in production |
| 2 · V0 content | The launch content, published | The live site, verbatim ([07](07-v0-content.md)) | `src/legacy/content.ts` → `buildV0Documents()` | `local-v0` in phase 2 and `seed:v0` in phase 3. One builder feeds both, so local and live can't drift |
| 3 · Defaults for new items | What Studio creates when the owner adds something | [05](05-studio.md), [06](06-backend.md), [09](09-decisions.md) D37–D45 | `src/lib/defaults.ts` | Every "New …" and "Add …" in Studio; Zod `.default()` on optional fields |
| 4 · Owner follow-ups | What V0 can't fill, so it stays empty and hides | [07 · Worth a check](07-v0-content.md#worth-a-check) and the [owner's list](07-v0-content.md#after-launch-the-owners-list) | `unconfirmed[]` and `todo[]` on the documents | The dashboard's "Needs input" and "Worth a check" |

### Layer 3 · Defaults for new items

`src/lib/defaults.ts` has one factory per document. Each factory has a unit test that its output passes its schema.

| Factory | Creates |
| --- | --- |
| `newProject({ kind, accent })` | An empty draft: no title, summary, story or outcomes, so every section hides. `kind` defaults to `study`. `accent` is `firstFreeAccent()` of the shelf it was started from: the first of the nine accents in 02's order that no project on that shelf uses yet (D26). `visibility: 'public'` and `index_allowed: true` are the row's column defaults. `settings.redirectOldSlug` starts false; the first publish turns it on (D40) |
| `nextUntitledSlug(taken)` | `untitled-n`, one more than the highest `untitled-n` already taken |
| `newPost()` | A draft with an empty title, no topics and `showOnHome: true`. The reading time is computed at publish (words ÷ 220) |
| `newTextSection(n)` | "Text section {n}" (id `text-n`), visible, not in the nav, with an empty body. Studio inserts it before Contact |
| `newChapter()` | An empty, visible chapter, which shows "Questions to answer" and the three starters in Studio |
| `newBlock(type)` | The block at the settings Studio shows first: text in Body style, callout in Neutral tone, cards in 3 columns, a table with every switch off except cards on phones, and empty media or links waiting for the owner |
| `emptyProfile()`, `defaultLayout()` | Every field empty, in the section order of [07 · Layout](07-v0-content.md#layout). Used for a blank install and in tests |

Drafts may hold empty media ids and empty links while the owner works; the publish checks require them. Every factory has a unit test that its output passes its schema (`tests/unit/defaults.test.ts`).

The rules hold in every layer:

- nothing is invented, and empty fields hide;
- the boards' copy appears only in the fixture and in the section labels 07 allows;
- drafts never reach the build.

## Code architecture

These rules are enforced from phase 0, by tooling where possible.

- **Layers, with dependencies pointing one way:**
  - `src/lib/` holds `schemas.ts`, `defaults.ts`, `v0.ts`, `content-source.ts` and the other helpers. It's plain TypeScript, with no React. Only `supabase.ts` and `auth.ts` import supabase-js.
  - `src/components/` holds the UI.
  - `src/routes/` holds the pages.
  - Studio lives in `src/routes/studio/` and `src/components/studio/`. It's lazy-loaded, and public routes never import it.
  - `supabase/` holds the migrations and the Edge Functions.

  ESLint's `import/no-restricted-paths` enforces these boundaries, and the build's chunk check confirms that Studio's code ships 0 bytes to the public bundle ([08](08-qa.md#performance)).
- **One definition of every data shape.** `schemas.ts` is the single source:
  - the TypeScript types are inferred from it;
  - it validates Studio's writes, the seed, and `pm-publish`'s input.

  The Edge Functions import the same file through `supabase/functions/_shared/`, so the browser and the server can't disagree.
- **Strict TypeScript:**
  - `strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are on;
  - `any` and floating promises are lint errors;
  - Prettier runs on every file.
- **Tests at every layer:**
  - Vitest for `src/lib` (schemas, factories, the V0 builder), with a coverage floor in CI;
  - SQL and RLS tests against a local Supabase;
  - Playwright for the end-to-end paths, parity, accessibility and the no-leaks suite.
- **Small commits.** One milestone item per commit, with its box ticked.

## Security gates

Each gate fails CI or blocks the phase from closing. They put [`SECURITY.md`](../../SECURITY.md) and [06 · Security](06-backend.md#security) into practice.

| Area | Gate |
| --- | --- |
| Secrets | gitleaks on the full history, on every push. A build check that only the three `VITE_` variables reach the browser, and that none of them is a service-role JWT. `.env*` stays git-ignored, and `.env.example` holds names only |
| Database | A CI test fails if any `pm` table has RLS off or has no policy (except `owners` and `schema_migrations`, which have RLS on and no policies). `anon` gets column grants only. Every function sets `search_path = ''`, with explicit revokes and grants. A migration lint fails on any statement outside the `pm` schema and the `pm-` buckets |
| Drafts | `no-leaks.spec.ts` runs on every pull request from phase 3 on. Prerendering writes each loader's whole return value into the page, so public loaders return only published types (`ProjectPublished` and so on): no hidden sections, no unpublished project ids in shelf or floater lists, and never `evidence`, `todo`, `facts`, `unconfirmed`, `prompts`, `reviewed` or hidden items |
| Links and rich text | Every stored link passes the 06 link rule (`isSafeLink`, `isHttpsUrl`, `isRelativePath` in `schemas.ts`). `Inline` and `Rich` strings are sanitised against the 06 allowlist on save and again at render, never rendered raw |
| Edge Functions | Each one checks the caller's JWT and `pm.is_owner()`, validates input with Zod, and allows only the origins in `PM_ALLOWED_ORIGINS`. No secret appears in a response or a log |
| Headers | The strict CSP in [01 · Headers](01-architecture.md#headers), with the hashed bootstrap and no other inline script, plus HSTS, `frame-ancestors` and `Referrer-Policy`, checked by Playwright. `/studio` and previews are `noindex` and `no-store` |
| Supply chain | Pinned versions with a committed lockfile and the smallest dependency set. `npm audit --omit=dev` reports no high or critical advisories. Dependabot is on. GitHub Actions are pinned by commit SHA, with `permissions: contents: read` by default |
| Auth | Owner checks run on the server (RLS and the functions), never only in the browser. A test covers a Studio page restored from the back/forward cache after sign-out |
| Review | Before a phase closes, a security review of its diff, with every finding fixed |

## Owner touchpoints

Ask each question when its phase starts, with the recommendation and the trade-off from [09 · Open questions](09-decisions.md#open-questions), and keep working on everything that doesn't depend on the answer.

| When | What's needed | If there's no answer |
| --- | --- | --- |
| Phase 0 | Q1: remove the Figma Make scaffolding | Remove it |
| Before phase 3 touches the shared project | Q3, Q4, Q6, Q10. Expose `pm` in the Data API settings. Run `db:migrate` with `PM_DATABASE_URL` in the shell | Keep building against the local Supabase |
| Phase 4 | Q7 (Turnstile account), Q9 (code length) | 6 digits |
| Phase 5 | Q2 (domain) | The Vercel address |
| Phase 6 | Q5 (contrast), Q8 (lumina sends Turnstile tokens), launch checklist items 1–10 | As in 09 |
