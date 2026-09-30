-- 019_stream_shop_archival.sql — F22 (2026-09-29 audit): authored-removal policy.
-- Removing a water/shop YAML now ARCHIVES its row (archived_at stamped by the
-- seeder) instead of leaving it active forever. Archival — not deletion — is
-- the removal policy: shop_reports reference streams by id and shops by
-- foreign key, so historical report rows keep a real, coherent row to point
-- at (and the portal still accepts ids for archived waters, whose history
-- stays queryable). The snapshot builder publishes only archived_at IS NULL
-- rows, so removed waters/shops leave the published catalog on the next
-- build. NULL = active. Additive: every existing row stays active.
ALTER TABLE streams ADD COLUMN archived_at TEXT;
ALTER TABLE shops ADD COLUMN archived_at TEXT;
