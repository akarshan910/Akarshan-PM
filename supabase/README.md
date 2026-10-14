# supabase/

The portfolio's backend: the `pm` schema, its two storage buckets and its `pm-` Edge Functions ([06 · Backend](../docs/handover/06-backend.md)).

**The Supabase project is shared with lumina-photography.** Nothing here is run against it by an agent or by CI. The owner runs each step below from their own shell. Never run `supabase db push`, `db reset --linked`, `db pull` or `migration repair` against the project ([06 · The shared project](../docs/handover/06-backend.md#the-shared-project)).

## What's here

| Path | What it is |
| --- | --- |
| `pm/migrations/0001_init.sql` | Every `pm` table, grant, RLS policy and function, and the `pm-media-draft` / `pm-media-public` buckets |
| `pm/migrations/0002_cron.sql` | The three `pm-` cron jobs. Needs pg_cron and pg_net switched on, and two Vault secrets |
| `functions/_shared/` | The functions' logic. `lib/` is generated from `src/lib` by `node scripts/sync-functions-lib.ts`; don't edit it |
| `functions/pm-*/index.ts` | One entry per function: `pm-publish`, `pm-preview`, `pm-project`, `pm-check-link`, `pm-post-scheduler`, `pm-purge` |
| `tests/` | `npm run test:db`: the migrations, RLS and every function, on PGlite with Supabase's roles, auth, storage, Vault and cron stubbed |

## Checks

- `npm run db:lint`: every migration stays inside `pm` and the `pm-` buckets.
- `npm run test:db`: RLS as a visitor, a signed-in non-owner, lumina's admin and the owner; the functions end to end.
- `node scripts/sync-functions-lib.ts --check`: the functions' copy of `src/lib` is current (also a test).

## Going live (the owner, once)

In this order. Each step changes only the portfolio's namespace.

1. **Data API:** Project Settings › Data API › Exposed schemas: add `pm` next to `public`.
2. **Extensions:** Database › Extensions: switch on `pg_cron` and `pg_net` if they're off. They're project-wide; lumina is unaffected.
3. **Migrations:** `PM_DATABASE_URL='<session pooler URL>' npm run db:migrate -- --dry`, check the list, then run it again without `--dry`.
4. **Vault:** Project Settings › Vault: add `pm_service_role_key` (the service-role key) and `pm_project_url` (`https://<project-ref>.supabase.co`).
5. **Function secrets:** `PM_SITE_URL=https://akarshan-pm.vercel.app`, `PM_ALLOWED_ORIGINS=https://akarshan-pm.vercel.app,http://localhost:5173` and `PM_DEPLOY_HOOK_URL`. Make the hook in Vercel › the site project › Settings › Git › Deploy Hooks, for branch `main`; the URL is a secret (anyone holding it can start builds), so it goes only here. Supabase provides `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL` itself.
6. **Functions,** one at a time, never `supabase functions deploy` without a name:
   - `supabase functions deploy pm-publish --project-ref <ref>`, and the same for `pm-check-link`, `pm-post-scheduler` and `pm-purge`;
   - `supabase functions deploy pm-preview --project-ref <ref> --no-verify-jwt` and the same for `pm-project`: visitors call these without a session, and each checks its own token or slug.
7. **The owner's account:** `OWNER_EMAIL=… SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run setup:owner`.
8. **Auth settings** as listed in [06 · Supabase settings](../docs/handover/06-backend.md#supabase-settings), applied with the owner (D52). Among them: **Email OTP length 8** (D66) and expiration 600 seconds. Studio's code input expects 8 digits, so set the length before the owner first signs in.

## Check it works (the owner, after going live)

Each check uses the dashboard or Studio; none needs a key in a file.

1. **Cron:** SQL editor: `select jobname, schedule from cron.job where jobname like 'pm-%'` shows `pm-scheduled-posts` (`*/5 * * * *`), `pm-link-check` (`23 2 * * *`) and `pm-purge` (`17 3 * * *`). After five minutes, `select status, return_message from cron.job_run_details where jobid in (select jobid from cron.job where jobname = 'pm-scheduled-posts') order by start_time desc limit 3` shows `succeeded`.
2. **Sign-in:** request a code at `/studio/login`; it has 8 digits and arrives from the configured sender. An address that isn't the owner's gets "Check your email" and no email.
3. **Publish:** edit a project's summary in Studio and publish. The dialog says "Live in about a minute", a row appears in `pm.deploys`, and Vercel shows a build from the hook. If the hook fails, "Try again" rebuilds without publishing again.
4. **Preview:** make a preview link, open it in a private window (it shows the draft, `noindex`), revoke it, reload: the expired-preview page.
5. **Lumina:** sign in to lumina-photography's admin as usual, and reset a password there once (the link now lasts 10 minutes).

## Who writes what

| Caller | Can write |
| --- | --- |
| Visitors (`anon`) | Nothing. Reads `published` columns of live public rows, and `pm.public_redirects()` |
| The owner's session | Drafts: `draft`, `version` and `slug`, new projects and posts, `pm.media` rows, files in `pm-media-draft` |
| `pm-publish` and the other functions | Everything published: `published`, `published_slug`, `visibility`, `deleted_at`, revisions, redirects, previews, link checks, deploys, `pm-media-public` |
| `db:migrate`, `setup:owner`, `seed:v0` | The owner's shell only, with credentials set for that one command |
