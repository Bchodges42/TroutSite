-- 004_evidence_runs.sql (data-sources lane, additive)
-- Stores the assembled per-water WaterEvidence payload produced by the evidence job.
-- The newest row is what the snapshot builder emits to /v1/evidence/waters.json
-- (contract-validated WaterEvidence[]); the payload column is also the audit trail.
-- A failing evidence run simply leaves the previous payload in place — never deleted,
-- never merged with live guesses.

CREATE TABLE IF NOT EXISTS evidence_runs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  retrieved_at  TEXT NOT NULL,              -- assembly time (WaterEvidence.retrievedAt)
  payload       TEXT NOT NULL,              -- JSON WaterEvidenceSet
  summary       TEXT                        -- JSON {waters, observations, errors}
);

CREATE INDEX IF NOT EXISTS idx_evidence_runs_retrieved ON evidence_runs(retrieved_at);
