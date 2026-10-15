# Content model

All content lives in Postgres, in the `pm` schema of a Supabase project shared with the owner's photography site. Each piece of content is one row holding two JSON documents: the `draft` the owner edits and the `published` copy visitors see. The document shapes are Zod schemas in [src/lib/schemas.ts](../../src/lib/schemas.ts), and the published shapes are in [src/lib/published.ts](../../src/lib/published.ts). The same files are used by Studio, the seed, the build and the Edge Functions. Every publish also writes a revision. Migrations are plain SQL applied by our own script, not the Supabase CLI. As of 15 Oct 2026 the migrations are built and tested locally but haven't been applied to the shared project yet; the owner does that at go-live ([supabase/README.md](../../supabase/README.md)).

## Why draft and published copies sit on the same row

A draft and its live version are two columns of one row, not two rows or two tables ([02 · Draft and published copies on the same row](../story/02-decisions.md#draft-and-published-copies-on-the-same-row)):

- autosave writes `draft` and never touches the live page;
- publishing copies a checked, cleaned version into `published`;
- visitors' column grants include `published` and never `draft`, so a draft can't be read even with a hand-written query ([0001_init.sql](../../supabase/pm/migrations/0001_init.sql)).

The owner's session can write `draft`, `version` and `slug` only. Every published column, and every revision, redirect, preview, link-check and deploy row, is written by `pm-publish` running as the service role ([D55](../handover/09-decisions.md)).

## Tables

Every table is in `pm` and has row-level security on. Every table except `owners` and `schema_migrations` has an `owner_all` policy that calls `pm.is_owner()`. Those two have RLS on and no policies: only the service role and the migration script touch them.

| Table | Rows | Key columns | Visitors (`anon`) can read |
| --- | --- | --- | --- |
| `schema_migrations` | One per applied migration | `version`, `applied_at`, `checksum` (from 0003) | Nothing |
| `owners` | Who may use Studio | `user_id` (references `auth.users`), keyed by id, not email ([D28](../handover/09-decisions.md)) | Nothing |
| `profile` | Exactly one (`id = 1`) | `draft`, `published`, `published_at`, `version`, `updated_at` | `published`, `published_at`, once published |
| `site_layout` | Exactly one (`id = 1`) | Same as `profile` | `published`, `published_at`, once published |
| `site_revisions` | One per website publish | `profile`, `layout`, `changes` (the change list shown in the publish dialog), `published_at` | Nothing |
| `projects` | One per project | `id`, `slug` (draft address), `published_slug` (live address), `visibility` (`public` or `unlisted`), `index_allowed`, `draft`, `published`, `published_at`, `first_published_at`, `version`, `updated_at`, `deleted_at` | `id`, `published_slug`, `published`, `published_at`, `first_published_at`, `index_allowed`, for live, public, not-deleted rows |
| `project_revisions` | One per project publish | `project_id`, `published`, `published_at` | Nothing |
| `posts` | One per post | `id`, `slug`, `published_slug`, `draft`, `published`, `published_at` (first publish: the post's date), `scheduled_for`, `schedule_error`, `version`, `updated_at`, `deleted_at` | `id`, `published_slug`, `published`, `published_at`, for live, not-deleted rows |
| `post_revisions` | One per post publish | `post_id`, `published`, `published_at` | Nothing |
| `media` | One per uploaded file | `id`, `rev`, `key` (`<id>/r<rev>`), `kind` (`image` or `document`), `mime`, `bytes` (up to 10 MB), `width`, `height`, `variants`, `has_og`, `focal`, `alt`, `decorative`, `dominant`, `filename`, `published` | Nothing (published images are copied into the site) |
| `slug_redirects` | One per old address | `old_path` (`/work/…` or `/writing/…`), `project_id` or `post_id` | Only through `pm.public_redirects()` |
| `preview_links` | One per share link | `token_hash` (SHA-256 hex; the token itself is never stored), `kind` (`site`, `project`, `post`), `expires_at`, `revoked_at` | Nothing (checked by `pm-preview`) |
| `link_checks` | The last result per external link | `url`, `status` (`ok`, `login`, `no-frame`, `not-shared`, `gone`, `error`), `detail`, `checked_at` | Nothing |
| `deploys` | One per deploy-hook call | `reason`, `requested_at` | Nothing |

Two exceptions to 06's original column list: `anon` also reads `id` on live projects and posts, because the published layout names projects by id ([D56](../handover/09-decisions.md)), and `index_allowed` on live projects, so the build can write `noindex` and leave those pages out of the sitemap ([D82](../handover/09-decisions.md), [0004_anon_index_allowed.sql](../../supabase/pm/migrations/0004_anon_index_allowed.sql)).

**Topics aren't a table.** `pm.topic_counts(kind)` computes the vocabulary from the drafts. It runs as the caller, so RLS applies and visitors get nothing. A topic used by nothing disappears by itself ([06 · Topics](../handover/06-backend.md#topics)).

### Functions and triggers

| Function | What it does | Who may call it |
| --- | --- | --- |
| `pm.is_owner()` | True when `auth.uid()` is in `pm.owners`. Security definer | `authenticated`, `service_role` |
| `pm.topic_counts(kind)` | Topic names and use counts, for the topic picker. Security invoker | `authenticated`, `service_role` |
| `pm.public_redirects()` | Old paths to new ones, only for things that are, or were, public and live. Pages that were public once and aren't any more point at `/work?moved=1` or `/writing?moved=1` | `anon`, `authenticated`, `service_role` |
| `pm.touch_updated_at()` | Trigger on `profile`, `site_layout`, `projects` and `posts`: sets `updated_at` on every update | Trigger only |
| `pm.invoke_function(fn, body)` | Calls a `pm-` Edge Function with the service-role key from Vault, for the cron jobs ([0002_cron.sql](../../supabase/pm/migrations/0002_cron.sql)) | Nobody but its owner |

Every function sets `search_path = ''` and has explicit revokes and grants; `npm run db:lint` fails otherwise.

### Storage buckets

| Bucket | Public | Holds | Who writes |
| --- | --- | --- | --- |
| `pm-media-draft` | No | Every upload, every variant | The owner, through the `pm_owner_draft` policy on `storage.objects` |
| `pm-media-public` | Yes, read-only | Copies of the files published content uses | `pm-publish` only |

Files are keyed `<media id>/r<rev>/<variant>.<ext>`, for example `480.webp`, `960.webp`, `1600.webp` and `og.jpg`. Ids are random UUIDs, so filenames never appear in URLs. "Replace file" bumps `rev`, so new files get new URLs and no cache serves the old ones ([D41](../handover/09-decisions.md)). Images are resized in the browser to 480, 960 and 1600 wide as WebP at quality 0.82, and the original is re-encoded, which drops EXIF ([src/lib/studio/media-pipeline.ts](../../src/lib/studio/media-pipeline.ts); [D29](../handover/09-decisions.md)).

## JSON documents

Every document carries `schemaVersion: 1`. The TypeScript types are inferred from the schemas ([src/lib/types.ts](../../src/lib/types.ts)), so the two can't disagree. Hard limits are `.max()` in the schemas; soft limits, which only warn in Studio, are the `SOFT_LIMITS` constants ([D39](../handover/09-decisions.md)). Rules such as "a summary is required" are publish checks, not schema rules, because drafts may be incomplete while the owner works.

### Shared types

| Type | Values |
| --- | --- |
| `Accent` | `teal`, `amber`, `sky`, `violet`, `coral`, `slate`, `green`, `yellow`, `lime` |
| `ResultType` | `achieved`, `target`, `projected`, `baseline`, `output` ([D7](../handover/09-decisions.md)) |
| `Source` | `current-site`, `resume`, `owner` |
| `Inline` | Sanitised inline HTML: `<strong>`, `<em>`, `<a href>` |
| `Rich` | Sanitised block HTML: `p`, `strong`, `em`, `a`, `ul`, `ol`, `li`, `br` |
| `MediaRef` | `{ mediaId, alt?, decorative? }`: how drafts point at media |
| `Img` | `{ src, srcset, width, height, alt, dominant, og?, focal? }`: what published documents carry instead |

Links must pass `isSafeLink` (https, mailto, a `/path` or a `#section`), `isHttpsUrl` or `isRelativePath`, all in [src/lib/schemas.ts](../../src/lib/schemas.ts).

### Profile (`pm.profile`)

The facts and site copy: name, job title, availability, location, the hero's positioning line and intro, hero buttons, About (body, photo, points), the proof strip, "Problem spaces", experience with highlight groups, education, skills groups with sizes `xl`/`l`/`m`/`s`, testimonials, Off duty panels with six art presets, contact links and where "Let's Talk" goes ([D34](../handover/09-decisions.md)), and the footer credit.

Two fields exist for honesty and never reach the published copy:

- `facts`: for each fact key (a JSON path such as `proof.p-users.value`), its `source` and an optional `alternative` value from another source;
- `unconfirmed`: the fact keys listed under "Worth a check" until the owner confirms them ([D5](../handover/09-decisions.md), [D76](../handover/09-decisions.md)).

### Site layout (`pm.site_layout`)

The homepage is data ([02 · The layout is data](../story/02-decisions.md#the-layout-is-data)). A layout is an ordered list of sections. The schema checks that the hero is first and always visible, the footer is last, and section ids are unique.

| Field | Meaning |
| --- | --- |
| `id` | Also the DOM anchor. Built-in sections use their kind; shelves and text sections get a slug of their name |
| `kind` | `hero`, `proof`, `shelf`, `writing`, `about`, `experience`, `skills`, `testimonials`, `offduty`, `contact`, `text`, `footer` |
| `visible` | Shown or hidden |
| `nav` | `{ label }`, up to 14 characters, when linked in the pill nav |
| `header` | `kicker`, `title`, `titleMuted` (the grey second half), `intro` ([D31](../handover/09-decisions.md)) |
| `items` | `{ id, visible }[]`: which profile items or projects the section lists, in order |
| `shelf`, `writing`, `text`, `hero`, `contact` | Settings per kind: shelf name and rows, latest posts and RSS, a rich-text body, the motion switch and floaters, the closing line |

A shelf has no stored lead. The lead is the first visible, published project in its `items` ([D37](../handover/09-decisions.md)).

### Project (`pm.projects`)

| Part | Holds |
| --- | --- |
| `overview` | Title (warns over 60, rejected over 80), company, sector, card label, summary (140 is a publish check), "The problem" and "What I proposed" ([D25](../handover/09-decisions.md)), kind (`shipped`, `study`, `prototype`), up to 8 topics ([D44](../handover/09-decisions.md)), role, timeline, team, PRD link |
| `visuals` | The accent ([D26](../handover/09-decisions.md)), the hero (`image`, `video` or `prototype` with frame, start, title, note and screens), the cover, the gallery |
| `story` | Chapters, each with a title, a hidden flag, blocks, and Studio-only `prompts` |
| `outcomes` | Value, label, result type, whose result (`credit`), a private `evidence` note, and whether it shows in the strip |
| `headlineOutcomeId` | The number on cards and floating previews |
| `seo` | Search title, description and Open Graph image |
| `settings` | `redirectOldSlug`: "Redirect the old address here" ([D40](../handover/09-decisions.md)) |
| `todo` | Private "Needs input" notes for the dashboard |

Block types: `text`, `heading`, `list`, `quote`, `callout`, `metrics`, `table` (with the RICE formula switches), `image`, `gallery`, `beforeafter`, `video`, `prototype`, `journey`, `ownership`, `cards`, `divider`.

A new project, from `newProject()` in [src/lib/defaults.ts](../../src/lib/defaults.ts), is empty, so every part hides on the site until the owner fills it:

```ts
{
  schemaVersion: 1,
  overview: { title: "", company: "", summary: "", kind: "study", topics: [] },
  visuals: { accent: "teal", hero: { type: "image" }, gallery: [] },
  story: [],
  outcomes: [],
  seo: {},
  settings: { redirectOldSlug: false },
}
```

(The accent is the first one not already used on the shelf the project was started from; `teal` is the first in the list.)

### Post (`pm.posts`)

Title, subtitle, cover, blocks, excerpt (up to 160), up to 8 topics, `showOnHome`, an optional canonical link, and search title and description. Post blocks are `text`, `heading`, `quote`, `image`, `embed`, `code` and `fact` (a confirmed number with its result label). `newPost()` starts with an empty title, no blocks, no topics and `showOnHome: true`. Writing starts empty in V0 ([D19](../handover/09-decisions.md)).

## The published shape

`publishProject`, `publishProfile` and `publishPost` in [src/lib/published.ts](../../src/lib/published.ts) turn a draft into what visitors get. `pm-publish` runs them, then sanitises the result again on the server ([supabase/functions/\_shared/sanitize.ts](../../supabase/functions/_shared/sanitize.ts)).

| Draft | Published |
| --- | --- |
| `MediaRef` | `Img`, with the media row's alt text unless the reference overrides it; empty for decorative images |
| Outcome `evidence`, `todo`, `settings`, chapter `prompts`, a table's `reviewed` rows | Removed |
| Hidden or empty chapters, hidden experience bullets, a video or prototype hero with no link | Removed (an empty hero falls back to the image hero) |
| `facts`, `unconfirmed`, the contact phone unless `showPhone` is on | Removed |
| A video hero or block | Gains a `poster` and `duration` where the host's oEmbed gives them ([D81](../handover/09-decisions.md)) |
| A post | Gains `readingMinutes` (words ÷ 220, at least 1), `excerpt` (its own, or the first 160 characters) and `modifiedAt` |

For the website, `pm-publish` also drops hidden sections, hidden items and ids that no longer exist, and keeps only the profile items a visible section lists ([supabase/functions/\_shared/site.ts](../../supabase/functions/_shared/site.ts)). Public components accept only the published types (`ProjectPublished` and so on), so a draft field can't be rendered by accident.

## Versions and revisions

There are two kinds of version, for two jobs:

- **`version` (an integer on each row)** is the autosave's optimistic lock. Studio saves with `where version = <the version it last saw>` and bumps it. Zero rows updated means another tab or device saved first, which opens the conflict dialog ([06 · Autosave](../handover/06-backend.md#autosave); [src/lib/studio/supabase.ts](../../src/lib/studio/supabase.ts)).
- **Revisions** are a history of what was live. Every publish inserts a row into `project_revisions`, `post_revisions` or `site_revisions`. Undo after Unpublish puts the latest revision back up without re-running the checks ([D62](../handover/09-decisions.md)). As of 15 Oct 2026 Studio has no screen for browsing older revisions.

`schemaVersion: 1` marks the shape of a JSON document. The sources don't yet describe how a document would move to a version 2.

## Migrations

Migrations are plain SQL in [supabase/pm/migrations/](../../supabase/pm/migrations), named `NNNN_what.sql`:

| File | What it does |
| --- | --- |
| [0001_init.sql](../../supabase/pm/migrations/0001_init.sql) | Every table, index, trigger, grant, RLS policy and function above, and the two buckets with their storage policy |
| [0002_cron.sql](../../supabase/pm/migrations/0002_cron.sql) | `pm.invoke_function()` and the three cron jobs. Stops with a message if `pg_cron` or `pg_net` is off; it never creates an extension ([D57](../handover/09-decisions.md)) |
| [0003_migration_checksums.sql](../../supabase/pm/migrations/0003_migration_checksums.sql) | Adds `checksum` to `pm.schema_migrations` |
| [0004_anon_index_allowed.sql](../../supabase/pm/migrations/0004_anon_index_allowed.sql) | Lets `anon` read `index_allowed` on live projects ([D82](../handover/09-decisions.md)) |

**Why not the Supabase CLI.** The CLI keeps one migration history per project, and the photography site's migrations aren't in this repo. `supabase db push`, `db reset --linked`, `db pull` and `migration repair` would fail or try to reconcile the two, so they're never run against the shared project ([D36](../handover/09-decisions.md)).

**How `npm run db:migrate` works** ([scripts/migrate.ts](../../scripts/migrate.ts)):

1. It connects with `PM_DATABASE_URL`, set in the owner's shell for that one command. It reads no `.env` file and never prints the URL.
2. It lints every file first ([scripts/migration-lint.ts](../../scripts/migration-lint.ts)) and refuses to run if any has a finding.
3. It reads `pm.schema_migrations`. If an applied file is missing, or its SHA-256 no longer matches the recorded `checksum`, it stops: "Put the change in a new migration."
4. It applies each pending file in order, each in its own transaction with `set local search_path = pm, extensions`, and records the version and checksum. Files applied before 0003 get their checksum on the same run.
5. `-- --dry` lists what's pending and changes nothing.

Every new table must ship with its grants, `enable row level security` and its `owner_all` policy in the same migration; the lint fails otherwise.

## Code

- [src/lib/schemas.ts](../../src/lib/schemas.ts), [src/lib/types.ts](../../src/lib/types.ts): the document schemas and types
- [src/lib/published.ts](../../src/lib/published.ts): the published shapes and `publishProject`, `publishProfile`, `publishPost`
- [src/lib/defaults.ts](../../src/lib/defaults.ts): factories for every new document
- [src/lib/v0.ts](../../src/lib/v0.ts): `buildV0Documents()`, the launch content from the current site
- [supabase/pm/migrations/](../../supabase/pm/migrations): the `pm` schema
- [scripts/migrate.ts](../../scripts/migrate.ts), [scripts/migration-lint.ts](../../scripts/migration-lint.ts): `db:migrate` and `db:lint`
- [supabase/functions/\_shared/publish.ts](../../supabase/functions/_shared/publish.ts), [supabase/functions/\_shared/site.ts](../../supabase/functions/_shared/site.ts), [supabase/functions/\_shared/sanitize.ts](../../supabase/functions/_shared/sanitize.ts): publishing
- [supabase/tests/](../../supabase/tests): migrations and RLS tests (`npm run test:db`)
- [docs/handover/06-backend.md](../handover/06-backend.md): the full spec
