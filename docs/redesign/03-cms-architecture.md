# 03 · Studio CMS architecture

Studio lets one owner run the whole portfolio without touching code:

- every homepage section and widget, its order and whether it shows;
- the navigation;
- profile facts and site copy;
- projects;
- posts;
- media.

Drafts stay private until published. The public site reads only published content.

## Shape of the system

```
Browser (public site)  ── reads ──▶  Supabase Postgres: published columns only (anon key + RLS)
        │                                     ▲
        │ prerendered pages                   │ owner-only writes (RLS)
        ▼                                     │
Static host (CDN)  ◀── rebuild/revalidate ── Edge function: publish (site, project or post)
                                              ▲                      ▲
Browser (Studio, /studio)  ── auth (Google) ──────┘      Cron: scheduled posts
        │
        └── uploads ──▶ Supabase Storage: media (images, PDFs)

Prototypes and videos stay where you host them (Vercel, Figma, YouTube, Vimeo, Loom,
Google Drive). Studio stores their links; the site embeds them on click, sandboxed.
```

- **Front end.** Keep Vite and React. Add a router:

  | Route | Page |
  | --- | --- |
  | `/` | Home, built from the published site layout |
  | `/work` | Every published project, as a list |
  | `/work/:slug` | A project |
  | `/writing` | Every published post |
  | `/writing/:slug` | A post |
  | `/writing/rss.xml` | The RSS feed |
  | `/studio/*` | The CMS |

  Studio is a separate lazy-loaded chunk, so visitors never download it.
- **Backend.** Supabase: Postgres, Auth, Storage, Edge Functions and Cron. No server of our own.
- **SEO.** Public pages are prerendered at publish time, with title, description, Open Graph tags and canonical URL. A plain SPA would serve the same empty HTML to crawlers and link previews.

## Studio sections

| Section | What it holds |
| --- | --- |
| Dashboard | What needs input, recent changes, what's live |
| Website | The homepage outline and navigation. **Profile & facts** sits under it: names, numbers, roles, testimonials and contact details, each confirmed before it goes live |
| Projects | Every project by shelf, the five-tab editor, preview links |
| Writing | Posts: drafts, scheduled and published |
| Media | Images and PDFs, with alt text and where each file is used. Prototypes and videos are links, added in a project |

On phones these five are the bottom tabs.

## Auth

To be built during development. Studio signs in with Google, and only the owner's Google account, akarshan910@gmail.com, gets in. The database enforces this, not just the UI.

**How it works**

- **Sign-in page.** `/studio` shows "Continue with Google". It uses Supabase Auth's Google provider with only the `openid`, `email` and `profile` scopes, which don't need Google's app review.
- **Owner check.** After Google returns, the signed-in email is checked against the `owners` table. Every RLS policy checks the same table. Any other Google account sees "This Google account can't open Studio" and gets no data.
- **Closed sign-ups.** New sign-ups are turned off after the owner's first sign-in, so no other account can even be created.
- **Backup.** "Email me a sign-in link instead" sends a one-time link, in case Google sign-in is unavailable.
  - It's rate-limited.
  - Its "Check your inbox" message never reveals whether an address owns the site.
- **Staying signed in.** Sessions refresh silently on each device, and "Sign out" is in the sidebar. On expiry, edits stay on the device and sync after signing in again (Studio › States).
- **Where it lives.** Studio is at `[your-domain]/studio`. It isn't linked from the public site, is `noindex`, and is disallowed in `robots.txt`. Bookmark it on your laptop and phone.

The designs are on the canvas: Studio › sign in, which has every state in Tweaks, and Studio › States › Session expired.

**Setup checklist for development**

1. **Google Cloud Console.**
   - Create an OAuth client ID of type "Web application".
   - Set up the consent screen: External, app name "Studio", scopes `openid`, `email` and `profile`.
   - Add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorised redirect URI.
2. **Supabase › Authentication › Providers › Google.** Enable it and paste the client ID and secret. The secret stays in Supabase and never goes in the site's code.
3. **Supabase › Authentication › URL configuration.**
   - Site URL: `https://[your-domain]`.
   - Redirect URLs: `https://[your-domain]/studio`, plus `http://localhost:5173/studio` for development.
4. **Owner and policies.** Add akarshan910@gmail.com to `owners` with a migration, and apply the RLS policies below.
5. **Close sign-ups.** Sign in once with Google, then turn off "Allow new users to sign up" in Supabase.
6. **Test.**
   - A different Google account must land on "This Google account can't open Studio" and read zero rows from every table.
   - Signing out must end the session on that device.
7. **Email sender.** Set a custom SMTP sender for the backup links, for example Resend or Postmark. Supabase's built-in sender is rate-limited and meant for testing.
8. **Google account.** Turn on 2-Step Verification for akarshan910@gmail.com: it is now the key to the site.

## Data model

```sql
create table owners (
  email text primary key
);

create table profile (           -- one row: facts and site copy
  id int primary key default 1 check (id = 1),
  draft jsonb not null,          -- see Profile below
  published jsonb,
  published_at timestamptz,
  version int not null default 1
);

create table site_layout (       -- one row: sections, widgets, shelves, navigation
  id int primary key default 1 check (id = 1),
  draft jsonb not null,          -- see SiteLayout below
  published jsonb,
  published_at timestamptz,
  version int not null default 1
);

create table site_revisions (    -- history of published profile + layout pairs
  id bigserial primary key,
  profile jsonb not null,
  layout jsonb not null,
  published_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
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

create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  draft jsonb not null,          -- see Post below
  published jsonb,
  published_at timestamptz,      -- first publish; shown as the post's date
  scheduled_for timestamptz,     -- set while a post waits to go live
  version int not null default 1,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table post_revisions (
  id bigserial primary key,
  post_id uuid references posts on delete cascade,
  published jsonb not null,
  published_at timestamptz not null default now()
);

create table media (
  id uuid primary key default gen_random_uuid(),
  path text not null,            -- storage key, random UUID-based
  kind text not null check (kind in ('image','document')),   -- prototypes and videos are links, not files
  mime text not null,
  bytes int not null,
  width int,
  height int,
  alt text,                      -- default alt; projects and posts can override
  decorative boolean not null default false,
  created_at timestamptz not null default now()
);

create table slug_redirects (
  old_path text primary key,     -- '/work/old-slug' or '/writing/old-slug'
  project_id uuid references projects on delete cascade,
  post_id uuid references posts on delete cascade,
  check ((project_id is null) <> (post_id is null))
);

create table preview_links (
  token_hash text primary key,   -- sha-256 of a 32-byte random token; the token itself is never stored
  kind text not null check (kind in ('site','project','post')),
  project_id uuid references projects on delete cascade,
  post_id uuid references posts on delete cascade,
  expires_at timestamptz not null,               -- 7 days
  revoked_at timestamptz,
  check ((kind = 'project') = (project_id is not null) and (kind = 'post') = (post_id is not null))
);
```

A post's status follows from its columns:

| Status | Condition |
| --- | --- |
| Draft | `published` and `scheduled_for` are both null |
| Scheduled | `scheduled_for` is set |
| Published | `published` is set |

A published post can also hold unpublished edits in `draft`.

Projects have no shelf or order columns. Shelf membership and order live in the site layout, so they publish with the rest of the homepage.

### Profile JSON

Lists carry stable ids so the layout can order and hide their entries.

```ts
type ResultType = 'achieved' | 'target' | 'projected' | 'baseline' | 'output';

type Profile = {
  name: string;
  title: string;                 // job title
  availability?: string;         // the hero chip; hidden when empty
  location?: string;
  positioning: string;           // the hero's main line
  intro: string;
  about: string;
  photo?: { mediaId: string; alt: string };
  proof: { id: string; value: string; label: string; type: ResultType }[];
  experience: { id: string; company: string; role: string; dates: string; note?: string }[];
  skills: { id: string; group: string; items: string[] }[];
  testimonials: { id: string; quote: string; name: string; role: string }[];
  offDuty: { id: string; label: string }[];
  contact: { closing: string; email?: string; linkedin?: string; github?: string; resumeMediaId?: string };
  unconfirmed: string[];         // keys of imported facts not yet confirmed in Profile & facts
};
```

### SiteLayout JSON

```ts
type SiteLayout = {
  sections: Section[];           // page order: the hero is always first, the footer always last
};

type Section = {
  id: string;                    // 'hero', 'proof', 'about', … or a generated id for shelves and text sections
  kind: 'hero' | 'proof' | 'shelf' | 'writing' | 'about' | 'experience' | 'skills'
      | 'testimonials' | 'offduty' | 'contact' | 'text' | 'footer';
  visible: boolean;              // the hero can't be hidden; hide its parts instead
  nav?: { label: string };       // set = linked in the pill nav; links follow page order
  items: { id: string; visible: boolean }[];     // what's inside, in display order
  shelf?: { title: string; intro: string; rows: 1 | 2 | 3 };   // items are project ids
  writing?: { latest: 2 | 3 | 4 };
  text?: { title: string; body: string };        // sanitised rich text
  floaters?: { items: string[]; atOnce: 1 | 2 | 3 };  // hero only: project ids that float, in rotation; drafts are skipped until published
};
```

| Section kind | Its items |
| --- | --- |
| `hero` | `availability`, `location`, `name`, `brush`, `positioning`, `intro`, `buttons`, `motion`, `floaters` |
| `proof`, `experience`, `skills`, `testimonials`, `offduty` | Ids of the matching profile entries |
| `shelf` | Project ids |
| `writing` | `latest`, `rss` |
| `about` | `text`, `photo` |
| `contact` | `closing`, `email`, `linkedin`, `github`, `resume` |
| `footer` | `credit`, `updated` |
| `text` | None |

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
      | { type: 'video'; url: string }  // YouTube, Vimeo, Loom or Google Drive
      | { type: 'prototype'; url: string; posterId: string; frame: 'phone' | 'tablet' | 'desktop' | 'none'; start: 'click' | 'visible' };  // url: a deployed prototype, e.g. on Vercel, or a Figma prototype
    cover: { mediaId: string; focal: { x: number; y: number }; alt: string };
    gallery: { mediaId: string; alt?: string; decorative?: boolean; caption?: string }[];
  };
  story: { id: string; title: string; hidden: boolean; blocks: Block[] }[];  // empty chapters never render
  outcomes: {
    id: string; value: string; label: string;
    type: ResultType;
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
  | { type: 'prototype'; startPath?: string }  // added to the project's prototype link, e.g. '/booking' or '#calendar'
  | { type: 'journey'; stages: { title: string; note: string }[] }
  | { type: 'ownership'; mine: string; team: string; business: string }
  | { type: 'cards'; columns: 2 | 3 | 4; items: { title: string; note?: string }[] }
  | { type: 'divider' };
```

### Post JSON

```ts
type Post = {
  title: string;
  subtitle?: string;
  cover?: { mediaId: string; alt: string };
  blocks: PostBlock[];
  excerpt?: string;              // ≤ 160; cards and search fall back to the first lines
  topics: string[];
  showOnHome: boolean;           // eligible for the homepage Writing section
  canonicalUrl?: string;         // only when the post first appeared elsewhere
  seo: { title?: string; description?: string };
};

type PostBlock =
  | { type: 'text' | 'heading' | 'quote'; body: string }
  | { type: 'image'; mediaId: string; alt?: string; decorative?: boolean; caption?: string }
  | { type: 'embed'; url: string }               // YouTube, Vimeo, Loom or Google Drive, as in projects
  | { type: 'code'; language?: string; body: string }
  | { type: 'fact'; value: string; label: string; resultType: ResultType };  // copied from Profile & facts with its label
```

Rich text is stored as a small allowlisted HTML subset: `p`, `strong`, `em`, `a[href]`, `ul`, `ol` and `li`. It is sanitised on save and on render. Links get `rel="noopener"`. Code blocks are stored as plain text and escaped on render.

## Website builder

Studio › Website controls the homepage and the navigation.

**Editing**

- **Outline.** Every section in page order. Each section expands to show what's inside:
  - the hero's parts;
  - proof-strip numbers;
  - projects on each shelf;
  - experience entries, testimonials and so on.
- **Order.**
  - Drag a handle, or focus it and press ↑ or ↓, to move a section or an item within its section.
  - "Move to …" moves a project to another shelf.
  - The hero is pinned first and the footer last.
- **On or off.** The eye switch shows or hides any section or item.
  - The hero always shows. Hide its parts instead.
  - A draft project keeps its spot but can't be switched on. It takes that spot when it's published.
- **Navigation.**
  - Any section can be linked in the pill nav, with its own label. Links follow page order.
  - "Let's Talk" always shows. It links to Contact, or to the email address when Contact is hidden.
- **Settings.** Selecting a section opens its settings:

  | Section | Settings |
  | --- | --- |
  | Hero | Availability chip, positioning line, intro. Floating previews: which projects float, and how many at once (1, 2 or 3) |
  | Shelf | Title, intro, rows on the homepage (1, 2 or 3) |
  | Writing | Posts on the homepage (the latest 2, 3 or 4) |
  | About | The About text |
  | Contact | The closing line |

  Names, numbers and roles are edited and confirmed in Profile & facts. The hero fields write to the same profile draft, so each fact exists once.
- **New sections.** "Add section" adds a text section (a title and a body) or a new project shelf before Contact. It can then be moved anywhere.
- **Preview.**
  - A live preview at laptop, tablet and phone width.
  - Clicking a section in the preview selects it in the outline.
  - "Show drafts" and "Show hidden" add placeholders for what visitors won't see.
- **Publish website.** Publishes the layout and the profile together and lists every change since the last publish, for example "Moved Testimonials above About" or "Hid Off duty". A longest-increasing-subsequence check works out the moves, so one drag reads as one move. Project pages, posts and drafts aren't touched. The Projects page's "Homepage layout changed" bar publishes the same way.

**On the live site**

- **Empty sections hide.** A section shows only when it is switched on and has something to show. These stay off the page:
  - a shelf with no published projects;
  - Writing before the first post;
  - a list whose items are all hidden.
- **Stale ids are dropped.** At publish, any item that no longer exists is removed, for example a deleted testimonial.
- **New items join at the end.** They are added to the end of their section, switched on. Examples: a testimonial added in Profile & facts, or a project created on a shelf.
- **Motion off means off.** Turning off the hero's motion turns off the tilt and the speed-line aiming for every visitor. A visitor's reduced-motion setting always wins.
- **Floating previews skip drafts.** A draft in the list floats once it's published. An empty list hides the floating previews.

## How shelves scale

1. **Your order, everywhere.**
   - Shelf order and project order in Studio set the homepage, the default sort on `/work` and the volume numbers.
   - Volume numbers count published, listed projects in that order. They change when you reorder or publish.
   - Links use slugs, never numbers, so a shared link never breaks.
2. **The homepage is a cap, not a list.**
   - On laptop, a shelf shows its lead card across the full width, then rows of three, for 1 to 3 rows.
   - With r rows there is room for 1 + 3r projects. If the shelf holds more, the last cell becomes "See all N" and links to `/work?shelf=<id>`.
   - If the last row has a gap, an "All work" tile fills it, so rows are always complete.
   - iPad and phones show the same projects in their own layout.
3. **The lead card** is the first published project on the shelf. Starring a project in Studio › Projects moves it to the top.
4. **`/work` carries the rest.**
   - It lists every published, listed project. Each row shows the volume, title, company, shelf and headline number with its label.
   - Filters: shelf, company, topic and label. There's also search and sort ("Your order" by default).
   - It loads 24 rows at a time and virtualises past 100 rows.
5. **Shelves are yours.**
   - Add, rename, reorder or turn off a shelf.
   - A shelf's id is set when it's created and never changes, so `/work?shelf=` links survive a rename.
6. **Light by default.** The homepage loads only the covers it shows. `/work` is a text list, so it stays light at any length.
7. **Phones get a list, not a rail.**
   - A shelf shows its lead card, then compact rows of the same projects, then "See all N".
   - `/work` is the same list, with filters in a bottom sheet.

## Writing

**In Studio › Writing**

- **Lists.** Drafts, Scheduled and Published tabs.
- **Ideas from your résumé.** Suggested titles, clearly marked as suggestions. Starting one creates a draft with only the title.
- **Editor.**
  - An optional cover image, the title and a subtitle.
  - Blocks: paragraph, heading, quote, image, embed and code.
  - "Facts you can cite" inserts a confirmed number from Profile & facts with its label.
  - A word count and reading time.
- **Post settings.**
  - Address: `/writing/<slug>`, generated from the title and editable.
  - Excerpt and topics.
  - Publish now or schedule.
  - "Show on my homepage".
  - An optional canonical link.
  - A search preview.

**Publishing a post**

- **Checks.** Publishing is blocked by:
  - a missing title or slug;
  - an image or cover without alt text that isn't marked decorative;
  - an embed from an unsupported host, or a Google Drive video that isn't shared publicly;
  - a canonical link that isn't `https:`.
- **Scheduling.** A cron job runs every 5 minutes and publishes posts whose `scheduled_for` has passed, with the same checks.
  - If a check fails, the post stays scheduled, and Studio shows "Couldn't publish" with the reason.
  - Times are entered and shown in the owner's time zone.
- **Reading time** is the word count divided by 220, rounded up, computed at publish.

**On the public site**

- **Homepage Writing section.**
  - Shows the latest 2, 3 or 4 published posts that have "Show on my homepage" switched on, newest first.
  - Links to all posts and, if switched on, the RSS feed.
  - Stays hidden until there's a post to show.
- **`/writing`.** The newest post leads, then a plain list that pages through older posts. It can be filtered by topic and links to RSS.
- **A post** has:
  - a reading-progress bar;
  - the date, reading time and topics;
  - one 68-character column;
  - numbers that keep their labels;
  - share links (LinkedIn, X, copy link);
  - a link to the next post.
- **RSS.** `/writing/rss.xml` carries the 20 latest posts in full, built from the sanitised HTML. Every page links it with `<link rel="alternate" type="application/rss+xml">`.
- **Canonical.** A post's own address is canonical unless `canonicalUrl` is set. Copies posted elsewhere should point back here: Medium's import does this.

## Row-level security

```sql
alter table projects enable row level security;

-- Owner can do everything
create policy owner_all on projects for all
  using ((auth.jwt() ->> 'email') in (select email from owners))
  with check ((auth.jwt() ->> 'email') in (select email from owners));

-- Public read: published, public rows only, and only these columns
revoke all on projects from anon;
grant select (slug, published, published_at) on projects to anon;
create policy public_read on projects for select to anon
  using (published is not null and deleted_at is null and visibility = 'public');
```

- `draft` has no column grant for `anon`, so it can't be selected even by a hand-written query. Private evidence notes live only in `draft`.
- Signed-in users who aren't owners match no policy and see nothing.
- Unlisted projects are served by slug through an edge function that adds `X-Robots-Tag: noindex`. They never appear in public reads, shelves, `/work` or the sitemap.
- The same pattern (owner-all policy, column grants, published-only policy) applies to `profile`, `site_layout`, `posts` and `media`. A scheduled post that was never published has `published = null`, so visitors can't read it early.
- The service-role key exists only in edge functions and the cron job, never in browser code.

## Editing and publishing

1. **Autosave.** 800ms after an edit, the draft is written with `version = version + 1 where version = :seen`. A zero-row update means another tab or device saved first, and Studio shows "This changed in another tab".
2. **Offline.** Edits queue in IndexedDB and sync on reconnect. Publishing waits for the connection.
3. **Publish** is one edge function, `publish`, called with `site`, `project` or `post`. It first checks that the JWT email is on the allowlist.

   | Kind | Checks | What it copies | What it rebuilds |
   | --- | --- | --- | --- |
   | `site` | Unknown ids are dropped. Unconfirmed facts need a second confirmation | Profile and layout, in one transaction, plus a `site_revisions` row | Every page, since the nav and footer appear on all of them |
   | `project` | Missing title, summary or slug. Gallery image without alt text that isn't decorative. Achieved result without evidence. Unsupported video host. A Google Drive video that isn't shared publicly. A prototype link that asks for a login | `draft` to `published` with private fields stripped, plus a `project_revisions` row | `/`, `/work`, `/work/:slug`, `sitemap.xml` |
   | `post` | See [Writing](#writing) | `draft` to `published`, sanitised, with the reading time, plus a `post_revisions` row | `/`, `/writing`, `/writing/:slug`, `rss.xml`, `sitemap.xml` |

   - **A project's first publish** places it in the published layout at its spot from the draft layout: right after the nearest project before it that's already live. Other unpublished layout changes stay in the draft.
   - **A changed slug** adds a `slug_redirects` row for the old path if the redirect switch is on.
4. **Unpublish** sets `published = null`.
   - A project's URL then redirects to `/work`, and a post's to `/writing`.
   - The project's spot in the layout is kept for when it returns.
5. **Delete** is a soft delete with a 7-second undo. A purge job removes rows after 30 days.

## Media

- **Images.** PNG, JPG, WebP and GIF up to 10 MB; HEIC is converted to JPG.
  - Uploads are resumable, so a lost connection pauses rather than fails.
  - Serve resized variants (for example 480, 960 and 1600 wide) with `srcset`.
  - Store the focal point for crops.
- **Video.** Links only, validated by URL pattern. Files aren't uploaded: they're heavy and would use up the free storage quota.

  | Host | How it embeds |
  | --- | --- |
  | YouTube | Privacy-enhanced embed |
  | Vimeo | Standard player |
  | Loom | Standard player |
  | Google Drive | `drive.google.com/file/d/<id>/view` links play as `…/preview` |

  - **Drive sharing.** The file must be shared as "Anyone with the link". At publish, the edge function requests the preview URL without credentials; a sign-in redirect blocks publishing with "This video isn't shared".
  - **Drive limits.** Drive's player can't autoplay or loop, and a file that suddenly gets many views can hit Drive's sharing limits.
  - **Homepage videos.** Studio suggests an unlisted YouTube link there.
- **Prototypes.** Links only.
  - **Where to host.** Deploy each prototype, for example to one Vercel project with a folder per prototype, and paste its public address. Figma prototype links work too.
  - **Checks when the link is pasted** (also run at publish):
    - it's `https:`;
    - it opens without a login, so a Vercel preview link is rejected in favour of the production address;
    - it can be framed. If `X-Frame-Options` or a CSP `frame-ancestors` rule blocks framing, the site shows an "Open prototype ↗" button instead.
  - **On the page.** A poster image shows first. On click, the prototype loads in `<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerpolicy="no-referrer">`.
    - The prototype runs on its own origin, so `allow-same-origin` only gives it its own storage. It can never read the site, its cookies or Studio.
    - The main site's CSP `frame-src` lists the allowed hosts.
- **PDFs.** Up to 10 MB, for example the résumé.
- **In-use files can't be deleted.** "Replace file" swaps a file everywhere it is used: projects, posts and the profile.
- **Links are checked again** before every publish, so a prototype or video that has moved or gone private is caught early.

Free-plan quotas change, so check current Supabase limits for storage, file size and database before launch.

## Preview links

- They cover the website draft, a project or a post.
- They're valid for 7 days and can be revoked.
- The token is 32 random bytes. Only its SHA-256 is stored.
- The preview response is `no-store` and `noindex`, and shows a "Draft preview" bar.
- A website preview renders the draft layout and profile with published projects and posts only, so a draft project still shows as nothing.
- An expired token shows a friendly page that links to the published site.

## SEO and indexing

- **Own pages.** Each published project and post has its own address with:
  - its own title and description;
  - an Open Graph image made from the cover unless one is uploaded;
  - a canonical URL.
- **Posts** also get `article:published_time` and `BlogPosting` structured data.
- **The sitemap** lists `/`, `/work`, `/writing` and every published, public project and post.
- **Never indexed:** drafts, scheduled posts, previews, unlisted pages and `/studio`. All are `noindex`, and `/studio` is also disallowed in `robots.txt`.
- **No leaks.** A draft's or scheduled post's URL returns the site's normal 404, so its existence never leaks.

## Migrating today's content

1. Map each `CASES` entry to the project JSON:

   | Today | In Studio |
   | --- | --- |
   | `customSections` | Chapters |
   | `items` | List blocks |
   | `subsections` / `widgets` | Cards |
   | `metricGroups` | Table blocks; RICE tables get `formula: 'rice'` |
   | `journeys` | Journey blocks |
   | `kpis` | Outcomes, labelled by hand |

2. Import as drafts. Nothing goes live until reviewed: the Studio dashboard lists what needs input.
3. Build the first site layout from today's page:
   - the current section order and nav labels;
   - a "Strategy & prototypes" shelf with the five case studies;
   - a "Shipped" shelf with the four Sugar.fit drafts started from the résumé.

   The Shipped shelf stays hidden until one of its projects is published.
4. Deploy the three prototypes (Sri Mandir, Word Trip, FarmVille 3) to one Vercel project, a folder each, and link them from their projects. Move the résumé PDF into storage. Once the new site is live, delete the prototype files from `public/` and the duplicates at the repository root.
5. Import into the profile:
   - the seven testimonials;
   - the experience list;
   - the proof numbers.

   Imported facts start unconfirmed, and résumé discrepancies are flagged (see the [audit](01-audit.md#site-vs-résumé)).
6. Writing starts empty. The homepage section stays hidden until the first post is published.

## Security checklist

- No secrets in client code. The anon key is public by design, and RLS is what protects data.
- Every mutation goes through RLS (owner only) or an edge function that re-checks the allowlist.
- Rate-limit sign-in links and show a clear "try again in 60 seconds".
- Sanitise rich text in projects, posts and text sections. Escape code blocks. Build RSS only from sanitised HTML.
- Validate URLs (`https:` only), including canonical links and embeds.
- Set a strict CSP on the main site. Its `frame-src` allows only the video hosts (`www.youtube-nocookie.com`, `player.vimeo.com`, `www.loom.com`, `drive.google.com`), Figma's embed and your prototype host (for example `*.vercel.app` or a custom domain).
- Load prototypes and videos only on click, in sandboxed frames, with `referrerpolicy="no-referrer"`.
- Write audit fields (`updated_at`, `published_at` and revisions) for every publish.
