# Operations

How the site is deployed and kept running: where each setting lives, the scheduled jobs, backups, link checks, the purge job, what to watch, and how dependencies are updated. There's no server to look after. The public site is static on Vercel, and the rest is the `pm` part of a Supabase project shared with the owner's photography site, lumina-photography. Status as of 15 Oct 2026: the site isn't launched (M6 is pending), and `main` still serves the old site ([D46](../handover/09-decisions.md)). None of the go-live steps have been run on the shared Supabase project yet, the host's routes and headers are built as Vercel Build Output ([D83](../handover/09-decisions.md)) but only apply once the site deploys, and `npm run backup` is still a placeholder. Each section says what's built and what isn't.

## Deploys

| What | How it deploys |
| --- | --- |
| The public site | Vercel builds the `main` branch: on a push, and whenever `pm-publish` or the scheduler calls the deploy hook ([Publishing · Rebuilds](Publishing.md#rebuilds)). `npm run build` runs `check-env`, `react-router build`, `build:feeds`, `build:media` and `check-build` ([package.json](../../package.json)) |
| Edge Functions | By hand, one at a time, from the owner's shell: `supabase functions deploy pm-<name> --project-ref <ref>`. `pm-preview` and `pm-project` add `--no-verify-jwt` ([D59](../handover/09-decisions.md)). Never `supabase functions deploy` without a name, because the project's functions are shared |
| Database changes | `npm run db:migrate`, from the owner's shell ([Content model · Migrations](Content-model.md#migrations)). Never `supabase db push`, `db reset --linked`, `db pull` or `migration repair` ([D36](../handover/09-decisions.md)) |
| The prototypes | A separate Vercel project, never the site's own origin ([D11](../handover/09-decisions.md)) |

**Until launch,** the rebuild lives on `claude/elegant-allen-xdmal0` and is merged into `main` at M6 ([D46](../handover/09-decisions.md)). Nothing in CI or in an agent session touches the shared Supabase project; the owner runs every step against it ([supabase/README.md](../../supabase/README.md)).

## Environment variables

Names only. The repository is public and holds no values ([D10](../handover/09-decisions.md), [SECURITY.md](../../SECURITY.md)). [.env.example](../../.env.example) lists the names with empty values, and local development reads `.env.local`, which is git-ignored.

| Variable | Where the value lives | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Vercel env; the client bundle | Public by design. RLS protects the data. The build also reads published content with them |
| `VITE_TURNSTILE_SITE_KEY` | Vercel env; the Studio bundle | Public. Renders the Turnstile check on the sign-in page |
| `SITE_URL` | Vercel env | Canonical URLs, sitemap and RSS ([D53](../handover/09-decisions.md)). It must be an https origin ([src/lib/seo.ts](../../src/lib/seo.ts)) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` | Provided to Edge Functions by Supabase | The functions' database, Auth and Storage access ([D59](../handover/09-decisions.md)). The service-role key is the shared project's, so it also opens lumina's data. Never in Vercel or the client |
| `PM_DEPLOY_HOOK_URL` | Supabase Edge Function secrets | Rebuild after a publish. Anyone holding it can start builds, so it's a secret |
| `PM_ALLOWED_ORIGINS` | Supabase Edge Function secrets | The origins allowed by CORS on the functions, comma-separated |
| `PM_SITE_URL` | Supabase Edge Function secrets | The site's origin, for preview links |
| `pm_service_role_key`, `pm_project_url` | Supabase Vault | The cron jobs' calls to the `pm-` functions ([D57](../handover/09-decisions.md)) |
| Turnstile secret key | Supabase dashboard, Authentication › Attack Protection | Not set yet: CAPTCHA protection stays off on the shared project for now ([D54](../handover/09-decisions.md)) |
| SMTP host, user and password | Supabase dashboard, Authentication › SMTP | Sends the sign-in codes. The sender is still open ([D53](../handover/09-decisions.md)) |
| `OWNER_EMAIL` | The owner's shell, for `npm run setup:owner` only | Creates or finds the owner's account. The address never appears in code, migrations, seeds or tests |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | The owner's shell, for one command at a time | `setup:owner` and `seed:v0` (and `backup`, once it exists) |
| `PM_DATABASE_URL` | The owner's shell, for one command at a time | `db:migrate` and `seed:v0`. Never in Vercel, CI or a file |

**Build and test switches** (no secrets):

| Variable | Effect |
| --- | --- |
| `CONTENT_SOURCE` | `local-v0` (default), `fixture:boards` or `supabase` ([Architecture · Rendering](Architecture.md#rendering)) |
| `CATALOGUE` | `1` includes the dev component catalogue in a local QA build |
| `PM_BUILD_DIR` | Where a build goes; parity builds use their own folders |
| `PM_FIXTURE_WIDTH` | The boards fixture's variant for parity: 1440, 834 or 390 ([D70](../handover/09-decisions.md)) |
| `PW_PORT_BASE`, `PW_REUSE` | Playwright's ports, and reusing a running server ([HANDOFF](../../HANDOFF.md)) |

[scripts/check-env.ts](../../scripts/check-env.ts) runs before every build and fails it if:

- `src/` reads a `VITE_` variable other than the three above, or reads `import.meta.env` as a whole;
- any environment value, from the shell or a `.env` file Vite loads, is a Supabase secret key (a JWT with `role: service_role`, or an `sb_secret_` key);
- a Vercel build sets `CONTENT_SOURCE=fixture:boards`, or a production build sets `CATALOGUE` or any `CONTENT_SOURCE` other than `supabase`.

## Going live

The steps are the owner's, because they need the owner's accounts and they touch a project another site depends on. They're written out in [supabase/README.md](../../supabase/README.md) (Supabase, in order) and the [launch checklist](../handover/09-decisions.md#launch-checklist-owner) (everything else). In short:

1. Expose `pm` in the Data API settings.
2. Switch on `pg_cron` and `pg_net`.
3. `npm run db:migrate -- --dry`, check the list, then run it.
4. Add `pm_service_role_key` and `pm_project_url` to Vault.
5. Set the three `PM_` function secrets, then deploy the six functions one by one.
6. `npm run setup:owner`.
7. Apply the Auth settings with the owner ([D52](../handover/09-decisions.md)), including an 8-digit code length ([D66](../handover/09-decisions.md)).
8. Vercel: the site project with its environment variables, and the deploy hook.
9. `npm run seed:v0`, then check every "Worth a check" item in Studio.

[supabase/README.md](../../supabase/README.md#check-it-works-the-owner-after-going-live) then lists five checks: cron, sign-in, publish, preview, and lumina's own sign-in.

## Scheduled jobs

[0002_cron.sql](../../supabase/pm/migrations/0002_cron.sql) creates three `pg_cron` jobs. Each calls `pm.invoke_function()`, which posts to a `pm-` function with the service-role key from Vault. Job names start with `pm-`, so they're easy to tell from lumina's in `cron.job`.

| Job | Schedule (UTC) | Calls |
| --- | --- | --- |
| `pm-scheduled-posts` | `*/5 * * * *` | `pm-post-scheduler`: publishes posts whose time has passed ([Publishing · Scheduled posts](Publishing.md#scheduled-posts)) |
| `pm-link-check` | `23 2 * * *` | `pm-check-link` with `{ nightly: true }` |
| `pm-purge` | `17 3 * * *` | `pm-purge` |

The migration stops with a message if `pg_cron` or `pg_net` is off. It never creates an extension, because extensions are project-wide ([D57](../handover/09-decisions.md)).

## Link checks

`pm-check-link` ([supabase/functions/\_shared/check-link.ts](../../supabase/functions/_shared/check-link.ts)) runs in three places: when the owner pastes a link in Studio, during publish, and nightly.

- **How it fetches:** no cookies, a 10-second budget and at most 5 redirects, followed by hand so every hop is checked. Only `https:` on port 443, with no credentials and no IP literal, `localhost` or private host. The body is never returned.
- **What it reports:** `ok`, `login` (a redirect to a sign-in page, or 401/403), `no-frame` (a prototype that can't be embedded; the site shows "Open prototype ↗"), `not-shared` (a Drive file that isn't shared), `gone` (404 or 410) or `error`.
- **Nightly,** it checks up to 200 distinct links found in published projects, posts and the profile, and records each result in `pm.link_checks`. Failures appear on the Studio dashboard ([src/lib/studio/dashboard.ts](../../src/lib/studio/dashboard.ts)).

## The purge job

`pm-purge` ([supabase/functions/\_shared/jobs.ts](../../supabase/functions/_shared/jobs.ts)) runs nightly and accepts only the service-role key.

- **Rows:** deletes projects and posts soft-deleted more than 30 days ago, and preview links that expired or were revoked more than 30 days ago. Their revisions, redirects and preview links go with them (`on delete cascade`).
- **Draft files:** removes files in `pm-media-draft` that don't belong to a media row's current revision. Files younger than 24 hours are left alone, because Studio uploads a file before it inserts its media row.
- **Public files:** removes files in `pm-media-public` that no published document names, then updates `pm.media.published` to match.

So a deleted project can be restored for 30 days, and an image replaced with "Replace file" leaves both buckets once nothing published uses the old revision ([D41](../handover/09-decisions.md)).

## Backups and restore

**Not built yet.** `npm run backup` currently runs a placeholder ([scripts/not-yet.ts](../../scripts/not-yet.ts)) that prints a message and exits with an error. `scripts/backup.ts` doesn't exist.

The plan ([06 · Backups](../handover/06-backend.md#backups)): the free plan has no downloadable backups, and a public repository can't hold them, so `npm run backup` will export every `pm` table as JSON and every file in the two `pm-` buckets into `backups/<date>/`, which `.gitignore` excludes. It will run on the owner's machine with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set for that command only, and never read lumina's data. No restore procedure is written yet.

What protects content today:

- **Revisions:** every publish keeps the published copy in `project_revisions`, `post_revisions` or `site_revisions` ([Content model · Versions and revisions](Content-model.md#versions-and-revisions)).
- **Soft deletes:** a deleted project or post can be restored for 30 days.
- **The V0 content** is in the repository ([src/legacy/content.ts](../../src/legacy/content.ts)), and `seed:v0` loads it into an empty schema.
- **The public site is static,** so it keeps working while Supabase is paused or down; only Studio and publishing wait ([06 · The shared project](../handover/06-backend.md#the-shared-project)).

## Monitoring

There's no monitoring service. These are the places to look:

| What | Where |
| --- | --- |
| Did a publish start a build? | A row in `pm.deploys`, and a build from the hook in Vercel. Studio offers "Try again" when the hook fails |
| Are the cron jobs running? | `cron.job` and `cron.job_run_details` in the SQL editor; the queries are in [supabase/README.md](../../supabase/README.md#check-it-works-the-owner-after-going-live) |
| Broken links | The Studio dashboard, from `pm.link_checks` |
| A scheduled post that didn't publish | "Couldn't publish" with the reason (`schedule_error`) on the post and the dashboard |
| Storage use | Studio's storage meter, "Storage {used} of 1 GB". That's the shared project's free quota, so it counts lumina's files too ([05 · Media](../handover/05-studio.md)) |
| Failed builds | Vercel. A build fails, rather than shipping stale content, when a Supabase read fails, a published image can't be downloaded, or a check fails |

The Edge Functions log unexpected errors by name only. They never log request bodies, tokens or email addresses ([supabase/functions/\_shared/http.ts](../../supabase/functions/_shared/http.ts)).

## Updating dependencies

The rules are in [10 · Security gates](../handover/10-execution-plan.md#security-gates) (Supply chain): pinned versions, a committed lockfile and the smallest dependency set.

- **Dependabot** ([.github/dependabot.yml](../../.github/dependabot.yml)) opens weekly pull requests for npm and for GitHub Actions, at most five at a time, with `react-router` and `@react-router/*` grouped so they move together.
- **Versions are exact** in [package.json](../../package.json). Commit `package-lock.json` with every dependency change.
- **The Edge Functions** pin their own copies of `zod`, `@supabase/supabase-js` and `postgres` in [supabase/functions/deno.json](../../supabase/functions/deno.json), at the same versions as `package.json`. Dependabot's npm updates don't cover that file, so update it alongside.
- **GitHub Actions** are pinned by commit SHA, with `permissions: contents: read` ([.github/workflows/ci.yml](../../.github/workflows/ci.yml)).
- **CI runs** `npm audit --omit=dev --audit-level=high`, so a high or critical advisory in a production dependency fails the build.
- **Before merging an update,** run the full checks ([HANDOFF · How we work](../../HANDOFF.md)): `npm run typecheck && npm run lint && npm run format:check && npm run test:coverage && npm run test:db && npm run db:lint && npm run build && npx playwright test`. If a change touches `src/lib` modules the functions share, run `node scripts/sync-functions-lib.ts` and commit the regenerated `_shared/lib/`.
- **New dependencies** need a reason. Two were turned down during the build: `heic2any` (unmaintained, and its bundle ships LGPL code without a notice) and, provisionally, dnd-kit and TipTap ([D80](../handover/09-decisions.md), [D69](../handover/09-decisions.md)).

**Repository settings** the owner keeps on: secret scanning with push protection, Dependabot alerts and security updates, private vulnerability reporting, and branch protection on `main` ([SECURITY.md](../../SECURITY.md)). CI also runs gitleaks on every push. If a secret is ever committed, rotate it first, then clean the history; deleting the file isn't enough.

## Code

- [package.json](../../package.json): every `npm run` script
- [supabase/README.md](../../supabase/README.md): go-live steps and post-launch checks
- [supabase/pm/migrations/0002_cron.sql](../../supabase/pm/migrations/0002_cron.sql): the cron jobs
- [supabase/functions/\_shared/jobs.ts](../../supabase/functions/_shared/jobs.ts), [supabase/functions/\_shared/check-link.ts](../../supabase/functions/_shared/check-link.ts): the scheduler, purge and link checks
- [supabase/functions/\_shared/runtime.ts](../../supabase/functions/_shared/runtime.ts): how the functions read their secrets
- [scripts/check-env.ts](../../scripts/check-env.ts), [scripts/check-build.ts](../../scripts/check-build.ts): build gates
- [scripts/migrate.ts](../../scripts/migrate.ts), [scripts/setup-owner.ts](../../scripts/setup-owner.ts), [scripts/seed-v0.ts](../../scripts/seed-v0.ts), [scripts/not-yet.ts](../../scripts/not-yet.ts): the owner's scripts
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml), [.github/dependabot.yml](../../.github/dependabot.yml): CI and dependency updates
- [.env.example](../../.env.example): variable names
