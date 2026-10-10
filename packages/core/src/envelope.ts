import { z } from 'zod';

import { ErrorCode } from './errors.js';
import { LocaleSchema } from './locale.js';
import { RealmSchema } from './realm.js';

/**
 * Response metadata describing realm, locale, cache, and upstream source.
 */
export const ResponseMetaSchema = z.object({
  realm: RealmSchema,
  locale: LocaleSchema,
  cached: z.boolean(),
  cacheAgeMs: z.number().int().nonnegative().optional(),
  stale: z.boolean().optional(),
  source: z.string().min(1).optional(),
  generatedAt: z.string().datetime(),
});

/**
 * Metadata attached to successful (and some degraded) API responses.
 */
export type ResponseMeta = z.infer<typeof ResponseMetaSchema>;

/**
 * Structured API error payload inside a failure envelope.
 */
export const ApiErrorBodySchema = z.object({
  code: z.nativeEnum(ErrorCode),
  message: z.string().min(1),
  messageKey: z.string().min(1),
  details: z.record(z.unknown()).optional(),
});

/**
 * Failure body returned when `ok` is false.
 */
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

/**
 * Builds a success envelope schema for a given data schema.
 *
 * @param dataSchema - Zod schema describing the `data` payload.
 * @returns Zod object schema for `{ ok: true, data, meta }`.
 */
export function successEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    ok: z.literal(true),
    data: dataSchema,
    meta: ResponseMetaSchema,
  });
}

/**
 * Failure envelope shared by all `/v1` error responses.
 */
export const FailureEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: ApiErrorBodySchema,
});

/**
 * Failure envelope type for typed client parsing.
 */
export type FailureEnvelope = z.infer<typeof FailureEnvelopeSchema>;

/**
 * Success envelope type parameterized by the data payload type.
 */
export type SuccessEnvelope<T> = {
  ok: true;
  data: T;
  meta: ResponseMeta;
};

/**
 * Union of success and failure envelopes for a data payload type.
 */
export type ApiEnvelope<T> = SuccessEnvelope<T> | FailureEnvelope;

/**
 * Creates a success envelope with the given data and meta.
 *
 * @param data - Normalized DTO payload for clients.
 * @param meta - Response metadata (realm, cache, source, timestamps).
 * @returns Typed success envelope with `ok: true`.
 */
export function createSuccessEnvelope<T>(
  data: T,
  meta: ResponseMeta,
): SuccessEnvelope<T> {
  return { ok: true, data, meta };
}

/**
 * Creates a failure envelope with a stable error code and message.
 *
 * @param error - Structured error body for clients.
 * @returns Typed failure envelope with `ok: false`.
 */
export function createFailureEnvelope(error: ApiErrorBody): FailureEnvelope {
  return { ok: false, error };
}
