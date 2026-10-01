-- 021_watchlists.sql — ADR 0016: angler watchlist alerts (ALERTS lane).
-- The one deliberate server-side exception to local-first: a pseudonymous
-- subscription + narrow watch rules, so the evaluation cron can send web-push
-- notices when a watched water's conditions cross a threshold or a new
-- stocking event / shop report lands.
--
-- Privacy floor (mirrors 020's zero-PII discipline):
--   * `subscription_id` is RANDOM (CSPRNG base64url) — never derived from the
--     push endpoint, never from any device or account property. Knowing the id
--     IS the credential (documented tradeoff, ADR 0016 §4).
--   * The push endpoint is stored only as `endpoint` (needed to deliver) plus
--     `endpoint_hash` (SHA-256) for upsert/dedup, so no query path correlates
--     subscriptions by raw endpoint.
--   * NO IP, NO location, NO logbook columns anywhere. `user_agent` is the one
--     diagnostic string the client volunteered; it is never logged.
--   * `push_notices` is deliberately NOT a table — delivery records live in an
--     in-memory ring (StubNotifier) or nowhere. The DB keeps only each rule's
--     own last_notified_at, the minimum state hysteresis needs (arm_state).
--
-- Retention: the cron prunes subscriptions whose last_seen_at is older than
-- SUBSCRIPTION_STALE_DAYS (180) — an inactive watchlist forgets itself.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id TEXT NOT NULL UNIQUE,       -- random CSPRNG id (the credential)
  endpoint        TEXT NOT NULL,              -- push-service URL; needed to deliver
  endpoint_hash   BLOB NOT NULL UNIQUE,       -- SHA-256(endpoint); upsert key, never logged
  p256dh          TEXT NOT NULL,              -- WebPush client public key
  auth            TEXT NOT NULL,              -- WebPush auth secret
  user_agent      TEXT,                       -- client-supplied diagnostic string
  created_at      TEXT NOT NULL,              -- server clock, ISO-8601
  last_seen_at    TEXT NOT NULL               -- bumped on subscribe + rule CRUD; drives retention
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_seen
  ON push_subscriptions(last_seen_at);

CREATE TABLE IF NOT EXISTS watch_rules (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id   TEXT NOT NULL REFERENCES push_subscriptions(subscription_id) ON DELETE CASCADE,
  water_id          TEXT NOT NULL,            -- catalog id; resolved against streams at insert
  kind              TEXT NOT NULL CHECK (kind IN ('condition','stocking','report')),
  metric            TEXT CHECK (metric IN ('tempC','cfs')),  -- condition rules only; NULL otherwise
  threshold_op      TEXT CHECK (threshold_op IN ('above','below')), -- condition rules only
  threshold         REAL,                     -- condition rules only
  -- Meaningful-transition memory: the last decisive side of the threshold
  -- ('above'|'below') after hysteresis, NULL until a first decisive reading.
  -- NULL → the next reading ARMS the rule without firing (no baseline, no
  -- spurious first-run notice after a deploy).
  arm_state         TEXT CHECK (arm_state IN ('above','below')),
  cooldown_minutes  INTEGER NOT NULL DEFAULT 240,
  quiet_hours_start TEXT,                     -- local HH:MM at the water (America/Chicago), nullable
  quiet_hours_end   TEXT,                     -- paired with start: both set or both NULL
  hysteresis        REAL NOT NULL DEFAULT 0,  -- dead band around threshold, both directions
  created_at        TEXT NOT NULL,
  last_notified_at  TEXT                      -- server clock of the last fired notice (cooldown clock)
);

CREATE INDEX IF NOT EXISTS idx_watch_rules_subscription
  ON watch_rules(subscription_id, created_at);
CREATE INDEX IF NOT EXISTS idx_watch_rules_water
  ON watch_rules(water_id, kind);
