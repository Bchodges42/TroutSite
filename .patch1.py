import io

def patch(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new in pairs:
        assert old in s, "NOT FOUND in %s:\n%s" % (path, old[:140])
        s = s.replace(old, new, 1)
    io.open(path, 'w', encoding='utf-8', newline='').write(s)
    print('patched', path)

# ---------------------------------------------------------------- themes --
patch('apps/web/src/theme/themes.ts', [
  ("""  noData: string;
  warmwater: string;
  sulphur: string;""",
   """  noData: string;
  warmwater: string;
  /** Class-outline halo colors (2026-09-10): trout vs warmwater highlight. */
  troutOutline: string;
  warmOutline: string;
  sulphur: string;"""),
  ("""      noData: '#607b6e',
      warmwater: '#957246',
      sulphur: '#bd722c',""",
   """      noData: '#607b6e',
      warmwater: '#957246',
      troutOutline: '#1b7fa8',
      warmOutline: '#b06f14',
      sulphur: '#bd722c',"""),
  ("""      noData: '#7ca394',
      warmwater: '#c4a477',
      sulphur: '#e5b773',""",
   """      noData: '#7ca394',
      warmwater: '#c4a477',
      troutOutline: '#6fd0e8',
      warmOutline: '#f2a94f',
      sulphur: '#e5b773',"""),
])

# ---------------------------------------------------------- TennesseeMap --
patch('apps/web/src/features/map/TennesseeMap.tsx', [
  ("""  stillWaterIds?: Set<string>;""",
   """  /** Fishery-class outline per water id ('trout' | 'warmwater' | null) —
   * drives the rivers-class-outline halo (2026-09-10). Absent = unclassified. */
  classOutlines?: Map<string, 'trout' | 'warmwater' | null>;
  stillWaterIds?: Set<string>;"""),
  ("""            assessed: p.assessedIds?.has(river.id) ?? false,
            hatchActive: p.hatchActiveIds?.has(river.id) ?? false,""",
   """            assessed: p.assessedIds?.has(river.id) ?? false,
            outlineClass: p.classOutlines?.get(river.id) ?? '',
            hatchActive: p.hatchActiveIds?.has(river.id) ?? false,"""),
  ("""      // species the catalog leaves unset reads "Unverified" in place of the
      // assessment suffix — never an implied trout or condition claim.
      const note = labelSpeciesNote({ id: river.id, species }, { troutIds });
      const unassessedWord = note === 'Unverified' ? 'Unverified' : 'Unassessed';""",
   """      // species the catalog leaves unset reads "Needs data" in place of the
      // assessment suffix — never an implied trout or condition claim.
      const note = labelSpeciesNote({ id: river.id, species }, { troutIds });
      const unassessedWord = note === 'Unverified' ? 'Needs data' : 'Unassessed';"""),
])

# -------------------------------------------------------------- mapStyle --
patch('apps/web/src/features/map/mapStyle.ts', [
  ("""      // Rivers — condition centerline (feature-state `color` set live by""",
   """      // Fishery-class outline (2026-09-10): a halo AROUND the condition
      // centerline encoding the water's CLASS — cold trout waters glow
      // ice-blue, warmwater glows amber, unclassified waters get nothing.
      // Drawn wider than the interior so the condition color reads inside it;
      // hidden for the selected water (selection has its own ring).
      {
        id: 'rivers-class-outline',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'match',
            ['feature-state', 'outlineClass'],
            'trout',
            t.troutOutline,
            'warmwater',
            t.warmOutline,
            'rgba(0,0,0,0)',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0,
            ['==', ['feature-state', 'outlineClass'], 'trout'],
            4.6,
            3.6,
          ],
          'line-opacity': [
            'case',
            ['==', ['feature-state', 'outlineClass'], ''],
            0,
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            0.85,
          ],
        },
      },
      // Rivers — condition centerline (feature-state `color` set live by"""),
  ("""          'symbol-placement': 'line',
          // ~1 arrow every 130 screen px — readable cadence without clutter.
          'symbol-spacing': 130,""",
   """          'symbol-placement': 'line',
          // ~1 arrow every 105 screen px — the 2026-09-10 owner pass found
          // the old cadence too sparse to read flow at corridor scale.
          'symbol-spacing': 105,"""),
  ("""          'icon-size': ['interpolate', ['linear'], ['zoom'], 6.5, 0.55, 11, 1.0],""",
   """          'icon-size': ['interpolate', ['linear'], ['zoom'], 6.5, 0.85, 11, 1.55],"""),
])

# ------------------------------------------------------------ flowArrows --
patch('apps/web/src/features/map/flowArrows.ts', [
  ("""  if (typeof document === 'undefined') return null;
  const size = 44;""",
   """  if (typeof document === 'undefined') return null;
  // 2026-09-10 owner pass: the 44px glyph vanished against the corridor at
  // overview zoom — 56px with a heavier rim and a fatter core reads at both
  // statewide and regional scales.
  const size = 56;"""),
  ("""  const triangle = () => {
    ctx.beginPath();
    ctx.moveTo(8, 9);
    ctx.lineTo(36, 22);
    ctx.lineTo(8, 35);
    ctx.closePath();
  };""",
   """  const triangle = () => {
    ctx.beginPath();
    ctx.moveTo(10, 11);
    ctx.lineTo(46, 28);
    ctx.lineTo(10, 45);
    ctx.closePath();
  };"""),
  ("""  ctx.strokeStyle = halo;
  ctx.lineWidth = 6;""",
   """  ctx.strokeStyle = halo;
  ctx.lineWidth = 7;"""),
  ("""  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(11, 12);
  ctx.lineTo(31.5, 22);
  ctx.lineTo(11, 32);
  ctx.closePath();
  ctx.fill();""",
   """  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(14, 15);
  ctx.lineTo(39.5, 28);
  ctx.lineTo(14, 41);
  ctx.closePath();
  ctx.fill();"""),
])

# ------------------------------------------------- water-decision tests --
patch('apps/web/test/water-decision.test.tsx', [
  ("      'Unverified',", "      'Needs data',"),
  ("expect(decisionStatusText(view, { species: undefined, status: 'good' })).toBe('Unverified');",
   "expect(decisionStatusText(view, { species: undefined, status: 'good' })).toBe('Needs data');"),
])

# ------------------------------------------------------------ MapControls --
patch('apps/web/src/features/map/MapControls.tsx', [
  ("""            <div className="space-y-3">
              <div className="md:hidden">
                <p className="eyebrow mb-1.5">Species</p>
                <Segmented
                  ariaLabel="Species"
                  size="sm"
                  value={species}
                  onChange={onSpecies}
                  options={[{ value: 'trout', label: 'Trout' }, { value: 'all', label: 'All fish' }]}
                />
              </div>
              <div>""",
   """            <div className="space-y-3">
              <div>"""),
])
print('ALL PATCHES OK')
