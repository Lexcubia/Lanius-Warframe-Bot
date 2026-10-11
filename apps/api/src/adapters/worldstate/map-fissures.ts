import type {
  FissureDto,
  FissureEra,
  FissurePath,
  LocalizedName,
} from '@lanius/core';

import {
  resolveFissureEraLabel,
  resolveMissionTypeLabel,
  resolveNodeLabel,
} from './resolve-labels.js';
import type {
  UpstreamActiveMission,
  UpstreamVoidStorm,
  UpstreamWorldstate,
} from './types.js';

/**
 * VoidT* → 纪元枚举。
 */
const ERA_BY_MODIFIER: Record<string, FissureEra> = {
  VoidT1: 'lith',
  VoidT2: 'meso',
  VoidT3: 'neo',
  VoidT4: 'axi',
  VoidT5: 'requiem',
  VoidT6: 'omnia',
};

/**
 * 纪元对应官方 PublicExport 遗物图标文件名（A 档代表性贴图）。
 * 安魂使用 Immortal；全能暂无独立 Relic* 文件，用通用遗物分类图标。
 */
const ERA_ICON_FILE: Record<FissureEra, string> = {
  lith: 'RelicLithA.png',
  meso: 'RelicMesoA.png',
  neo: 'RelicNeoA.png',
  axi: 'RelicAxiA.png',
  requiem: 'RelicImmortalA.png',
  omnia: 'IconRelic256.png',
};

/**
 * 纪元图标所在 PublicExport 子目录。
 */
const ERA_ICON_DIR: Record<FissureEra, string> = {
  lith: 'Relics',
  meso: 'Relics',
  neo: 'Relics',
  axi: 'Relics',
  requiem: 'Relics',
  omnia: 'Categories',
};

/**
 * 路径档双语标签。
 */
const PATH_LABELS: Record<FissurePath, LocalizedName> = {
  normal: { zh: '普通', en: 'Normal' },
  steelPath: { zh: '钢铁之路', en: 'Steel Path' },
  empyrean: { zh: '九重天', en: 'Empyrean' },
};

/**
 * 纪元排序权重（古纪→全能）。
 */
const ERA_ORDER: Record<FissureEra, number> = {
  lith: 1,
  meso: 2,
  neo: 3,
  axi: 4,
  requiem: 5,
  omnia: 6,
};

/**
 * 路径档排序：普通 → 钢铁 → 九重天。
 */
const PATH_ORDER: Record<FissurePath, number> = {
  normal: 0,
  steelPath: 1,
  empyrean: 2,
};

/**
 * 从官方 worldState 映射活跃虚空裂隙（ActiveMissions + VoidStorms）。
 *
 * @param raw - 上游 worldState 根对象
 * @param nowMs - 当前时刻毫秒，用于过滤已过期条目与计算剩余时间
 * @returns 规范化裂隙列表（按路径档 → 纪元 → 剩余时间）
 */
export function mapFissures(raw: UpstreamWorldstate, nowMs: number): FissureDto[] {
  const rows: FissureDto[] = [];

  for (const mission of raw.ActiveMissions ?? []) {
    const mapped = mapActiveMission(mission, nowMs);
    if (mapped) {
      rows.push(mapped);
    }
  }

  for (const storm of raw.VoidStorms ?? []) {
    const mapped = mapVoidStorm(storm, nowMs);
    if (mapped) {
      rows.push(mapped);
    }
  }

  rows.sort((a, b) => {
    const pathDiff = PATH_ORDER[a.path] - PATH_ORDER[b.path];
    if (pathDiff !== 0) {
      return pathDiff;
    }
    const eraDiff = ERA_ORDER[a.era] - ERA_ORDER[b.era];
    if (eraDiff !== 0) {
      return eraDiff;
    }
    return a.remainingMs - b.remainingMs;
  });

  return rows;
}

/**
 * 映射星图虚空裂隙（含钢铁之路 `Hard`）。
 *
 * @param raw - `ActiveMissions[]` 单条
 * @param nowMs - 当前时刻毫秒
 * @returns 裂隙 DTO，或缺字段/已过期时 `null`
 */
function mapActiveMission(
  raw: UpstreamActiveMission,
  nowMs: number,
): FissureDto | null {
  const id = raw._id?.$oid;
  const nodeKey = raw.Node;
  const modifier = raw.Modifier;
  const missionTypeKey = raw.MissionType;
  if (!id || !nodeKey || !modifier || !missionTypeKey) {
    return null;
  }

  const era = ERA_BY_MODIFIER[modifier];
  if (!era) {
    return null;
  }

  const timing = readTiming(raw.Expiry, nowMs);
  if (!timing) {
    return null;
  }

  const path: FissurePath = raw.Hard ? 'steelPath' : 'normal';
  return buildFissureDto({
    id,
    era,
    missionTypeKey,
    nodeKey,
    path,
    expiryIso: timing.expiryIso,
    remainingMs: timing.remainingMs,
  });
}

/**
 * 映射九重天虚空风暴（Railjack）。
 *
 * @param raw - `VoidStorms[]` 单条
 * @param nowMs - 当前时刻毫秒
 * @returns 裂隙 DTO，或缺字段/已过期时 `null`
 */
function mapVoidStorm(raw: UpstreamVoidStorm, nowMs: number): FissureDto | null {
  const id = raw._id?.$oid;
  const nodeKey = raw.Node;
  const modifier = raw.ActiveMissionTier;
  if (!id || !nodeKey || !modifier) {
    return null;
  }

  const era = ERA_BY_MODIFIER[modifier];
  if (!era) {
    return null;
  }

  const timing = readTiming(raw.Expiry, nowMs);
  if (!timing) {
    return null;
  }

  // 风暴条目无 MissionType，任务类型由星图节点表解析。
  return buildFissureDto({
    id,
    era,
    missionTypeKey: nodeKey,
    nodeKey,
    path: 'empyrean',
    expiryIso: timing.expiryIso,
    remainingMs: timing.remainingMs,
    missionFromNode: true,
  });
}

/**
 * 组装单条裂隙 DTO（图标路径 + 双语标签）。
 *
 * @param input - 已校验的映射中间值
 * @returns 规范化 `FissureDto`
 */
function buildFissureDto(input: {
  id: string;
  era: FissureEra;
  missionTypeKey: string;
  nodeKey: string;
  path: FissurePath;
  expiryIso: string;
  remainingMs: number;
  missionFromNode?: boolean;
}): FissureDto {
  const iconPath = `/Lotus/Interface/Icons/${ERA_ICON_DIR[input.era]}/${ERA_ICON_FILE[input.era]}`;
  return {
    id: input.id,
    era: input.era,
    eraLabel: resolveFissureEraLabel(input.era),
    missionTypeKey: input.missionTypeKey,
    missionType: resolveMissionTypeLabel(input.missionTypeKey, {
      fromNode: input.missionFromNode === true,
    }),
    node: resolveNodeLabel(input.nodeKey),
    path: input.path,
    pathLabel: PATH_LABELS[input.path],
    iconPath,
    iconUrl: `https://content.warframe.com/PublicExport${iconPath}`,
    expiry: input.expiryIso,
    remainingMs: input.remainingMs,
  };
}

/**
 * 解析上游 `$date.$numberLong` 过期时间。
 *
 * @param expiry - 上游 expiry 对象
 * @param nowMs - 当前时刻毫秒
 * @returns ISO 过期时间与剩余毫秒；无效或已过期时 `null`
 */
function readTiming(
  expiry: { $date?: { $numberLong?: string } } | undefined,
  nowMs: number,
): { expiryIso: string; remainingMs: number } | null {
  const expiryMs = Number(expiry?.$date?.$numberLong);
  if (!Number.isFinite(expiryMs) || expiryMs <= nowMs) {
    return null;
  }
  return {
    expiryIso: new Date(expiryMs).toISOString(),
    remainingMs: Math.max(0, Math.floor(expiryMs - nowMs)),
  };
}
