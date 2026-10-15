# Source implementation receipts — October 14, 2026

This supplements the frozen 190-water source audit; it does not replace those captures.
UTC receipts from October 15 correspond to the evening of October 14 in Tennessee.

- `live-check.json` is normalized output from the actual new CWMS, USGS Statistics and
  WQP adapters. It includes source URLs, values and observation/retrieval times. It is
  **not** a raw HTTP-response archive. Checks used read-only requests and a disposable DB.
- `receipts.json` records exact byte counts/hashes for five copied receipts. `.gitattributes`
  protects those files against checkout newline conversion.
- `implementation-inventory.json`: 200 catalog/map waters, all 190 original map features
  unchanged, 94 editorial flow bands, 13 gauge policies, 31 special regulations, and the
  same 34 waters without fishery-specific sources (36 unresolved opportunities total).
- `regulated-water-identities.json`: the ten added waters and their reviewed identity/reach.
- `twra-pond-points.json` / `twra-pond-request.json`: official TWRA points and exact query
  provenance. Acorn is one lake point; Dillard's marker represents one of four pond points.
- `taxon-tail-repair-ledger.json`: all 64 tail-count changes and stated basis. Eight counts
  remain unknown. The ledger is not a certification of every biological taxon attribute.
- `hatch-article-review.json`: primary-paper URL/hash, visually reviewed printed pages,
  methods, mapped genera and the deliberately limited supported claim. The paper is
  scanned; rendered Table 2 and methods were inspected. The article itself is not bundled.

The original audit's exact CWMS captures remain in `../2026-10-14-source-audit/captures/`.
The USGS Statistics fixture is in `apps/api/fixtures/USGS-STATISTICS/`. Historical samples
and archived responses are never substituted for fresh live conditions.
