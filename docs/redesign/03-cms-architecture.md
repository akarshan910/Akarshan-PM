# 03 · Studio CMS architecture

Studio lets one owner edit the portfolio without touching code. Drafts stay private until published. The public site reads only published content.

## Shape of the system

```
Browser (public site)  ── reads ──▶  Supabase Postgres: published views only (anon key + RLS)
        │                                     ▲
        │ /work/:slug, prerendered            │ owner-only writes (RLS)
        ▼                                     │
Static host (CDN)  ◀── rebuild/revalidate ── Edge function: publish
                                              ▲
Browser (Studio, /studio)  ── auth (magic link) ──┘
        │
        └── uploads ──▶ Supabase Storage: media (images, PDFs)
                         Prototype origin: separate domain, sandboxed
```

- **Front end.** Keep Vite and React. Add a router:
  - `/` for home;
  - `/work/:slug` for a project;
  - `/studio/*` for the CMS.

  Studio is a separate lazy-loaded chunk, so visitors never download it.
- **Backend.** Supabase: Postgres, Auth, Storage and Edge Functions. No server of our own.
- **SEO.** Project pages are prerendered at publish time, with title, description, Open Graph tags and canonical URL. A plain SPA would serve the same empty HTML to crawlers and link previews.

## Auth

- Magic-link sign-in (email OTP). There is no password to leak.
- An `owners` allowlist table. A signed-in user who isn't on it sees "This email can't sign in to Studio" and gets no data, because the database policies check the allowlist, not the UI.
- Sessions refresh silently. On expiry, edits stay in local storage and sync after sign-in (Studio › States).
- Before launch, set a custom SMTP sender (for example Resend or Postmark). Supabase's built-in sender is rate-limited and meant for testing.

## Data model

```sql
create table owners (
  email text primary key
);

create table profile (           -- one row
  id int primary key default 1 check (id = 1),
  draft jsonb not null,          -- name, title, positioning, availability, proof strip, about, links
  published jsonb,
  published_at timestamptz,
  version int not null default 1
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  shelf text not null check (shelf in ('shipped','strategy')),
  sort_order int not null,
  featured boolean not null default false,       -- lead card on its shelf, one per shelf
  visibility text not null default 'public' check (visibility in ('public','unlisted')),
  index_allowed boolean not null default true,
  draft jsonb not null,          -- overview, visuals, story blocks, outcomes, seo; includes private notes
  published jsonb,               -- the same shape with private fields stripped
  published_at timestamptz,
  version int not null default 1,                -- optimistic concurrency
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                         -- soft delete, purged after 30 days
);

create table project_revisions (                 -- history of published snapshots
  id bigserial primary key,
  project_id uuid references projects on delete cascade,
  published jsonb not null,
  published_at timestamptz not null default now()
);

create table media (
  id uuid primary key default gen_random_uuid(),
  path text not null,            -- storage key, random UUID-based
  kind text not null check (kind in ('image','prototype','document')),
  mime text not null,
  bytes int not null,
  width int,
  height int,
  alt text,                      -- default alt; projects can override
  decorative boolean not null default false,
  created_at timestamptz not null default now()
);

create table slug_redirects (
  old_slug text primary key,
  project_id uuid references projects on delete cascade
);

create table preview_links (
  token_hash text primary key,   -- sha-256 of a 32-byte random token; the token itself is never stored
  project_id uuid references projects on delete cascade,
  expires_at timestamptz not null,               -- 7 days
  revoked_at timestamptz
);

create table homepage_layout (   -- published order and featured cards
  id int primary key default 1 check (id = 1),
  draft jsonb not null,
  published jsonb
);
```

Testimonials and experience are arrays in `profile.draft` and `profile.published`. They are short, ordered and always edited together.

### Project JSON

```ts
type Project = {
  overview: {
    title: string; company: string; cardLabel?: string; summary: string;  // summary ≤ 140
    kind: 'shipped' | 'study' | 'prototype'; topics: string[];
    role?: string; timeline?: string; team?: string; prdUrl?: string;
  };
  visuals: {
    hero:
      | { type: 'image' }
      | { type: 'video'; url: string }  // YouTube, Vimeo or Loom only
      | { type: 'prototype'; mediaId: string; frame: 'phone' | 'tablet' | 'desktop' | 'none'; start: 'click' | 'visible' };
    cover: { mediaId: string; focal: { x: number; y: number }; alt: string };
    gallery: { mediaId: string; alt?: string; decorative?: boolean; caption?: string }[];
  };
  story: { id: string; title: string; hidden: boolean; blocks: Block[] }[];  // empty chapters never render
  outcomes: {
    id: string; value: string; label: string;
    type: 'achieved' | 'target' | 'projected' | 'baseline' | 'output';
    credit?: 'mine' | 'team' | 'business';
    evidence?: string;  // PRIVATE: stripped from `published`
    inStrip: boolean;
  }[];
  headlineOutcomeId?: string;
  seo: { title?: string; description?: string; ogImage?: 'cover' | string };
};

type Block =
  | { type: 'text' | 'heading' | 'list' | 'quote' | 'callout'; body: string; style?: 'body' | 'lead'; tone?: 'neutral' | 'accent' }
  | { type: 'metrics' }  // renders outcomes; one source of truth
  | { type: 'table'; columns: string[]; rows: string[][]; formula?: 'rice'; checkFormula?: boolean; sortByScore?: boolean }
  | { type: 'image' | 'gallery' | 'beforeafter'; mediaIds: string[] }
  | { type: 'video'; url: string }
  | { type: 'prototype'; startScreen?: string }
  | { type: 'journey'; stages: { title: string; note: string }[] }
  | { type: 'ownership'; mine: string; team: string; business: string }
  | { type: 'cards'; columns: 2 | 3 | 4; items: { title: string; note?: string }[] }
  | { type: 'divider' };
```

Rich text is stored as a small allowlisted HTML subset: `p`, `strong`, `em`, `a[href]`, `ul`, `ol` and `li`. It is sanitised on save and on render. Links get `rel="noopener"`.

## Row-level security

```sql
alter table projects enable row level security;

-- Owner can do everything
create policy owner_all on projects for all
  using ((auth.jwt() ->> 'email') in (select email from owners))
  with check ((auth.jwt() ->> 'email') in (select email from owners));

-- Public read: published, public rows only, and only these columns
revoke all on projects from anon;
grant select (slug, shelf, sort_order, featured, published, published_at) on projects to anon;
create policy public_read on projects for select to anon
  using (published is not null and deleted_at is null and visibility = 'public');
```

- `draft` has no column grant for `anon`, so it can't be selected even by a hand-written query. Private evidence notes live only in `draft`.
- Signed-in users who aren't owners match no policy and see nothing.
- Unlisted projects are served by slug through an edge function that adds `X-Robots-Tag: noindex`. They never appear in public reads, the homepage or the sitemap.
- The same pattern (owner-all policy, column grants, published-only policy) applies to `profile`, `homepage_layout` and `media`.
- The service-role key exists only in edge functions, never in browser code.

## Editing and publishing

1. **Autosave.** 800ms after an edit, the draft is written with `version = version + 1 where version = :seen`. A zero-row update means another tab or device saved first, and Studio shows "This project changed in another tab".
2. **Offline.** Edits queue in IndexedDB and sync on reconnect. Publishing waits for the connection.
3. **Publish** (edge function `publish-project`), after verifying the JWT email is on the allowlist:
   1. Validate the draft. Publishing is blocked by:
      - a missing title, summary or slug;
      - a gallery image without alt text that isn't marked decorative;
      - an Achieved result without evidence;
      - an unsupported video host.
   2. Copy `draft` to `published`, stripping private fields. Write a `project_revisions` row.
   3. If the slug changed and the redirect switch is on, add a `slug_redirects` row.
   4. Trigger a rebuild or revalidation of `/`, `/work/:slug` and `sitemap.xml`.
4. **Unpublish** sets `published = null`. The URL then redirects to the work index.
5. **Delete** is a soft delete with a 7-second undo. A purge job removes rows after 30 days.
6. **Homepage layout** (order and featured) has its own draft and publish, separate from project content.

## Media

- **Images.** PNG, JPG, WebP and GIF up to 10 MB; HEIC is converted to JPG.
  - Uploads are resumable, so a lost connection pauses rather than fails.
  - Serve resized variants (for example 480, 960 and 1600 wide) with `srcset`.
  - Store the focal point for crops.
- **Video.** Links only: YouTube (privacy-enhanced embed), Vimeo or Loom, validated by URL pattern. Files aren't uploaded: they are heavy and would eat the free storage quota.
- **HTML prototypes.** Up to 5 MB.
  - Rejected if they load scripts from another origin.
  - Served from a separate domain (for example `proto.[your-domain]`), inside `<iframe sandbox="allow-scripts">` without `allow-same-origin`.
  - That origin sends a strict Content-Security-Policy, so a prototype can never read the site, its cookies or Studio.
  - A poster image shows until the visitor clicks.
- **PDFs.** Up to 10 MB, for example the résumé.
- **In-use files can't be deleted.** "Replace file" swaps a file everywhere it is used.

Free-plan quotas change, so check current Supabase limits for storage, file size and database before launch.

## Preview links

- Created from URL & SEO, valid for 7 days, revocable.
- The token is 32 random bytes. Only its SHA-256 is stored.
- The preview response is `no-store` and `noindex`, and shows a "Draft preview" bar.
- An expired token shows a friendly page that links to the published work.

## SEO and indexing

- Each published project has `/work/:slug` with:
  - its own title and description;
  - an Open Graph image made from the cover crop unless one is uploaded;
  - a canonical URL.
- The sitemap lists published, public projects only.
- Drafts, previews, unlisted pages and `/studio` are `noindex`. `/studio` is also disallowed in `robots.txt`.
- A draft's URL returns the site's normal 404, so its existence never leaks.

## Migrating today's content

1. Map each `CASES` entry to the project JSON:
   - `customSections` → chapters;
   - `items` → list blocks;
   - `subsections` / `widgets` → cards;
   - `metricGroups` → table blocks (RICE tables get `formula: 'rice'`);
   - `journeys` → journey blocks;
   - `kpis` → outcomes, labelled by hand.
2. Import as drafts. Nothing goes live until reviewed: the Studio dashboard lists what needs input.
3. Move the three prototypes and the résumé PDF into storage. Delete the duplicate prototype files at the repository root.
4. Import the seven testimonials and the experience list into the profile. Résumé discrepancies are flagged for confirmation (see the [audit](01-audit.md#site-vs-résumé)).

## Security checklist

- No secrets in client code. The anon key is public by design, and RLS is what protects data.
- Every mutation goes through RLS (owner only) or an edge function that re-checks the allowlist.
- Rate-limit sign-in links and show a clear "try again in 60 seconds".
- Sanitise rich text and validate URLs (`https:` only).
- Set a strict CSP on the main site, plus a separate CSP on the prototype origin.
- Write audit fields (`updated_at`, `published_at` and revisions) for every publish.
