import type { AlertDto, CatalogItemDto } from '@lanius/core';

import {
  resolveFactionLabel,
  resolveMissionTypeLabel,
  resolveNodeLabel,
  resolvePathLabel,
} from './resolve-labels.js';
import type { UpstreamAlert, UpstreamWorldstate } from './types.js';

/**
 * 从官方 worldState 的 `Alerts` 映射活跃警报列表。
 * 与科研 Conquests **无关**；过期条目丢弃；缺 id 的行跳过。
 *
 * @param raw - 上游 worldState 根对象
 * @param nowMs - 当前时刻毫秒，用于过滤已过期条目
 * @returns 规范化警报 DTO 数组（按到期时间升序）
 */
export function mapAlerts(raw: UpstreamWorldstate, nowMs: number): AlertDto[] {
  const rows: AlertDto[] = [];
  for (const entry of raw.Alerts ?? []) {
    const mapped = mapOneAlert(entry, nowMs);
    if (mapped) {
      rows.push(mapped);
    }
  }
  rows.sort((a, b) => {
    const aMs = a.expiry ? Date.parse(a.expiry) : Number.POSITIVE_INFINITY;
    const bMs = b.expiry ? Date.parse(b.expiry) : Number.POSITIVE_INFINITY;
    return aMs - bMs;
  });
  return rows;
}

/**
 * 映射单条上游警报。
 *
 * @param raw - 上游 Alerts 元素
 * @param nowMs - 当前时刻毫秒
 * @returns AlertDto；缺 id 或已过期时 `null`
 */
function mapOneAlert(raw: UpstreamAlert, nowMs: number): AlertDto | null {
  const id = raw._id?.$oid;
  if (!id) {
    return null;
  }

  const expiryMs = Number(raw.Expiry?.$date?.$numberLong);
  if (Number.isFinite(expiryMs) && expiryMs <= nowMs) {
    return null;
  }

  const activationMs = Number(raw.Activation?.$date?.$numberLong);
  const mission = raw.MissionInfo;
  const nodeKey = mission?.location;
  const missionTypeKey = mission?.missionType;
  const factionKey = mission?.faction;
  const credits = mission?.missionReward?.credits;
  const rewards = mapAlertRewards(mission?.missionReward?.countedItems);

  return {
    id,
    ...(raw.Tag ? { tag: raw.Tag } : {}),
    ...(nodeKey ? { nodeKey, node: resolveNodeLabel(nodeKey) } : {}),
    ...(missionTypeKey
      ? { missionTypeKey, missionType: resolveMissionTypeLabel(missionTypeKey) }
      : {}),
    ...(factionKey ? { factionKey, faction: resolveFactionLabel(factionKey) } : {}),
    ...(Number.isFinite(activationMs) ? { activation: new Date(activationMs).toISOString() } : {}),
    ...(Number.isFinite(expiryMs) ? { expiry: new Date(expiryMs).toISOString() } : {}),
    ...(typeof credits === 'number' && Number.isFinite(credits) && credits >= 0
      ? { credits: Math.floor(credits) }
      : {}),
    rewards,
  };
}

/**
 * 将警报 `missionReward.countedItems` 映射为 CatalogItemDto 列表。
 *
 * @param items - 上游 countedItems
 * @returns 有 uniqueName 的奖励数组（可空）
 */
function mapAlertRewards(
  items: Array<{ ItemType?: string; ItemCount?: number }> | undefined,
): CatalogItemDto[] {
  if (!items || items.length === 0) {
    return [];
  }
  const out: CatalogItemDto[] = [];
  for (const row of items) {
    const itemType = row.ItemType;
    if (!itemType || itemType.length === 0) {
      continue;
    }
    const quantity =
      typeof row.ItemCount === 'number' && Number.isFinite(row.ItemCount) && row.ItemCount > 0
        ? Math.floor(row.ItemCount)
        : undefined;
    out.push({
      name: resolvePathLabel(itemType),
      uniqueName: itemType,
      ...(quantity !== undefined ? { quantity } : {}),
    });
  }
  return out;
}
