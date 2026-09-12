-- 009_region_pressure.sql (F8 — NWS barometric pressure, area-level).
-- One row per catalog REGION: pressure is an AREA signal from a representative
-- NWS ASOS station (infra: apps/api/src/evidence/nws-provider.ts) — never
-- per-water, and the browser never calls NWS (privacy spec). observed_at is
-- NWS's own observation timestamp; retrieved_at is when WE fetched; the pair
-- is never interchangeable (evidence-lane discipline). trend_hpa_3h is the
-- derived ~3 h change (null when history does not reach the window);
-- trend_direction is 'rising' | 'falling' | 'stable'.

CREATE TABLE IF NOT EXISTS region_pressure (
  region_id TEXT PRIMARY KEY,
  observed_at TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  pressure_hpa REAL NOT NULL,
  trend_hpa_3h REAL,
  trend_direction TEXT NOT NULL,
  station TEXT NOT NULL
);
