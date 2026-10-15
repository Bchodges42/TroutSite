-- Preserve verified county identity for ponds that have no line-water GNIS/HUC trace.
ALTER TABLE streams ADD COLUMN counties TEXT;
