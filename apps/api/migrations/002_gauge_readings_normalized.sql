-- 002_gauge_readings_normalized.sql (ROLE 3, additive — documented in docs/ASSUMPTIONS.md)
-- Adds normalized columns alongside the raw USGS payload so "latest per gauge" is an
-- indexed lookup instead of re-parsing payloads at snapshot time. The payload column
-- remains the audit trail exactly as created by 001_init.sql.

ALTER TABLE gauge_readings_raw ADD COLUMN cfs REAL;
ALTER TABLE gauge_readings_raw ADD COLUMN height_ft REAL;
ALTER TABLE gauge_readings_raw ADD COLUMN temp_c REAL;
-- Dissolved oxygen (mg/L) is retained as a constraint/context metric only.
ALTER TABLE gauge_readings_raw ADD COLUMN dissolved_oxygen_mg_l REAL;
-- TVA reservoir pool elevation, retained for lake context and never scored as flow/stage.
ALTER TABLE gauge_readings_raw ADD COLUMN reservoir_level_ft REAL;
-- Timestamp of the observation itself (USGS dateTime), distinct from fetched_at.
ALTER TABLE gauge_readings_raw ADD COLUMN observed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_gauge_observed ON gauge_readings_raw(gauge_id, observed_at);
