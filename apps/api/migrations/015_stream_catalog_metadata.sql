-- Preserve optional first-class catalog metadata through the SQLite seed and
-- snapshot round trip. Aliases power search/source matching; fishery and
-- year_round already exist in the public Stream contract.
ALTER TABLE streams ADD COLUMN aliases TEXT NOT NULL DEFAULT '[]';
ALTER TABLE streams ADD COLUMN fishery TEXT;
ALTER TABLE streams ADD COLUMN year_round INTEGER;
