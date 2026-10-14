# 09 · Decisions

This file outranks every other document except the owner's instructions in the current conversation ([`CLAUDE.md`](../../CLAUDE.md#sources-of-truth-in-order)).

- **Decided** items are settled. Build them as written.
- **Open questions** need the owner. Each has a recommendation and a default. Keep building everything that doesn't depend on the answer, and use the default when the "Needed before" milestone arrives without an answer.
- New decisions are added at the end with the next number and the date. A decision is never edited silently: if one changes, mark it "Replaced by Dn" and add the new one.

The reasoning behind the bigger decisions is in [`docs/story/02-decisions.md`](../story/02-decisions.md).

## Decided

| # | Date | Decision | Where it's specified |
| --- | --- | --- | --- |
| D1 | 13 Oct 2026 | **Remove the Figma Make scaffolding:** the unused MUI, Emotion and Radix packages that Studio doesn't use, `react-slick`, `canvas-confetti`, `guidelines/`, `src/imports/`, and the `@figma/my-make-file` package name. The default is to remove them; the owner confirms in Q1 | [01 · Stack](01-architecture.md#stack) |
| D2 | 13 Oct 2026 | **Stack:** TypeScript, React 18, React Router 7 framework mode with prerendered public routes, client-only `/studio`, Vite, plain CSS with the board tokens, Supabase, Vercel | [01](01-architecture.md) |
| D3 | 13 Oct 2026 | **Final design:** Round 1's Volumes everywhere, with the Ink & Depth hero redrawn in Round 1's tokens. Earlier rounds are history, not spec | [`design/README.md`](../../design/README.md) |
| D4 | 13 Oct 2026 | **The live pill nav is copied exactly:** glass, rotating ring, Let's Talk, on every device. Phones get Menu plus Let's Talk, and Menu opens the full-screen menu | [02 · C1, C2](02-tokens-and-components.md#c1--pill-nav) |
| D5 | 13 Oct 2026 | **V0 publishes the current site's content.** Disputed facts keep their live values and are listed as "Worth a check" with the résumé's value. This replaces the earlier plan to import everything as drafts | [07](07-v0-content.md) |
| D6 | 13 Oct 2026 | **Nothing is invented.** Missing content leaves the field empty, and it hides | [`CLAUDE.md`](../../CLAUDE.md), [07](07-v0-content.md) |
| D7 | 13 Oct 2026 | **Five result labels:** Achieved, Target, Projected, Baseline, Output. Achieved needs a private evidence note to publish. Tenure and counts carry no label | [02 · C5](02-tokens-and-components.md#c5--result-label), [05 · Outcomes](05-studio.md#outcomes) |
| D8 | 13 Oct 2026 | **Studio signs in with a 6-digit email code,** replacing Google sign-in. Sign-ups off; the owner is created once from `OWNER_EMAIL` | [06 · Auth](06-backend.md#auth), [05 · Sign-in](05-studio.md#sign-in) |
| D9 | 13 Oct 2026 | **iPad keeps all five nav links at 834.** The live site's ≤900px rule doesn't carry over | [02 · Layout](02-tokens-and-components.md#layout) |
| D10 | 13 Oct 2026 | **The repository is public and holds no secrets.** gitleaks runs in CI | [`SECURITY.md`](../../SECURITY.md), [`CLAUDE.md`](../../CLAUDE.md#security) |
| D11 | 13 Oct 2026 | **Prototypes and videos are links.** The three local prototypes are deployed separately, never served from the site's own origin. Arcana's is already live | [07 · Legacy links](07-v0-content.md#legacy-links), [03 · Media](03-public-site.md#media) |
| D12 | 13 Oct 2026 | **V0 ships the dark theme only.** The light tokens stay defined. Accent text on the light background is under 3:1, so it needs darker variants if light is ever switched on | [02 · Colour](02-tokens-and-components.md#colour) |
| D13 | 13 Oct 2026 | **The project accent is `--pa`, from Studio.** Text on an accent fill is `#0B0B0E`. Tints are mixed from `--pa`, replacing the `#E8273A` tints on the laptop and iPad case-study boards | [02 · Project accents](02-tokens-and-components.md#project-accents) |
| D14 | 13 Oct 2026 | **All switched-on testimonials show in the homepage carousel.** There's no testimonials page and no limit of three. The Profile board was updated to match | [03 · Testimonials](03-public-site.md#testimonials) |
| D15 | 13 Oct 2026 | **Phones show the same content as laptop.** Shorter lists on phone boards are illustrative | [03 · Skills](03-public-site.md#skills) |
| D16 | 13 Oct 2026 | **V0 covers are the board art,** rendered to WebP in `design/covers/`. The body-scan sweep animation (M-COVER-SCAN) isn't built | [07 · Covers](07-v0-content.md#covers), [04](04-motion.md) |
| D17 | 13 Oct 2026 | **The four Sugar.fit projects are drafts with titles only,** in a hidden Shipped shelf | [07 · The Sugar.fit drafts](07-v0-content.md#the-sugarfit-drafts) |
| D18 | 13 Oct 2026 | **The Wipro "$XXXK" bullet is kept, hidden.** It's a live placeholder | [07 · Experience](07-v0-content.md#experience) |
| D19 | 13 Oct 2026 | **Writing starts empty.** `/writing` is a 404 and the homepage section hides until the first post | [03 · Writing pages](03-public-site.md#writing-pages) |
| D20 | 13 Oct 2026 | **Motion precedence:** the Motion board wins for animations it specifies; page boards win for animations only they show and for layout; device-specific page values win for that device. The resolved conflicts table is binding | [04 · Which board wins](04-motion.md#which-board-wins), [04 · Resolved conflicts](04-motion.md#resolved-conflicts) |
| D21 | 13 Oct 2026 | **Skills are one word cloud,** fully set in Studio: label, title, intro, groups, skills, order and sizes. V0 starts every skill at M | [02 · C15](02-tokens-and-components.md#c15--skills-cloud), [05 · Website builder](05-studio.md#website-builder) |
| D22 | 13 Oct 2026 | **Off duty is a manga page:** ink panels with art presets, caption boxes, tags, and favourites as volume spines | [02 · C17](02-tokens-and-components.md#c17--off-duty-page) |
| D23 | 13 Oct 2026 | **Topics use one picker** for posts and projects: chips up to 8 topics, a multi-select dropdown with search and create beyond 8 | [02 · S1](02-tokens-and-components.md#s1--topic-picker) |
| D24 | 13 Oct 2026 | **Unlisted projects are client-rendered** by a `noindex` shell that fetches by exact slug. Unknown `/work/*` paths get a 200 with the 404 view and `noindex`, which is accepted | [01 · Rendering](01-architecture.md#rendering) |
| D25 | 13 Oct 2026 | **The case study's summary row has its own fields,** "The problem" and "What I proposed", in Overview. Empty columns hide | [06 · Project](06-backend.md#project), [05 · Overview](05-studio.md#overview) |
| D26 | 13 Oct 2026 | **Each project stores its accent** (`visuals.accent`), chosen in Visuals. V0 uses the accents the Home board gives the five projects | [05 · Visuals](05-studio.md#visuals), [07](07-v0-content.md#overview-and-visuals) |
| D27 | 13 Oct 2026 | **The Supabase project is shared with lumina-photography.** The portfolio lives in the `pm` schema with `pm-` buckets, functions, secrets and cron jobs, and its own migrations. The free plan's two projects were both in use | [06 · The shared project](06-backend.md#the-shared-project) |
| D28 | 13 Oct 2026 | **Owners are keyed by auth user id** (`pm.owners.user_id`), not by email | [06 · Tables](06-backend.md#tables) |
| D29 | 13 Oct 2026 | **Media:** two buckets (draft and public), images resized in the browser, published images copied into the site at build, so visitors never load from Supabase | [06 · Storage](06-backend.md#storage) |
| D30 | 13 Oct 2026 | **The V0 proof strip is the live hero's four stats.** About's two other numbers are stored as hidden proof items | [07 · Proof](07-v0-content.md#proof) |
| D31 | 13 Oct 2026 | **Section headers live in the layout** (`header`), and V0's come from the live headings, split where the live site changes colour | [06 · Site layout](06-backend.md#site-layout), [07 · Layout](07-v0-content.md#layout) |
| D32 | 13 Oct 2026 | **Not carried over to V0:** the hero's keyword ticker, the case studies' tool tags (`content.tags`), `volJp`, the footer typewriter animation, and the testimonials' generic LinkedIn link. The "Problem spaces" chips start empty | [07](07-v0-content.md) |
| D33 | 13 Oct 2026 | **Legacy case-study content maps by fixed rules:** sections to chapters, metric groups to RICE tables or cards, subsections to cards or heading-plus-list, journeys to journey blocks | [07 · Story](07-v0-content.md#story) |
| D34 | 13 Oct 2026 | **"Let's Talk" goes to the Contact section by default,** as on the live site. Studio can switch it to email, LinkedIn or a booking link | [03 · The page shell](03-public-site.md#the-page-shell) |
| D35 | 13 Oct 2026 | **Turnstile is enforced by Supabase's CAPTCHA protection, which is project-wide.** It's switched on only once lumina's login sends tokens too (Q8). Until then, the rate limits protect sign-in | [06 · Supabase settings](06-backend.md#supabase-settings) |
| D36 | 13 Oct 2026 | **Migrations don't use the Supabase CLI's history,** because the project is shared. `npm run db:migrate` applies `supabase/pm/migrations/` and records them in `pm.schema_migrations` | [06 · Schema](06-backend.md#schema) |
| D37 | 14 Oct 2026 | **A shelf's lead is derived from order:** the first visible, published project in the shelf. The boards' Star moves a project to the top; nothing stores a separate lead (`shelf.lead` is removed) | [06 · Site layout](06-backend.md#site-layout), [05 · Projects](05-studio.md#projects) |
| D38 | 14 Oct 2026 | **Profile fields with no board editor get plain forms** in Profile & facts, in the boards' field styles: the hero button, About points, "Problem spaces", education and each testimonial's fields. The owner may revisit this | [05 · More fields](05-studio.md#more-fields), [06 · Profile](06-backend.md#profile) |
| D39 | 14 Oct 2026 | **Soft and hard limits:** a project title warns over 60 characters (the board's counter) and is rejected over 80; the hero's positioning line warns over 100 and is rejected over 220 | [06 · Profile](06-backend.md#profile), [06 · Project](06-backend.md#project) |
| D40 | 14 Oct 2026 | **Addresses change only on publish.** `slug` is the draft address and `published_slug` the live one, written by `pm-publish`. "Redirect the old address here" is stored as `settings.redirectOldSlug`. Visibility and indexing apply without a publish, through `pm-publish`'s `settings` action, which rebuilds the site | [06 · Tables](06-backend.md#tables), [06 · pm-publish](06-backend.md#pm-publish) |
| D41 | 14 Oct 2026 | **"Replace file" bumps the media row's `rev`,** which is part of every file's URL. Live pages pick the new file up on their next publish, and Studio offers "Publish all n" for the documents that use it | [06 · Storage](06-backend.md#storage) |
| D42 | 14 Oct 2026 | **D5 overrides the Profile board's publish copy.** Unconfirmed facts keep their live values when the site is published; they aren't "left off the live site" as the `StudioProfile` dialog says | [05 · Profile & facts](05-studio.md#profile--facts), [07 · Worth a check](07-v0-content.md#worth-a-check) |
| D43 | 14 Oct 2026 | **Deleting from the Projects list is a soft delete** with a plain confirm, "Unpublish instead" and a 7-second Undo. Only URL & SEO's delete is permanent, and only it asks the owner to type the address | [05 · Projects](05-studio.md#projects) |
| D44 | 14 Oct 2026 | **Up to 8 topics per post or project.** At the cap the topic picker disables the unselected options, ignores "+ Create" and Enter, and says "Up to 8 topics per post." (or "per project") in its polite live region | [02 · S1](02-tokens-and-components.md#s1--topic-picker) |
| D45 | 14 Oct 2026 | **Small additions beyond the boards,** built in the boards' styles: the shelf's kicker and second title half in the Website builder, "Unschedule" for a scheduled post, and the More fields forms (D38). The Website builder previews Desktop and Phone only, as drawn; iPad is checked in Draft preview | [05 · Website](05-studio.md#website-builder), [05 · Writing](05-studio.md#writing) |

## Open questions

| # | Needed before | Question | Recommendation and trade-off | Default if unanswered |
| --- | --- | --- | --- | --- |
| Q1 | M0 | May the Figma Make scaffolding be removed (D1)? | Yes. It's unused, it slows installs, and it hides what the site really depends on | Remove it |
| Q2 | M5 | Which domain does the site use? | A short personal domain. It's needed for canonical URLs, the email sender and the Turnstile widget. Until then, the Vercel address works for everything but email deliverability | Build on the Vercel address; keep `SITE_URL` configurable |
| Q3 | M3 | Which Vercel account hosts the site and the prototypes project? | The owner's existing account, where lumina-photography already runs. Two more projects fit the free plan | The owner's account |
| Q4 | M3 | Which email sender for sign-in codes? | Resend's free plan, on the site's domain with SPF, DKIM and DMARC. If lumina already has a custom sender in the shared project, reuse it: it's one setting | Supabase's built-in sender in development only. Launch waits for this |
| Q5 | M6 | Three reds in the live nav and the CTA miss WCAG AA for small text: Let's Talk `#E8273A` (4.39:1 with white), its hover `#FF4D5E` (3.24:1), and the CTA hover `#E42A3F` (4.47:1). Keep them exactly, or adjust? | Adjust slightly: Let's Talk `#D61F33` (5.12:1, the site's CTA red), and both hovers `#C8202F` (5.67:1), darker instead of lighter. Nearly the same look, and it meets AA. Keeping them exact honours "copy the nav exactly", but fails the accessibility rule | Build the exact live values, and list them as known exceptions in QA |
| Q6 | M3 | Arcana's live summary is 143 characters; the limit is 140. Publish it as is, or trim it? | Publish as is: the seed allows it, Studio flags it, and the owner trims it in Studio. Trimming in the seed would change the owner's words | Publish as is |
| Q7 | M4 | Which Cloudflare account holds the Turnstile widget? | The owner's free Cloudflare account. One widget lists the portfolio's domain, lumina's domain and `localhost` | Turnstile's test keys in development |
| Q8 | Launch | Change lumina-photography's login and forgot-password pages to send Turnstile tokens, so CAPTCHA protection can be switched on for the shared project? | Yes. It's a small change in that repo, and it protects both sites' sign-ins. It needs its own session on that repository and the owner's usual local check before deploying | CAPTCHA protection stays off; sign-in relies on the rate limits |
| Q9 | M4 | Sign-in codes: 6 digits (as designed) or 8? | 6 with CAPTCHA on (Q8). Choose 8 if Q8 is declined: guessing gets 100 times harder, and the code input shows 8 boxes | 6 |
| Q10 | M3 | The shared Auth settings change lumina too: sign-ups off (lumina's admins are created by hand), and password-reset links that last 10 minutes instead of an hour. Is that fine for lumina? | Yes. Both make lumina safer, and nothing in lumina relies on sign-ups | Don't change any shared Auth setting until the owner says yes |

## Launch checklist (owner)

These need the owner's accounts or decisions. The build agent prepares everything else and walks the owner through each step.

1. **Answer Q1–Q10,** or accept the defaults.
2. **Supabase, the shared project:**
   1. Project Settings › Data API › Exposed schemas: add `pm`.
   2. Run `npm run db:migrate` with `PM_DATABASE_URL` set in the shell for that command only.
   3. Authentication: the settings in [06 · Supabase settings](06-backend.md#supabase-settings), once Q10 is answered, and the Magic Link template.
   4. Edge Functions: set `PM_DEPLOY_HOOK_URL`, `PM_ALLOWED_ORIGINS` and `PM_SITE_URL`, then deploy the `pm-` functions one by one.
   5. Vault: add `pm_service_role_key` for the cron jobs.
3. **The owner's account:** `npm run setup:owner` with `OWNER_EMAIL`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the shell.
4. **Email:** the custom sender (Q4) with SPF, DKIM and DMARC, then send a test code to the owner's address.
5. **Turnstile:** create the widget (Q7). The site key goes in Vercel as `VITE_TURNSTILE_SITE_KEY`. The secret goes in Supabase › Attack Protection, switched on after Q8.
6. **Vercel:**
   - create the site project with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY` and `SITE_URL`;
   - create the deploy hook and put its URL in Supabase as `PM_DEPLOY_HOOK_URL`;
   - add the domain (Q2).
7. **Prototypes:** deploy the three prototypes as one Vercel project and fill `scripts/v0-prototypes.json`.
8. **Content:** run `npm run seed:v0`. Then sign in, open the dashboard, and check every "Worth a check" item.
9. **GitHub settings:** secret scanning with push protection, Dependabot alerts and security updates, private vulnerability reporting, and branch protection on `main`.
10. **The owner's mailbox:** turn on 2-Step Verification. It's now the key to Studio.
11. **After launch:** delete the old prototype copies in `public/` and at the repo root, remove `dist/` from git, and take the old site's Vercel project down if it's separate.
