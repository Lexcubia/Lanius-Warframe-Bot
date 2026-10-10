import {
  ErrorCode,
  ErrorMessageKey,
  type ApiErrorBody,
  type ErrorCode as ErrorCodeName,
} from '@lanius/core';

/**
 * Domain error thrown by services/routes and mapped to the failure envelope.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCodeName;
  readonly messageKey: string;
  readonly details?: Record<string, unknown>;

  /**
   * Constructs an HTTP-mappable API error.
   *
   * @param status - HTTP status code to send.
   * @param code - Stable machine-readable error code.
   * @param message - Human-readable message (may be localized later).
   * @param messageKey - i18n key for clients that resolve copy themselves.
   * @param details - Optional structured details for validation failures.
   */
  constructor(
    status: number,
    code: ErrorCodeName,
    message: string,
    messageKey: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.messageKey = messageKey;
    this.details = details;
  }

  /**
   * Converts this error into the API failure envelope body.
   *
   * @returns Structured `error` object for `{ ok: false, error }`.
   */
  toErrorBody(): ApiErrorBody {
    return {
      code: this.code,
      message: this.message,
      messageKey: this.messageKey,
      details: this.details,
    };
  }
}

/**
 * Builds a validation error (HTTP 400) from Zod or similar details.
 *
 * @param message - Short human-readable validation summary.
 * @param details - Optional field-level details for clients.
 * @returns HttpError with `VALIDATION_ERROR` code.
 */
export function validationError(
  message: string,
  details?: Record<string, unknown>,
): HttpError {
  return new HttpError(
    400,
    ErrorCode.VALIDATION_ERROR,
    message,
    ErrorMessageKey.VALIDATION_ERROR,
    details,
  );
}

/**
 * Builds a realm-not-available error (HTTP 501) for MVP-unavailable realms.
 *
 * @param realm - Requested realm that is not wired in MVP.
 * @returns HttpError with `REALM_NOT_AVAILABLE` code.
 */
export function realmNotAvailableError(realm: string): HttpError {
  return new HttpError(
    501,
    ErrorCode.REALM_NOT_AVAILABLE,
    `Realm "${realm}" is not available in MVP`,
    ErrorMessageKey.REALM_NOT_AVAILABLE,
    { realm },
  );
}

/**
 * Builds an upstream-unavailable error (HTTP 502).
 *
 * @param message - Short description of the upstream failure.
 * @returns HttpError with `UPSTREAM_UNAVAILABLE` code.
 */
export function upstreamUnavailableError(message: string): HttpError {
  return new HttpError(
    502,
    ErrorCode.UPSTREAM_UNAVAILABLE,
    message,
    ErrorMessageKey.UPSTREAM_UNAVAILABLE,
  );
}

/**
 * Builds an internal error (HTTP 500) for unexpected failures.
 *
 * @param message - Safe message suitable for clients (no secrets).
 * @returns HttpError with `INTERNAL` code.
 */
export function internalError(message: string = 'Internal server error'): HttpError {
  return new HttpError(500, ErrorCode.INTERNAL, message, ErrorMessageKey.INTERNAL);
}
