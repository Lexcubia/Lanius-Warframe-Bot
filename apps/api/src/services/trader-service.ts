import {
  isRealmAvailable,
  type Locale,
  type Realm,
  type VarziaDto,
  type VoidTraderDto,
} from '@lanius/core';

import { mapVarzia, mapVoidTrader } from '../adapters/worldstate/map-traders.js';
import { WORLDSTATE_SOURCE } from '../adapters/worldstate/map-worldstate.js';
import { realmNotAvailableError } from '../lib/http-error.js';
import type { ItemIconService } from './item-icon-service.js';
import type { WorldstateService } from './worldstate-service.js';

/**
 * 商人查询服务依赖。
 */
export type TraderServiceDeps = {
  worldstateService: WorldstateService;
  /** 可选：为货架物品填充官方图标 */
  itemIconService?: ItemIconService;
};

/**
 * 虚空商人查询结果。
 */
export type VoidTraderServiceResult = {
  data: VoidTraderDto;
  cached: boolean;
  cacheAgeMs: number;
  stale: boolean;
  source: string;
};

/**
 * 瓦奇娅查询结果。
 */
export type VarziaServiceResult = {
  data: VarziaDto;
  cached: boolean;
  cacheAgeMs: number;
  stale: boolean;
  source: string;
};

/**
 * 从 worldState 派生虚空商人 / 瓦奇娅可查询模块。
 */
export class TraderService {
  private readonly worldstateService: WorldstateService;
  private readonly itemIconService?: ItemIconService;

  /**
   * @param deps - 复用 WorldstateService 上游缓存
   */
  constructor(deps: TraderServiceDeps) {
    this.worldstateService = deps.worldstateService;
    this.itemIconService = deps.itemIconService;
  }

  /**
   * 查询虚空商人快照。
   *
   * @param realm - 区服
   * @param _locale - 语言（标签解析已在映射层完成）
   * @returns 虚空商人 DTO 与缓存元数据
   * @throws HttpError 区服不可用或上游失败时
   */
  async getVoidTrader(
    realm: Realm,
    _locale: Locale,
  ): Promise<VoidTraderServiceResult> {
    if (!isRealmAvailable(realm)) {
      throw realmNotAvailableError(realm);
    }
    const upstream = await this.worldstateService.loadUpstream(realm);
    const mapped = mapVoidTrader(upstream.raw, upstream.fetchedAt);
    const data = this.itemIconService
      ? {
          ...mapped,
          inventory: await this.itemIconService.enrichTraderItems(
            mapped.inventory,
          ),
        }
      : mapped;
    return {
      data,
      cached: upstream.cached,
      cacheAgeMs: upstream.cacheAgeMs,
      stale: upstream.stale,
      source: WORLDSTATE_SOURCE,
    };
  }

  /**
   * 查询瓦奇娅快照。
   *
   * @param realm - 区服
   * @param _locale - 语言
   * @returns 瓦奇娅 DTO 与缓存元数据
   * @throws HttpError 区服不可用或上游失败时
   */
  async getVarzia(realm: Realm, _locale: Locale): Promise<VarziaServiceResult> {
    if (!isRealmAvailable(realm)) {
      throw realmNotAvailableError(realm);
    }
    const upstream = await this.worldstateService.loadUpstream(realm);
    const mapped = mapVarzia(upstream.raw, upstream.fetchedAt);
    const data = this.itemIconService
      ? {
          ...mapped,
          inventory: await this.itemIconService.enrichTraderItems(
            mapped.inventory,
          ),
        }
      : mapped;
    return {
      data,
      cached: upstream.cached,
      cacheAgeMs: upstream.cacheAgeMs,
      stale: upstream.stale,
      source: WORLDSTATE_SOURCE,
    };
  }
}
