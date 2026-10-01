-- Add a separately selected source-availability watch without rewriting old rules.
CREATE TABLE watch_rules_next (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id TEXT NOT NULL REFERENCES push_subscriptions(subscription_id) ON DELETE CASCADE,
  water_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('condition','stocking','report','source-outage')),
  metric TEXT CHECK (metric IN ('tempC','cfs')),
  threshold_op TEXT CHECK (threshold_op IN ('above','below')),
  threshold REAL,
  arm_state TEXT CHECK (arm_state IN ('above','below')),
  cooldown_minutes INTEGER NOT NULL DEFAULT 240,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  hysteresis REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_notified_at TEXT,
  last_feed_key TEXT,
  quiet_time_zone TEXT NOT NULL DEFAULT 'America/Chicago'
);
INSERT INTO watch_rules_next SELECT * FROM watch_rules;
INSERT INTO sqlite_sequence (name, seq)
  SELECT 'watch_rules_next', seq FROM sqlite_sequence WHERE name = 'watch_rules'
    AND NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'watch_rules_next');
UPDATE sqlite_sequence SET seq = MAX(seq, COALESCE((SELECT seq FROM sqlite_sequence WHERE name = 'watch_rules'), 0))
  WHERE name = 'watch_rules_next';
DROP TABLE watch_rules;
ALTER TABLE watch_rules_next RENAME TO watch_rules;
CREATE INDEX idx_watch_rules_subscription ON watch_rules(subscription_id, created_at);
CREATE INDEX idx_watch_rules_water ON watch_rules(water_id, kind);
