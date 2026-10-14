# 01 · Architecture

Choices marked **(decided)** are settled. Choices marked **(default)** are the recommendation. Build with the default unless the owner overrides it. The open questions are in [09-decisions](09-decisions.md).

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Language | TypeScript, strict **(decided)** | |
| UI | React 18 **(decided)** | Already in the repo |
| Routing and rendering | React Router 7 in framework mode, with the `@react-router/dev` Vite plugin **(decided)** | `react-router` 7 is already a dependency. Public routes are prerendered to static HTML at build; `/studio/*` is a client-only SPA |
| Build | Vite 6 **(decided)** | |
| Styling | Plain CSS. Global `tokens.css` and `base.css`, then a CSS Module per component **(decided)** | The boards are plain CSS, so copy their values directly. No Tailwind or MUI on the public site |
| Studio primitives | Radix UI: Dialog, DropdownMenu, Switch, Tabs, Tooltip, Popover **(default)** | Already installed. Style them to the boards |
| Drag and reorder | `@dnd-kit/core` and `@dnd-kit/sortable`, with the keyboard sensor **(default)** | Boards: drag a handle, or focus it and press ↑ ↓ |
| Rich text | TipTap, restricted to the allowlist in [06](06-backend.md#rich-text) **(default)** | Case-study chapters, posts, text sections |
| Sanitising | DOMPurify on the client, and the same allowlist in Edge Functions **(default)** | |
| Backend | Supabase: Postgres, Auth (email code), Storage, Edge Functions, Cron **(decided)** | One project, shared with the owner's lumina-photography site. The portfolio lives in its own `pm` schema, `pm-` buckets and `pm-` functions. See [06 · The shared project](06-backend.md#the-shared-project) |
| Bot protection | Cloudflare Turnstile, through Supabase's CAPTCHA protection **(decided)** | Studio sign-in only. The public site never loads it. Supabase's CAPTCHA protection is project-wide, so it's switched on only once lumina's login sends tokens ([09](09-decisions.md), D35, Q8); until then the rate limits protect sign-in |
| Email | Custom SMTP for sign-in codes, Resend by default **(default)** | Set in the Supabase dashboard, on the site's domain |
| Validation | Zod schemas for every JSON document: profile, layout, project, post **(default)** | Shared by Studio, the Edge Functions and the build |
| Hosting | Vercel, static output plus a deploy hook **(decided)** | The owner already uses Vercel for prototypes |
| Tests | Vitest for units, Playwright for end-to-end and screenshots **(default)** | Chromium is pre-installed in cloud sessions |

Remove the Figma Make scaffolding once the owner confirms ([09](09-decisions.md), D1):

- the unused MUI and Emotion packages, the Radix packages Studio doesn't use, `react-slick` and `canvas-confetti`;
- the `guidelines/` folder;
- `src/imports/`;
- the `@figma/my-make-file` package name.

## Rendering

**Public routes are prerendered.** At build time, the loaders read published content from Supabase with the anon key. React Router writes one HTML file per route. Every public page is therefore readable without JavaScript, and crawlers and link previews get real HTML.

**Studio is client-only.** `/studio/*` uses `clientLoader`s and is served by the SPA fallback. Its code ships in its own route chunks, so visitors never download it.

**Rebuild on publish.** Every publish calls a Vercel deploy hook. The site rebuilds in about a minute, which is the "It updates within a minute" toast on the boards.

**Previews are client-rendered.** `/preview/:token` fetches the draft through the `pm-preview` Edge Function and renders it with the same page components. It adds the draft preview bar and `noindex`.

**Unlisted projects are client-rendered too.** They're published but must not be listed anywhere, so the build never sees them. A `/work/:slug` path with no prerendered file is rewritten to a `noindex` shell. The shell asks the `pm-project` Edge Function for that exact slug, and renders the project or the 404 page ([09](09-decisions.md), D24).

**Hydration.** It runs only for interactive pieces:

- the nav: scroll-spy, sliding highlight and phone menu;
- the hero: tilt, speed lines and floating previews;
- shelves' "Load more";
- `/work` filters;
- media embeds.

Everything else is static markup.

## Routes

| Path | Rendering | Source of content |
| --- | --- | --- |
| `/` | Prerendered | `site_layout.published`, `profile.published`, published projects and posts |
| `/work` | Prerendered | Published, listed projects |
| `/work/:slug` | Prerendered, one per published public project | `projects.published` |
| `/writing` | Prerendered. Returns the 404 page and status while there are no published posts | Published posts |
| `/writing/:slug` | Prerendered, one per published post | `posts.published` |
| `/writing/rss.xml` | Generated at build | The 20 latest posts |
| `/sitemap.xml`, `/robots.txt` | Generated at build | Published, public pages |
| `/work/:slug` (unlisted) | Client-only shell, `noindex` | `pm-project` Edge Function, by exact slug |
| `/preview/:token` | Client-only, `noindex`, `no-store` | `pm-preview` Edge Function |
| `/studio/login` | Client-only SPA, `noindex`, `no-store` | Sign-in by email code |
| `/studio`, `/studio/*` | Client-only SPA, `noindex`, `no-store`, disallowed in `robots.txt` | supabase-js with the owner's session |
| Anything else | Static 404 page | — |

Old links:

- `/?open=<id>` redirects to `/work/<slug>` for the five legacy ids, with Vercel `has: query` redirects ([07](07-v0-content.md#legacy-links)).
- Changed slugs redirect from `slug_redirects`, written into `vercel.json` at build.

## Folders

```
src/
  root.tsx                 app shell, fonts, <Meta/>, theme attribute
  routes.ts                route table
  routes/
    home.tsx  work.tsx  work.$slug.tsx  writing.tsx  writing.$slug.tsx
    preview.$token.tsx  work.unlisted.tsx  not-found.tsx
    studio/               one module per Studio screen, plus login.tsx (see 05)
  components/
    nav/  buttons/  labels/  hero/  shelf/  cards/  case-study/  media/
    sections/             about, experience, skills, testimonials, off-duty, contact, footer
    states/               404, moved, preview bar, expired, empty, error
    studio/               shell, outline, inspector, editors, dialogs, toasts
  motion/
    reduced-motion.ts  tilt.ts  speed-lines.ts  floaters.ts  reveal.ts  drift.css  keyframes.css
  lib/
    supabase.ts  auth.ts  schemas.ts  types.ts  shelves.ts  volumes.ts  labels.ts
    skills-order.ts  rich-text.ts  links.ts  seo.ts
  styles/
    tokens.css  base.css  studio.css
  legacy/
    content.ts            the current site's content, extracted verbatim (see 07)
supabase/
  pm/migrations/          SQL for the pm schema, 0001_init.sql onwards (never the Supabase CLI's history)
  functions/              pm-publish, pm-preview, pm-project, pm-check-link, pm-post-scheduler, pm-purge
  functions/_shared/      owner check, schemas, sanitiser, CORS
scripts/
  migrate.ts  setup-owner.ts  seed-v0.ts  fetch-media.ts  write-vercel-config.ts  build-feeds.ts  backup.ts
  v0-prototypes.json      the deployed prototype addresses, a seed input (see 07)
tests/   e2e/
public/
  fonts/  robots.txt  og-default.png
```

## Environment

Every variable, where its value lives, and who can see it. Only the three `VITE_` variables reach the browser, and all three are public by design.

| Variable | Where the value lives | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Vercel env; the client bundle | Public. RLS protects the data |
| `VITE_TURNSTILE_SITE_KEY` | Vercel env; the Studio bundle | Public. Renders the Turnstile check on the sign-in page |
| `SITE_URL` | Vercel env | Canonical URLs, sitemap, RSS |
| `SUPABASE_SERVICE_ROLE_KEY` | Provided to Edge Functions by Supabase | Publishing, previews, link checks. Never in Vercel, never in the client. It's the shared project's key, so it also opens lumina's data |
| `pm_service_role_key` | Supabase Vault | The cron jobs' calls to `pm-` functions ([06 · Cron](06-backend.md#cron)) |
| `PM_DEPLOY_HOOK_URL` | Supabase Edge Function secrets | Rebuild after a publish |
| `PM_ALLOWED_ORIGINS` | Supabase Edge Function secrets | The site's origins, for CORS on the functions Studio calls |
| `PM_SITE_URL` | Supabase Edge Function secrets | Preview links |
| Turnstile secret key | Supabase dashboard, Authentication › Attack protection | Supabase checks each `captchaToken` with Cloudflare |
| SMTP host, user and password | Supabase dashboard, Authentication › SMTP | Sends the sign-in codes |
| `OWNER_EMAIL`, plus `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` | The owner's local shell, only while running `npm run setup:owner`, `npm run seed:v0` or `npm run backup` (`OWNER_EMAIL` for `setup:owner` only) | Creates or finds the owner's account and adds the `pm.owners` row; loads the V0 seed; takes backups. Never written to a file in the repo |
| `PM_DATABASE_URL` | The owner's local shell, only while running `npm run db:migrate` | Applies `supabase/pm/migrations/`. Never in Vercel, CI or a file |

- Commit `.env.example` with the variable names and empty values. Never commit a value.
- Local development uses `.env.local`, which `.gitignore` already covers.
- The build fails if a `VITE_` variable's value looks like a service-role key: a JWT whose `role` claim is `service_role`. `scripts/write-vercel-config.ts` runs this check.

## Headers

`scripts/write-vercel-config.ts` writes these into `vercel.json` at build, together with the redirects.

| Header | Public pages | `/studio/*` |
| --- | --- | --- |
| `Content-Security-Policy` | `default-src 'self'`; `script-src 'self'`; `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: <supabase>` (only the draft preview needs Supabase: published images are served from `/media/`); `connect-src 'self' <supabase>`; `frame-src` the video hosts and the prototype hosts; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'` | The same, plus `https://challenges.cloudflare.com` in `script-src` and `frame-src`, `wss://<supabase>` in `connect-src`, and no video or prototype hosts |
| `Cache-Control` | Static assets immutable for a year; HTML `max-age=0, must-revalidate` | `no-store` |
| `X-Robots-Tag` | — (unlisted shells and previews: `noindex`) | `noindex, nofollow` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `same-origin` |
| `X-Content-Type-Options` | `nosniff` | `nosniff` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | the same |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | the same |

- `<supabase>` is the project's URL. Published images are copied into the site at build ([06 · Storage](06-backend.md#storage)); Studio and previews load draft images from Supabase through signed URLs.
- **Video hosts:** `https://www.youtube-nocookie.com`, `https://player.vimeo.com`, `https://www.loom.com`, `https://drive.google.com`, `https://www.figma.com`.
- **Prototype hosts** are computed at build: the origins of every published project's prototype link. A new host goes live with the publish that adds it.
- `'unsafe-inline'` for styles is needed because the hero and cards set CSS variables inline (`--pa`, `--d`, positions).
- The only inline script is the one-line bootstrap in `<head>` that adds `js` and, under reduced motion, `still` to `<html>` ([04 · Ground rules](04-motion.md#ground-rules)). It's allowed by its SHA-256 hash in `script-src`, which `write-vercel-config.ts` computes from the built HTML. Any other inline script fails the build.

## Performance budget

| Metric | Budget |
| --- | --- |
| Home JavaScript | ≤ 110 kB gzipped, excluding fonts |
| Fonts | ≤ 4 WOFF2 files preloaded. Display Archivo and Geist, subset to Latin, plus `₹ → ×` and the other symbols the content uses |
| Images | AVIF or WebP `srcset` at 480, 960 and 1600 wide, `loading="lazy"` below the fold, with explicit width and height |
| LCP | Under 2.5s on a mid-range phone over 4G |
| CLS | Under 0.1 |
| INP | Under 200ms |

The hero's motion must not delay LCP. The name and text render in the static HTML, and motion attaches after hydration.
