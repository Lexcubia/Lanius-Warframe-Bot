import {
  isRealmAvailable,
  type Locale,
  type Realm,
  type WorldstateDto,
} from '@lanius/core';
import type { Logger } from 'pino';

import { fetchInternationalWorldstate } from '../adapters/worldstate/international.js';
import {
  mapWorldstate,
  WORLDSTATE_SOURCE,
} from '../adapters/worldstate/map-worldstate.js';
import { realmNotAvailableError, upstreamUnavailableError } from '../lib/http-error.js';
import type { TtlCache } from '../lib/ttl-cache.js';

/**
 * Default worldstate cache TTL (60s), within the documented 60–120s band.
 */
export const WORLDSTATE_TTL_MS = 60_000;

/**
 * Dependencies injected into the worldstate service.
 */
export type WorldstateServiceDeps = {
  cache: TtlCache<WorldstateDto>;
  worldstateUrl: string;
  timeoutMs: number;
  logger: Logger;
  fetchImpl?: typeof fetch;
};

/**
 * Result of a worldstate fetch including cache metadata for the envelope.
 */
export type WorldstateServiceResult = {
  data: WorldstateDto;
  cached: boolean;
  cacheAgeMs: number;
  stale: boolean;
  source: string;
};

/**
 * Loads normalized worldstate for a realm with TTL cache and stale fallback.
 */
export class WorldstateService {
  private readonly cache: TtlCache<WorldstateDto>;
  private readonly worldstateUrl: string;
  private readonly timeoutMs: number;
  private readonly logger: Logger;
  private readonly fetchImpl?: typeof fetch;

  /**
   * Creates a worldstate service bound to cache and upstream settings.
   *
   * @param deps - Cache, upstream URL/timeout, logger, optional fetch.
   */
  constructor(deps: WorldstateServiceDeps) {
    this.cache = deps.cache;
    this.worldstateUrl = deps.worldstateUrl;
    this.timeoutMs = deps.timeoutMs;
    this.logger = deps.logger;
    this.fetchImpl = deps.fetchImpl;
  }

  /**
   * Returns worldstate for the requested realm/locale context.
   * Locale is accepted for future localized titles; MVP mapping is bilingual.
   *
   * @param realm - Requested realm (`china` → not available in MVP).
   * @param _locale - Requested locale (reserved for localized enrichment).
   * @returns Service result with DTO and cache metadata.
   * @throws HttpError when the realm is unavailable or upstream fails without cache.
   */
  async getWorldstate(realm: Realm, _locale: Locale): Promise<WorldstateServiceResult> {
    if (!isRealmAvailable(realm)) {
      throw realmNotAvailableError(realm);
    }

    const cacheKey = `worldstate:${realm}`;
    const fresh = this.cache.getFresh(cacheKey);
    if (fresh) {
      return {
        data: fresh.value,
        cached: true,
        cacheAgeMs: fresh.ageMs,
        stale: false,
        source: WORLDSTATE_SOURCE,
      };
    }

    try {
      const raw = await fetchInternationalWorldstate({
        url: this.worldstateUrl,
        timeoutMs: this.timeoutMs,
        fetchImpl: this.fetchImpl,
      });
      const fetchedAt = new Date().toISOString();
      const data = mapWorldstate(realm, raw, fetchedAt);
      this.cache.set(cacheKey, data, WORLDSTATE_TTL_MS);
      return {
        data,
        cached: false,
        cacheAgeMs: 0,
        stale: false,
        source: WORLDSTATE_SOURCE,
      };
    } catch (error) {
      // Prefer stale cache over failing the client when upstream is down.
      const stale = this.cache.getIncludingStale(cacheKey);
      if (stale) {
        this.logger.warn(
          { err: serializeError(error), realm, cacheAgeMs: stale.ageMs },
          'worldstate upstream failed; serving stale cache',
        );
        return {
          data: stale.value,
          cached: true,
          cacheAgeMs: stale.ageMs,
          stale: true,
          source: WORLDSTATE_SOURCE,
        };
      }

      this.logger.error(
        { err: serializeError(error), realm },
        'worldstate upstream failed with empty cache',
      );
      throw upstreamUnavailableError('Warframe worldstate upstream unavailable');
    }
  }
}

/**
 * Converts an unknown thrown value into a loggable plain object.
 *
 * @param error - Caught value from try/catch.
 * @returns Plain object safe for structured logging (no secrets expected).
 */
function serializeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { name: 'UnknownError', message: String(error) };
}
