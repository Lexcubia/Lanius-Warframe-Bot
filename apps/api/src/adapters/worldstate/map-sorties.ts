import type { ArchonHuntDto, SortieDto, SortieMissionDto } from '@lanius/core';

import {
  resolveMissionTypeLabel,
  resolveNodeLabel,
  resolveSortieBossLabel,
  resolveSortieModifierLabel,
} from './resolve-labels.js';
import type {
  UpstreamLiteSortie,
  UpstreamLiteSortieMission,
  UpstreamSortie,
  UpstreamSortieVariant,
} from './types.js';

/**
 * 将官方 `Sorties[0]` 映射为每日突击 DTO。
 * 无有效 id / Boss 时返回 `null`（空态由调用方展示）。
 *
 * @param rows - 上游 `Sorties` 数组（通常至多一条活跃）
 * @returns 规范化突击切片，或 `null`
 */
export function mapSortie(rows: UpstreamSortie[] | undefined): SortieDto | null {
  const raw = rows?.[0];
  if (!raw) {
    return null;
  }
  const id = raw._id?.$oid;
  if (!id) {
    return null;
  }

  const bossKey = trimKey(raw.Boss);
  const missions = (raw.Variants ?? [])
    .map(mapSortieVariant)
    .filter((row): row is SortieMissionDto => row !== null);

  return {
    id,
    ...(bossKey ? { bossKey, boss: resolveSortieBossLabel(bossKey) } : {}),
    ...optionalIsoRange(raw.Activation, raw.Expiry),
    missions,
  };
}

/**
 * 将官方 `LiteSorties[0]` 映射为执行官狩猎 DTO。
 * 形状与突击相近，独立字段以便并行演进。
 *
 * @param rows - 上游 `LiteSorties` 数组
 * @returns 规范化执行官切片，或 `null`
 */
export function mapArchonHunt(rows: UpstreamLiteSortie[] | undefined): ArchonHuntDto | null {
  const raw = rows?.[0];
  if (!raw) {
    return null;
  }
  const id = raw._id?.$oid;
  if (!id) {
    return null;
  }

  const bossKey = trimKey(raw.Boss);
  const missions = (raw.Missions ?? [])
    .map(mapLiteSortieMission)
    .filter((row): row is SortieMissionDto => row !== null);

  return {
    id,
    ...(bossKey ? { bossKey, boss: resolveSortieBossLabel(bossKey) } : {}),
    ...optionalIsoRange(raw.Activation, raw.Expiry),
    missions,
  };
}

/**
 * 映射突击单步（节点 + 任务类型 + 修正）。
 *
 * @param raw - `Variants[]` 单条
 * @returns 任务步 DTO；三者皆空时 `null`
 */
function mapSortieVariant(raw: UpstreamSortieVariant): SortieMissionDto | null {
  const missionTypeKey = trimKey(raw.missionType);
  const modifierKey = trimKey(raw.modifierType);
  const nodeKey = trimKey(raw.node);
  if (!missionTypeKey && !modifierKey && !nodeKey) {
    return null;
  }
  return {
    ...(missionTypeKey
      ? {
          missionTypeKey,
          missionType: resolveMissionTypeLabel(missionTypeKey),
        }
      : {}),
    ...(modifierKey
      ? {
          modifierKey,
          modifier: resolveSortieModifierLabel(modifierKey),
        }
      : {}),
    ...(nodeKey
      ? {
          nodeKey,
          node: resolveNodeLabel(nodeKey),
        }
      : {}),
  };
}

/**
 * 映射执行官单步（通常无修正）。
 *
 * @param raw - `Missions[]` 单条
 * @returns 任务步 DTO；字段皆空时 `null`
 */
function mapLiteSortieMission(raw: UpstreamLiteSortieMission): SortieMissionDto | null {
  const missionTypeKey = trimKey(raw.missionType);
  const nodeKey = trimKey(raw.node);
  if (!missionTypeKey && !nodeKey) {
    return null;
  }
  return {
    ...(missionTypeKey
      ? {
          missionTypeKey,
          missionType: resolveMissionTypeLabel(missionTypeKey),
        }
      : {}),
    ...(nodeKey
      ? {
          nodeKey,
          node: resolveNodeLabel(nodeKey),
        }
      : {}),
  };
}

/**
 * 将上游 Activation / Expiry 转为可选 ISO8601 字段。
 *
 * @param activation - 上游激活时间
 * @param expiry - 上游过期时间
 * @returns 仅含有效时间戳的部分对象
 */
function optionalIsoRange(
  activation: UpstreamSortie['Activation'],
  expiry: UpstreamSortie['Expiry'],
): { activation?: string; expiry?: string } {
  const activationIso = mongoDateToIso(activation);
  const expiryIso = mongoDateToIso(expiry);
  return {
    ...(activationIso ? { activation: activationIso } : {}),
    ...(expiryIso ? { expiry: expiryIso } : {}),
  };
}

/**
 * 解析 Mongo 风格 `$date.$numberLong` 为 ISO8601。
 *
 * @param stamp - 上游时间戳对象
 * @returns ISO 字符串；无效时 `undefined`
 */
function mongoDateToIso(
  stamp: { $date?: { $numberLong?: string } } | undefined,
): string | undefined {
  const ms = Number(stamp?.$date?.$numberLong);
  if (!Number.isFinite(ms)) {
    return undefined;
  }
  return new Date(ms).toISOString();
}

/**
 * 去掉空白键；空串视为缺失。
 *
 * @param value - 上游可选字符串
 * @returns 非空串，或 `undefined`
 */
function trimKey(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
