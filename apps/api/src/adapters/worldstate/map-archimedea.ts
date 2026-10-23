import type {
  ArchimedeaDifficultyDto,
  ArchimedeaDto,
  ArchimedeaKind,
  ArchimedeaMissionDto,
  ArchimedeaSeasonDto,
} from '@lanius/core';

import { resolveArchimedeaModifierLabel } from './archimedea-labels.js';
import { resolveFactionLabel, resolveMissionTypeLabel } from './resolve-labels.js';
import type {
  UpstreamConquest,
  UpstreamConquestDifficulty,
  UpstreamConquestMission,
} from './types.js';

/**
 * 上游 `Conquests[].Type` → 科研子类。
 */
const KIND_BY_TYPE: Record<string, ArchimedeaKind> = {
  CT_LAB: 'lab',
  CT_HEX: 'hex',
};

/**
 * 将官方 `Conquests` 映射为科研 DTO（精英 `CT_LAB` + 时光 `CT_HEX`）。
 * 与警报无关；未知 Type 跳过。无有效季时返回 `null`。
 *
 * @param rows - 上游 Conquests 数组（可缺省）
 * @returns 科研聚合，或 `null`
 */
export function mapArchimedea(rows: UpstreamConquest[] | undefined): ArchimedeaDto | null {
  if (!rows || rows.length === 0) {
    return null;
  }

  const seasons: ArchimedeaSeasonDto[] = [];
  for (const row of rows) {
    const season = mapSeason(row);
    if (season) {
      seasons.push(season);
    }
  }

  if (seasons.length === 0) {
    return null;
  }

  // 展示顺序：精英科研 → 时光科研；同 kind 保持上游顺序
  seasons.sort((a, b) => kindRank(a.kind) - kindRank(b.kind));
  return { seasons };
}

/**
 * 科研子类排序权重。
 *
 * @param kind - lab / hex
 * @returns 越小越靠前
 */
function kindRank(kind: ArchimedeaKind): number {
  return kind === 'lab' ? 0 : 1;
}

/**
 * 映射单条 Conquest 为季节 DTO。
 *
 * @param raw - 上游单季科研
 * @returns 季节 DTO；Type 未知时 `null`
 */
function mapSeason(raw: UpstreamConquest): ArchimedeaSeasonDto | null {
  const typeKey = raw.Type?.trim();
  if (!typeKey) {
    return null;
  }
  const kind = KIND_BY_TYPE[typeKey];
  if (!kind) {
    return null;
  }

  const variableKeys = (raw.Variables ?? []).filter(
    (key): key is string => typeof key === 'string' && key.trim().length > 0,
  );
  const missions = (raw.Missions ?? [])
    .map(mapMission)
    .filter((row): row is ArchimedeaMissionDto => row !== null);

  return {
    kind,
    activation: toIso(raw.Activation),
    expiry: toIso(raw.Expiry),
    missions,
    variableKeys,
    variables: variableKeys.map(resolveArchimedeaModifierLabel),
  };
}

/**
 * 映射科研任务链单步。
 *
 * @param raw - 上游单步
 * @returns 任务 DTO；无有效内容时仍返回（保留空 difficulties）
 */
function mapMission(raw: UpstreamConquestMission): ArchimedeaMissionDto | null {
  const factionKey = raw.faction?.trim();
  const missionTypeKey = raw.missionType?.trim();
  const difficulties = (raw.difficulties ?? [])
    .map(mapDifficulty)
    .filter((row): row is ArchimedeaDifficultyDto => row !== null);

  // 完全空对象跳过，避免污染任务链
  if (!factionKey && !missionTypeKey && difficulties.length === 0) {
    return null;
  }

  return {
    ...(factionKey ? { factionKey, faction: resolveFactionLabel(factionKey) } : {}),
    ...(missionTypeKey
      ? { missionTypeKey, missionType: resolveMissionTypeLabel(missionTypeKey) }
      : {}),
    difficulties,
  };
}

/**
 * 映射单档难度（偏差 + 风险）。
 *
 * @param raw - 上游 difficulties 项
 * @returns 难度 DTO；缺 `type` 时 `null`
 */
function mapDifficulty(raw: UpstreamConquestDifficulty): ArchimedeaDifficultyDto | null {
  const typeKey = raw.type?.trim();
  if (!typeKey) {
    return null;
  }
  const deviationKey = raw.deviation?.trim();
  const riskKeys = (raw.risks ?? []).filter(
    (key): key is string => typeof key === 'string' && key.trim().length > 0,
  );
  return {
    typeKey,
    ...(deviationKey
      ? {
          deviationKey,
          deviation: resolveArchimedeaModifierLabel(deviationKey),
        }
      : {}),
    riskKeys,
    risks: riskKeys.map(resolveArchimedeaModifierLabel),
  };
}

/**
 * 解析上游 `$date.$numberLong` 为 ISO8601。
 *
 * @param stamp - Activation / Expiry 对象
 * @returns ISO 字符串；无效时 `undefined`
 */
function toIso(stamp?: { $date?: { $numberLong?: string } }): string | undefined {
  const raw = stamp?.$date?.$numberLong;
  if (!raw) {
    return undefined;
  }
  const ms = Number(raw);
  if (!Number.isFinite(ms)) {
    return undefined;
  }
  return new Date(ms).toISOString();
}
