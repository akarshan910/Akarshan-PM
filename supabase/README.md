# supabase/

The portfolio's backend: the `pm` schema, its two storage buckets and its `pm-` Edge Functions ([06 · Backend](../docs/handover/06-backend.md)).

**The Supabase project is shared with lumina-photography.** Nothing here is run against it by an agent or by CI. The owner runs each step below from their own shell. Never run `supabase db push`, `db reset --linked`, `db pull` or `migration repair` against the project ([06 · The shared project](../docs/handover/06-backend.md#the-shared-project)).

## What's here

| Path | What it is |
| --- | --- |
| `pm/migrations/0001_init.sql` | Every `pm` table, grant, RLS policy and function, and the `pm-media-draft` / `pm-media-public` buckets |
| `pm/migrations/0002_cron.sql` | The three `pm-` cron jobs. Needs pg_cron and pg_net switched on, and two Vault secrets |
| `pm/migrations/0003_migration_checksums.sql` | `db:migrate` records each file's SHA-256 and refuses an applied file that changed |
| `pm/migrations/0004_anon_index_allowed.sql` | The build may read a live project's `index_allowed` (noindex, sitemap) |
| `config.toml` | A **local** stack only (`supabase start`, CI's no-leaks job). Never linked; no project ref |
| `functions/_shared/` | The functions' logic. `lib/` is generated from `src/lib` by `node scripts/sync-functions-lib.ts`; don't edit it |
| `functions/pm-*/index.ts` | One entry per function: `pm-publish`, `pm-preview`, `pm-project`, `pm-check-link`, `pm-post-scheduler`, `pm-purge` |
| `tests/` | `npm run test:db`: the migrations, RLS and every function, on PGlite with Supabase's roles, auth, storage, Vault and cron stubbed |

## Checks

- `npm run db:lint`: every migration stays inside `pm` and the `pm-` buckets.
- `npm run test:db`: RLS as a visitor, a signed-in non-owner, lumina's admin and the owner; the functions end to end.
- `node scripts/sync-functions-lib.ts --check`: the functions' copy of `src/lib` is current (also a test).
- `npm run seed:leaks`: seeds a **local** stack with the no-leaks markers and prints the manifest for `tests/e2e/no-leaks.spec.ts`; it refuses any non-local address.

## Going live (the owner, once)

One ordered list. Do it from your own machine, in a checkout of the branch being launched, after CI is green. Every step touches only the portfolio's namespace (`pm`, `pm-` buckets, `pm-` functions, `pm_` Vault secrets, `pm-` cron jobs). **Secrets are typed into your shell for one command, or pasted into a dashboard field. Never into a file, a commit, a chat or an issue.**

Where a step says "your shell", start the command with the variables, as shown, so they last only for that command. `<ref>` is the project ref from the dashboard URL (`supabase.com/dashboard/project/<ref>`).

**Before you start**

- [ ] Take a backup of what matters to lumina, as you normally would. Nothing below changes `public`, but it's the shared project.
- [ ] Have these to hand (all in the Supabase dashboard): the project ref; Project Settings › API › the URL, the anon key and the service-role key; Project Settings › Database › Connection string › **Session pooler** URI (with your database password).

**Supabase dashboard**

1. [ ] **Expose `pm`:** Project Settings › Data API › Exposed schemas: add `pm` next to `public`. Save.
2. [ ] **Extensions:** Database › Extensions: search `pg_cron`, switch it on if it's off; the same for `pg_net`. (Project-wide; lumina is unaffected.)

**Your shell: the database**

3. [ ] **See what would run:** `PM_DATABASE_URL='<session pooler URI>' npm run db:migrate -- --dry`. Expect `0001_init`, `0002_cron`, `0003_migration_checksums`, `0004_anon_index_allowed`. It stops before running anything if the lint or a checksum fails.
4. [ ] **Apply:** the same command without `-- --dry`. Each file runs in its own transaction; a failure rolls that file back and stops.

**Supabase dashboard: Vault and function secrets**

5. [ ] **Vault** (Project Settings › Vault › Add new secret), two secrets:
   - name `pm_service_role_key`, value: the service-role key;
   - name `pm_project_url`, value: `https://<ref>.supabase.co`.
6. [ ] **Deploy hook** (Vercel): the site project › Settings › Git › Deploy Hooks › name `pm-publish`, branch `main` › Create. Copy the URL; it's a secret (anyone holding it can start builds).
7. [ ] **Function secrets** (Supabase › Edge Functions › Secrets › Add), three:
   - `PM_SITE_URL` = `https://akarshan-pm.vercel.app`
   - `PM_ALLOWED_ORIGINS` = `https://akarshan-pm.vercel.app`
   - `PM_DEPLOY_HOOK_URL` = the hook URL from step 6.
   Supabase provides `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL` itself.

**Your shell: the functions**

8. [ ] Sign the CLI in once: `npx supabase login` (a browser window). Never run `supabase link`, `db push`, `db pull`, `db reset --linked` or `migration repair`.
9. [ ] Deploy each function by name, one at a time (never `functions deploy` without a name):
   - `npx supabase functions deploy pm-publish --project-ref <ref>`
   - `npx supabase functions deploy pm-check-link --project-ref <ref>`
   - `npx supabase functions deploy pm-post-scheduler --project-ref <ref>`
   - `npx supabase functions deploy pm-purge --project-ref <ref>`
   - `npx supabase functions deploy pm-preview --project-ref <ref> --no-verify-jwt`
   - `npx supabase functions deploy pm-project --project-ref <ref> --no-verify-jwt`
   (`pm-preview` and `pm-project` are called by visitors without a session; each checks its own token or slug.)

**Supabase dashboard: sign-in (applied together, D52)**

10. [ ] Authentication › Sign In / Providers › Email: provider on, Confirm email on, **Allow new users to sign up off**, **Email OTP length 8** (D66), **Email OTP expiration 600** seconds. Leave Phone as it is. Anonymous sign-ins off.
11. [ ] Authentication › Emails › Templates › **Magic Link**: subject "Your Studio sign-in code" and the body in [06 · Supabase settings](../docs/handover/06-backend.md#supabase-settings) (the code, no link). Don't change the other templates (lumina uses Reset Password).
12. [ ] Authentication › Emails › SMTP: the sender you picked (D53 is still open: lumina's existing Resend SMTP, or the built-in sender for development only).
13. [ ] Authentication › Rate Limits: emails sent 30 an hour; token verifications 30 per 5 minutes. Leave Attack Protection (CAPTCHA) **off** (D54).

**Your shell: the owner and the content**

14. [ ] `OWNER_EMAIL='<your Studio address>' SUPABASE_URL='https://<ref>.supabase.co' SUPABASE_SERVICE_ROLE_KEY='<service-role key>' npm run setup:owner`. It prints "Owner ready" with the address masked.
15. [ ] `SUPABASE_URL='https://<ref>.supabase.co' SUPABASE_SERVICE_ROLE_KEY='<service-role key>' PM_DATABASE_URL='<session pooler URI>' npm run seed:v0`. It runs once on an empty schema; a second run refuses.
16. [ ] Close the terminal tab (it held the keys), or clear the history entries for steps 3, 4, 14 and 15.

**Vercel: the site reads Supabase**

17. [ ] The site project › Settings › Environment Variables, for **Production**: `VITE_SUPABASE_URL` = `https://<ref>.supabase.co`, `VITE_SUPABASE_ANON_KEY` = the anon key, `SITE_URL` = `https://akarshan-pm.vercel.app`, `CONTENT_SOURCE` = `supabase`. Nothing else: the build refuses a service-role key in any variable.
18. [ ] Redeploy (Deployments › the latest › Redeploy), then run the checks below.

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
