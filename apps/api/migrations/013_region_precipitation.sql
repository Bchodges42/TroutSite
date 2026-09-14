-- 013_region_precipitation.sql — NWS rolling three-hour rain fallback.
-- Region-level measured context only; never a score factor.
CREATE TABLE IF NOT EXISTS region_precipitation (
  region_id TEXT PRIMARY KEY,
  observed_at TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  precipitation_mm REAL NOT NULL CHECK (precipitation_mm >= 0),
  station TEXT NOT NULL
);
