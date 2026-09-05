-- 006_streams_waterbody_types.sql (conditions-integration follow-up)
-- Legacy production databases were created by an EARLIER revision of 001_init.sql
-- whose waterbody_type CHECK allowed only ('river','creek','tailrace','spring').
-- The West Tennessee put-and-take ponds and the B15 reference waterbodies seeded
-- since then use 'lake' and 'pond' (the current 001 CHECK and the frozen
-- WaterbodyTypeSchema enum both allow exactly these six types), so seeding the
-- current content pack into a legacy database fails the CHECK and the snapshots
-- job keeps rewriting the old 92-water catalog.
--
-- SQLite cannot ALTER a CHECK constraint, so the table is rebuilt in place.
-- Every column — including `species` added by 004 — is preserved row for row;
-- the column list is explicit so the copy cannot drift with future ALTERs.
-- On databases created by the current 001 this rebuild is a no-op reshape.

ALTER TABLE streams RENAME TO streams_legacy_006;

CREATE TABLE streams (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  state_id          TEXT NOT NULL,
  waterbody_type    TEXT NOT NULL CHECK (waterbody_type IN ('river','creek','tailrace','spring','lake','pond')),
  region_id         TEXT NOT NULL,
  gauge_ids         TEXT NOT NULL DEFAULT '[]',  -- JSON array of USGS gauge ids
  stocking_program  INTEGER NOT NULL DEFAULT 0,
  ideal_flow        TEXT NOT NULL DEFAULT '[]',  -- JSON array of {min,max,unit}
  notes             TEXT,
  official_sources  TEXT NOT NULL DEFAULT '[]',  -- JSON array of {label,url}
  species           TEXT                          -- 'trout' | 'warmwater' | NULL (unset)
);

INSERT INTO streams (id, name, state_id, waterbody_type, region_id, gauge_ids,
                     stocking_program, ideal_flow, notes, official_sources, species)
SELECT id, name, state_id, waterbody_type, region_id, gauge_ids,
       stocking_program, ideal_flow, notes, official_sources, species
FROM streams_legacy_006;

DROP TABLE streams_legacy_006;
