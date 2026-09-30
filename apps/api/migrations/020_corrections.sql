-- 0020_corrections.sql — ADR 0015: user-suggested water corrections (CORR-API lane).
-- The moderation queue for POST /v1/corrections. Privacy floor (zero-PII):
-- there is NO plaintext receipt column (only the keyed HMAC in receipt_hash)
-- and NO reporter-identity columns at all — no IP, no user agent, no email.
-- The receipt code exists only in the 202 response; the DB can neither look it
-- up nor correlate it after the fact.
--
-- Statuses are the public vocabulary (ADR 0015 §4): received is the only entry
-- state; accepted | rejected | resolved are terminal (terminal_at stamped for
-- the 90-day post-terminal content-purge clock; NULL while still open).
-- risk_flags holds the high-impact category markers (access, regulations,
-- identity, species, gauge) so moderators can work high-impact first.
-- dedup_key is the normalized (waterId + category + collapsed proposed text)
-- clustering fingerprint: advisory metadata for moderators, never auto-close.

CREATE TABLE IF NOT EXISTS corrections (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_hash        BLOB NOT NULL UNIQUE,      -- HMAC-SHA256(pepper, normalized code)
  receipt_last4       TEXT NOT NULL,             -- support triage only, not a lookup key
  created_at          TEXT NOT NULL,             -- server clock, ISO-8601 (received_at)
  water_id            TEXT NOT NULL,             -- resolved against the catalog at insert
  water_name          TEXT,                      -- as reported; informational only
  category            TEXT NOT NULL CHECK (category IN (
                        'water-identity','species-or-season','stocking-association',
                        'gauge-or-source','access','regulations','other')),
  field               TEXT,
  current_value       TEXT,
  proposed_correction TEXT NOT NULL,
  what_appears_wrong  TEXT,
  source_url          TEXT,                      -- stored opaque; NEVER fetched (ADR 0015 §6)
  source_pub_date     TEXT,
  status              TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
                        'received','needs-more-evidence','accepted','rejected','resolved')),
  duplicate_of        INTEGER REFERENCES corrections(id),
  reviewer_note       TEXT,                      -- mandatory when status='rejected'
  risk_flags          TEXT NOT NULL DEFAULT '',  -- comma-joined: access,regulations,identity,species,gauge
  dedup_key           TEXT,                      -- normalized duplicate-cluster fingerprint
  terminal_at         TEXT,                      -- entered accepted|rejected|resolved
  updated_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_corrections_status_received
  ON corrections(status, created_at);
CREATE INDEX IF NOT EXISTS idx_corrections_water
  ON corrections(water_id, status);
CREATE INDEX IF NOT EXISTS idx_corrections_dedup
  ON corrections(dedup_key, status) WHERE dedup_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_corrections_terminal
  ON corrections(terminal_at) WHERE terminal_at IS NOT NULL;

-- Immutable transition history: every state change appends (actor, action,
-- from→to, note). Rows expire with the content-retention clock (purged with
-- their correction by purgeExpiredCorrections in src/corrections/service.ts).
CREATE TABLE IF NOT EXISTS corrections_audit (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  correction_id INTEGER NOT NULL REFERENCES corrections(id),
  actor         TEXT NOT NULL DEFAULT 'moderator',
  action        TEXT NOT NULL,
  from_status   TEXT,
  to_status     TEXT,
  note          TEXT,
  at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_corrections_audit_correction
  ON corrections_audit(correction_id, at);
