import {
  createSuccessEnvelope,
  type Locale,
  type Realm,
  type ResponseMeta,
  type SuccessEnvelope,
} from '@lanius/core';

/**
 * Inputs for building response metadata on successful reads.
 */
export type BuildMetaInput = {
  realm: Realm;
  locale: Locale;
  cached: boolean;
  cacheAgeMs?: number;
  stale?: boolean;
  source?: string;
  generatedAt?: string;
};

/**
 * Builds `ResponseMeta` for a successful API envelope.
 *
 * @param input - Realm/locale/cache/source fields for the meta object.
 * @returns Response metadata ready for `createSuccessEnvelope`.
 */
export function buildResponseMeta(input: BuildMetaInput): ResponseMeta {
  return {
    realm: input.realm,
    locale: input.locale,
    cached: input.cached,
    cacheAgeMs: input.cacheAgeMs,
    stale: input.stale,
    source: input.source,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };
}

/**
 * Convenience helper: meta + success envelope in one call.
 *
 * @param data - DTO payload.
 * @param input - Meta construction inputs.
 * @returns Typed success envelope.
 */
export function successWithMeta<T>(
  data: T,
  input: BuildMetaInput,
): SuccessEnvelope<T> {
  return createSuccessEnvelope(data, buildResponseMeta(input));
}
