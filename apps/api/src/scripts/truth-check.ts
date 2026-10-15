// Data truth check CLI (audit 2026-10-14 guardrail):
//   pnpm --filter api truth-check [--json]
// Reads the PUBLISHED snapshot files (TROUT_SNAPSHOTS_DIR) and compares them with
// the upstream sources right now: USGS latest-continuous for every published
// USGS gauge, TVA generation-releases for every published schedule, and a fresh
// parse of TWRA's stocking page. Read-only: writes nothing, touches no DB.
// Exit 0 = published data agrees with the sources; 1 = mismatch/stale/unparsed
// findings (infra/truth-check.sh pages); 3 = a source could not be reached.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { ConditionSnapshotSchema, ReleaseScheduleSchema, StockingEventSchema } from '@trout/contracts';
import { loadEnv } from '../env.js';
import { pipelineConfig } from '../pipeline.js';
import { TVA_BROWSER_UA } from '../evidence/conditionsBridge.js';
import { fetchWaterDataReadings } from '../ingest/usgs-waterdata.js';
import { scheduleYearFromPage, tnAdapter } from '../ingest/stocking/tn.js';
import { compareTvaSchedule, compareTwraStocking, compareUsgsReadings, type TruthFinding } from '../truth/truthCheck.js';

const argv = process.argv.slice(2).filter((a) => a !== '--');
const { values } = parseArgs({ args: argv, options: { json: { type: 'boolean', default: false } }, strict: true });

const env = loadEnv();
const cfg = pipelineConfig(env);
const v1 = join(cfg.snapshotsDir, 'v1');
const now = new Date();
const findings: TruthFinding[] = [];
const unreachable: string[] = [];
const checks: Record<string, number> = {};

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// ── USGS ────────────────────────────────────────────────────────────────────
const conditionsPath = join(v1, 'conditions', 'latest.json');
if (existsSync(conditionsPath)) {
  const snapshots = ConditionSnapshotSchema.array().parse(readJson(conditionsPath));
  const ids = [...new Set(snapshots.flatMap((s) => s.readings.map((r) => r.gaugeId)).filter((id) => /^\d+$/.test(id)))];
  try {
    const upstream = await fetchWaterDataReadings(ids, {
      userAgent: cfg.userAgent,
      ...(cfg.usgsWaterDataApiKey ? { apiKey: cfg.usgsWaterDataApiKey } : {}),
    });
    const usgs = compareUsgsReadings(snapshots, upstream.readings);
    checks.usgsGauges = usgs.checked;
    findings.push(...usgs.findings);
  } catch (err) {
    unreachable.push(`USGS: ${(err as Error).message}`);
  }
}

// ── TVA ─────────────────────────────────────────────────────────────────────
const releaseDir = join(v1, 'release-schedule');
if (existsSync(releaseDir)) {
  checks.tvaSchedules = 0;
  for (const file of readdirSync(releaseDir).filter((f) => f.endsWith('.json'))) {
    const published = ReleaseScheduleSchema.parse(readJson(join(releaseDir, file)));
    try {
      const res = await fetch(`https://www.tva.com/RestApi/generation-releases/${encodeURIComponent(published.locationId)}`, {
        headers: { 'User-Agent': TVA_BROWSER_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      findings.push(...compareTvaSchedule(published, await res.json(), now));
      checks.tvaSchedules += 1;
    } catch (err) {
      unreachable.push(`TVA ${published.locationId}: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 300)); // Cloudflare politeness gap
  }
}

// ── TWRA ────────────────────────────────────────────────────────────────────
const stockingPath = join(v1, 'stocking', 'TN.json');
if (existsSync(stockingPath)) {
  const published = StockingEventSchema.array().parse(readJson(stockingPath));
  try {
    const raw = await tnAdapter.fetchLatest({ fetchImpl: fetch, userAgent: cfg.userAgent, rawDir: '', now });
    const fresh = tnAdapter.normalize(raw, { now });
    const page = raw.artifacts.find((a) => a.suffix === 'html')?.content;
    findings.push(...compareTwraStocking(published, fresh.events, now, scheduleYearFromPage(page) ?? now.getUTCFullYear()));
    checks.twraEvents = published.length;
  } catch (err) {
    unreachable.push(`TWRA: ${(err as Error).message}`);
  }
}

const report = { checkedAt: now.toISOString(), checks, findings, unreachable, ok: findings.length === 0 };
if (values.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`[truth-check] ${now.toISOString()} checks=${JSON.stringify(checks)}`);
  for (const f of findings) console.log(`[truth-check] ${f.kind.toUpperCase()} ${f.source} ${f.subject}: ${f.detail}`);
  for (const u of unreachable) console.log(`[truth-check] UNREACHABLE ${u}`);
  console.log(`[truth-check] ${findings.length === 0 ? 'OK — published data agrees with the sources' : `${findings.length} finding(s)`}`);
}
process.exit(findings.length > 0 ? 1 : unreachable.length > 0 ? 3 : 0);
