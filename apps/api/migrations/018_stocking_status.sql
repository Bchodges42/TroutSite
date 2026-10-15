-- 018_stocking_status.sql (data-integrity lane, ADR 0012)
-- 'scheduled' (TWRA schedule row, a plan) vs 'reported' (TWRA Locations Report
-- row, a completed stocking). NULL on legacy rows means 'scheduled'.

ALTER TABLE stocking_events ADD COLUMN status TEXT;
