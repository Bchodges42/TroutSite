# Implementation Guide — Remaining Trout Map Changes

_Audited and authored 2026-09-03. Every fact, file path, code block, and expected
output below was verified against the working tree at the time of writing. The
places-generator code in Task 3 was executed against the real Census data and its
output validated (71 places, 6 city / 65 town, all names matched, every point
provably inside its own polygon)._

You are implementing the remaining changes from the map-first remediation. Work
through the tasks **in order**. Do not skip acceptance checks. If any acceptance
check fails, **stop and report** — do not improvise a workaround.

---

## 0. Ground rules (read first — violating any of these fails the task)

**Repository:** `C:\Users\Benjamin\Projects\trout`. Branch `main`, up to date with
`origin/main`. The working tree contains **uncommitted remediation work from a
previous session — never reset, checkout, stash, or discard anything.** Only make
the edits described in this guide.

**Environment:** Windows, Git Bash shell. `pnpm@9.15.9`, Node ≥ 20. Run every
command from the repository root (`cd /c/Users/Benjamin/Projects/trout`) unless a
task says otherwise. `unzip` is available at `/usr/bin/unzip`.

**Values that must never change** (they are asserted by tests and screenshots):

- East Fork Stones River: score **37 · Poor · Running low**, flow **19.3 cfs**,
  ideal range **50–400 cfs**, temperature **unavailable**, real timestamps.
- `apps/web/public/atlas/rivers.geojson` — **never edit this file by hand and
  never re-run `merge-rivers.mjs`** (it needs the full 190 MB `.atlas-src/` cache
  and is not part of these tasks). After every task, `git diff --stat` must show
  **no change** to `rivers.geojson`.
- Condition fixtures under `apps/web/fixtures/data/v1/` — do not touch.

**Privacy rules (product principle):** no third-party runtime requests, no
telemetry, no remote map tiles/fonts/glyphs/sprites. The one exception in this
guide: `fetch-atlas-sources.mjs` downloads **build-time** data from official
Census/USGS URLs into a git-ignored cache. That is a data pipeline, not app
runtime traffic — it is allowed and already established.

**Do not** redesign the admin portal or the marketing site. Do not commit or push
anything — Task 10 is **gated on the user explicitly asking**.

**Checklist you will see repeated:** after each task run
`git status --short` and confirm the only changes are the ones that task
describes.

---

## Task overview

| # | Task | Files | Risk | Time |
|---|------|-------|------|------|
| 1 | Fix stale white-oak/91-92 claims in atlas docs | `docs/atlas-sources.md` | trivial | 5 min |
| 2 | Fix context-source URLs + extraction stems in fetcher | `apps/web/scripts/fetch-atlas-sources.mjs` | low | 10 min |
| 3 | Add checked-in context/places generator (the big one) | new `apps/web/scripts/build-atlas-context-sources.mjs` + docs | medium | 45 min |
| 4 | Replace retired synthetic generator with a clean stub | `apps/web/scripts/build-atlas.mjs` | trivial | 5 min |
| 5 | Expose map readiness flags for tests | `apps/web/src/features/map/TennesseeMap.tsx` | low | 15 min |
| 6 | Fix "Live · now" badge wrapping | `apps/web/src/features/map/RiverMapPage.tsx` | trivial | 5 min |
| 6b | Render wide-water polygons as water, not lines | `apps/web/src/features/map/mapStyle.ts`, `apps/web/src/features/map/TennesseeMap.tsx` | medium | 30 min |
| 6c | Fullscreen map shell — one hamburger drawer everywhere | `apps/web/src/components/layout/AppShell.tsx`, `RiverMapPage.tsx`, `index.css`, E2E specs | medium | 60 min |
| 6d | Legend as a bottom-left map control | `RiverMapPage.tsx` (+`MapLegend.tsx` wrapper only) | low | 15 min |
| 6e | Basemap switcher — Paper / Ink night / Topo (local only) | `mapStyle.ts`, `mapTokens.ts`, `TennesseeMap.tsx`, `RiverMapPage.tsx`, `vite.shared.ts`, `index.css` | high | Phase A 60 min · Phase B (Topo data) separate |
| 6f | No-data honesty fix ("0 · Poor" contradiction) | `riverMapSelectors.ts` | low | 10 min |
| 7 | Harden atlas E2E + add 1440×900 viewport | `e2e/web/atlas-verify.spec.ts` | low | 20 min |
| 8 | Serialize Playwright workers + canonical web command | `e2e/playwright.config.ts`, root `package.json` | low | 10 min |
| 9 | Full verification pass | — | — | 15 min |
| 10 | Commit (GATED — only if the user asks) | — | — | 10 min |

---

## Session plan — how to split this work

The tasks above are grouped into **six sessions across three waves**. Wave 1's
three lanes touch pairwise-disjoint files, so they run concurrently; Waves 2–3
are sequential because the sessions in them share the build pipeline
(`apps/web/dist`, the preview server, pm2). Every session ships **complete**
work — nothing lands dormant or "wired later." Each session has its own brief
with scope, boundaries, subagent (glm-5.3-flash) delegation guidance, and a
pass/fail gate: `docs/session-brief-1-atlas-pipeline.md`,
`docs/session-brief-2-map-shell-chrome.md`,
`docs/session-brief-3-map-rendering-core.md`,
`docs/session-brief-4-basemap-complete.md`,
`docs/session-brief-5-e2e-hardening.md`,
`docs/session-brief-6-final-verification-ship.md`.

```text
Wave 1 — three concurrent lanes (disjoint files; NO pnpm build / pm2 /
         playwright during this wave — the first full build is Session 5's):
  Session 1 — Atlas pipeline & provenance    Tasks 1–4        (scripts + docs)
  Session 2 — Map shell & chrome             Tasks 6c, 6d, 6  (fullscreen drawer,
                                                              legend, badge)
  Session 3 — Map rendering core             Tasks 5, 6b, 6f  (wide water,
                                                              readiness, honesty)

Wave 2 — sequential (shared build pipeline); either order, 5 → 4 recommended:
  Session 5 — E2E hardening                  Tasks 7, 8       (first full build
                                                              of merged Wave 1;
                                                              28 tests green)
  Session 4 — Complete basemap feature       Task 6e A + B    (Ink + Topo + UI
                                                              in ONE slice)

Wave 3:
  Session 6 — Final verification & ship      Tasks 9, 10      (full pass over
                                                              everything; gated
                                                              commit)
```

Dependency notes:

- Wave 1 needs no prerequisites; the three briefs' "File ownership" sections
  are the contract that makes concurrency safe.
- Session 5 needs Session 3's readiness flags (Task 7's `waitForMap`).
- Session 4 needs Session 2's `RiverMapPage.tsx`/`index.css` and Session 3's
  filtered `mapStyle.ts`/`TennesseeMap.tsx` — hence Wave 2.
- Sessions 4 and 5 are content-independent but must not run simultaneously
  (both write `apps/web/dist`; the e2e globalSetup also rebuilds it).
- Session 6 needs 4 AND 5.

If working solo and sequentially instead: run the sessions in numeric order —
the task numbering already reflects a valid single-threaded order.

---

## Task 1 — Fix stale claims in `docs/atlas-sources.md`

**Why:** the shipped `rivers.geojson` contains all **92/92** streams including
`white-oak-creek` (resolved via the `WHITEOAK → WHITE OAK` normalization in
`merge-rivers.mjs`), but lines 51–53 of this doc still describe the old state
(91/92, white-oak absent). `docs/atlas-validation.md` already documents the truth;
this doc contradicts it.

**Step 1.1** Open `docs/atlas-sources.md`. Find this exact text (lines ~51–53):

```markdown
- **Unresolved:** `white-oak-creek` has no verified official geometry yet and is
  intentionally absent from `rivers.geojson`. Do not fabricate it.
- **Generated file:** `apps/web/public/atlas/rivers.geojson` (91/92 resolved).
```

**Step 1.2** Replace it with:

```markdown
- **Resolved:** all 92/92 streams carry verified official geometry.
  `white-oak-creek` is matched to TIGER LINEARWATER through the
  `WHITEOAK → WHITE OAK` entry in the `WORD` normalization map in
  `merge-rivers.mjs`; do not remove that mapping.
- **Generated file:** `apps/web/public/atlas/rivers.geojson` (92/92 resolved).
```

**Acceptance:**

```bash
grep -n "91/92" docs/atlas-sources.md        # must print nothing
grep -n "92/92 resolved" docs/atlas-sources.md   # must find the new line
git status --short                            # only docs/atlas-sources.md modified
```

---

## Task 2 — Fix context-source URLs and extraction stems

**Why:** `fetch-atlas-sources.mjs` claims to download TIGER/Line (`tl_2024_*`)
files for boundary/counties/places, but the archives actually sitting in
`.atlas-src/` contain the **cartographic boundary (`cb_2024_*`) series** — that is
what the shipped atlas geometry was really built from (the shipped `places.json`
source line even says `cb_2024_47_place_500k`). Two concrete bugs:

1. The three context URLs point at `tl_*` TIGER URLs — wrong series.
2. The root-zip extraction skip-check tests `county5m.shp` etc., but the archives
   extract to `cb_2024_us_county_5m.shp` etc. — so the check never matches and
   re-extraction happens every run (harmless but wrong), and the extraction never
   ran in the last session, leaving the three shapefiles missing.

**Step 2.1** Open `apps/web/scripts/fetch-atlas-sources.mjs`. Find:

```js
const BASE = 'https://www2.census.gov/geo/tiger/TIGER2024';
const jobs = [
  ...FIPS.map((f) => ({ dir: 'lw', name: `tl_2024_${f}_linearwater.zip`, url: `${BASE}/LINEARWATER/tl_2024_${f}_linearwater.zip` })),
  ...FIPS.map((f) => ({ dir: 'aw', name: `tl_2024_${f}_areawater.zip`, url: `${BASE}/AREAWATER/tl_2024_${f}_areawater.zip` })),
  { dir: '.', name: 'county5m.zip', url: `${BASE}/COUNTY/tl_2024_us_county_5m.zip` },
  { dir: '.', name: 'state5m.zip', url: `${BASE}/STATE/tl_2024_us_state_5m.zip` },
  { dir: '.', name: 'place500k.zip', url: `${BASE}/PLACE/tl_2024_47_place_500k.zip` },
];
```

Replace the last three `jobs` entries (keep the `lw`/`aw` lines and `BASE`
exactly as they are) with:

```js
const GENZ = 'https://www2.census.gov/geo/tiger/GENZ2024/shp';
const jobs = [
  ...FIPS.map((f) => ({ dir: 'lw', name: `tl_2024_${f}_linearwater.zip`, url: `${BASE}/LINEARWATER/tl_2024_${f}_linearwater.zip` })),
  ...FIPS.map((f) => ({ dir: 'aw', name: `tl_2024_${f}_areawater.zip`, url: `${BASE}/AREAWATER/tl_2024_${f}_areawater.zip` })),
  // Context files are the 1:5m CARTOGRAPHIC boundary (GENZ cb_*) series — the
  // same series the shipped atlas geometry was built from. Inner filenames are
  // cb_2024_*, which the extraction skip-checks must match.
  { dir: '.', name: 'county5m.zip', url: `${GENZ}/cb_2024_us_county_5m.zip` },
  { dir: '.', name: 'state5m.zip', url: `${GENZ}/cb_2024_us_state_5m.zip` },
  { dir: '.', name: 'place500k.zip', url: `${GENZ}/cb_2024_47_place_500k.zip` },
];
```

**Step 2.2** In the same file, find the root-zip extraction loop:

```js
  for (const z of ['county5m.zip', 'state5m.zip', 'place500k.zip']) {
    const stem = z.replace(/\.zip$/, '');
    if (existsSync(join(SRC, `${stem}.shp`))) continue;
    console.log(`unzip ${z}`);
    execSync(`unzip -o -q ${JSON.stringify(join(SRC, z))} -d ${JSON.stringify(SRC)}`);
  }
```

Replace with:

```js
  for (const [z, inner] of [
    ['county5m.zip', 'cb_2024_us_county_5m'],
    ['state5m.zip', 'cb_2024_us_state_5m'],
    ['place500k.zip', 'cb_2024_47_place_500k'],
  ]) {
    if (existsSync(join(SRC, `${inner}.shp`))) continue;
    console.log(`unzip ${z}`);
    execSync(`unzip -o -q ${JSON.stringify(join(SRC, z))} -d ${JSON.stringify(SRC)}`);
  }
```

**Step 2.3** Run it (archives already exist, so nothing downloads; it only
extracts the three missing shapefiles):

```bash
cd /c/Users/Benjamin/Projects/trout/apps/web
node scripts/fetch-atlas-sources.mjs
```

**Expected output:** three `unzip county5m.zip` / `unzip state5m.zip` /
`unzip place500k.zip` lines, then `atlas sources ready.`

**Acceptance:**

```bash
ls .atlas-src/cb_2024_us_county_5m.shp .atlas-src/cb_2024_us_state_5m.shp .atlas-src/cb_2024_47_place_500k.shp
# all three must exist
node scripts/fetch-atlas-sources.mjs   # run again — must print NO unzip lines (skip-checks now match)
git status --short                     # only fetch-atlas-sources.mjs modified (plus Task 1's doc)
```

**If it fails:** `curl`/network errors mean the GENZ URL is wrong — check
`https://www2.census.gov/geographies/mapping-files/2024/cartographic-boundary.html`
and correct the URL. Do not proceed to Task 3 without the three `.shp` files.

---

## Task 3 — Add the checked-in context/places generator

**Why this is the biggest task:** nothing in the repository generates
`.atlas-src/out/tn-boundary.geojson`, `tn-counties.geojson`,
`states-context.geojson`, or `places.json`. They were made by ad-hoc mapshaper
commands (mapshaper is not a project dependency), so the atlas is **not
reproducible from a clean clone**. This task adds one deterministic, plain-Node
script that regenerates all four intermediates from the official shapefiles.

The code below is **pre-verified**: it was executed against the real
`cb_2024_47_place_500k.shp` and produced exactly 71 places (6 city / 65 town),
name-for-name identical to the shipped file, with every generated point proven to
lie inside its own place polygon (containment self-check). Median coordinate
shift vs the old mapshaper points is ~1 km; worst case ~6 km (large multi-part
cities and one narrow strip town) — acceptable for orientation labels, and the
shift is deliberate: mapshaper is gone.

**Step 3.1** Create a new file
`apps/web/scripts/build-atlas-context-sources.mjs` with **exactly** this content:

```js
// Build atlas context intermediates (.atlas-src/out/) from the official Census
// 2024 cartographic boundary (cb_) shapefiles that fetch-atlas-sources.mjs
// downloads + extracts. Deterministic: fixed name tables, codepoint sort, 4dp
// rounding, strict count checks, polygon-containment self-check. The only
// dependency is the `shapefile` reader (already a devDependency). No mapshaper.
//
// Inputs (under .atlas-src/):
//   cb_2024_us_state_5m.shp    -> out/tn-boundary.geojson (TN)
//                              -> out/states-context.geojson (8 neighbors)
//   cb_2024_us_county_5m.shp   -> out/tn-counties.geojson (95 TN counties)
//   cb_2024_47_place_500k.shp  -> out/places.geojson + out/places.json (71 labels)
//
// Run AFTER fetch-atlas-sources.mjs:  node scripts/build-atlas-context-sources.mjs
// Then publish:                       node scripts/build-atlas-context.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { open as openShape } from 'shapefile';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', '.atlas-src');
const OUT = join(SRC, 'out');
mkdirSync(OUT, { recursive: true });

// ---- fixed curation tables (these ARE the editorial choices; do not change) ----
const NEIGHBORS = new Set(['MO', 'KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR']);
const CITY = new Set([
  'Chattanooga', 'Clarksville', 'Knoxville', 'Memphis', 'Murfreesboro',
  'Nashville-Davidson metropolitan government (balance)',
]);
const DISPLAY = { 'Nashville-Davidson metropolitan government (balance)': 'Nashville' };
const TOWNS = new Set([
  'Athens','Bolivar','Bristol','Brownsville','Byrdstown','Camden','Celina','Cleveland','Columbia',
  'Cookeville','Covington','Crossville','Dayton','Dover','Ducktown','Dunlap','Dyersburg','Elizabethton',
  'Erin','Etowah','Fayetteville','Franklin','Gainesboro','Gallatin','Gatlinburg','Greeneville','Huntsville',
  'Jackson','Jamestown','Jasper','Johnson City','Kingsport','Lawrenceburg','Lebanon','Linden','Livingston',
  'Loretto','Manchester','Martin','Maryville','McMinnville','Morristown','Newport','Oak Ridge','Oneida',
  'Paris','Pikeville','Pulaski','Ripley','Savannah','Sevierville','Shelbyville','Smithville','Smyrna',
  'South Pittsburg','Sparta','Spring Hill','Sweetwater','Townsend','Tullahoma','Union City','Waverly',
  'Waynesboro','Winchester','Woodbury',
]);

async function readShp(name) {
  const src = await openShape(join(SRC, name));
  const feats = [];
  let r;
  while ((r = await src.read()).done === false) feats.push(r.value);
  return feats;
}
const fc = (features) => ({ type: 'FeatureCollection', features });
const byName = (a, b) => (a.properties.NAME < b.properties.NAME ? -1 : a.properties.NAME > b.properties.NAME ? 1 : 0);

// ---- states: TN boundary + 8 bordering states ----
{
  const states = await readShp('cb_2024_us_state_5m.shp');
  const tn = states.filter((f) => f.properties.STUSPS === 'TN');
  const ctx = states.filter((f) => NEIGHBORS.has(f.properties.STUSPS)).sort(byName);
  if (tn.length !== 1) throw new Error(`expected exactly 1 TN feature, got ${tn.length}`);
  if (ctx.length !== 8) throw new Error(`expected 8 neighbor states, got ${ctx.length}: ${ctx.map((f) => f.properties.STUSPS).join(',')}`);
  writeFileSync(join(OUT, 'tn-boundary.geojson'), JSON.stringify(fc(tn)));
  writeFileSync(join(OUT, 'states-context.geojson'), JSON.stringify(fc(ctx)));
  console.log(`context sources: boundary 1, neighbors ${ctx.length}`);
}

// ---- counties: Tennessee's 95 ----
{
  const counties = (await readShp('cb_2024_us_county_5m.shp'))
    .filter((f) => f.properties.STATEFP === '47')
    .sort(byName);
  if (counties.length !== 95) throw new Error(`expected 95 TN counties, got ${counties.length}`);
  writeFileSync(join(OUT, 'tn-counties.geojson'), JSON.stringify(fc(counties)));
  console.log(`context sources: counties ${counties.length}`);
}

// ---- places: 71 curated labels with in-script interior points ----
// cb_ place files carry no INTPT attributes, so the label point is computed
// here: scanline interior point on the largest outer ring, preferring spans
// near the ring's vertical middle (PENALTY term). A polygon-containment
// self-check throws if any point misses its own place.
function shoelace(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}
function ringHasPoint(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inGeometry(geometry, x, y) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const poly of polys) {
    if (!ringHasPoint(poly[0], x, y)) continue;
    let hole = false;
    for (let h = 1; h < poly.length; h++) if (ringHasPoint(poly[h], x, y)) hole = true;
    if (!hole) return true;
  }
  return false;
}
function interiorPoint(geometry) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let best = null;
  let bestArea = 0;
  for (const poly of polys) {
    const area = Math.abs(shoelace(poly[0]));
    if (area > bestArea) { bestArea = area; best = poly[0]; }
  }
  let x0 = 1 / 0, y0 = 1 / 0, x1 = -1 / 0, y1 = -1 / 0;
  for (const [x, y] of best) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const midY = (y0 + y1) / 2;
  const h = y1 - y0;
  let outX = (x0 + x1) / 2, outY = midY, bestScore = -1 / 0;
  const ROWS = 33;
  const PENALTY = 2; // prefers central spans over peripheral wide lobes
  for (let i = 0; i < ROWS; i++) {
    const y = y0 + (h * i) / (ROWS - 1);
    const xs = [];
    for (let k = 0; k < best.length; k++) {
      const [ax, ay] = best[k];
      const [bx, by] = best[(k + 1) % best.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let j = 0; j + 1 < xs.length; j += 2) {
      const w = xs[j + 1] - xs[j];
      const score = w - PENALTY * Math.abs(y - midY);
      if (score > bestScore) { bestScore = score; outX = (xs[j] + xs[j + 1]) / 2; outY = y; }
    }
  }
  return [outX, outY];
}
{
  const round4 = (n) => Math.round(n * 1e4) / 1e4;
  const places = [];
  const pointFeats = [];
  for (const f of await readShp('cb_2024_47_place_500k.shp')) {
    const p = f.properties;
    const isCity = CITY.has(p.NAME);
    if (!isCity && !TOWNS.has(p.NAME)) continue;
    const [lon, lat] = interiorPoint(f.geometry);
    if (!inGeometry(f.geometry, lon, lat)) throw new Error(`${p.NAME}: interior point fell outside its own polygon`);
    const display = DISPLAY[p.NAME] ?? p.NAME;
    const kind = isCity ? 'city' : 'town';
    places.push({ name: display, lon: round4(lon), lat: round4(lat), kind });
    pointFeats.push({ type: 'Feature', properties: { NAME: p.NAME, displayName: display, kind }, geometry: { type: 'Point', coordinates: [round4(lon), round4(lat)] } });
  }
  places.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const nCity = places.filter((p) => p.kind === 'city').length;
  if (places.length !== 71) throw new Error(`expected 71 curated places, got ${places.length}`);
  if (nCity !== 6) throw new Error(`expected 6 cities, got ${nCity}`);
  const SOURCE = 'U.S. Census Bureau 2024 cartographic boundary place file cb_2024_47_place_500k (public domain); interior points computed by build-atlas-context-sources.mjs (deterministic scanline)';
  writeFileSync(join(OUT, 'places.geojson'), JSON.stringify(fc(pointFeats)));
  writeFileSync(join(OUT, 'places.json'), JSON.stringify({ source: SOURCE, places }));
  console.log(`context sources: places ${places.length} (${nCity} cities)`);
}
console.log('atlas context intermediates ready.');
```

**Step 3.2** Run the generator, then the publisher:

```bash
cd /c/Users/Benjamin/Projects/trout/apps/web
node scripts/build-atlas-context-sources.mjs
node scripts/build-atlas-context.mjs
```

**Expected output:**

```text
context sources: boundary 1, neighbors 8
context sources: counties 95
context sources: places 71 (6 cities)
atlas context intermediates ready.
context: tn-boundary.geojson (1 features)
context: tn-counties.geojson (95 features)
context: states-context.geojson (8 features)
context: places.json (71 places)
atlas context ready.
```

**Step 3.3 — review the diff (do this carefully):**

```bash
cd /c/Users/Benjamin/Projects/trout
git status --short apps/web/public/atlas/
git diff --stat apps/web/public/atlas/
```

**What is expected:**

- `rivers.geojson` — **MUST NOT APPEAR. If it appears, stop: something ran the
  wrong script.**
- `places.json` — modified: new `source` line (mapshaper mention gone) and small
  coordinate shifts on some places. This is intended.
- `tn-boundary.geojson`, `tn-counties.geojson`, `states-context.geojson` — may be
  modified (feature order is now sorted by name; geometry comes from the same cb_
  source, so shapes should be equivalent). Inspect `git diff` visually: county
  names must still be Tennessee counties.

**Step 3.4 — sanity-check the published places:**

```bash
cd apps/web && node -e "
const p = JSON.parse(require('fs').readFileSync('public/atlas/places.json','utf8'));
const k = { city: 0, town: 0 };
p.places.forEach(x => k[x.kind]++);
console.log(p.places.length, JSON.stringify(k));
console.log(p.places.filter(x => x.kind === 'city').map(x => x.name).join(', '));
console.log('Nashville:', JSON.stringify(p.places.find(x => x.name === 'Nashville')));
"
```

Expected: `71 {"city":6,"town":65}`, the six cities
`Chattanooga, Clarksville, Knoxville, Memphis, Murfreesboro, Nashville`, and a
Nashville entry with kind `city`.

**Step 3.5** Update `docs/atlas-sources.md` — two edits:

(a) In the `## Reproduce (deterministic)` block, insert the new step so the
pipeline reads (step 2 is new; renumber the rest):

```bash
pnpm --filter @trout/content build        # regenerate streams.json if content changed
node apps/web/scripts/fetch-atlas-sources.mjs   # one-time Census downloads (-> .atlas-src/, git-ignored)
node apps/web/scripts/build-atlas-context-sources.mjs  # context intermediates: boundary/counties/states/places
node apps/web/scripts/fetch-nhd-targets.mjs     # one-time USGS NHDPlus HR fetches (-> .atlas-src/nhd/)
node apps/web/scripts/match-rivers-tiger.mjs    # match 92 streams to TIGER LINEARWATER (-> .atlas-src/out/)
node apps/web/scripts/merge-rivers.mjs          # assemble public/atlas/rivers.geojson
node apps/web/scripts/build-atlas-context.mjs   # slim + publish context files
node apps/web/scripts/validate-atlas.mjs        # structural gate (must PASS)
```

(b) Replace the `## Tennessee boundary / counties / states / places` section's
last bullet — find:

```markdown
- **Places:** 71 city/town/water centroids from `cb_2024_47_place_500k`
  (interior points); rendered zoom-gated (cities always, towns z≥7, water z≥7.5).
```

replace with:

```markdown
- **Intermediates:** `build-atlas-context-sources.mjs` generates
  `out/tn-boundary.geojson` (TN), `out/states-context.geojson` (8 bordering
  states), `out/tn-counties.geojson` (95 counties), and `out/places.json` from
  the cb_ 1:5m cartographic files — plain Node, deterministic, no mapshaper.
- **Places:** 71 curated labels from `cb_2024_47_place_500k` (six principal
  cities + 65 towns; label points are deterministic scanline interior points,
  4dp, self-checked for polygon containment); rendered zoom-gated (cities
  always, towns z≥7; a `water` kind is supported by the client but currently
  unused).
```

**Acceptance for Task 3:** all expected outputs above match;
`node scripts/validate-atlas.mjs` still prints `PASS`; `git status` shows no
`rivers.geojson` change; docs updated.

**If `places` count ≠ 71:** a name in the `TOWNS`/`CITY` tables doesn't match the
shapefile exactly (typo, or Census renamed a place). Print the diff:

```bash
node -e "
const { open } = require('shapefile');
(async () => {
  const s = await open('.atlas-src/cb_2024_47_place_500k.shp');
  const cur = new Set(JSON.parse(require('fs').readFileSync('public/atlas/places.json','utf8')).places.map(p=>p.name));
  const names = new Set(); let r;
  while ((r = await s.read()).done === false) names.add(r.value.properties.NAME);
  for (const n of ['Athens','Bolivar']) {} // noop
  console.log('sample of file names:', [...names].slice(0, 20).join(' | '));
})()"
```

Compare against the tables in the script and fix the specific mismatched string.
Do **not** change the expected counts to make an error go away.

---

## Task 4 — Replace the retired synthetic generator with a clean stub

**Why:** `build-atlas.mjs` was "retired" by inserting `process.exit(1)` at the
top, but the dead code below it is syntactically invalid, so running it produces
a `SyntaxError` instead of the intended message. It cannot overwrite anything
(exit code is still 1) but it's sloppy and confusing.

**Step 4.1** Overwrite the **entire file** `apps/web/scripts/build-atlas.mjs`
with exactly this content (delete everything else in the file):

```js
#!/usr/bin/env node
/**
 * RETIRED — do not run. This script generated the old SYNTHETIC atlas
 * (seeded jitter around region centroids) and is kept only as a tombstone.
 * It is NOT part of the canonical pipeline and MUST NOT overwrite
 * public/atlas/*.geojson.
 *
 * Canonical atlas pipeline (real Census + USGS sources, all public domain) —
 * see docs/atlas-sources.md:
 *   1. node apps/web/scripts/fetch-atlas-sources.mjs        # Census downloads (TIGER lw/aw + GENZ cb_ context)
 *   2. node apps/web/scripts/build-atlas-context-sources.mjs # context intermediates (boundary/counties/states/places)
 *   3. node apps/web/scripts/fetch-nhd-targets.mjs          # USGS NHDPlus HR fetches
 *   4. node apps/web/scripts/match-rivers-tiger.mjs         # TIGER LINEARWATER stream matching
 *   5. node apps/web/scripts/merge-rivers.mjs               # assemble public/atlas/rivers.geojson
 *   6. node apps/web/scripts/build-atlas-context.mjs        # slim + publish context files
 *   7. node apps/web/scripts/validate-atlas.mjs             # structural gate (must PASS)
 */
console.error('build-atlas.mjs is RETIRED (synthetic generator). See docs/atlas-sources.md for the canonical real-data pipeline.');
process.exit(1);
```

**Acceptance:**

```bash
cd /c/Users/Benjamin/Projects/trout/apps/web
node scripts/build-atlas.mjs ; echo "exit=$?"
# must print the RETIRED message (NOT a SyntaxError) and exit=1
```

---

## Task 5 — Expose map readiness flags in `TennesseeMap.tsx`

**Why:** the E2E suite currently can't tell a healthy map from one whose 12-second
watchdog is about to fire the failure banner — a "passing" run previously
captured screenshots showing "The river map didn't finish loading" (assertions ran
before the watchdog). The component will publish two data attributes tests can
wait on. This is test instrumentation only — no behavior change.

**Step 5.1** Open `apps/web/src/features/map/TennesseeMap.tsx`.

Find (inside the mount `useEffect`, right after `setMapFailed(false);`):

```ts
    setMapFailed(false);
    let idle = false;
```

Insert one line so it reads:

```ts
    setMapFailed(false);
    delete container.dataset.mapReady;
    delete container.dataset.mapFailed;
    let idle = false;
```

**Step 5.2** Find the idle handler:

```ts
    map.on('idle', () => {
      idle = true;
      try { applyRef.current(); } catch { /* colors apply on next tick */ }
    });
```

Replace with:

```ts
    map.on('idle', () => {
      idle = true;
      container.dataset.mapReady = '1';
      try { applyRef.current(); } catch { /* colors apply on next tick */ }
    });
```

**Step 5.3** Find the watchdog:

```ts
    const watchdog = window.setTimeout(() => {
      if (!disposed && !idle) setMapFailed(true);
    }, 12000);
```

Replace with:

```ts
    const watchdog = window.setTimeout(() => {
      if (!disposed && !idle) {
        container.dataset.mapFailed = '1';
        setMapFailed(true);
      }
    }, 12000);
```

**Acceptance:**

```bash
cd /c/Users/Benjamin/Projects/trout
pnpm --filter @trout/web typecheck   # must pass silently
grep -n "dataset.mapReady\|dataset.mapFailed" apps/web/src/features/map/TennesseeMap.tsx
# must find all four occurrences (2 deletes, 1 set, 1 set)
```

(The functional proof comes in Task 9's E2E run.)

---

## Task 6 — Fix the "Live · now" badge wrapping

**Why:** the freshness badge in the map top bar has no `whitespace-nowrap`, so
when the top row is squeezed (panel open, tablet widths) the pill's words wrap
inside it and it collapses into a white circle overlapping the search box —
visible in current screenshots at 1440, 1024, and 390 px.

**Step 6.1** Open `apps/web/src/features/map/RiverMapPage.tsx`. Find (line ~128):

```tsx
<span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold shadow-sm" style={{ borderColor: '#D3C6AB' }}>{live ? 'Live' : 'Cached'} {fetchedAt ? `· ${ageMinutes(fetchedAt)}` : ''} {!online ? '· Offline — still works' : ''}</span>
```

Replace with (one class added at the front of `className`):

```tsx
<span className="whitespace-nowrap rounded-full border bg-white px-3 py-1 text-xs font-semibold shadow-sm" style={{ borderColor: '#D3C6AB' }}>{live ? 'Live' : 'Cached'} {fetchedAt ? `· ${ageMinutes(fetchedAt)}` : ''} {!online ? '· Offline — still works' : ''}</span>
```

**Acceptance:** `pnpm --filter @trout/web typecheck` passes; visual proof comes
from the Task 9 screenshots (badge renders as a full pill on its own wrapped
line, never a crushed circle).

---

## Task 6b — Render wide-water polygons as water, not lines

**Why (diagnosis, confirmed in the browser on 2026-09-03):** three rivers —
`hiwassee-river`, `french-broad-river`, `obey-river` — have **no centerlines
anywhere in Census TIGER LINEARWATER**, so the atlas stores them as wide-water
**MultiPolygon** shapes (TIGER AREAWATER, the official Census representation).
Two presentational defects follow:

1. **Line layers draw ring outlines on polygons.** In MapLibre, a `line` layer
   renders a polygon's *ring boundary*. So `rivers-casing`, `rivers-interior`,
   `rivers-selection` (8.5 px), and `rivers-hatch-halo` (9 px) all draw thick
   outlines around each polygon — including the **straight edges where
   county-clipped pieces interlock** (each county's Census file contains only
   its piece of the water; the pieces meet along county borders, e.g. 38 of
   hiwassee poly-0's 189 vertices lie on poly-3's border). That is the "box
   shapes that don't follow the river" the user saw.
2. **The fill is too loud.** `rivers-water` paints the whole polygon in the
   condition color at 0.55 opacity (0.18 dimmed) plus a full ink outline, so
   wide reservoir-like water reads as a misplaced colored slab instead of a
   watercolor wash.

The data itself is correct and must NOT be regenerated for this task
(`rivers.geojson` must stay byte-identical; optional data follow-up at the end).

**How:** restrict all line layers to LineString geometry, give polygons their
own soft watercolor treatment (wash + hairline shore + interior hatch glow),
and reset hover when the pointer leaves polygon fills.

**Step 6b.1** Open `apps/web/src/features/map/mapStyle.ts`. First verify it is
the expected version — line 1 must be `import { atlas } from './mapTokens';`
and the file must export `atlasStyle` around line 20. If the file looks
different from that, **stop and report**.

**Step 6b.2** Change the import line (line 2) from:

```ts
import type { StyleSpecification } from 'maplibre-gl';
```

to:

```ts
import type { StyleSpecification, FilterSpecification } from 'maplibre-gl';
```

**Step 6b.3** Directly below the import lines, add these two constants (just
above `export function atlasStyle`):

```ts
// Wide-water safety: line layers must never touch polygon features (a line
// layer on polygon geometry draws ring outlines — including straight
// county-clip edges — instead of a river path). Legacy $type filters.
const LINES_ONLY = ['==', '$type', 'LineString'] as unknown as FilterSpecification;
const POLYS_ONLY = ['==', '$type', 'Polygon'] as unknown as FilterSpecification;
```

**Step 6b.4** Replace the entire rivers layer stack — every layer from the
comment `// Wide rivers — real waterbody polygons, condition-tinted like the
lines.` down to and including the `rivers-hit` layer (the last one before the
closing `],` of `layers`) — with exactly this block:

```ts
      // Wide water — AREAWATER polygons (Hiwassee, French Broad, Obed; TIGER
      // has no centerlines for these). Rendered as watercolor washes: soft
      // condition tint + hairline shore. Never drawn by line layers.
      {
        id: 'rivers-water',
        type: 'fill',
        source: 'rivers',
        filter: POLYS_ONLY,
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#D98232',
            ['coalesce', ['feature-state', 'color'], ['get', 'color'], '#8B8A82'],
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.45,
            ['boolean', ['feature-state', 'dimmed'], false],
            0.08,
            0.3,
          ],
        },
      },
      // Shore hairline for wide water — 1px ink so the county-clip edges that
      // exist in the source polygons stay subtle; selection turns it sulphur.
      {
        id: 'rivers-water-shore',
        type: 'line' as const,
        source: 'rivers',
        filter: POLYS_ONLY,
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#D98232',
            atlas.ink,
          ],
          'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.5, 0.8],
          'line-opacity': ['case', ['boolean', ['feature-state', 'dimmed'], false], 0.25, 0.7],
        },
      },
      // Hatch glow for wide water — soft interior wash, never a ring outline.
      {
        id: 'rivers-hatch-wash',
        type: 'fill',
        source: 'rivers',
        filter: POLYS_ONLY,
        paint: {
          'fill-color': ['coalesce', ['feature-state', 'hatchColor'], ['get', 'hatchColor'], atlas.sulphur],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hatchActive'], false], 0.2, 0],
        },
      },
      // Rivers — casing (ink) renders beneath interior so bends read clearly.
      // LINESTRING ONLY — see LINES_ONLY note above.
      {
        id: 'rivers-casing',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': atlas.ink,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            7,
            ['boolean', ['feature-state', 'hover'], false],
            5,
            3.4,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            1,
            ['boolean', ['feature-state', 'hover'], false],
            0.9,
            ['boolean', ['feature-state', 'dimmed'], false],
            0.18,
            0.62,
          ],
        },
      },
      // Rivers — interior (condition color: feature-state `color` set live by
      // TennesseeMap, static `get color` property as fallback). LINES ONLY.
      {
        id: 'rivers-interior',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['coalesce', ['feature-state', 'color'], ['get', 'color'], atlas.noData],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3.4,
            ['boolean', ['feature-state', 'hover'], false],
            2.9,
            ['boolean', ['feature-state', 'dimmed'], false],
            1.4,
            2.05,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'dimmed'], false],
            0.35,
            1,
          ],
        },
      },
      // Selection highlight — warm outline beyond casing when selected. LINES ONLY.
      {
        id: 'rivers-selection',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#F59E0B',
          'line-width': 8.5,
          'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.9, 0],
        },
      },
      // Hatch-mode halo — sulphur glow when hatchActive. LINES ONLY.
      {
        id: 'rivers-hatch-halo',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['coalesce', ['feature-state', 'hatchColor'], ['get', 'hatchColor'], atlas.sulphur],
          'line-width': 9,
          'line-opacity': ['case', ['boolean', ['feature-state', 'hatchActive'], false], 0.42, 0],
          'line-blur': 1.1,
        },
      },
      // Wide transparent hit area — last so it receives pointer events. LINES ONLY.
      {
        id: 'rivers-hit',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 18 },
      },
```

Note what was removed: the old `fill-outline-color: '#24352D'` on `rivers-water`
(that constant ink outline is what made the boxes shout), and every implicit
polygon ring outline from line layers.

**Step 6b.5** Open `apps/web/src/features/map/TennesseeMap.tsx`. The click and
hover handlers already query `rivers-water` (fill layers are pointer-queryable,
so polygon interiors remain clickable — do not change those lists). Only the
hover-reset needs one addition. Find:

```ts
    map.on('mouseleave', 'rivers-hit', onMouseLeaveHit);
```

Add directly below it:

```ts
    map.on('mouseleave', 'rivers-water', onMouseLeaveHit);
```

Then find the cleanup block:

```ts
        map.off('click', handleClick);
        map.off('mousemove', onMouseMove);
        map.off('mouseleave', 'rivers-hit', onMouseLeaveHit);
```

and add one line so it reads:

```ts
        map.off('click', handleClick);
        map.off('mousemove', onMouseMove);
        map.off('mouseleave', 'rivers-hit', onMouseLeaveHit);
        map.off('mouseleave', 'rivers-water', onMouseLeaveHit);
```

**Step 6b.6** Acceptance (rebuild, then hard-refresh `http://127.0.0.1:8787/`):

1. Open `http://127.0.0.1:8787/?river=hiwassee-river`.
2. The Hiwassee must render as a **soft orange wash with a 2.5 px orange
   shore** — no thick orange ring outline, no boxy county edges standing out.
3. Non-selected wide water must be a faint tint, clearly calmer than the thin
   rivers.
4. Zoom in on the former "box" area around Etowah: shapes now read as
   lake-like water with hairline shores — not colored slabs.
5. Switch to **Hatches** mode: wide water gets a soft interior glow, no ring.
6. Click the middle of the wide water: the inspector must open (fill layers are
   clickable via `rivers-water` in the click list).
7. Hover a river then move off the wide water: the pointer cursor resets (the
   new `mouseleave` binding).
8. Select a normal line river (`?river=east-fork-stones-river`): unchanged
   orange line-with-halo rendering.
9. `pnpm --filter @trout/web typecheck` passes.
10. `git diff --stat apps/web/public/atlas/rivers.geojson` is **empty**.

**Optional data follow-up (separate decision, do NOT bundle into this task):**
the straight county-clip edges inside the polygons come from merging
per-county Census pieces without dissolving. A future atlas regeneration could
dissolve adjacent pieces per river (and drop hiwassee's 13-vertex stray
fragment, poly index 4). That requires re-running `merge-rivers.mjs` with the
full `.atlas-src/` cache and re-validating — out of scope here.

---

## Task 6c — Fullscreen map shell: one hamburger drawer everywhere

**Why (user decision, 2026-09-03):** when the site opens, the map must be the
*only* view — edge-to-edge, no persistent sidebar, no bottom tab bar. All
navigation lives behind one three-dash (hamburger) button that opens a drawer.
The goal for feel: "full screen, polished, expensive."

**Current state (verified):** `AppShell.tsx` already contains a working drawer
(focus trap, Escape, focus return) but it is mobile-only (`lg:hidden`), the
desktop keeps a 240 px sticky sidebar (`w-60`), and mobile keeps a bottom tab
bar (`MOBILE_TABS`). The map route height is `calc(100dvh-3.5rem-…)` because a
persistent header exists.

**Step 6c.1 — AppShell.tsx: expose the menu opener to pages.** Add
`useOutletContext` to the react-router import (line 2 becomes):

```ts
import { Link, NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom';
```

Change `<Outlet />` (line ~143) to:

```tsx
<Outlet context={{ openMenu: () => setMenuOpen(true) }} />
```

and export a hook at the bottom of the file:

```ts
export function useShell() {
  return useOutletContext<{ openMenu: () => void }>();
}
```

**Step 6c.2 — AppShell.tsx: one drawer for all viewports.**

- In the drawer container (`fixed inset-0 z-40 lg:hidden`), delete the
  `lg:hidden` class → `fixed inset-0 z-40`.
- In the header's hamburger button (`…rounded-lg lg:hidden`), delete `lg:hidden`
  so desktop also gets the button in the header.
- **Delete the entire desktop sidebar `<nav aria-label="Primary" className="sticky top-14 hidden … lg:flex" …>…</nav>` block** (lines ~112–125).
- **Delete the entire bottom tab bar `<nav aria-label="Primary tabs" …>…</nav>` block** (lines ~147–159) and the `MOBILE_TABS` const (lines ~21–26).
- The drawer's nav keeps `DESKTOP_NAV` + `MORE_LINKS` and gains the privacy
  line the sidebar used to have — add inside the drawer `<nav>`, after the link
  maps, before the Close button:

```tsx
<p className="mt-4 px-3 text-xs" style={{ color: 'var(--trout-ink-muted)' }}>No accounts. No tracking. Your logbook never leaves this device.</p>
```

- `OfflineNote` anchored at `bottom-20 … lg:bottom-4` for the removed tab bar —
  change both to `bottom-4`.
- The `isMapRoute` const already exists. Wrap the header so the map route has
  **no header at all**: change `<header className="sticky top-0 …">` to
  `{!isMapRoute && (<header className="sticky top-0 …"> … </header>)}` (keep the
  inner content unchanged). On the map route the hamburger + brand live in the
  map's own top bar (Step 6c.3), so nothing is lost.
- The map route wrapper (line ~111) becomes:

```tsx
<div className={isMapRoute ? 'flex w-full flex-1 overflow-hidden' : 'mx-auto flex w-full max-w-[1600px] flex-1'}>
```

**Step 6c.3 — RiverMapPage.tsx: hamburger + brand in the map top bar, true
fullscreen height.**

- Import: `import { useSearchParams, useOutletContext } from 'react-router-dom';`
  and `import { Link } from 'react-router-dom';` (one import line), plus
  `import { useShell } from '../../components/layout/AppShell';` and the icons
  the shell uses: `import { MenuIcon } from '../../components/icons';`.
- Inside the component: `const { openMenu } = useShell();`
- Root div height: replace
  `h-[calc(100dvh-3.5rem-3.5rem)] … lg:h-[calc(100dvh-3.5rem)]` with plain
  `h-dvh` (map route has no header/footer anymore — this also **fixes the 1px
  overflow** found at 1440×900). The root className becomes:

```tsx
<div className={`relative flex h-dvh flex-col overflow-hidden bg-[#F2E9D5]${selectedId && isDesktop ? ' atlas-panel-open' : ''}`}>
```

- First row of the top bar: insert the hamburger and brand chip **before**
  `<RiverSearch …>`:

```tsx
<button type="button" onClick={openMenu} aria-label="Open menu" aria-expanded={false} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm" style={{ borderColor: '#D3C6AB' }}>
  <MenuIcon size={20} />
</button>
<Link to="/" className="flex shrink-0 items-center gap-1.5 rounded-full border bg-white px-3 py-2 shadow-sm" style={{ borderColor: '#D3C6AB' }} aria-label="Trout — home">
  <span className="atlas-title text-sm font-black tracking-tight text-[#24352D]">Trout</span>
  <span className="hidden text-[11px] font-semibold text-[#566158] sm:inline">Field Atlas</span>
</Link>
```

(`aria-expanded={false}` is intentionally static here — the drawer is AppShell
state; if the implementer finds it simple to lift `menuOpen` into context they
may wire the real value, but it must not block this task.)

**Step 6c.4 — E2E: open the drawer before clicking nav links.**
`e2e/web/offline-cold-start.spec.ts` clicks `getByRole('link', { name: 'Match
the Hatch' })` directly from `/`. Insert immediately before that click:

```ts
await page.getByRole('button', { name: 'Open menu' }).click();
```

(Drawer links already close the drawer on click via their `onClick`.)

**Step 6c.5 — New smoke spec.** Create `e2e/web/shell.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('fullscreen map shell', () => {
  test('map route is edge-to-edge: no header, no page scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Primary tabs"]')).toHaveCount(0);
    const overflow = await page.evaluate(() => ({
      y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    expect(overflow.y).toBeLessThanOrEqual(0);
    expect(overflow.x).toBeLessThanOrEqual(0);
  });

  test('hamburger opens a drawer with primary links; Escape closes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Open menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    for (const label of ['Map', 'Match the Hatch', 'Logbook', 'Conditions', 'Stocking', 'Settings', 'About & Privacy']) {
      await expect(drawer.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
  });

  test('drawer link navigates and closes the drawer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Stocking', exact: true }).click();
    await expect(page).toHaveURL(/\/stocking/);
    await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0);
  });
});
```

**Step 6c.6 — Acceptance:** typecheck passes; `pnpm e2e:web` green (test total
grows from 25 by the new shell specs — update Appendix A with the real number);
manual: at 1440×900 and 390×844 the map fills the window with no header/sidebar/
tab bar; hamburger + "Trout · Field Atlas" chip sit in the map's top bar; drawer
works with keyboard (Tab cycles inside, Escape closes, focus returns); other
routes (`/charts`, `/logbook`) still show the normal header.

---

## Task 6d — Legend as a bottom-left map control

**Why:** the user asked for an on-screen legend; today it is a pill floating in
the top bar (competing with controls). A docked, mode-aware legend card in the
map's bottom-left corner reads as a proper atlas fixture and keeps the top bar
clean.

**Step 6d.1** In `RiverMapPage.tsx`, remove `<MapLegend mode={mode} />` from
the second top-bar row. Add a new block just above the desktop-inspector block
(still inside the map container div):

```tsx
{/* Docked legend — bottom-left; clears attribution (bottom-right) and the mobile peek sheet. */}
<div className={`absolute left-3 z-10 ${selectedFeature ? 'bottom-[172px] lg:bottom-3' : 'bottom-3'}`}>
  <MapLegend mode={mode} />
</div>
```

**Step 6d.2** Open `MapLegend.tsx` and restyle its root element into a card:
rounded-2xl border + paper background + shadow + internal padding, and add a
collapse toggle — a small button with `aria-expanded` + `aria-label`
("Hide legend"/"Show legend") that flips local state (default expanded,
persisted to `localStorage['trout:legendHidden']`). Keep the existing
Good/Fair/Poor/No-data and hatch-activity content and colors **exactly** (they
are the product's condition semantics). Keep the root `aria-label`
("Condition legend"/"Hatch activity" as already implemented).

**Step 6d.3 — Acceptance:** legend visible bottom-left in both modes; correct
content per mode; collapse toggle works and persists across reload; attribution
and zoom (bottom-right) unobstructed; when the desktop panel or mobile sheet is
open the legend still has clear space (the `bottom-[172px]` branch); typecheck
passes.

---

## Task 6e — Basemap switcher: Paper / Ink night / Topo (local styles only)

**Why (user decision):** the paper background makes rivers hard to distinguish.
Give users background choices — **built exclusively from local assets; zero
third-party requests ever** (satellite explicitly rejected: cannot be shipped
locally within any reasonable size, and remote providers violate the privacy
constraint).

Three variants:
- **Paper Atlas** (default, current style).
- **Ink night** — dark variant of the same data; pure style tokens, no new data.
- **Topo** — real contours + hillshade generated at build time from USGS 3DEP
  (public domain). Phase B below.

### Phase A — switcher + Ink night (ship first)

**Step A1 — mapTokens.ts: add the night palette.** Below the existing `atlas`
const:

```ts
// Ink night — dark variant. Condition hues stay recognizable; only ground,
// lines, and label tones change. Never used for UI chrome (panels stay paper).
export const atlasNight = {
  paper: '#121815',
  paperRaised: '#1A231E',
  paperWarm: '#161F1A',
  ink: '#0B100D',
  softInk: '#93A096',
  inkFaint: '#5E6B62',
  contour: '#26312A',
  hairline: '#33423A',
  noData: '#5E6B62',
  sulphur: '#E89A4B',
  placeText: '#D8D2C2',
  placeHalo: 'rgba(10, 15, 12, 0.85)',
} as const;
```

**Step A2 — mapStyle.ts: parameterize the style.** Change the signature to
`export function atlasStyle(variant: 'paper' | 'ink' = 'paper'): StyleSpecification`
and at the top of the function body:

```ts
const t = variant === 'ink' ? { ...atlas, ...atlasNight } : atlas;
```

(import `atlasNight` from './mapTokens'.) Then within the style object replace
every `atlas.x` ground/line tone reference with `t.x`: `background-color`
(t.paper), states-context fill (t.paper) + outline (t.hairline), tn-fill
(t.paperRaised), counties (t.contour), tn-contour (t.contour), tn-outline
(t.hairline), rivers-casing color (t.ink), interior fallback (t.noData),
hatch-halo fallback (t.sulphur). **Do not change** the selection orange
('#D98232'/'#F59E0B'), the condition feature-state colors (set at runtime from
`conditionColor` — Good/Fair/Poor hues are identical in both variants so the
legend stays truthful), or `rivers-water`'s '#8B8A82' fallback. Also export the
type:

```ts
export type BasemapVariant = 'paper' | 'ink' | 'topo';
```

**Step A3 — TennesseeMap.tsx: accept + switch variants without recreating the
map.** Add prop `basemap?: 'paper' | 'ink' | 'topo'` (default 'paper'). Add one
effect (after the mount effect; must NOT remount the map):

```ts
useEffect(() => {
  const map = mapRef.current;
  if (!map || !map.isStyleLoaded() || basemap === 'paper') return;
  if (basemap === 'topo') return; // Phase B: only applied when topo sources exist (Step B4)
  try {
    map.setStyle(atlasStyle(basemap) as unknown as maplibregl.StyleSpecification);
    // feature-state lives with the style — re-apply colors + selection states
    map.once('idle', () => { try { applyRef.current(); } catch { /* retry paths cover */ } });
    for (const id of allIdsRef.current ?? []) {
      try { map.setFeatureState({ source: 'rivers', id }, { dimmed: selectedId ? id !== selectedId : false, selected: id === selectedId }); } catch { /* sourcedata retries */ }
    }
  } catch { /* style not ready; next idle applies */ }
}, [basemap]);
```

Also set the container attribute so CSS can react:
on the wrapper div (`className={className ?? 'absolute inset-0'}`) add
`data-basemap={basemap ?? 'paper'}`.

**Step A4 — RiverMapPage.tsx: state + control.**

```ts
const [basemap, setBasemap] = useState<'paper' | 'ink' | 'topo'>(() => {
  const fromUrl = new URLSearchParams(window.location.search).get('basemap');
  if (fromUrl === 'ink' || fromUrl === 'topo' || fromUrl === 'paper') return fromUrl;
  const saved = localStorage.getItem('trout:basemap');
  return saved === 'ink' || saved === 'topo' ? saved : 'paper';
});
const setBasemapPersist = (v: 'paper' | 'ink' | 'topo') => {
  setBasemap(v);
  localStorage.setItem('trout:basemap', v);
  const next = new URLSearchParams(params); next.set('basemap', v); setParams(next, { replace: true });
};
```

Pass `basemap={basemap}` to `<TennesseeMap …>`. Add the control to the first
top-bar row (after `MapModeControl`): a small round button showing the current
variant name („Paper"/„Ink"/„Topo") that cycles paper → ink → paper (topo entry
appears only when Phase B's manifest exists — Step B4). Minimal, or a tiny
popover with one option per row; 44px targets; `aria-label`
"Basemap: current — change".

**Step A5 — night label CSS.** In `index.css`, find the `.atlas-place` rules
(`grep -n "atlas-place" apps/web/src/index.css`) and add directly below:

```css
[data-basemap="ink"] .atlas-place { color: #D8D2C2; text-shadow: 0 0 3px rgba(10, 15, 12, 0.85); }
[data-basemap="ink"] .atlas-place--city { color: #EDE7D7; }
```

(adjust selector shape to match how the existing rules are written).

**Step A6 — Acceptance (Phase A):** cycle to Ink: ground goes dark, rivers keep
condition colors and stay legible, selection stays orange, place labels flip to
light with halo, county hairlines visible but calm; paper UI chips remain
readable over the dark map; reload persists via localStorage; `?basemap=ink`
deep link works; no network requests beyond same-origin (privacy spec still
green); typecheck + e2e green.

### Phase B — Topo variant (USGS 3DEP)

Real data, public domain, fully local. Both phases ship together in
**Session 4** as one complete feature: run Phase A to its acceptance first,
then Phase B — the Topo entry appears only when `/atlas/topo/manifest.json`
resolves (capability detection, not deferred work).

1. **`apps/web/scripts/fetch-tn-dem.mjs`** — query The National Map API
   (`https://tnmaccess.nationalmap.gov/api/v1/products?datasets=3DEP%20Products%20%201%2F3%20arc-second&state=TN`) for TN tiles, download TIFFs into
   `apps/web/.atlas-src/dem/` (git-ignored, same pattern as
   `fetch-atlas-sources.mjs`: curl `-fL --retry 3`, skip-if-exists, `--check`).
2. **`apps/web/scripts/build-topo.mjs`** — deps to pin in apps/web
   devDependencies: `geotiff` (decode), `proj4` (DEM tiles may be UTM — reproject
   to EPSG:4326), `d3-contour` (contour rings), `sharp` (hillshade PNG tiles;
   prebuilt binaries on Windows). Outputs into `public/atlas/topo/`:
   - `contours-band{0,1,2}.geojson` — MajorTrail style: band 0 = 100 m
     intervals (statewide zooms), band 1 = 50 m, band 2 = 20 m (high zoom only);
     RDP-simplify (~0.0004°), coordinates 5dp; target total ≤ 12 MB. Each
     feature: `{ H: elevation }`; style renders band 0 heavier + labeled tone.
   - `hillshade/{z}/{x}/{y}.webp` — grayscale hillshade tiles z7–11 from a
     simple azimuth-315/altitude-45 shading of the DEM; target ≤ 60 MB total.
   - `manifest.json` — `{ bands: [...], minZoom, maxZoom, bytes }`.
3. **Style integration (guarded):** `RiverMapPage`/`TennesseeMap` probe
   `fetch('/atlas/topo/manifest.json')` once; only on success does 'Topo' appear
   in the switcher and does `atlasStyle('topo')` include: a
   `raster` source `hillshade` (tiles `/atlas/topo/hillshade/{z}/{x}/{y}.webp`,
   tileSize 256) layered just above `tn-fill` at ~0.35 opacity, plus two
   `line` sources for contour bands above counties (hairline tones, opacity
   fading in ≥ z8, band 2 only ≥ z10) — beneath all river layers. Rivers,
   selection, halos unchanged. No glyphs/symbols (contour labels come later or
   never; HTML markers already avoided the glyph pipeline).
4. **Service worker:** in `vite.shared.ts` `runtimeCaching`, add below the
   existing entry:

```ts
{
  urlPattern: /^\/atlas\/topo\//,
  handler: 'CacheFirst',
  options: {
    cacheName: 'topo-cache',
    expiration: { maxEntries: 512, maxAgeSeconds: 90 * 24 * 3600 },
    cacheableResponse: { statuses: [0, 200] },
  },
},
```

   **Do NOT add `topo/**` to `precacheGlobPatterns`** — it must never count
   against the install budget.
5. **Size budget:** `scripts/size-budget.mjs` (1.1 KB — read it first) walks
   dist. Exclude `public/atlas/topo` from the main precache-proxy number and
   print a separate line: `topo (runtime-cached, not precached): X MB` with its
   own warn threshold at 100 MB. The 25 MB gate itself stays untouched.
6. **Validation:** `scripts/validate-topo.mjs` — every contour coordinate
   inside the TN clip, band totals within targets, manifest matches files.
   Run it in the same breath as `validate-atlas.mjs`.
7. **Acceptance (Phase B):** Topo appears in the switcher only when the
   manifest exists; contours + hillshade visible and subtle at z8+; rivers
   remain the visual lead; offline: after first view, topo tiles render from
   the SW cache with the network cut; precache stays ~153 entries; budget gate
   green.

---

## Task 6f — No-data honesty fix ("0 · Poor" contradiction)

**Why (seen in the browser, 2026-09-03):** selecting a river with no gauge
readings (e.g. Clinch at that moment) showed **"0 · Poor"** in the panel while
the very next sentence said "No gauge readings are available, so conditions
cannot be assessed." A fabricated-looking score of 0 contradicts the product's
honesty principle.

**Step 6f.1** Open `apps/web/src/features/map/riverMapSelectors.ts`. Locate
`plainStatus(status, score)` (and any sibling that renders
`${score} · ${label}` in the drawer/inspector). Change the behavior so:
when `status === 'no-data'` (or the snapshot has no usable readings), render
**`No data`** instead of `0 · Poor`. Keep good/fair/poor rendering exactly as
today. Mirror the same fix anywhere else the panel prints a numeric score for
no-data rivers (check `WaterTab` in `RiverDrawer.tsx` — the "0 · Poor" list
heading came from there).

**Step 6f.2** Check the fixture path: with the standard fixture pack, Clinch
shows "No gauge readings…" — that is the correct moment to show `No data`.

**Step 6f.3 — Acceptance:** open `/?river=clinch-river` (or whichever river the
fixtures currently give no readings): header line reads "No data", gray
(`atlas.noData`), with the existing explanation bullet intact; a river WITH
readings (East Fork Stones) still reads "37 · Poor"; unit tests green (add a
small case to `apps/web/test/` if `plainStatus` has coverage); typecheck green.

---

## Task 7 — Harden `atlas-verify.spec.ts` and add the 1440×900 case

**Why two changes:**

1. The suite's `waitUntil`-style helper waits a fixed 6 s and asserts the failure
   banner count is 0 — but `toHaveCount(0)` passes *immediately* when the banner
   isn't there yet (the watchdog fires at 12 s). The tests could pass while the
   map was actually failing. Fix: wait on the readiness flags from Task 5.
2. The brief requires visual validation at **1440×900**, but the desktop test
   currently runs at Playwright's default 1280×720.

**Step 7.1** Open `e2e/web/atlas-verify.spec.ts`. Replace the whole `waitForMap`
helper (lines ~15–20):

```ts
async function waitForMap(page: import('@playwright/test').Page) {
  await page.waitForSelector('canvas.maplibregl-canvas', { timeout: 30_000 });
  // let sources load + idle settle
  await page.waitForTimeout(6000);
  await expect(page.getByText(/didn't finish loading/i)).toHaveCount(0);
}
```

with:

```ts
async function waitForMap(page: import('@playwright/test').Page) {
  await page.waitForSelector('canvas.maplibregl-canvas', { timeout: 30_000 });
  // Deterministic readiness: TennesseeMap sets data-map-ready on the container
  // when MapLibre first goes idle, or data-map-failed when its 12s watchdog
  // trips. Waiting on the pair (not a fixed sleep) is what keeps a failing map
  // from passing these tests.
  await page.waitForSelector('[data-map-ready], [data-map-failed]', { timeout: 25_000 });
  await expect(page.getByText(/didn't finish loading/i)).toHaveCount(0);
  await page.waitForTimeout(1500); // settle animations before screenshots
}
```

**Step 7.2** In the same file, find the desktop test's opening:

```ts
test('select East Fork Stones via search, desktop panel', async ({ page }) => {
  await page.goto('/?v=atlasqa', { waitUntil: 'domcontentloaded' });
```

Replace with:

```ts
test('select East Fork Stones via search, desktop panel', async ({ page }) => {
  // Brief-required acceptance viewport (was previously Playwright's 1280x720 default)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?v=atlasqa', { waitUntil: 'domcontentloaded' });
```

(The tablet test already sets 1024×768 and the mobile test 390×844 — leave them.)

**Acceptance** (run just this file; single worker keeps it deterministic — the
config-wide fix lands in Task 8):

```bash
cd /c/Users/Benjamin/Projects/trout/e2e
npx playwright test --project=web web/atlas-verify.spec.ts --workers=1
```

Expected: `4 passed`, console lines `PANEL {"found":true,...}` and
`TABLET overflowX=0`, and four fresh PNGs in `e2e/test-results/`.

---

## Task 8 — Serialize Playwright workers + canonical web command

**Why:** with default parallel workers, 8 of 25 web tests fail on this machine —
parallel MapLibre WebGL contexts plus concurrent service-worker installs starve
the SW-activation and render budgets (Chrome logs `GPU stall due to ReadPixels`
warnings). All 25 pass serialized. The brief demands CI-safe and deterministic;
deterministic beats fast here.

**Step 8.1** Open `e2e/playwright.config.ts`. Find:

```ts
  globalSetup: './global-setup.mjs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
```

Replace with:

```ts
  globalSetup: './global-setup.mjs',
  fullyParallel: true,
  // Serialized on purpose: parallel workers each boot a MapLibre WebGL context
  // and a service-worker install; on constrained machines (and 2-core CI) that
  // starves SW activation/render budgets and fails offline specs. All projects
  // pass green at workers=1; deterministic > fast for this suite.
  workers: 1,
  forbidOnly: !!process.env.CI,
```

**Step 8.2** Fix the invocation foot-gun. The documented command
`pnpm --filter @trout/e2e e2e -- --project=web` passes a literal `--` through to
Playwright (it ran 42 tests across projects and failed 5). The correct form is
`exec`. Open the root `package.json` and find:

```json
    "e2e": "pnpm --filter @trout/e2e e2e",
```

Replace with:

```json
    "e2e": "pnpm --filter @trout/e2e e2e",
    "e2e:web": "pnpm --filter @trout/e2e exec playwright test --project=web",
```

**Acceptance:**

```bash
cd /c/Users/Benjamin/Projects/trout
pnpm e2e:web --list 2>&1 | tail -2   # must end with: Total: 25 tests in 6 files
```

(`--list` does not start servers or run globalSetup — it is safe and fast.)

---

## Task 9 — Full verification pass

Run everything in order. Every step must pass before moving to the next.

```bash
cd /c/Users/Benjamin/Projects/trout

# 1. Types
pnpm --filter @trout/web typecheck          # expect: no output, exit 0

# 2. Unit tests
pnpm --filter @trout/web test               # expect: "7 passed (7)", "47 passed (47)"

# 3. Production build + PWA + size gate
pnpm --filter @trout/web build              # expect: "precache 153 entries (~3593 KiB)" (± a few entries/KiB is fine),
                                            #        "size-budget: OK — dist is X MB (limit 25 MB)"

# 4. Atlas structural gate
cd apps/web && node scripts/validate-atlas.mjs && cd ../..
# expect: "features: 92 unique ids: 92" + tailwaters line + "validate-atlas: PASS"

# 5. Web E2E, serialized (rebuilds the fixture flavor first — takes a few minutes)
pnpm e2e:web                                # expect: "25 passed" before Task 6c lands;
                                            # afterwards the total grows by the shell specs —
                                            # assert against the --list count, all green
```

**Step 9.6 — visual inspection (mandatory, not optional).** Open the four
screenshots produced in `e2e/test-results/`:

- `atlas-statewide.png` — Tennessee boundary, counties, rivers in condition
  colors, city/town labels readable, no failure banner.
- `atlas-selected-desktop.png` (**now 1440×900**) — orange East Fork Stones in
  Middle TN centered in exposed map space; desktop panel top-anchored with no
  blank upper region; **badge renders as a proper pill** (Task 6); zoom +
  attribution clear of the panel; values `37`, `19.3 cfs`, `50–400 cfs`,
  temperature unavailable.
- Wide-water spot check: open `http://127.0.0.1:8787/?river=hiwassee-river` —
  wide water renders as a soft wash with a hairline shore (Task 6b); **no
  box-shaped highlights or thick ring outlines anywhere on the map**.
- Shell spot check (Task 6c): map fills the window at 1440×900 and 390×844 —
  no header, no sidebar, no bottom tab bar; hamburger opens the drawer with all
  seven primary links; Escape closes it; document overflow is now exactly **0**,
  not merely ≤1 (the old header-based calc is gone).
- Legend spot check (Task 6d): docked bottom-left in both Conditions and
  Hatches modes; collapse toggle persists; nothing overlaps attribution/zoom.
- Basemap spot check (Task 6e Phase A): cycle to Ink — dark ground, rivers and
  selection still legible, labels flip light; persists across reload; switch
  back to Paper; **zero third-party requests in the network log in both
  variants**.
- Honesty spot check (Task 6f): a no-reading river shows "No data", never
  "0 · Poor"; East Fork Stones still shows "37 · Poor".
- `atlas-selected-tablet.png` (1024×768) — same checks; top-bar second row not
  clipped under the panel.
- `atlas-selected-mobile.png` (390×844) — bottom sheet in peek state, all five
  tabs visible.

**Step 9.7 — no unwanted data changes:**

```bash
git status --short
git diff --stat apps/web/public/atlas/rivers.geojson   # must be EMPTY
```

---

## Task 10 — Commit (GATED: only when the user explicitly says to commit)

Until the user asks, stop after Task 9 and report. If (and only if) asked:

```bash
cd /c/Users/Benjamin/Projects/trout
git add -A
git status   # review the full staged list before committing
```

Suggested commit message:

```text
fix(web): finish atlas remediation — reproducible context pipeline, deterministic e2e

- docs: correct white-oak-creek/92-92 status in atlas-sources.md
- scripts: fetch GENZ cb_ context archives; fix extraction skip-stems
- scripts: add build-atlas-context-sources.mjs (deterministic, mapshaper-free
  context intermediates + 71-place label set with containment self-check)
- scripts: build-atlas.mjs is now a clean tombstone (was a SyntaxError exit)
- web: TennesseeMap publishes data-map-ready/failed for test determinism
- web: whitespace-nowrap on the freshness badge (no more crushed pill)
- e2e: atlas-verify waits on real map readiness, adds 1440x900 case
- e2e: workers=1 (parallel WebGL+SW starved offline specs); root e2e:web alias
- web: fullscreen map shell — one hamburger drawer on all viewports; sidebar
  and bottom tabs removed; map route is true 100dvh (kills the 1px overflow)
- web: docked bottom-left legend (mode-aware, collapsible, persisted)
- web: basemap switcher — Paper / Ink night fully local; Topo variant
  feature-detected behind /atlas/topo/manifest.json (USGS 3DEP pipeline)
- web: no-data rivers render "No data", never a fabricated "0 · Poor"
```

Deploying: local services run under pm2 (`trout-api`, `trout-cron`,
`trout-marketing-static`, `trout-portal-static`). After a build, refresh the app
server with `pm2 reload trout-api --update-env`. **The public site
(`trout.tntechclimb.com`) must not be described as fixed until it is actually
deployed and read back** — and only deploy if the user asks.

---

## Appendix A — quick reference of expected values

| Check | Expected |
|---|---|
| `rivers.geojson` features / unique ids | 92 / 92 |
| Geometry families | 89 MultiLineString + 3 MultiPolygon |
| east-fork-stones-river | 11 parts, 547 vertices, bounds `[-86.442141, 35.81021, -85.949346, 35.986857]`, source `tiger-linear + nhd-dedup-15` |
| white-oak-creek | present, `tiger-linear`, 14 parts |
| EFS fixture | score 37, cfs 19.3, ideal 50–400, no temperature reading |
| Context published counts | boundary 1 · counties 95 · neighbor states 8 · places 71 (6 city / 65 town) |
| Web unit tests | 7 files / 50 tests, all pass (47 + the 3 Task 6f no-data cases) |
| Build | precache ~153 entries, ≤ ~3.95 MB of 25 MB budget |
| Web E2E (serialized) | 28 passed (workers=1) |

## Appendix B — troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `build-atlas-context-sources.mjs` throws "expected 71 curated places" | name table mismatch vs shapefile | print the shapefile NAMEs (snippet in Task 3), fix the one string in the script |
| Generator throws "interior point fell outside its own polygon" | algorithm regression from editing `interiorPoint` | restore `PENALTY = 2` and `ROWS = 33` exactly; do not retune |
| `unzip: command not found` | shell without Git Bash's unzip | `powershell -c "Expand-Archive -Force <zip> <dir>"` per archive into `.atlas-src/` |
| E2E offline specs time out | workers not serialized | confirm `workers: 1` in `e2e/playwright.config.ts` (Task 8) |
| E2E still shows failure banner in screenshots | Task 5 flags not applied or helper not replaced | re-check Steps 5.1–5.3 and 7.1 |
| `rivers.geojson` shows a diff | wrong script ran (merge-rivers or old build-atlas) | `git checkout -- apps/web/public/atlas/rivers.geojson`, find what ran it, re-run Task 9 |
| atlas tests fail on `Nashville` label | places.json regeneration changed the label point | acceptable only if point is inside its polygon; verify Task 3 Step 3.4 output, then re-run suite |
| boxy/ring-shaped highlights around wide water return | mapStyle `$type` filters removed or a line layer edited back | re-apply Task 6b exactly; every line layer must keep `filter: LINES_ONLY` |
| nav links fail after Task 6c ("Open menu" not found) | drawer button not rendered on the route under test | map route: button lives in RiverMapPage top bar via `useShell`; other routes: in the header — check `!isMapRoute` guard |
| 1px page scrollbar returns | RiverMapPage root height changed away from `h-dvh` or AppShell renders a header on `/` | restore Step 6c.2/6c.3 exactly; the shell spec asserts overflow ≤ 0 |
| Ink variant shows dark-on-dark rivers | an `atlas.x` ground tone wasn't swapped to `t.x` in mapStyle | re-check Step A2: background, tn-fill, counties, contour, casing all use `t.` |
| Ink labels unreadable | night `.atlas-place` CSS missing or `[data-basemap]` attr not set | re-check Step A3 (container attr) and Step A5 (CSS) |
| 'Topo' visible but blank | manifest probe succeeded while tiles missing, or vice versa | Topo must be feature-detected off `/atlas/topo/manifest.json`; never hardcode |
| precache balloons after Phase B | `topo/**` added to `precacheGlobPatterns` by mistake | topo is runtime `CacheFirst` only; precache stays ~153 entries |
