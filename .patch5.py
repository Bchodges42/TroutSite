import io

def patch(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new in pairs:
        assert old in s, "NOT FOUND in %s:\n%s" % (path, old[:200])
        s = s.replace(old, new, 1)
    io.open(path, 'w', encoding='utf-8', newline='').write(s)
    print('patched', path)

# ------------------------------------------- dash layers: offseason shows --
patch('apps/web/src/features/map/mapStyle.ts', [
  ("""          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5.6,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              0.5,
            ],
            7.4,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              0.22,
            ],
            8.6,
            0,
          ],""",
   """          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5.6,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'offseason'], false],
              0.5,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              0.5,
            ],
            7.4,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'offseason'], false],
              0.22,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              0.22,
            ],
            8.6,
            0,
          ],"""),
  ("""          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7.4,
            0,
            8.6,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              0.75,
            ],""",
   """          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7.4,
            0,
            8.6,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'offseason'], false],
              0.75,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              0.75,
            ],"""),
])

# the 9.4 stop of the local dash layer shares the same assessed-gate shape
s = io.open('apps/web/src/features/map/mapStyle.ts', encoding='utf-8').read()
old = """            9.4,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              1,
            ],"""
new = """            9.4,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'offseason'], false],
              1,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              1,
            ],"""
assert old in s
s = s.replace(old, new, 1)
io.open('apps/web/src/features/map/mapStyle.ts', 'w', encoding='utf-8', newline='').write(s)
print('patched mapStyle 9.4 stop')

# ------------------------------------------------- waterDecision: dimming --
patch('apps/web/src/features/map/waterDecision.ts', [
  ("""  // Trout-mode visibility (owner direction 2026-09-10, refined: only waters
  // with trout AVAILABLE NOW). A documented trout water out of season — Stones
  // River, a December–February stocking, in September — is NOT a trout option
  // today and is hidden; it stays discoverable in all-fish mode. Unclassified
  // waters stay discoverable but never read as trout. A warmwater base with a
  // real winter program (the Harpeth) is only de-emphasized while in season.
  let visibility: WaterDecisionView['visibility'] = 'include';
  if (mode === 'trout') {
    if (warmwater) {
      if (!calendar) {
        // No calendar in this bundle: the legacy owner ruling (2026-09-04)
        // applies unchanged — a stocked warmwater water stays visible-but-dim.
        visibility = feature.stream.stockingProgram ? 'deemphasize' : 'exclude';
      } else {
        visibility =
          feature.stream.stockingProgram && presence?.state === 'present'
            ? 'deemphasize'
            : 'exclude';
      }
    } else if (presence?.state === 'absent') {
      visibility = 'exclude';
    }
  }""",
   """  // Trout-mode visibility (owner direction 2026-09-10, refined same day:
  // "I don't want them completely gone but MUCH easier to distinguish"). A
  // documented trout water out of season — Stones River, a December–February
  // stocking, in September — STAYS VISIBLE but de-emphasized: dimmed on the
  // map, dashed, labeled "no trout now", sorted last. Waters the calendar
  // documents as having no trout program at all (Kentucky Lake) are excluded
  // outright. Unclassified waters stay discoverable but never read as trout.
  let visibility: WaterDecisionView['visibility'] = 'include';
  if (mode === 'trout') {
    if (warmwater) {
      if (!calendar) {
        // No calendar in this bundle: the legacy owner ruling (2026-09-04)
        // applies unchanged — a stocked warmwater water stays visible-but-dim.
        visibility = feature.stream.stockingProgram ? 'deemphasize' : 'exclude';
      } else {
        visibility = feature.stream.stockingProgram ? 'deemphasize' : 'exclude';
      }
    } else if (presence?.state === 'absent') {
      visibility = 'deemphasize';
    } else if (presence?.state === 'none') {
      visibility = 'exclude';
    }
  }"""),
])
print('BATCH B OK')
