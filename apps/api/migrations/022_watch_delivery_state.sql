-- Durable feed identity prevents a future scheduled date notifying every cooldown.
-- Quiet hours use an explicit IANA zone; existing rules keep their original zone.
ALTER TABLE watch_rules ADD COLUMN last_feed_key TEXT;
ALTER TABLE watch_rules ADD COLUMN quiet_time_zone TEXT NOT NULL DEFAULT 'America/Chicago';
