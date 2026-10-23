import {
  isRealmAvailable,
  type ArbitrationDto,
  type Locale,
  type Realm,
  type WorldstateDto,
} from '@lanius/core';
import type { Logger } from '@lanius/logger';

import { mapArbitration } from '../adapters/worldstate/map-arbitration.js';
import { fetchInternationalWorldstate } from '../adapters/worldstate/international.js';
import { mapWorldstate, WORLDSTATE_SOURCE } from '../adapters/worldstate/map-worldstate.js';
import type { UpstreamWorldstate } from '../adapters/worldstate/types.js';
import {
  DEFAULT_WARFRAMESTAT_BASE_URL,
  fetchWarframestatArbitration,
} from '../adapters/worldstate/warframestat-arbitration.js';
import type { CacheStore } from '../cache/types.js';
import { realmNotAvailableError, upstreamUnavailableError } from '../lib/http-error.js';
import type { ItemIconService } from './item-icon-service.js';

/**
 * Default worldstate cache TTL (60s), within the documented 60–120s band.
 */
export const WORLDSTATE_TTL_MS = 60_000;

/**
 * 仲裁社区源独立 TTL（与官方 worldstate 同量级；失败不写脏缓存）。
 */
export const ARBITRATION_TTL_MS = 60_000;

/**
 * Dependencies injected into the worldstate service.
 */
export type WorldstateServiceDeps = {
  cache: CacheStore;
  worldstateUrl: string;
  timeoutMs: number;
  logger: Logger;
  fetchImpl?: typeof fetch;
  /** 可选：为入侵奖励填充官方图标 */
  itemIconService?: ItemIconService;
  /**
   * warframestat.us 基址（仲裁社区源）；缺省官方文档默认。
   * 失败时仅 `arbitration=null`，不拖垮 `/v1/worldstate`。
   */
  warframestatBaseUrl?: string;
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
 * 上游原始 worldState 加载结果（供商人等派生模块复用同一缓存）。
 */
export type UpstreamWorldstateResult = {
  raw: UpstreamWorldstate;
  fetchedAt: string;
  cached: boolean;
  cacheAgeMs: number;
  stale: boolean;
  source: string;
};

/**
 * 缓存的原始上游载荷。
 */
type CachedUpstreamPayload = {
  raw: UpstreamWorldstate;
  fetchedAt: string;
};

/**
 * Loads normalized worldstate for a realm with TTL cache and stale fallback.
 */
export class WorldstateService {
  private readonly cache: CacheStore;
  private readonly worldstateUrl: string;
  private readonly timeoutMs: number;
  private readonly logger: Logger;
  private readonly fetchImpl?: typeof fetch;
  private readonly itemIconService?: ItemIconService;
  private readonly warframestatBaseUrl: string;

  /**
   * Creates a worldstate service bound to cache and upstream settings.
   *
   * @param deps - Cache, upstream URL/timeout, logger, optional fetch / warframestat 基址。
   */
  constructor(deps: WorldstateServiceDeps) {
    this.cache = deps.cache;
    this.worldstateUrl = deps.worldstateUrl;
    this.timeoutMs = deps.timeoutMs;
    this.logger = deps.logger;
    this.fetchImpl = deps.fetchImpl;
    this.itemIconService = deps.itemIconService;
    this.warframestatBaseUrl = deps.warframestatBaseUrl ?? DEFAULT_WARFRAMESTAT_BASE_URL;
  }

  /**
   * Returns worldstate for the requested realm/locale context.
   * 官方切片与仲裁社区源并行；仲裁失败仅置 `arbitration=null`，不抛穿。
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
    const fresh = await this.cache.getFresh<WorldstateDto>(cacheKey);
    if (fresh) {
      return {
        data: fresh.value,
        cached: true,
        cacheAgeMs: fresh.ageMs,
        stale: false,
        source: WORLDSTATE_SOURCE,
      };
    }

    const upstream = await this.loadUpstream(realm);
    const mapped = mapWorldstate(realm, upstream.raw, upstream.fetchedAt);
    const arbitration = await this.loadArbitration(realm);
    const withArbitration: WorldstateDto = { ...mapped, arbitration };
    const data = this.itemIconService
      ? await this.itemIconService.enrichWorldstate(withArbitration)
      : withArbitration;
    await this.cache.set(cacheKey, data, WORLDSTATE_TTL_MS);
    return {
      data,
      cached: upstream.cached,
      cacheAgeMs: upstream.cacheAgeMs,
      stale: upstream.stale,
      source: WORLDSTATE_SOURCE,
    };
  }

  /**
   * 拉取并映射仲裁社区源；任何失败 / 空数据均返回 `null`（不抛）。
   *
   * @param realm - 区服（用于缓存键；MVP 仅 international）
   * @returns `ArbitrationDto` 或 `null`
   */
  async loadArbitration(realm: Realm): Promise<ArbitrationDto | null> {
    const cacheKey = `arbitration:${realm}`;
    const fresh = await this.cache.getFresh<ArbitrationDto | null>(cacheKey);
    if (fresh) {
      return fresh.value;
    }

    try {
      const raw = await fetchWarframestatArbitration({
        baseUrl: this.warframestatBaseUrl,
        timeoutMs: this.timeoutMs,
        fetchImpl: this.fetchImpl,
      });
      const mapped = mapArbitration(raw);
      await this.cache.set(cacheKey, mapped, ARBITRATION_TTL_MS);
      return mapped;
    } catch (error) {
      this.logger.warn(
        { err: serializeError(error), realm, source: 'warframestat' },
        'arbitration community source failed; leaving slice null',
      );
      // 失败不写 null 进长缓存，避免短暂故障锁死整窗；仍返回 null 以保证 worldstate 可用
      return null;
    }
  }

  /**
   * 加载官方 worldState 原始文档（与规范化 DTO 共用上游拉取与 TTL）。
   *
   * @param realm - 区服
   * @returns 原始文档与缓存元数据
   * @throws HttpError 区服不可用或上游失败且无缓存时
   */
  async loadUpstream(realm: Realm): Promise<UpstreamWorldstateResult> {
    if (!isRealmAvailable(realm)) {
      throw realmNotAvailableError(realm);
    }

    const cacheKey = `worldstate-raw:${realm}`;
    const fresh = await this.cache.getFresh<CachedUpstreamPayload>(cacheKey);
    if (fresh) {
      return {
        raw: fresh.value.raw,
        fetchedAt: fresh.value.fetchedAt,
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
      await this.cache.set(cacheKey, { raw, fetchedAt }, WORLDSTATE_TTL_MS);
      return {
        raw,
        fetchedAt,
        cached: false,
        cacheAgeMs: 0,
        stale: false,
        source: WORLDSTATE_SOURCE,
      };
    } catch (error) {
      const stale = await this.cache.getIncludingStale<CachedUpstreamPayload>(cacheKey);
      if (stale) {
        this.logger.warn(
          { err: serializeError(error), realm, cacheAgeMs: stale.ageMs },
          'worldstate upstream failed; serving stale raw cache',
        );
        return {
          raw: stale.value.raw,
          fetchedAt: stale.value.fetchedAt,
          cached: true,
          cacheAgeMs: stale.ageMs,
          stale: true,
          source: WORLDSTATE_SOURCE,
        };
      }

      this.logger.error(
        { err: serializeError(error), realm },
        'worldstate upstream failed with empty raw cache',
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
