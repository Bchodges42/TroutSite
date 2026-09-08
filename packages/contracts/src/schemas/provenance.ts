// Geometry-provenance disclosure records for verified atlas waters.
//
// Emitted by apps/web/scripts/integrate-verified-atlas.mjs into
// public/atlas/provenance.json (schema trout/atlas-provenance/1) from the
// staging topology files (atlas-sources/verified/*.topology.json). This is
// QA/disclosure data: it lives OUTSIDE the content pack on purpose so
// angler-facing catalog copy (packages/content streams `notes`) never has to
// carry source-layer terminology, repair narrative, or internal ids (review
// M3). The web app consumes it lazily via /atlas/provenance.json.
import { z } from 'zod';
import { IsoDateSchema } from './shared.js';

export const ChainSeparationsSchema = z.object({
  attachments: z.number().int().nonnegative().optional(),
  openEnds: z.number().int().nonnegative().optional(),
  poolMediated: z.number().int().nonnegative(),
  poolMediatedMaxM: z.number().nullable(),
  braid: z.number().int().nonnegative(),
  braidMaxM: z.number().nullable(),
});

export const MidCourseSeamSchema = z.object({
  at: z.tuple([z.number(), z.number()]),
  nearestChainM: z.number().nonnegative(),
  documented: z.string().nullable(),
});

export const TerminusSchema = z.object({
  anchor: z.string().min(1),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  target: z.string().optional(),
  distanceM: z.number().nonnegative(),
  maxM: z.number().nonnegative(),
  poolMediated: z.number().int().nonnegative().nullable().optional(),
  ok: z.boolean(),
  informational: z.boolean(),
  note: z.string().optional(),
});

export const DamProvenanceSchema = z.object({
  name: z.string().min(1),
  coordinates: z.tuple([z.number(), z.number()]),
  source: z.string().min(1),
  poolDistanceM: z.number().nonnegative().optional(),
});

const LengthsSchema = z
  .object({
    sourceLengthKm: z.number().nullable(),
    deliveredLengthKm: z.number().nullable(),
    lengthRatio: z.number().optional(),
    reachScope: z.string().optional(),
  })
  .partial();

const AreasSchema = z.object({
  sourceAreaSqKm: z.number().nullable(),
  deliveredAreaSqKm: z.number().nullable(),
});

export const VerifiedProvenanceSchema = z.object({
  region: z.enum(['east-southeast', 'west-middle']),
  generated: IsoDateSchema,
  status: z.literal('verified'),
  verificationState: z.enum(['PASS', 'UNRESOLVED']),
  verificationSources: z.array(z.string().min(1)).min(1),
  sourceIdentifiers: z.array(z.string().min(1)).min(1),
  rebuild: z
    .object({
      lengths: LengthsSchema.optional(),
      areas: AreasSchema.optional(),
      largestConnectionGapMeters: z.number().nullable().optional(),
      chainSeparations: ChainSeparationsSchema.optional(),
      termini: z.array(TerminusSchema).optional(),
      midCourseSeams: z.array(MidCourseSeamSchema).optional(),
      tailwater: z
        .object({ startDistanceM: z.number(), startEndpointM: z.number().optional() })
        .optional(),
      throughLakeToleranceM: z.record(z.string(), z.number()).optional(),
      flowConnectivity: z
        .object({
          upstreamFeatureIds: z.array(z.string()),
          downstreamFeatureIds: z.array(z.string()),
        })
        .optional(),
    })
    .optional(),
  dam: DamProvenanceSchema.optional(),
  lake: z
    .object({
      // West records leave the distance off some connection entries.
      connections: z.record(z.string(), z.object({ nearestVertexDistanceM: z.number().optional() })).optional(),
      poolStageNote: z.string().optional(),
    })
    .optional(),
  note: z.string().optional(),
});

export const CarriedProvenanceSchema = z.object({
  region: z.enum(['east-southeast', 'west-middle']).nullable(),
  status: z.literal('carried'),
  source: z.array(z.string()).optional(),
  note: z.string(),
});

export const LegacyProvenanceSchema = z.object({
  region: z.null().optional(),
  status: z.literal('legacy'),
  source: z.array(z.string()).optional(),
  note: z.string(),
});

export const ProvenanceRecordSchema = z.discriminatedUnion('status', [
  VerifiedProvenanceSchema,
  CarriedProvenanceSchema,
  LegacyProvenanceSchema,
]);

export const AtlasProvenanceSchema = z.object({
  schema: z.literal('trout/atlas-provenance/1'),
  generated: IsoDateSchema,
  regions: z.record(z.string(), IsoDateSchema),
  waters: z.record(z.string(), ProvenanceRecordSchema),
});

export type AtlasProvenance = z.infer<typeof AtlasProvenanceSchema>;
export type ProvenanceRecord = z.infer<typeof ProvenanceRecordSchema>;
export type VerifiedProvenance = z.infer<typeof VerifiedProvenanceSchema>;
