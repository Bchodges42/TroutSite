-- Stable GNIS/HUC identity for selectable line waters. JSON keeps the API's
-- contract shape intact while allowing older databases to migrate in place.
ALTER TABLE streams ADD COLUMN hydro_identity TEXT;
