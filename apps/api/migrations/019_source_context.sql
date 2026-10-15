-- ADR 0013: explicit primary/reference gauges and separately stored historical context.
ALTER TABLE streams ADD COLUMN gauge_policy TEXT;
CREATE TABLE flow_normals (
  gauge_id TEXT NOT NULL,
  month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
  payload TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  PRIMARY KEY (gauge_id, month)
);
