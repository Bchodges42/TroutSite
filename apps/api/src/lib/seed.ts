import { ShopSchema, StreamSchema } from '@trout/contracts';
import type { Shop, Stream } from '@trout/contracts';
import type { Db } from '../db.js';
import { readYamlFiles } from './content.js';

export interface SeedResult {
  /** Authored rows applied (upserted) from the content pack this run. */
  streams: number;
  shops: number;
  /** Previously seeded rows whose YAML disappeared since the last seed (F22):
   *  kept in the table but stamped archived_at — see the removal policy below. */
  streamsArchived: number;
  shopsArchived: number;
}

interface StreamRow {
  id: string;
  name: string;
  aliases: string;
  state_id: string;
  waterbody_type: string;
  region_id: string;
  hydro_identity: string | null;
  display: string | null;
  gauge_ids: string;
  stocking_program: number;
  ideal_flow: string;
  ideal_flow_source: string | null;
  season_months: string | null;
  season_kind: string | null;
  species_evidence: string | null;
  notes: string | null;
  official_sources: string;
  species: string | null;
  target_species: string | null;
  fishery: string | null;
  year_round: number | null;
  opportunity: string | null;
}

interface ShopRow {
  id: string;
  name: string;
  state_id: string;
  town: string;
  website_url: string;
  reports_enabled: number;
}

/**
 * Seed streams + shops from packages/content YAML (00-SHARED-CONTEXT §7 layout).
 * MUST succeed when the content pack is still empty (Phase 0) — it then seeds nothing.
 * Invalid YAML or contract violations throw; the CLI turns that into a non-zero exit.
 *
 * F22 (2026-09-29 audit) — seeding is validate-all-then-apply and synchronizes
 * catalog membership:
 *
 *   1. EVERY stream and shop file is parsed + schema-validated BEFORE the
 *      database is touched. A failed seed used to leave earlier valid rows
 *      applied behind a failed job result; now it changes nothing.
 *   2. The whole run applies in ONE transaction: upserts for every authored
 *      row, plus a soft-archive for every previously seeded row whose YAML is
 *      gone (removals propagate — the audit repro: two waters seeded, one YAML
 *      deleted, reseed left two persisted streams behind a one-stream result).
 *
 * Removal policy (archival, not deletion): a row that disappears from the
 * authored content gets archived_at = seed time. shop_reports reference
 * streams by id and shops by foreign key, so report/token history must keep a
 * real, coherent row to point at — and the portal still accepts report ids
 * for archived waters, whose history stays queryable. The published catalog
 * is the snapshot builder, which selects only archived_at IS NULL rows, so
 * removed waters/shops leave the API surface on the next build while their
 * history remains intact. A row whose YAML returns is reactivated by its
 * upsert (archived_at cleared).
 */
export function seedContent(db: Db, contentDir: string): SeedResult {
  // Phase 1 — validate every input file; any violation throws before the
  // database is opened for writing.
  const streamRows: StreamRow[] = [];
  for (const file of readYamlFiles(`${contentDir}/streams`)) {
    const parsed = StreamSchema.safeParse(file.data);
    if (!parsed.success) {
      throw new Error(`Invalid stream content in ${file.path}: ${parsed.error.message}`);
    }
    streamRows.push(toStreamRow(parsed.data));
  }
  const shopRows: ShopRow[] = [];
  for (const file of readYamlFiles(`${contentDir}/shops`)) {
    const parsed = ShopSchema.safeParse(file.data);
    if (!parsed.success) {
      throw new Error(`Invalid shop content in ${file.path}: ${parsed.error.message}`);
    }
    shopRows.push(toShopRow(parsed.data));
  }

  // Phase 2 — apply membership synchronously in one transaction: upsert the
  // authored rows (clearing a stale archive stamp = reactivation), then
  // archive every previously seeded row the authored set no longer names.
  const archivedAt = new Date().toISOString();
  let streamsArchived = 0;
  let shopsArchived = 0;
  db.transaction(() => {
    const insertStream = db.prepare(`
      INSERT INTO streams (id, name, aliases, state_id, waterbody_type, region_id, display, gauge_ids,
                           hydro_identity, stocking_program, ideal_flow, ideal_flow_source, season_months, season_kind,
                           species_evidence, notes, official_sources, species, target_species, fishery, year_round, opportunity)
      VALUES (@id, @name, @aliases, @state_id, @waterbody_type, @region_id, @display, @gauge_ids,
              @hydro_identity, @stocking_program, @ideal_flow, @ideal_flow_source, @season_months, @season_kind,
              @species_evidence, @notes, @official_sources, @species, @target_species, @fishery, @year_round, @opportunity)
      ON CONFLICT(id) DO UPDATE SET
        name=@name, aliases=@aliases, state_id=@state_id, waterbody_type=@waterbody_type, region_id=@region_id,
        display=@display, gauge_ids=@gauge_ids, hydro_identity=@hydro_identity, stocking_program=@stocking_program, ideal_flow=@ideal_flow,
        ideal_flow_source=@ideal_flow_source, season_months=@season_months, season_kind=@season_kind,
        species_evidence=@species_evidence,
        notes=@notes, official_sources=@official_sources, species=@species, target_species=@target_species,
        fishery=@fishery, year_round=@year_round, opportunity=@opportunity,
        archived_at=NULL
    `);
    const insertShop = db.prepare(`
      INSERT INTO shops (id, name, state_id, town, website_url, reports_enabled)
      VALUES (@id, @name, @state_id, @town, @website_url, @reports_enabled)
      ON CONFLICT(id) DO UPDATE SET
        name=@name, state_id=@state_id, town=@town, website_url=@website_url,
        reports_enabled=@reports_enabled,
        archived_at=NULL
    `);
    for (const row of streamRows) insertStream.run(row);
    for (const row of shopRows) insertShop.run(row);

    streamsArchived = archiveMissing(db, 'streams', streamRows.map((r) => r.id), archivedAt);
    shopsArchived = archiveMissing(db, 'shops', shopRows.map((r) => r.id), archivedAt);
  })();

  const started = new Date().toISOString();
  db.prepare(
    'INSERT INTO jobs_log (job, status, started_at, finished_at, detail) VALUES (?, ?, ?, ?, ?)',
  ).run('seed', 'ok', started, started, `streams=${streamRows.length} shops=${shopRows.length} archived=${streamsArchived + shopsArchived}`);

  return {
    streams: streamRows.length,
    shops: shopRows.length,
    streamsArchived,
    shopsArchived,
  };
}

/**
 * Stamp archived_at on rows of `table` that the authored set no longer names
 * (F22 removal policy — see seedContent). Rows already archived keep their
 * original stamp. Returns how many rows were newly archived.
 */
function archiveMissing(db: Db, table: 'streams' | 'shops', authoredIds: string[], archivedAt: string): number {
  const placeholders = authoredIds.map(() => '?').join(', ');
  const filter = authoredIds.length > 0 ? ` AND id NOT IN (${placeholders})` : '';
  const result = db
    .prepare(`UPDATE ${table} SET archived_at = ? WHERE archived_at IS NULL${filter}`)
    .run(...(authoredIds.length > 0 ? [archivedAt, ...authoredIds] : [archivedAt]));
  return Number(result.changes);
}

function toStreamRow(s: Stream): StreamRow {
  return {
    id: s.id,
    name: s.name,
    aliases: JSON.stringify(s.aliases ?? []),
    state_id: s.stateId,
    waterbody_type: s.waterbodyType,
    region_id: s.regionId,
    hydro_identity: s.hydroIdentity ? JSON.stringify(s.hydroIdentity) : null,
    display: s.display ?? null,
    gauge_ids: JSON.stringify(s.gaugeIds),
    stocking_program: s.stockingProgram ? 1 : 0,
    ideal_flow: JSON.stringify(s.idealFlow),
    ideal_flow_source: s.idealFlowSource ?? null,
    season_months: s.seasonMonths ? JSON.stringify(s.seasonMonths) : null,
    season_kind: s.seasonKind ?? null,
    species_evidence: s.speciesEvidence ? JSON.stringify(s.speciesEvidence) : null,
    notes: s.notes ?? null,
    official_sources: JSON.stringify(s.officialSources),
    species: s.species ?? null,
    target_species: s.targetSpecies ? JSON.stringify(s.targetSpecies) : null,
    fishery: s.fishery ?? null,
    year_round: s.yearRound == null ? null : s.yearRound ? 1 : 0,
    opportunity: s.opportunity ? JSON.stringify(s.opportunity) : null,
  };
}

function toShopRow(sh: Shop): ShopRow {
  return {
    id: sh.id,
    name: sh.name,
    state_id: sh.stateId,
    town: sh.town,
    website_url: sh.websiteUrl,
    reports_enabled: sh.reportsEnabled ? 1 : 0,
  };
}
