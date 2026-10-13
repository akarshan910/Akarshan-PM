# Security

This repository is public. It holds the code and design for the portfolio and its private CMS, Studio. It holds no secrets, and it must never hold any.

## Reporting a problem

If you find a vulnerability in the site, Studio or this code, please report it privately with GitHub's **Report a vulnerability** button on the repository's Security tab. Don't open a public issue.

You'll get a reply within a week.

## What's in the repository, and what isn't

| In the repository | Never in the repository |
| --- | --- |
| Source code, design files and documentation | API keys, service-role keys, deploy hooks, SMTP or CAPTCHA secrets |
| `.env.example`, listing variable names with no values | `.env` files of any kind (they're git-ignored) |
| Database migrations: tables, policies, functions | The owner's account or anything that grants access |
| The public site's content seed, which matches what is already public on the live site | Drafts, private evidence notes, unpublished content |

**Where the secrets live:**

- **Vercel environment variables:** the Supabase URL, the anon key and the Turnstile site key. All three are public by design.
- **Supabase Edge Function secrets:** the Vercel deploy hook and the allowed origins. Supabase provides the service-role key to functions itself.
- **Supabase dashboard:** SMTP credentials and the Turnstile secret key.

The owner's email address for Studio is supplied as `OWNER_EMAIL` when the one-time setup script runs. It isn't written into code or migrations.

## How the site and Studio are protected

**Studio sign-in:**

- Studio signs in with a 6-digit code sent by email. Sign-ups are off, so only the owner's existing account can get a code.
- Codes expire after 10 minutes and work once.
- One code can be requested per minute.
- Cloudflare Turnstile guards code requests. Supabase limits how many codes can be checked from one IP address.

**One backend, two sites.** The Supabase project is shared with the owner's photography site. The portfolio keeps everything in its own `pm` schema, `pm-` storage buckets and `pm-` functions, with its own owner check. Each site's admins have no access to the other's data, and the policies and tests are written so neither site's rules can expose the other's.

**Database:** row-level security on every table.

- Visitors can read published content only, and only the columns they need.
- Every write requires the owner's session.
- Draft columns aren't readable by visitors at all.

**Privileged work:** the service-role key is used only inside Supabase Edge Functions, which check the owner's session first. That covers publishing, previews and link checks.

**Drafts never leak:**

- Unpublished pages return the site's normal 404 page.
- Previews use expiring, revocable links with `noindex` and `no-store`.
- Studio itself is `noindex` and disallowed in `robots.txt`.

**Untrusted content:**

- Rich text is sanitised on save and on render.
- URLs must be `https:`.
- Prototypes and videos load only on click, in sandboxed frames.
- A strict Content Security Policy limits scripts and frames.

**Dependencies:** dependencies are pinned by the lockfile and checked in CI.

The full design is in [`docs/handover/06-backend.md`](docs/handover/06-backend.md) and [`docs/redesign/03-cms-architecture.md`](docs/redesign/03-cms-architecture.md).

## Repository settings the owner should keep on

- Secret scanning, with push protection.
- Dependabot alerts and security updates.
- Private vulnerability reporting.
- Branch protection on `main`: changes arrive through pull requests, with CI passing.
