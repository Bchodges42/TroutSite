-- 004_stream_species.sql (B08 follow-up — species applicability on catalog streams)
-- The SPECIES lane added optional `species` ('trout' | 'warmwater') to the Stream
-- contract and the content pack; this brings the API's streams table in line so
-- seeded catalog data survives the DB → snapshot round trip. NULL = unset
-- (thin-evidence waters stay honestly unclassified).

ALTER TABLE streams ADD COLUMN species TEXT;
