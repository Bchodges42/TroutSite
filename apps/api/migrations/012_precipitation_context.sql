-- 012_precipitation_context.sql — USGS 00045 rain context (additive).
-- Values are normalized to millimetres and are never used in scoring.
ALTER TABLE gauge_readings_raw ADD COLUMN precipitation_mm REAL;
