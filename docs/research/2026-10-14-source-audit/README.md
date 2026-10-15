# Source audit evidence — October 14, 2026

These are read-only research requests, not production feed changes. Request timestamps
are UTC; `2026-10-15T03:xxZ` is the evening of October 14 in America/Chicago.

- `requests.json`: 29 exact request URLs, retrieval times, HTTP/error outcomes, byte
  counts and SHA-256 hashes. A successful HTTP status alone does not establish usable data.
- `captures/`: 25 compact original API responses. Large OpenAPI specifications and the
  complete 2024 WQP CSV are omitted; their URL, size and hash remain in the manifest.
- `summary.json`: parsed temperature-record counts, example USGS statistics, and Corps
  value counts/units. The WQP CSV was parsed as CSV, including quoted multiline cells:
  **3,985 records**, not the larger physical-line count.
- `catalog-inventory.json`: the 190 catalog waters, exact USGS IDs, 94 flow ranges,
  regulation associations after repairs, and the 34 unresolved fishery-evidence gaps.

All counts describe this checkout after `aa0a8a7`. Archived responses are historical
evidence; fetching their URLs later may return different data. Some failed requests
worked through the research browser instead (notably tn.gov regulations); do not interpret
one transport failure as absence of the source. The narrative report distinguishes
direct API results, official-page research, and inherited verification.

See [the report](../../reports/2026-10-14-source-verification-followup.md) for findings,
limits, source citations, tests and the proposed implementation order.
