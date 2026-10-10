import { z } from 'zod';

/**
 * Optional dependency probe results included in health responses.
 */
export const HealthChecksSchema = z.object({
  cache: z.enum(['ok', 'degraded', 'unknown']).optional(),
  upstreamWorldstate: z.enum(['ok', 'degraded', 'unknown']).optional(),
});

/**
 * Dependency check summary for `GET /v1/health`.
 */
export type HealthChecks = z.infer<typeof HealthChecksSchema>;

/**
 * Health payload returned by `GET /v1/health`.
 */
export const HealthDtoSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptimeSec: z.number().nonnegative(),
  checks: HealthChecksSchema.optional(),
});

/**
 * Normalized health DTO for clients (liveness + optional probes).
 */
export type HealthDto = z.infer<typeof HealthDtoSchema>;
