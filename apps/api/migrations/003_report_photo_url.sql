-- 003_report_photo_url.sql (ROLE 6, additive — ADR 0002 / contracts-v1.0.1)
-- Optional https photo URL on shop reports, supplied through the portal composer and
-- passed through to the public feed. NULL = no photo (all pre-existing rows).

ALTER TABLE shop_reports ADD COLUMN photo_url TEXT;
