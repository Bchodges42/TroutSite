#!/usr/bin/env bash
# nhd_convert_gdb.sh — ONE-TIME GDAL conversion: USGS NHD HU8 FileGDB → committed JSONL.
#
# Usage:
#   scripts/nhd_convert_gdb.sh <hu8code> <path-to-NHD_H_<hu8>_HU8_GDB.gdb> [path-to-source-zip]
#
# Example:
#   scripts/nhd_convert_gdb.sh 06010207 /tmp/nhd06010207/NHD_H_06010207_HU8_GDB.gdb \
#     /tmp/nhd06010207/NHD_H_06010207_HU8_GDB.zip
#
# GDAL (ogr2ogr) is a MAINTAINER TOOL ONLY — it must never become a build, test,
# or CI dependency. The derived JSONL under data/nhd/hu8/ is the interface that
# everything downstream (nhd_build_graph.mjs, nhd_trace.mjs) consumes.
# See docs/NHD-CONVENTIONS.md for the frozen schema and naming contract.
set -euo pipefail

HU8="${1:?usage: nhd_convert_gdb.sh <hu8code> <path-to-gdb> [path-to-zip]}"
GDB="${2:?usage: nhd_convert_gdb.sh <hu8code> <path-to-gdb> [path-to-zip]}"
ZIP="${3:-}"

command -v ogr2ogr >/dev/null 2>&1 || {
  echo "error: ogr2ogr not found — install GDAL once (brew install gdal); it is not a project dependency" >&2
  exit 1
}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/data/nhd/hu8"
mkdir -p "$OUT"

# Flowline layer: named Stream/River (ftype 460) + named Artificial Path (ftype 558).
# Connectors (334) and unnamed features are intentionally excluded — see conventions.
FLOW_SELECT="permanent_identifier,gnis_id,gnis_name,ftype,fcode,reachcode,flowdir,lengthkm,mainpath,innetwork,wbarea_permanent_identifier"
FLOW_WHERE="ftype IN (460, 558) AND gnis_name IS NOT NULL"

# VAA table ships ALL flowlines in the HU8; consumers join by permanent_identifier.
VAA_SELECT="permanent_identifier,streamlevel,streamorder,fromnode,tonode,hydroseq,levelpathid,pathlengthkm,terminalpathid,arbolatesumkm,divergenceflag,startflag,terminalflag,dnlevel,uplevelpathid,uphydroseq,dnlevelpathid,dnminhydroseq,dndraincount"

PRECISION=6 # decimal places kept in the committed intermediate (~0.11 m)

echo "→ flowlines: $OUT/$HU8.jsonl"
ogr2ogr -f GeoJSONSeq -lco RS=no -lco COORDINATE_PRECISION="$PRECISION" -dim XY \
  -select "$FLOW_SELECT" -where "$FLOW_WHERE" -t_srs EPSG:4326 \
  "$OUT/$HU8.jsonl" "$GDB" NHDFlowline

echo "→ VAA: $OUT/$HU8.vaa.jsonl"
ogr2ogr -f GeoJSONSeq -lco RS=no \
  -select "$VAA_SELECT" \
  "$OUT/$HU8.vaa.jsonl" "$GDB" NHDFlowlineVAA

# Waterbodies carry NO geometry: their only job downstream is resolving
# wbarea_permanent_identifier → name/type (dam termini). GeoJSONSeq ignores
# `-nlt NONE`, so ogr2ogr writes to a temp file and Node strips geometry.
echo "→ waterbodies: $OUT/$HU8.waterbodies.jsonl"
ogr2ogr -f GeoJSONSeq -lco RS=no \
  -select "permanent_identifier,gnis_id,gnis_name,ftype,fcode" \
  -where "gnis_name IS NOT NULL" \
  "$OUT/.tmp.$HU8.waterbodies.jsonl" "$GDB" NHDWaterbody
node - "$OUT/.tmp.$HU8.waterbodies.jsonl" "$OUT/$HU8.waterbodies.jsonl" <<'EOF'
const fs = require("node:fs");
const [tmp, out] = process.argv.slice(2);
const rows = fs
  .readFileSync(tmp, "utf8")
  .trimEnd()
  .split("\n")
  .map((l) => {
    const f = JSON.parse(l);
    return { type: "Feature", properties: f.properties, geometry: null };
  });
fs.writeFileSync(out, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
fs.unlinkSync(tmp);
EOF

node - "$HU8" "$OUT" "$PRECISION" "$FLOW_WHERE" "$ZIP" "$GDB" <<'EOF'
const fs = require("node:fs");
const crypto = require("node:crypto");
const { execSync } = require("node:child_process");
const [hu8, out, precision, flowWhere, zip, gdb] = process.argv.slice(2);
const sha256 = (p) =>
  crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const lines = (p) => fs.readFileSync(p, "utf8").trimEnd().split("\n").length;
const meta = {
  hu8,
  convertedAt: new Date().toISOString(),
  gdal: execSync("ogr2ogr --version").toString().trim(),
  source: {
    product: "USGS National Hydrography Dataset Best Resolution, HU8 FileGDB",
    index:
      "https://prd-tnm.s3.amazonaws.com/index.html?prefix=StagedProducts/Hydrography/NHD/HU8/GDB/",
    object: `StagedProducts/Hydrography/NHD/HU8/GDB/NHD_H_${hu8}_HU8_GDB.zip`,
    zipSha256: zip ? sha256(zip) : null,
    published: null,
  },
  filter: { flowlines: flowWhere, vaa: "all flowlines in HU8 (join by permanent_identifier)" },
  coordinatePrecision: Number(precision),
  crs: "EPSG:4326 (source NAD83/EPSG:4269, transformed on convert)",
  counts: {
    flowlines: lines(`${out}/${hu8}.jsonl`),
    vaa: lines(`${out}/${hu8}.vaa.jsonl`),
    waterbodies: lines(`${out}/${hu8}.waterbodies.jsonl`),
  },
};
try {
  const xml = `${gdb.substring(0, gdb.lastIndexOf("/"))}/NHD_H_${hu8}_HU8_GDB.xml`;
  const m = fs.readFileSync(xml, "utf8").match(/<pubdate>(\d{8})<\/pubdate>/);
  if (m) meta.source.published = m[1];
} catch {
  /* metadata xml is optional provenance */
}
fs.writeFileSync(`${out}/${hu8}.meta.json`, JSON.stringify(meta, null, 2) + "\n");
console.log(`→ meta: ${out}/${hu8}.meta.json`);
console.log(`  flowlines=${meta.counts.flowlines} vaa=${meta.counts.vaa} waterbodies=${meta.counts.waterbodies}`);
EOF

echo "→ sizes:"
ls -lh "$OUT" | grep "$HU8"
