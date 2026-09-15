import { ShopSchema, StreamSchema } from '@trout/contracts';
import type { Db } from '../db.js';
import { readYamlFiles } from './content.js';

export interface SeedResult {
  streams: number;
  shops: number;
}

interface StreamRow {
  id: string;
  name: string;
  aliases: string;
  state_id: string;
  waterbody_type: string;
  region_id: string;
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
 */
export function seedContent(db: Db, contentDir: string): SeedResult {
  const insertStream = db.prepare(`
    INSERT INTO streams (id, name, aliases, state_id, waterbody_type, region_id, display, gauge_ids,
                         stocking_program, ideal_flow, ideal_flow_source, season_months, season_kind,
                         species_evidence, notes, official_sources, species, target_species, fishery, year_round)
    VALUES (@id, @name, @aliases, @state_id, @waterbody_type, @region_id, @display, @gauge_ids,
            @stocking_program, @ideal_flow, @ideal_flow_source, @season_months, @season_kind,
            @species_evidence, @notes, @official_sources, @species, @target_species, @fishery, @year_round)
    ON CONFLICT(id) DO UPDATE SET
      name=@name, aliases=@aliases, state_id=@state_id, waterbody_type=@waterbody_type, region_id=@region_id,
      display=@display, gauge_ids=@gauge_ids, stocking_program=@stocking_program, ideal_flow=@ideal_flow,
      ideal_flow_source=@ideal_flow_source, season_months=@season_months, season_kind=@season_kind,
      species_evidence=@species_evidence,
      notes=@notes, official_sources=@official_sources, species=@species, target_species=@target_species,
      fishery=@fishery, year_round=@year_round
  `);
  const insertShop = db.prepare(`
    INSERT INTO shops (id, name, state_id, town, website_url, reports_enabled)
    VALUES (@id, @name, @state_id, @town, @website_url, @reports_enabled)
    ON CONFLICT(id) DO UPDATE SET
      name=@name, state_id=@state_id, town=@town, website_url=@website_url,
      reports_enabled=@reports_enabled
  `);

  let streams = 0;
  let shops = 0;

  for (const file of readYamlFiles(`${contentDir}/streams`)) {
    const parsed = StreamSchema.safeParse(file.data);
    if (!parsed.success) {
      throw new Error(`Invalid stream content in ${file.path}: ${parsed.error.message}`);
    }
    const s = parsed.data;
    const row: StreamRow = {
      id: s.id,
      name: s.name,
      aliases: JSON.stringify(s.aliases ?? []),
      state_id: s.stateId,
      waterbody_type: s.waterbodyType,
      region_id: s.regionId,
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
    };
    insertStream.run(row);
    streams += 1;
  }

  for (const file of readYamlFiles(`${contentDir}/shops`)) {
    const parsed = ShopSchema.safeParse(file.data);
    if (!parsed.success) {
      throw new Error(`Invalid shop content in ${file.path}: ${parsed.error.message}`);
    }
    const sh = parsed.data;
    const row: ShopRow = {
      id: sh.id,
      name: sh.name,
      state_id: sh.stateId,
      town: sh.town,
      website_url: sh.websiteUrl,
      reports_enabled: sh.reportsEnabled ? 1 : 0,
    };
    insertShop.run(row);
    shops += 1;
  }

  const started = new Date().toISOString();
  db.prepare(
    'INSERT INTO jobs_log (job, status, started_at, finished_at, detail) VALUES (?, ?, ?, ?, ?)',
  ).run('seed', 'ok', started, started, `streams=${streams} shops=${shops}`);

  return { streams, shops };
}
