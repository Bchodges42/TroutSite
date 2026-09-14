-- 011_release_schedules.sql — additive TVA release/forecast snapshot source.
CREATE TABLE IF NOT EXISTS release_schedules (
  water_id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_release_schedules_retrieved ON release_schedules(retrieved_at);
