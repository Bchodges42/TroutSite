-- 014_dissolved_oxygen_reservoir_level.sql (accuracy campaign follow-up, additive).
-- These columns were briefly edited into 002 in place; existing databases had
-- already applied 002, so the columns never appeared. New databases get them here
-- (002 no longer creates them); pre-campaign databases get them from this file.
ALTER TABLE gauge_readings_raw ADD COLUMN dissolved_oxygen_mg_l REAL;
ALTER TABLE gauge_readings_raw ADD COLUMN reservoir_level_ft REAL;
