#!/usr/bin/env bash
# One-off subset fetch for the Caney Fork geometry fix + lakes layer.
# Uses the same Census TIGER2024 layout as fetch-atlas-sources.mjs so the
# existing scripts still see them. Files already on disk are skipped.
set -u
SRC="$(dirname "$0")/../.atlas-src"
BASE="https://www2.census.gov/geo/tiger/TIGER2024"
mkdir -p "$SRC/lw" "$SRC/aw" "$SRC/shp" "$SRC/awshp"

LW="035 087 041 141 159 175 177 185"
AW="001 005 009 013 019 021 025 027 029 031 035 037 039 041 051 057 063 065 073 079 083 087 089 093 095 105 107 111 115 121 123 133 135 137 139 141 143 145 149 155 159 161 163 165 173 175 177 185 189"

for f in $LW; do
  z="tl_2024_47${f}_linearwater.zip"
  [ -s "$SRC/lw/$z" ] || curl -fsSL --retry 3 -o "$SRC/lw/$z" "$BASE/LINEARWATER/$z" && echo "lw $f ok"
done
for f in $AW; do
  z="tl_2024_47${f}_areawater.zip"
  [ -s "$SRC/aw/$z" ] || curl -fsSL --retry 3 -o "$SRC/aw/$z" "$BASE/AREAWATER/$z" && echo "aw $f ok"
done

for z in "$SRC"/lw/*.zip; do
  stem="$(basename "$z" .zip)"
  [ -f "$SRC/shp/$stem.shp" ] || unzip -o -q "$z" -d "$SRC/shp/"
done
for z in "$SRC"/aw/*.zip; do
  stem="$(basename "$z" .zip)"
  [ -f "$SRC/awshp/$stem.shp" ] || unzip -o -q "$z" -d "$SRC/awshp/"
done
echo "SUBSET FETCH DONE: $(ls "$SRC/shp"/*.shp 2>/dev/null | wc -l) lw shp, $(ls "$SRC/awshp"/*.shp 2>/dev/null | wc -l) aw shp"
