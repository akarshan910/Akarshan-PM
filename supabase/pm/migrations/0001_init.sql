-- 0001_init.sql: the portfolio's schema, `pm` (06 · Schema, Row-level security, Storage).
--
-- The Supabase project is shared with lumina-photography (06 · The shared project). Every name
-- here is in `pm`, a `pm-` bucket or a `pm_` function; nothing touches `public` or lumina's data.
-- `npm run db:migrate` runs this file in one transaction with `search_path = pm, extensions`.
--
-- Differences from 06, all tighter:
-- - `authenticated` gets column-limited writes. The owner edits drafts directly (autosave), but
--   `published`, `published_slug`, `visibility`, `deleted_at` and every revision, redirect, preview
--   and deploy row are written only by the `pm-` functions (service role). So the publish checks
--   and the server-side sanitiser can't be skipped, even with the owner's own session.
-- - `anon` may also read `id` on live projects and posts: the published layout names projects by id.
-- - `authenticated` has no privileges on `pm.owners` or `pm.schema_migrations` at all.
-- - Schema-level default privileges can't revoke Postgres's global ones (EXECUTE for PUBLIC on new
--   functions), so every object below also gets explicit revokes and grants.

create schema if not exists pm;
grant usage on schema pm to anon, authenticated, service_role;
alter default privileges in schema pm revoke all on tables from public, anon, authenticated;
alter default privileges in schema pm revoke all on sequences from public, anon, authenticated;
alter default privileges in schema pm revoke execute on functions from public, anon, authenticated;
alter default privileges in schema pm grant all on tables to service_role;
alter default privileges in schema pm grant all on sequences to service_role;
alter default privileges in schema pm grant execute on functions to service_role;

create table if not exists pm.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);
alter table pm.schema_migrations enable row level security;   -- no policies: only db:migrate's connection touches it

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

-- Who may use Studio, by auth user id. RLS on, no policies: only the service role (setup:owner).
create table pm.owners (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create table pm.profile (
  id int primary key default 1 check (id = 1),
  draft jsonb not null,
  published jsonb,
  published_at timestamptz,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

create table pm.site_layout (
  id int primary key default 1 check (id = 1),
  draft jsonb not null,
  published jsonb,
  published_at timestamptz,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

create table pm.site_revisions (
  id bigserial primary key,
  profile jsonb not null,
  layout jsonb not null,
  changes jsonb not null default '[]',
  published_at timestamptz not null default now()
);

create table pm.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  published_slug text unique check (published_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(published_slug) <= 80),
  visibility text not null default 'public' check (visibility in ('public', 'unlisted')),
  index_allowed boolean not null default true,
  draft jsonb not null,
  published jsonb,
  published_at timestamptz,
  first_published_at timestamptz,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table pm.project_revisions (
  id bigserial primary key,
  project_id uuid not null references pm.projects on delete cascade,
  published jsonb not null,
  published_at timestamptz not null default now()
);

create table pm.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  published_slug text unique check (published_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(published_slug) <= 80),
  draft jsonb not null,
  published jsonb,
  published_at timestamptz,
  scheduled_for timestamptz,
  schedule_error text,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table pm.post_revisions (
  id bigserial primary key,
  post_id uuid not null references pm.posts on delete cascade,
  published jsonb not null,
  published_at timestamptz not null default now()
);

create table pm.media (
  id uuid primary key default gen_random_uuid(),
  rev int not null default 1 check (rev >= 1),
  key text not null unique check (key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/r[0-9]+$'),
  kind text not null check (kind in ('image', 'document')),
  mime text not null check (mime in ('image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf')),
  bytes int not null check (bytes > 0 and bytes <= 10485760),
  width int check (width > 0),
  height int check (height > 0),
  variants int[] not null default '{}',
  has_og boolean not null default false,
  focal jsonb,
  alt text check (length(alt) <= 500),
  decorative boolean not null default false,
  dominant text check (dominant ~ '^#[0-9A-Fa-f]{6}$'),
  filename text not null check (length(filename) <= 255),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  check (key = id::text || '/r' || rev)
);

create table pm.slug_redirects (
  old_path text primary key check (old_path ~ '^/(work|writing)/[a-z0-9-]+$'),
  project_id uuid references pm.projects on delete cascade,
  post_id uuid references pm.posts on delete cascade,
  created_at timestamptz not null default now(),
  check ((project_id is null) <> (post_id is null))
);

create table pm.preview_links (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  kind text not null check (kind in ('site', 'project', 'post')),
  project_id uuid references pm.projects on delete cascade,
  post_id uuid references pm.posts on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check ((kind = 'project') = (project_id is not null) and (kind = 'post') = (post_id is not null))
);

create table pm.link_checks (
  url text primary key check (url ~ '^https://' and length(url) <= 2048),
  status text not null check (status in ('ok', 'login', 'no-frame', 'not-shared', 'gone', 'error')),
  detail text check (length(detail) <= 500),
  checked_at timestamptz not null default now()
);

create table pm.deploys (
  id bigserial primary key,
  reason text not null check (length(reason) <= 120),
  requested_at timestamptz not null default now()
);

create index projects_deleted_at_idx on pm.projects (deleted_at) where deleted_at is not null;
create index posts_scheduled_for_idx on pm.posts (scheduled_for) where scheduled_for is not null;
create index preview_links_expires_at_idx on pm.preview_links (expires_at);
create index project_revisions_project_id_idx on pm.project_revisions (project_id);
create index post_revisions_post_id_idx on pm.post_revisions (post_id);
create index slug_redirects_project_id_idx on pm.slug_redirects (project_id);
create index slug_redirects_post_id_idx on pm.slug_redirects (post_id);
create index preview_links_project_id_idx on pm.preview_links (project_id);
create index preview_links_post_id_idx on pm.preview_links (post_id);

-- ---------------------------------------------------------------------------------------------
-- Timestamps (06 · Timestamps and versions)
-- ---------------------------------------------------------------------------------------------

create function pm.touch_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function pm.touch_updated_at() from public, anon, authenticated;

create trigger profile_touch before update on pm.profile
  for each row execute function pm.touch_updated_at();
create trigger site_layout_touch before update on pm.site_layout
  for each row execute function pm.touch_updated_at();
create trigger projects_touch before update on pm.projects
  for each row execute function pm.touch_updated_at();
create trigger posts_touch before update on pm.posts
  for each row execute function pm.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
-- The owner check (06 · Row-level security)
-- ---------------------------------------------------------------------------------------------

create function pm.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from pm.owners where user_id = auth.uid());
$$;
revoke all on function pm.is_owner() from public, anon, authenticated;
grant execute on function pm.is_owner() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Privileges. Revoke everything first, whatever the project's defaults are, then grant exactly.
-- ---------------------------------------------------------------------------------------------

revoke all on all tables in schema pm from public, anon, authenticated;
revoke all on all sequences in schema pm from public, anon, authenticated;

grant all on all tables in schema pm to service_role;
grant all on all sequences in schema pm to service_role;
grant execute on all functions in schema pm to service_role;

-- The owner, through RLS. Reads everything in Studio's tables; writes drafts only.
grant select on pm.profile, pm.site_layout, pm.site_revisions, pm.projects, pm.project_revisions,
  pm.posts, pm.post_revisions, pm.media, pm.slug_redirects, pm.preview_links, pm.link_checks,
  pm.deploys to authenticated;
grant update (draft, version) on pm.profile, pm.site_layout to authenticated;
grant insert (slug, draft) on pm.projects, pm.posts to authenticated;
grant update (slug, draft, version) on pm.projects, pm.posts to authenticated;
grant insert (id, rev, key, kind, mime, bytes, width, height, variants, has_og, focal, alt, decorative,
  dominant, filename) on pm.media to authenticated;
grant update (rev, key, mime, bytes, width, height, variants, has_og, focal, alt, decorative, dominant,
  filename) on pm.media to authenticated;
grant delete on pm.media to authenticated;

-- Visitors and the build: published columns only (06 · Visitor reads).
grant select (id, published_slug, published, published_at, first_published_at) on pm.projects to anon;
grant select (id, published_slug, published, published_at) on pm.posts to anon;
grant select (published, published_at) on pm.profile, pm.site_layout to anon;

-- ---------------------------------------------------------------------------------------------
-- Row-level security: on for every table. `owners` and `schema_migrations` have no policies.
-- ---------------------------------------------------------------------------------------------

alter table pm.owners enable row level security;
alter table pm.profile enable row level security;
alter table pm.site_layout enable row level security;
alter table pm.site_revisions enable row level security;
alter table pm.projects enable row level security;
alter table pm.project_revisions enable row level security;
alter table pm.posts enable row level security;
alter table pm.post_revisions enable row level security;
alter table pm.media enable row level security;
alter table pm.slug_redirects enable row level security;
alter table pm.preview_links enable row level security;
alter table pm.link_checks enable row level security;
alter table pm.deploys enable row level security;

-- `(select pm.is_owner())` runs once per statement, not once per row.
create policy owner_all on pm.profile for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.site_layout for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.site_revisions for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.projects for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.project_revisions for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.posts for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.post_revisions for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.media for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.slug_redirects for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.preview_links for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.link_checks for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));
create policy owner_all on pm.deploys for all to authenticated
  using ((select pm.is_owner())) with check ((select pm.is_owner()));

create policy public_read on pm.projects for select to anon
  using (published is not null and deleted_at is null and visibility = 'public');
create policy public_read on pm.posts for select to anon
  using (published is not null and deleted_at is null);
create policy public_read on pm.profile for select to anon using (published is not null);
create policy public_read on pm.site_layout for select to anon using (published is not null);

-- ---------------------------------------------------------------------------------------------
-- Functions for the build and Studio
-- ---------------------------------------------------------------------------------------------

-- Topics (06 · Topics): runs as the caller, so RLS applies and visitors get nothing.
create function pm.topic_counts(kind text)
returns table (topic text, uses int)
language sql stable security invoker set search_path = '' as $$
  select min(t) as topic, count(*)::int as uses
  from (
    select jsonb_array_elements_text(coalesce(p.draft -> 'topics', '[]'::jsonb)) as t from pm.posts p
      where topic_counts.kind = 'post' and p.deleted_at is null
    union all
    select jsonb_array_elements_text(coalesce(p.draft -> 'overview' -> 'topics', '[]'::jsonb)) from pm.projects p
      where topic_counts.kind = 'project' and p.deleted_at is null
  ) x
  group by lower(t)
  order by lower(min(t));
$$;
revoke all on function pm.topic_counts(text) from public, anon, authenticated;
grant execute on function pm.topic_counts(text) to authenticated, service_role;

-- Redirects for the build (06 · Redirects): only for things that are, or were, public and live.
create function pm.public_redirects()
returns table (old_path text, new_path text)
language sql stable security definer set search_path = '' as $$
  select r.old_path, '/work/' || p.published_slug from pm.slug_redirects r join pm.projects p on p.id = r.project_id
    where p.published is not null and p.deleted_at is null and p.visibility = 'public' and p.published_slug is not null
  union all
  select r.old_path, '/writing/' || p.published_slug from pm.slug_redirects r join pm.posts p on p.id = r.post_id
    where p.published is not null and p.deleted_at is null and p.published_slug is not null
  union all   -- pages that were public once and aren't any more: the "moved" note
  select '/work/' || p.published_slug, '/work?moved=1' from pm.projects p
    where p.first_published_at is not null and p.published_slug is not null
      and (p.published is null or p.deleted_at is not null) and p.visibility = 'public'
  union all
  select '/writing/' || p.published_slug, '/writing?moved=1' from pm.posts p
    where p.published_at is not null and p.published_slug is not null
      and (p.published is null or p.deleted_at is not null);
$$;
revoke all on function pm.public_redirects() from public, anon, authenticated;
grant execute on function pm.public_redirects() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Storage (06 · Storage). Lumina's bucket, `portfolio`, is never touched.
-- ---------------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('pm-media-draft', 'pm-media-draft', false, 10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']),
  ('pm-media-public', 'pm-media-public', true, 10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do nothing;

-- The owner reads and writes draft files. pm-media-public has no policies for anon or
-- authenticated: public read comes from the bucket flag, and only pm-publish writes to it.
create policy pm_owner_draft on storage.objects for all to authenticated
  using (bucket_id = 'pm-media-draft' and (select pm.is_owner()))
  with check (bucket_id = 'pm-media-draft' and (select pm.is_owner()));
