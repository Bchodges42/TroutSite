# @trout/content

YAML content pack — **OWNER: ROLE 4** (this shell + the validate stub were created by ROLE 1).

Layout (00-SHARED-CONTEXT §7):

```
bugs/{taxon-id}.yaml
patterns/{pattern-id}.yaml
hatch/{stateId}/{regionId}.yaml
streams/{stateId}/{stream-id}.yaml
shops/{stateId}/{shop-id}.yaml
scripts/validate.ts   # CI gate: schema + orphan references + gauge-ID lint + SVG well-formedness
scripts/build.ts      # compact bundled JSON content pack for the PWA precache
```

Rules: facts + original writing only; **every file has `sources:`**; launch regions include the
Guadalupe River tailrace (TX), Lower Mountain Fork (OK), White River & Little Red (AR).
Schemas live in `@trout/contracts` (frozen).
