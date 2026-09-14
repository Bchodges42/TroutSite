-- 010_stream_authored_metadata.sql (accuracy campaign, additive).
-- Preserve authored display/provenance/season/species-evidence fields through
-- the SQLite seed and snapshot round trip. NULL means the catalog has not
-- authored that fact yet.
ALTER TABLE streams ADD COLUMN display TEXT;
ALTER TABLE streams ADD COLUMN ideal_flow_source TEXT;
ALTER TABLE streams ADD COLUMN season_months TEXT;
ALTER TABLE streams ADD COLUMN season_kind TEXT;
ALTER TABLE streams ADD COLUMN species_evidence TEXT;
