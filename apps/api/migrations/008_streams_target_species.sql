-- 008_streams_target_species.sql (F5 fishability pipeline, contract v2 / ADR 0007)
-- The F1 contract added optional `targetSpecies` (contract game-species keys) to
-- the Stream schema — F3 catalog authoring fills it from TWRA evidence. This
-- brings the API's streams table in line so seeded data survives the
-- DB → snapshot round trip. NULL = not cataloged (honestly unscored; the
-- fishability emitter emits nothing for these waters). JSON array of species keys.

ALTER TABLE streams ADD COLUMN target_species TEXT;
