-- 0003_migration_checksums.sql: db:migrate records each file's SHA-256 and refuses to run when an
-- applied file has changed since; a change always goes in a new migration. Files applied before
-- this one get their checksum on the same run, from the files as they are.
alter table pm.schema_migrations add column checksum text check (checksum ~ '^[0-9a-f]{64}$');
