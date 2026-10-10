/**
 * Stable machine-readable error codes returned in the API failure envelope.
 * Clients should key off these codes rather than HTTP status alone.
 */
export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  REALM_NOT_AVAILABLE: 'REALM_NOT_AVAILABLE',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  CACHE_STALE_FALLBACK: 'CACHE_STALE_FALLBACK',
  INTERNAL: 'INTERNAL',
} as const;

/**
 * Union of known Lanius API error code string literals.
 */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * i18n message keys for user-facing error copy (zh/en resolved by clients or API).
 */
export const ErrorMessageKey = {
  BAD_REQUEST: 'errors.bad_request',
  VALIDATION_ERROR: 'errors.validation',
  UNAUTHORIZED: 'errors.unauthorized',
  FORBIDDEN: 'errors.forbidden',
  NOT_FOUND: 'errors.not_found',
  RATE_LIMITED: 'errors.rate_limited',
  REALM_NOT_AVAILABLE: 'errors.realm_not_available',
  UPSTREAM_UNAVAILABLE: 'errors.upstream_unavailable',
  INTERNAL: 'errors.internal',
} as const;

/**
 * Union of error message key string literals.
 */
export type ErrorMessageKey = (typeof ErrorMessageKey)[keyof typeof ErrorMessageKey];
