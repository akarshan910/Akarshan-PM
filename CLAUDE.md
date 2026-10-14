# Working in this repository

This repo is being rebuilt from a single-file Figma Make export into:

- the redesigned portfolio, "Volumes" with the Ink & Depth hero;
- a private CMS, "Studio".

The design is final. Your job is to build it exactly, not to redesign it.

## Start here

1. Read `docs/handover/README.md` end to end before writing code. It has the plan, the order of work and the definition of done.
2. Read the handover chapter for the area you're working on, plus the matching design boards in `design/boards/`. `design/README.md` explains how to read them.
3. Keep `docs/handover/`, `design/` and `docs/redesign/` open as the reference. Don't rely on memory of earlier sessions.

## Sources of truth, in order

When two sources disagree, the higher one wins:

1. **The owner's instructions** in the current conversation.
2. **`docs/handover/09-decisions.md`.** Decisions already made, with dates.
3. **The design boards** in `design/boards/*.dc.html`. Their CSS, markup and script are the exact values for layout, type, colour, spacing, states and motion timings.
4. **The handover chapters** in `docs/handover/`.
5. **The design-phase docs** in `docs/redesign/`.

Content is different: copy on the boards is illustrative.

- **V0 content** comes from the current site (`src/app/App.tsx`), mapped as `docs/handover/07-v0-content.md` describes.
- **Never invent** personal facts, numbers, roles, dates or outcomes. If something is missing, leave the field empty so it hides. Then list it in the handover's open items.

## When to ask the owner, and when not to

Ask the owner only about:

- architecture decisions not already settled in `09-decisions.md`;
- blockers you can't resolve yourself, such as accounts, credentials, domains or a missing asset;
- core product decisions, meaning anything that changes what visitors see or what the owner can do, beyond what the boards and docs specify.

Don't ask about pixels, spacing, colours, copy that's already on a board, animation timings or interaction details. Those are all in the boards and the handover. Read them.

When you ask, give your recommendation and the trade-off in a few lines, then keep working on everything that doesn't depend on the answer.

## Non-negotiables

- **Pixel parity.** Match the boards at 1440, 834 and 390 wide. Follow `08-qa.md` before calling a page done.
- **Motion.** Every animation in `04-motion.md` is built with its exact duration, easing, delay and reduced-motion behaviour. Nothing is hover-only.
- **No secrets, anywhere in the repo.** The repository is public. See [Security](#security).
- **Drafts never leak.** They never appear on the public site, in the sitemap, in the RSS feed, or in any response a visitor can get.
- **Accessibility.** WCAG 2.2 AA, keyboard-complete, screen-reader labels as on the boards, `prefers-reduced-motion` respected.

## Security

The repository is public, so treat every commit as published.

- **Never commit** `.env` files, keys, tokens, passwords, database URLs with passwords, or exported data. `.gitignore` covers the usual files. Check `git diff --cached` before every commit anyway.
- **The browser gets only** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_TURNSTILE_SITE_KEY`. All three are public by design.
- **Server secrets live in dashboards only:**
  - the Vercel deploy hook URL, allowed origins and site URL go in Supabase Edge Function secrets (`PM_DEPLOY_HOOK_URL`, `PM_ALLOWED_ORIGINS`, `PM_SITE_URL`). Supabase provides the service-role key to functions itself, and the cron jobs read it from Vault as `pm_service_role_key`;
  - the SMTP password and Turnstile secret key go in the Supabase Auth settings.
- **The Studio sign-in address** never appears in code, migrations, seeds or tests. Scripts read it from `OWNER_EMAIL` in the local shell, and tests use `owner@example.test`. The contact address shown on the site is content, so it's fine in `src/legacy/content.ts` and the seed.
- **Row-level security** is on for every table, and every new table ships with its policies in the same migration.
- **The Supabase project is shared with lumina-photography.** Everything this repo creates lives in the `pm` schema, the `pm-` buckets and the `pm-` functions. Never touch `public`, lumina's bucket, functions or auth users. Never run `supabase db push`, `db reset --linked`, `db pull` or `migration repair` against the project, and never change an Auth setting that [06 · Auth](docs/handover/06-backend.md#auth) doesn't list. See [06 · The shared project](docs/handover/06-backend.md#the-shared-project).
- **If a secret is ever committed,** stop. Tell the owner, rotate the secret first, then clean the history. Deleting the file isn't enough.
- Follow [`SECURITY.md`](SECURITY.md) and [06 · Backend](docs/handover/06-backend.md#security).

## Conventions

- **Stack.** TypeScript, React 18, React Router 7 (framework mode, prerendered public routes, SPA `/studio`), plain CSS with the design tokens as CSS variables, and Supabase. See `01-architecture.md`.
- **Checks.** Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` before every commit, and fix failures before pushing.
- **Commits.** Small commits with clear messages, one milestone item at a time. Commit `package-lock.json` with dependency changes.
- **Tracking.** Tick items in the milestone checklists in `docs/handover/README.md` as you finish them, in the same commit.
