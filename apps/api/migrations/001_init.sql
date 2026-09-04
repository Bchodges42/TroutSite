-- 001_init.sql — initial schema (ROLE 1 foundation; ROLE 3 owns later additive migrations).
-- Add new migrations as 00N_*.sql; the runner applies them in filename order once each.

CREATE TABLE IF NOT EXISTS streams (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  state_id          TEXT NOT NULL,
  waterbody_type    TEXT NOT NULL CHECK (waterbody_type IN ('river','creek','tailrace','spring','lake','pond')),
  region_id         TEXT NOT NULL,
  gauge_ids         TEXT NOT NULL DEFAULT '[]',  -- JSON array of USGS gauge ids
  stocking_program  INTEGER NOT NULL DEFAULT 0,
  ideal_flow        TEXT NOT NULL DEFAULT '[]',  -- JSON array of {min,max,unit}
  notes             TEXT,
  official_sources  TEXT NOT NULL DEFAULT '[]'   -- JSON array of {label,url}
);

CREATE TABLE IF NOT EXISTS shops (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  state_id         TEXT NOT NULL,
  town             TEXT NOT NULL,
  website_url      TEXT NOT NULL,
  reports_enabled  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shop_reports (
  id               TEXT PRIMARY KEY,
  shop_id          TEXT NOT NULL REFERENCES shops(id),
  stream_id        TEXT,
  date             TEXT NOT NULL,
  body             TEXT NOT NULL,
  hot_patterns     TEXT NOT NULL DEFAULT '[]', -- JSON array of {patternId,hookSize?}
  attribution_url  TEXT NOT NULL,
  published_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gauge_readings_raw (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  gauge_id    TEXT NOT NULL,
  fetched_at  TEXT NOT NULL,
  payload     TEXT NOT NULL              -- raw USGS JSON snapshot (audit trail)
);

CREATE TABLE IF NOT EXISTS stocking_events (
  id             TEXT PRIMARY KEY,
  state_id       TEXT NOT NULL,
  stream_name    TEXT NOT NULL,
  county         TEXT,
  species        TEXT NOT NULL CHECK (species IN ('rainbow','brown','cutbow','brook','other')),
  count          INTEGER,
  date           TEXT NOT NULL,
  date_precision TEXT,
  source_url     TEXT NOT NULL,
  fetched_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  job          TEXT NOT NULL,
  status       TEXT NOT NULL,
  started_at   TEXT NOT NULL,
  finished_at  TEXT,
  detail       TEXT
);

CREATE INDEX IF NOT EXISTS idx_streams_state ON streams(state_id);
CREATE INDEX IF NOT EXISTS idx_gauge_readings_gauge ON gauge_readings_raw(gauge_id, fetched_at);
CREATE INDEX IF NOT EXISTS idx_stocking_state_date ON stocking_events(state_id, date);
CREATE INDEX IF NOT EXISTS idx_reports_published ON shop_reports(published_at);
