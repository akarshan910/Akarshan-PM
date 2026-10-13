# 01 · Architecture

Choices marked **(decided)** are settled. Choices marked **(default)** are the recommendation. Build with the default unless the owner overrides it. The open questions are in [09-decisions](09-decisions.md).

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Language | TypeScript, strict **(decided)** | |
| UI | React 18 **(decided)** | Already in the repo |
| Routing and rendering | React Router 7 in framework mode, with the `@react-router/dev` Vite plugin **(default)** | `react-router` 7 is already a dependency. Public routes are prerendered to static HTML at build; `/studio/*` is a client-only SPA |
| Build | Vite 6 **(decided)** | |
| Styling | Plain CSS. Global `tokens.css` and `base.css`, then a CSS Module per component **(default)** | The boards are plain CSS, so copy their values directly. No Tailwind or MUI on the public site |
| Studio primitives | Radix UI: Dialog, DropdownMenu, Switch, Tabs, Tooltip, Popover **(default)** | Already installed. Style them to the boards |
| Drag and reorder | `@dnd-kit/core` and `@dnd-kit/sortable`, with the keyboard sensor **(default)** | Boards: drag a handle, or focus it and press ↑ ↓ |
| Rich text | TipTap, restricted to the allowlist in [06](06-backend.md#rich-text) **(default)** | Case-study chapters, posts, text sections |
| Sanitising | DOMPurify on the client, and the same allowlist in Edge Functions **(default)** | |
| Backend | Supabase: Postgres, Auth (Google), Storage, Edge Functions, Cron **(decided)** | See [06](06-backend.md) |
| Hosting | Vercel, static output plus a deploy hook **(default)** | The owner already uses Vercel for prototypes |
| Tests | Vitest for units, Playwright for end-to-end and screenshots **(default)** | Chromium is pre-installed in cloud sessions |

Remove the Figma Make scaffolding once the owner confirms (question D1 in [09](09-decisions.md)):

- the unused MUI, Emotion, Radix packages, `react-slick` and `canvas-confetti`;
- the `guidelines/` folder;
- `src/imports/`;
- the `@figma/my-make-file` package name.

## Rendering

**Public routes are prerendered.** At build time, the loaders read published content from Supabase with the anon key. React Router writes one HTML file per route. Every public page is therefore readable without JavaScript, and crawlers and link previews get real HTML.

**Studio is client-only.** `/studio/*` uses `clientLoader`s and is served by the SPA fallback. Its code ships in its own route chunks, so visitors never download it.

**Rebuild on publish.** Every publish calls a Vercel deploy hook. The site rebuilds in about a minute, which is the "It updates within a minute" toast on the boards.

**Previews are client-rendered.** `/preview/:token` fetches the draft through the `preview` Edge Function and renders it with the same page components. It adds the draft preview bar and `noindex`.

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
| `/preview/:token` | Client-only, `noindex`, `no-store` | `preview` Edge Function |
| `/studio`, `/studio/*` | Client-only SPA, `noindex`, disallowed in `robots.txt` | supabase-js with the owner's session |
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
    preview.$token.tsx  not-found.tsx
    studio/               one module per Studio screen (see 05)
  components/
    nav/  buttons/  labels/  hero/  shelf/  cards/  case-study/  media/
    sections/             about, experience, skills, testimonials, off-duty, contact, footer
    states/               404, moved, preview bar, expired, empty, error
    studio/               shell, outline, inspector, editors, dialogs, toasts
  motion/
    reduced-motion.ts  tilt.ts  speed-lines.ts  floaters.ts  reveal.ts  drift.css  keyframes.css
  lib/
    supabase.ts  types.ts  shelves.ts  volumes.ts  labels.ts  rich-text.ts  links.ts  seo.ts
  styles/
    tokens.css  base.css  studio.css
  legacy/
    content.ts            the current site's content, extracted verbatim (see 07)
supabase/
  migrations/             SQL, one file per change
  functions/              publish, preview, check-link, post-scheduler, purge
scripts/
  seed-v0.ts  write-vercel-config.ts  build-feeds.ts
tests/   e2e/
public/
  fonts/  robots.txt  og-default.png
```

## Environment

| Variable | Where it lives | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Vercel env, and the client bundle | Public by design. RLS protects the data |
| `SITE_URL` | Vercel env | Canonical URLs, sitemap, RSS |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function secrets only | Publishing, previews, cron. Never in Vercel, never in the client |
| `VERCEL_DEPLOY_HOOK_URL` | Supabase secrets | Rebuild after a publish |
| Google OAuth client ID and secret | Supabase dashboard, Auth › Providers | Not in the repo |
| SMTP (Resend or Postmark) | Supabase dashboard, Auth › SMTP | Backup sign-in links |

Commit `.env.example` with the variable names only. Never commit a value.

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
