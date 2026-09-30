-- 018_report_idempotency_key.sql (F02 remediation, 2026-09-29 senior code audit; additive)
-- Optional client-supplied idempotency key for POST /v1/portal/reports
-- (Idempotency-Key header). NULL for reports published without one (all
-- pre-existing rows). The partial UNIQUE index makes a retry of the same
-- accepted report replay instead of double-inserting; scoping by shop_id keeps
-- keys independent per shop.

ALTER TABLE shop_reports ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS shop_reports_idempotency_key_unique
  ON shop_reports(shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
