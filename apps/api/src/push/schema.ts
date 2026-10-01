import { z } from 'zod';

/**
 * Wire schemas for the watchlist routes (ADR 0016). Deliberately narrow: the
 * server accepts ONLY what the evaluation job needs — a pseudonymous
 * subscription id, a water id, and threshold parameters. No name, no email,
 * no location, no free-text anywhere (unknown keys are stripped by zod, so a
 * hostile or buggy client cannot smuggle PII into storage).
 *
 * Bounds mirror the client checks in apps/web/src/features/watches/useWatches.ts
 * so errors render the same either way; the server re-validates everything.
 */

export const WATCH_KINDS = ['condition', 'stocking', 'report'] as const;
export type WatchKind = (typeof WATCH_KINDS)[number];

export const WATCH_METRICS = ['tempC', 'cfs'] as const;
export type WatchMetric = (typeof WATCH_METRICS)[number];

export const THRESHOLD_OPS = ['above', 'below'] as const;
export type ThresholdOp = (typeof THRESHOLD_OPS)[number];

/** Hard request-body caps (route-level 413 below the global 128 KiB). */
export const WATCH_BODY_LIMIT_BYTES = {
  subscribe: 4 * 1024,
  rule: 4 * 1024,
} as const;

export const WATCH_LIMITS = {
  /** Random subscription ids are 22 chars of base64url (128 bits). */
  subscriptionIdLength: 22,
  endpointMax: 2048,
  userAgentMax: 300,
  waterIdMax: 128,
  /** p256dh/auth are base64url keys; 512 chars is far beyond any real key. */
  keyMax: 512,
  thresholdMin: -100,
  thresholdMax: 100_000,
  hysteresisMax: 1000,
  cooldownMinMinutes: 15,
  cooldownMaxMinutes: 7 * 24 * 60,
  /** A single pseudonymous subscription cannot grow unbounded rule storage. */
  maxRulesPerSubscription: 50,
} as const;

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidQuietHours(value: string): boolean {
  return HHMM_RE.test(value);
}

/**
 * Random subscription id shape — the client generates its own before the first
 * subscribe round-trip? No: the SERVER generates the id (the client must never
 * pick its credential), and the client stores whatever comes back. This regex
 * validates what subscribe returns and what rule routes accept.
 */
export const SUBSCRIPTION_ID_RE = /^[A-Za-z0-9_-]{22}$/;

const endpointSchema = z
  .string({ required_error: 'endpoint is required.' })
  .trim()
  .max(WATCH_LIMITS.endpointMax, 'endpoint is too long.')
  .refine((v) => {
    try {
      const parsed = new URL(v);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }, 'endpoint must be a push-service URL.');

export const SubscribeSchema = z.object({
  endpoint: endpointSchema,
  keys: z.object(
    {
      p256dh: z
        .string({ required_error: 'keys.p256dh is required.' })
        .min(1, 'keys.p256dh is required.')
        .max(WATCH_LIMITS.keyMax, 'keys.p256dh is too long.'),
      auth: z
        .string({ required_error: 'keys.auth is required.' })
        .min(1, 'keys.auth is required.')
        .max(WATCH_LIMITS.keyMax, 'keys.auth is too long.'),
    },
    { required_error: 'keys is required.' },
  ),
  // Volunteered diagnostic string, stored verbatim, never logged. Missing is fine.
  userAgent: z.string().trim().max(WATCH_LIMITS.userAgentMax, 'userAgent is too long.').optional(),
});
export type SubscribeInput = z.infer<typeof SubscribeSchema>;

const quietHoursField = z
  .string()
  .refine(isValidQuietHours, 'Quiet hours use local HH:MM (24-hour).');

export const WatchRuleSchema = z
  .object({
    subscriptionId: z
      .string({ required_error: 'subscriptionId is required.' })
      .regex(SUBSCRIPTION_ID_RE, 'subscriptionId must be the id returned by subscribe.'),
    waterId: z
      .string({ required_error: 'Choose the water to watch.' })
      .trim()
      .min(1, 'Choose the water to watch.')
      .max(WATCH_LIMITS.waterIdMax, 'Water id is too long.')
      .refine((v) => !/\s/.test(v), {
        message: 'Water ids never contain spaces — use the id from the water page.',
      }),
    kind: z.enum(WATCH_KINDS, {
      errorMap: () => ({ message: `kind must be one of: ${WATCH_KINDS.join(', ')}` }),
    }),
    metric: z.enum(WATCH_METRICS).optional(),
    thresholdOp: z.enum(THRESHOLD_OPS).optional(),
    threshold: z.number().finite().min(WATCH_LIMITS.thresholdMin).max(WATCH_LIMITS.thresholdMax).optional(),
    cooldownMinutes: z
      .number()
      .int()
      .min(WATCH_LIMITS.cooldownMinMinutes, `cooldown must be at least ${WATCH_LIMITS.cooldownMinMinutes} minutes.`)
      .max(WATCH_LIMITS.cooldownMaxMinutes, 'cooldown must be at most one week.')
      .default(240),
    quietHoursStart: quietHoursField.optional(),
    quietHoursEnd: quietHoursField.optional(),
    hysteresis: z
      .number()
      .finite()
      .min(0, 'hysteresis cannot be negative.')
      .max(WATCH_LIMITS.hysteresisMax, 'hysteresis is too large.')
      .default(0),
  })
  .superRefine((rule, ctx) => {
    if (rule.kind === 'condition') {
      if (!rule.metric || !rule.thresholdOp || rule.threshold === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metric'],
          message: 'Condition watches need a metric (tempC/cfs), a direction, and a threshold.',
        });
      }
    }
    if ((rule.quietHoursStart === undefined) !== (rule.quietHoursEnd === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quietHoursStart'],
        message: 'Quiet hours need both a start and an end.',
      });
    }
  });
export type WatchRuleInput = z.infer<typeof WatchRuleSchema>;

/**
 * Canonical stored shape: stocking/report watches carry no threshold machinery,
 * so those fields are stripped (no dead parameters a future UI might misread).
 * Called after schema validation, before insert.
 */
export function canonicalizeRuleInput(rule: WatchRuleInput): WatchRuleInput {
  if (rule.kind !== 'condition') {
    return { ...rule, metric: undefined, thresholdOp: undefined, threshold: undefined };
  }
  return rule;
}

/** Per-field error map for the 422 body: { errors: { field: message } }. */
export function watchFieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}
