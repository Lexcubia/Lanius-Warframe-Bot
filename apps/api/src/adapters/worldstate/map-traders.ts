import type { TraderItemDto, VarziaDto, VoidTraderDto } from '@lanius/core';

import { canonicalizeItemPath } from '../public-export/canonicalize-item-path.js';
import { resolveNodeLabel, resolvePathLabel } from './resolve-labels.js';
import type { UpstreamWorldstate } from './types.js';

/**
 * 上游虚空商人条目。
 */
type UpstreamVoidTrader = {
  Character?: string;
  Node?: string;
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
  Manifest?: Array<{
    ItemType?: string;
    PrimePrice?: number;
    RegularPrice?: number;
  }>;
};

/**
 * 上游金满仓商人（瓦奇娅）。
 */
type UpstreamVaultTrader = {
  Character?: string;
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
  Manifest?: Array<{
    ItemType?: string;
    PrimePrice?: number;
    RegularPrice?: number;
  }>;
};

/**
 * 从官方 worldState 映射虚空商人。
 *
 * @param raw - 上游文档
 * @param fetchedAt - 拉取时间 ISO
 * @returns VoidTraderDto；无数据时返回 inactive 空货架
 */
export function mapVoidTrader(raw: UpstreamWorldstate, fetchedAt: string): VoidTraderDto {
  const now = Date.parse(fetchedAt) || Date.now();
  const row = (raw.VoidTraders?.[0] ?? undefined) as UpstreamVoidTrader | undefined;
  const activationMs = parseEpochMs(row?.Activation) ?? now;
  const expiryMs = parseEpochMs(row?.Expiry) ?? now;
  const active = now >= activationMs && now < expiryMs;
  const inventory = mapManifest(row?.Manifest);

  return {
    character: {
      zh: row?.Character ?? '虚空商人',
      en: row?.Character ?? 'Void Trader',
    },
    node: row?.Node
      ? resolveNodeLabel(row.Node)
      : { zh: '未知节点', en: 'Unknown node' },
    active,
    activation: new Date(activationMs).toISOString(),
    expiry: new Date(expiryMs).toISOString(),
    remainingMs: Math.max(0, (active ? expiryMs : activationMs) - now),
    inventory,
    fetchedAt,
  };
}

/**
 * 从官方 worldState 映射瓦奇娅。
 *
 * @param raw - 上游文档
 * @param fetchedAt - 拉取时间
 * @returns VarziaDto
 */
export function mapVarzia(raw: UpstreamWorldstate, fetchedAt: string): VarziaDto {
  const now = Date.parse(fetchedAt) || Date.now();
  const row = (raw.VaultTrader ??
    raw.PrimeVaultTraders?.[0] ??
    undefined) as UpstreamVaultTrader | undefined;
  const activationMs = parseEpochMs(row?.Activation);
  const expiryMs = parseEpochMs(row?.Expiry);
  const active =
    activationMs !== undefined &&
    expiryMs !== undefined &&
    now >= activationMs &&
    now < expiryMs;

  return {
    character: {
      zh: row?.Character ?? '瓦奇娅',
      en: row?.Character ?? 'Varzia',
    },
    active: Boolean(row?.Manifest?.length) || active,
    activation: activationMs ? new Date(activationMs).toISOString() : undefined,
    expiry: expiryMs ? new Date(expiryMs).toISOString() : undefined,
    remainingMs:
      expiryMs !== undefined ? Math.max(0, expiryMs - now) : undefined,
    inventory: mapManifest(row?.Manifest),
    fetchedAt,
  };
}

/**
 * 映射货架 Manifest。
 *
 * @param manifest - 上游货架
 * @returns 物品列表
 */
function mapManifest(
  manifest: UpstreamVoidTrader['Manifest'] | undefined,
): TraderItemDto[] {
  if (!manifest?.length) {
    return [];
  }
  const rows: TraderItemDto[] = [];
  for (const item of manifest) {
    const key = item.ItemType;
    if (!key) {
      continue;
    }
    // StoreItems 路径用于 languageString；目录键用规范 Types/Weapons 路径便于图标命中。
    const canonical = canonicalizeItemPath(key);
    const row: TraderItemDto = {
      name: resolvePathLabel(key),
      uniqueName: canonical,
    };
    if (typeof item.PrimePrice === 'number') {
      row.ducats = item.PrimePrice;
    }
    if (typeof item.RegularPrice === 'number') {
      row.credits = item.RegularPrice;
    }
    rows.push(row);
    if (rows.length >= 40) {
      break;
    }
  }
  return rows;
}

/**
 * 解析上游 `$numberLong` 毫秒时间。
 *
 * @param stamp - 上游时间戳对象
 * @returns epoch ms 或 undefined
 */
function parseEpochMs(
  stamp?: { $date?: { $numberLong?: string } },
): number | undefined {
  const raw = stamp?.$date?.$numberLong;
  if (!raw) {
    return undefined;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}
