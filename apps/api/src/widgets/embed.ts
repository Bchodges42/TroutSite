import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileAtomic } from '../lib/jsonFile.js';
import {
  WIDGET_SEMANTICS,
  assembleWaterRows,
  bandStatusLabel,
  buildConditionsWidgetModel,
  buildReadingRows,
  buildStockingText,
  buildWaterModel,
  capitalizeWords,
  formatAge,
  formatDetailUrl,
  formatMetricNumber,
  matchStockingEvents,
  monthYear,
  parseWatersParam,
  readingObservedMs,
  scoreBand,
  speciesDisplayName,
  waterTypeLabel,
} from './plan.js';

/**
 * Shop conditions widget — static artifact generator (ADR 0018).
 *
 * The widget is ONE self-contained HTML file at /v1/widgets/conditions-embed.html,
 * emitted by the snapshot builder's hourly pass exactly like every other served
 * file: inline CSS, inline vanilla JS, no external requests — the only network
 * calls it ever makes are same-origin fetches of the public /v1/*.json snapshots
 * the site itself serves. Per-shop selection rides the ?waters=id1,id2 query at
 * runtime, so there are no per-shop files in v1 and the artifact bytes are
 * deterministic (no build-time timestamps — repeated builds are byte-identical).
 *
 * No-tracking rules (binding, ADR 0018): no cookies, no localStorage, no
 * analytics, no visitor location, no referrer leak (<meta name="referrer"
 * content="no-referrer"> + rel="noreferrer" on the outbound link), and every
 * rendered data string goes through createTextNode/textContent — never
 * innerHTML — so catalog-sourced text (water names) can never inject markup.
 *
 * Model parity discipline: the inline script embeds the compiled source of the
 * plan.ts functions below via Function.prototype.toString() (see the
 * serialization discipline note in plan.ts). The artifact therefore executes
 * the exact model that plan.ts's tests pin, and test/widgets.test.ts evaluates
 * the emitted bytes in Node to prove the parity mechanically.
 */

/** The artifact file name (served at /v1/widgets/conditions-embed.html). */
export const CONDITIONS_EMBED_ARTIFACT = 'conditions-embed.html';

/** Every file the widgets emitter owns (the keep-set for the prune pass). */
export const WIDGET_ARTIFACTS: readonly string[] = [CONDITIONS_EMBED_ARTIFACT];

/** plan.ts functions embedded into the artifact, in dependency order. */
const EMBEDDED_MODEL_FUNCTIONS: readonly ((...args: never[]) => unknown)[] = [
  parseWatersParam,
  scoreBand,
  bandStatusLabel,
  waterTypeLabel,
  formatMetricNumber,
  formatAge,
  readingObservedMs,
  buildReadingRows,
  capitalizeWords,
  speciesDisplayName,
  matchStockingEvents,
  monthYear,
  buildStockingText,
  formatDetailUrl,
  buildWaterModel,
  assembleWaterRows,
  buildConditionsWidgetModel,
];

/** The compiled, browser-ready source of the embedded model functions. */
function modelScriptSource(): string {
  return EMBEDDED_MODEL_FUNCTIONS.map((fn) => String(fn)).join('\n\n');
}

/** Runtime bootstrap (hand-written, DOM+fetch layer only; all semantics live in
 *  the embedded model functions). Kept inert when script is evaluated without a
 *  document (the parity test) via the `typeof document` guard. */
function runtimeScriptSource(): string {
  return `if (typeof document !== 'undefined') {
  var params = new URLSearchParams(location.search);
  var theme = params.get('theme');
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  }
  var root = document.getElementById('trout-widget-root');
  var sem = SEM;
  var ids = parseWatersParam(params.get('waters'), sem.maxWaters);

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== null && text !== undefined) node.textContent = text;
    return node;
  }
  function showState(message, detail) {
    var box = el('div', 'tw-state');
    box.appendChild(el('p', 'tw-state-msg', message));
    if (detail) box.appendChild(el('p', 'tw-state-detail', detail));
    root.replaceChildren(box);
  }
  function fetchJson(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }
  function render(waters) {
    var frag = document.createDocumentFragment();
    frag.appendChild(el('p', 'tw-attribution', sem.sourceAttribution));
    for (var i = 0; i < waters.length; i++) frag.appendChild(renderWater(waters[i]));
    root.replaceChildren(frag);
  }
  function renderWater(water) {
    var card = el('section', 'tw-card' + (water.band ? ' tw-band-' + water.band : ' tw-band-none'));
    var head = el('div', 'tw-card-head');
    var title = el('div', 'tw-title');
    title.appendChild(el('span', 'tw-name', water.name));
    title.appendChild(el('span', 'tw-type', water.typeLabel));
    head.appendChild(title);
    var pill = el('span', 'tw-pill', water.statusLabel);
    if (water.band) pill.setAttribute('data-band', water.band);
    head.appendChild(pill);
    card.appendChild(head);

    if (water.readings.length > 0) {
      var rows = el('ul', 'tw-readings');
      for (var r = 0; r < water.readings.length; r++) {
        var row = water.readings[r];
        var li = el('li', 'tw-reading' + (row.stale ? ' tw-stale' : ''));
        li.appendChild(el('span', 'tw-metric', row.label));
        li.appendChild(el('span', 'tw-value', row.valueText));
        li.appendChild(el('span', 'tw-age', row.ageText));
        rows.appendChild(li);
      }
      card.appendChild(rows);
    } else {
      card.appendChild(el('p', 'tw-noreadings', sem.unavailableLabel));
    }

    if (water.speciesRows.length > 0) {
      var sp = el('ul', 'tw-species');
      for (var s = 0; s < water.speciesRows.length; s++) {
        var sr = water.speciesRows[s];
        var sli = el('li', 'tw-species-row');
        sli.appendChild(el('span', 'tw-metric', sr.species));
        sli.appendChild(el('span', 'tw-pill tw-pill-small', sr.statusLabel));
        sp.appendChild(sli);
      }
      card.appendChild(sp);
    } else if (water.species.length > 0) {
      card.appendChild(el('p', 'tw-species-note', 'Species: ' + water.species.join(', ')));
    }

    if (water.stockingText) card.appendChild(el('p', 'tw-stock', water.stockingText));

    var foot = el('p', 'tw-foot');
    var link = el('a', 'tw-link', sem.openLabel);
    link.href = water.openUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    foot.appendChild(link);
    card.appendChild(foot);
    return card;
  }

  if (ids.length === 0) {
    showState(sem.usageHint, sem.sourceAttribution);
  } else {
    showState(sem.loadingLabel, null);
    Promise.allSettled([fetchJson(sem.streamsUrl), fetchJson(sem.conditionsUrl)]).then(function (main) {
      if (main[0].status !== 'fulfilled' || main[1].status !== 'fulfilled') {
        showState(sem.fetchErrorLabel, sem.sourceAttribution);
        return;
      }
      var fish = {};
      var stock = {};
      var states = main[0].value;
      var conditions = main[1].value;
      var stateIds = {};
      for (var i = 0; i < ids.length; i++) {
        for (var j = 0; j < states.length; j++) {
          if (states[j].id === ids[i] && states[j].stateId) stateIds[states[j].stateId] = true;
        }
      }
      var pending = [];
      for (var w = 0; w < ids.length; w++) {
        pending.push(fetchJson(sem.fishabilityUrlTemplate.replace('{id}', encodeURIComponent(ids[w]))));
      }
      var stateList = Object.keys(stateIds);
      for (var st = 0; st < stateList.length; st++) {
        pending.push(fetchJson(sem.stockingUrlTemplate.replace('{state}', encodeURIComponent(stateList[st]))));
      }
      Promise.allSettled(pending).then(function (results) {
        var fishCount = ids.length;
        for (var k = 0; k < results.length; k++) {
          var out = results[k];
          if (out.status !== 'fulfilled' || !out.value) continue;
          if (k < fishCount) {
            if (out.value.streamId) fish[out.value.streamId] = out.value;
          } else {
            var events = out.value;
            for (var e = 0; e < events.length; e++) {
              var name = events[e].streamName;
              if (!stock[name]) stock[name] = [];
              stock[name].push(events[e]);
            }
          }
        }
        var model = buildConditionsWidgetModel(
          {
            watersParam: ids.join(','),
            streams: states,
            conditions: conditions,
            fishabilityByWater: fish,
            stockingByWater: groupStockingByWater(stock, states),
            nowMs: Date.now(),
            siteUrl: '',
          },
          sem,
        );
        if (model.waters.length === 0) {
          showState(sem.fetchErrorLabel, sem.sourceAttribution);
          return;
        }
        render(model.waters);
      });
    });
  }

  function groupStockingByWater(stock, states) {
    var byWater = {};
    for (var i = 0; i < states.length; i++) {
      var stream = states[i];
      var lowerNames = [stream.name];
      if (stream.aliases) {
        for (var a = 0; a < stream.aliases.length; a++) lowerNames.push(stream.aliases[a]);
      }
      var events = [];
      for (var key in stock) {
        var lowerKey = key.trim().toLowerCase();
        for (var n = 0; n < lowerNames.length; n++) {
          if (lowerNames[n].trim().toLowerCase() === lowerKey) {
            events = events.concat(stock[key]);
            break;
          }
        }
      }
      if (events.length > 0) byWater[stream.id] = events;
    }
    return byWater;
  }
}`;
}

/**
 * Render the complete self-contained HTML artifact. Deterministic: same inputs
 * → same bytes (the snapshot builder's generation verification relies on it).
 */
export function renderConditionsEmbedHtml(options?: { siteUrl?: string }): string {
  // siteUrl is accepted for future absolute-link builds (ADR 0018); the shipped
  // artifact uses relative detail URLs, which are correct inside the iframe.
  void options?.siteUrl;
  const semJson = JSON.stringify(WIDGET_SEMANTICS);
  const script = `var SEM = ${semJson};\n\n${modelScriptSource()}\n\n${runtimeScriptSource()}\n`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<title>Water conditions — Trout</title>
<style>
:root {
  color-scheme: light dark;
  --tw-bg: #f4f6f3;
  --tw-card: #ffffff;
  --tw-text: #1c2321;
  --tw-muted: #5b6a63;
  --tw-border: #d8dfd9;
  --tw-good: #1a7f4b;
  --tw-good-bg: #e4f3ea;
  --tw-fair: #9a6b06;
  --tw-fair-bg: #faf0d7;
  --tw-poor: #b3372c;
  --tw-poor-bg: #fae5e2;
  --tw-none: #5b6a63;
  --tw-none-bg: #eceeee;
}
@media (prefers-color-scheme: dark) {
  :root {
    --tw-bg: #10161a;
    --tw-card: #182126;
    --tw-text: #e8eeeb;
    --tw-muted: #93a39b;
    --tw-border: #2a363c;
    --tw-good: #4cc38a;
    --tw-good-bg: #14301f;
    --tw-fair: #e0a92f;
    --tw-fair-bg: #33290f;
    --tw-poor: #ef7f72;
    --tw-poor-bg: #371712;
    --tw-none: #93a39b;
    --tw-none-bg: #1e272c;
  }
}
:root[data-theme='light'] {
  color-scheme: light;
  --tw-bg: #f4f6f3;
  --tw-card: #ffffff;
  --tw-text: #1c2321;
  --tw-muted: #5b6a63;
  --tw-border: #d8dfd9;
  --tw-good: #1a7f4b;
  --tw-good-bg: #e4f3ea;
  --tw-fair: #9a6b06;
  --tw-fair-bg: #faf0d7;
  --tw-poor: #b3372c;
  --tw-poor-bg: #fae5e2;
  --tw-none: #5b6a63;
  --tw-none-bg: #eceeee;
}
:root[data-theme='dark'] {
  color-scheme: dark;
  --tw-bg: #10161a;
  --tw-card: #182126;
  --tw-text: #e8eeeb;
  --tw-muted: #93a39b;
  --tw-border: #2a363c;
  --tw-good: #4cc38a;
  --tw-good-bg: #14301f;
  --tw-fair: #e0a92f;
  --tw-fair-bg: #33290f;
  --tw-poor: #ef7f72;
  --tw-poor-bg: #371712;
  --tw-none: #93a39b;
  --tw-none-bg: #1e272c;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 8px;
  background: var(--tw-bg);
  color: var(--tw-text);
  font: 14px/1.45 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
.tw { max-width: 420px; margin: 0 auto; }
.tw-state { padding: 12px; text-align: center; }
.tw-state-msg { margin: 0 0 4px; font-weight: 600; }
.tw-state-detail { margin: 0; color: var(--tw-muted); font-size: 12px; }
.tw-attribution { margin: 0 0 8px; color: var(--tw-muted); font-size: 11px; }
.tw-card {
  background: var(--tw-card);
  border: 1px solid var(--tw-border);
  border-left: 4px solid var(--tw-none);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.tw-band-good { border-left-color: var(--tw-good); }
.tw-band-fair { border-left-color: var(--tw-fair); }
.tw-band-poor { border-left-color: var(--tw-poor); }
.tw-card-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.tw-title { min-width: 0; }
.tw-name { font-weight: 700; margin-right: 6px; overflow-wrap: anywhere; }
.tw-type { color: var(--tw-muted); font-size: 12px; }
.tw-pill {
  flex: none;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--tw-none-bg);
  color: var(--tw-none);
}
.tw-pill[data-band='good'] { background: var(--tw-good-bg); color: var(--tw-good); }
.tw-pill[data-band='fair'] { background: var(--tw-fair-bg); color: var(--tw-fair); }
.tw-pill[data-band='poor'] { background: var(--tw-poor-bg); color: var(--tw-poor); }
.tw-pill-small { font-size: 11px; padding: 1px 6px; }
.tw-readings, .tw-species { list-style: none; margin: 8px 0 0; padding: 0; }
.tw-reading, .tw-species-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 0;
  border-top: 1px solid var(--tw-border);
}
.tw-metric { color: var(--tw-muted); }
.tw-value { font-weight: 600; }
.tw-age { color: var(--tw-muted); font-size: 12px; }
.tw-stale .tw-value, .tw-stale .tw-age { opacity: 0.65; font-weight: 500; }
.tw-stale .tw-age::after { content: ' (old)'; }
.tw-noreadings, .tw-species-note, .tw-stock { margin: 8px 0 0; color: var(--tw-muted); font-size: 12px; }
.tw-foot { margin: 8px 0 0; }
.tw-link { color: var(--tw-good); font-weight: 600; }
</style>
</head>
<body>
<main id="trout-widget-root" class="tw">
<noscript><p class="tw-state-msg">Conditions need JavaScript — check the river directly.</p></noscript>
</main>
<script>
${script}</script>
</body>
</html>
`;
}

export interface WidgetEmitContext {
  /** The staging (or live) v1 directory the artifact tree hangs off. */
  v1Dir: string;
  /** The generation manifest — every emitted/removed path is appended. */
  files: string[];
  /** SITE_URL origin baked into detail links ('' → relative; see ADR 0018). */
  siteUrl?: string;
}

/**
 * Emit the widget artifacts into `v1Dir` and prune anything in the widgets
 * directory the current emit set no longer contains (same prune lifecycle as
 * the per-state stocking/shop passes: the widgets directory must equal the
 * emit set exactly). Returns the number of artifacts emitted.
 */
export function emitWidgetArtifacts(ctx: WidgetEmitContext): number {
  const widgetsDir = join(ctx.v1Dir, 'widgets');
  for (const name of WIDGET_ARTIFACTS) {
    const html = name === CONDITIONS_EMBED_ARTIFACT ? renderConditionsEmbedHtml({ siteUrl: ctx.siteUrl }) : '';
    if (html === '') continue;
    const path = join(widgetsDir, name);
    writeFileAtomic(path, html);
    ctx.files.push(path);
  }
  pruneWidgetFiles(widgetsDir, ctx.files);
  return WIDGET_ARTIFACTS.length;
}

/**
 * Remove widget files outside the current emit set — a retired artifact must
 * not linger at its served URL after the emitter stops producing it (the
 * `v1/widgets/` directory is fully owned by this emitter).
 */
function pruneWidgetFiles(widgetsDir: string, files: string[]): void {
  let existing: string[];
  try {
    existing = readdirSync(widgetsDir);
  } catch {
    return;
  }
  for (const f of existing) {
    if (WIDGET_ARTIFACTS.includes(f)) continue;
    const p = join(widgetsDir, f);
    rmSync(p, { recursive: true, force: true });
    files.push(`${p} (removed)`);
  }
}
