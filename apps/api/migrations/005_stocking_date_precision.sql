-- 005_stocking_date_precision.sql (ROLE 3, additive compatibility migration)
-- Older production databases were created before stocking_events.date_precision
-- was present in the initial schema. Keep the field in its own migration so both
-- fresh databases and those legacy databases converge on the same schema.

ALTER TABLE stocking_events ADD COLUMN date_precision TEXT;
