-- 0004_anon_index_allowed.sql: the build reads a live project's own "Let search engines index it"
-- switch, so `noindex` and the sitemap can honour it (06 · SEO). It's the page's SEO setting, not
-- private; RLS still returns live, public rows only.
grant select (index_allowed) on pm.projects to anon;
