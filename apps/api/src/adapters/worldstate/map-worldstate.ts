import type { CatalogItemDto, InvasionDto, NightwaveDto, Realm, WorldstateDto } from '@lanius/core';

import { mapAlerts } from './map-alerts.js';
import { mapArchimedea } from './map-archimedea.js';
import { mapCircuit } from './map-circuit.js';
import { mapOpenWorldCycles } from './map-cycles.js';
import { mapFissures } from './map-fissures.js';
import { NIGHTWAVE_KIND_LABELS, resolveNightwaveChallengeKind } from './nightwave-kind.js';
import {
  resolveChallengeLabels,
  resolveFactionLabel,
  resolveNodeLabel,
  resolvePathLabel,
} from './resolve-labels.js';
import type { UpstreamInvasion, UpstreamSeasonInfo, UpstreamWorldstate } from './types.js';

/**
 * Source tag recorded in response `meta.source` for official worldstate.
 */
export const WORLDSTATE_SOURCE = 'warframe-worldstate';

/**
 * Maps official worldState JSON into a Lanius `WorldstateDto`.
 * 仅输出活跃入侵；节点/阵营/挑战/奖励在此解析为双语可读名。
 *
 * @param realm - Realm this snapshot belongs to (must be available).
 * @param raw - Parsed upstream JSON object.
 * @param fetchedAt - ISO8601 timestamp when the snapshot was obtained.
 * @returns Normalized worldstate DTO for `/v1/worldstate`.
 */
export function mapWorldstate(
  realm: Realm,
  raw: UpstreamWorldstate,
  fetchedAt: string,
): WorldstateDto {
  const invasions = [...(raw.Invasions ?? []), ...(raw.EventInvasions ?? [])]
    // 已完成入侵对概览无意义，MVP 不返回。
    .filter((row) => !row.Completed)
    .map(mapInvasion)
    .filter((row): row is InvasionDto => row !== null);

  const nowMs = Date.parse(fetchedAt);
  const snapshotNow = Number.isFinite(nowMs) ? nowMs : Date.now();

  // Wave 1：alerts + archimedea + circuit 已接通；仲裁由服务层社区源挂载；其余模块仍空安全默认。
  return {
    realm,
    fetchedAt,
    cycles: mapOpenWorldCycles(raw),
    fissures: mapFissures(raw, snapshotNow),
    invasions,
    nightwave: mapNightwave(raw.SeasonInfo),
    sortie: null,
    archon: null,
    circuit: mapCircuit(raw, snapshotNow),
    bounties: [],
    // 官方 worldState 无仲裁；占位 null，由 WorldstateService.loadArbitration 覆盖
    arbitration: null,
    alerts: mapAlerts(raw, snapshotNow),
    archimedea: mapArchimedea(raw.Conquests),
  };
}

/**
 * Maps a single upstream invasion into a Lanius invasion DTO.
 *
 * @param raw - Upstream invasion object.
 * @returns Normalized invasion, or `null` when required fields are missing.
 */
function mapInvasion(raw: UpstreamInvasion): InvasionDto | null {
  const id = raw._id?.$oid;
  const nodeKey = raw.Node;
  if (!id || !nodeKey) {
    return null;
  }

  const attackingKey = raw.AttackerMissionInfo?.faction ?? 'Unknown';
  const defendingKey = raw.DefenderMissionInfo?.faction ?? 'Unknown';
  const completionPct = computeCompletionPct(raw.Count, raw.Goal);
  const attackerReward = mapCountedReward(raw.AttackerReward);
  const defenderReward = mapCountedReward(raw.DefenderReward);

  return {
    id,
    node: resolveNodeLabel(nodeKey),
    attackingFaction: resolveFactionLabel(attackingKey),
    defendingFaction: resolveFactionLabel(defendingKey),
    attackerReward,
    defenderReward,
    completionPct,
    expired: Boolean(raw.Completed),
  };
}

/**
 * Maps upstream SeasonInfo into a Nightwave DTO, or `null` when absent.
 *
 * @param raw - Upstream season info, if present.
 * @returns Normalized nightwave slice, or `null`.
 */
function mapNightwave(raw: UpstreamSeasonInfo | undefined): NightwaveDto | null {
  if (!raw) {
    return null;
  }

  const activeChallenges = (raw.ActiveChallenges ?? []).map((challenge, index) => {
    const path = challenge.Challenge;
    const id = challenge._id?.$oid ?? path ?? `challenge-${index}`;
    const expiryMs = Number(challenge.expiry?.$date?.$numberLong);
    const labels = path ? resolveChallengeLabels(path) : undefined;
    const kind = resolveNightwaveChallengeKind(path, challenge.Daily);
    return {
      id,
      kind,
      kindLabel: NIGHTWAVE_KIND_LABELS[kind],
      title: labels?.title,
      description: labels?.description,
      expiry: Number.isFinite(expiryMs) ? new Date(expiryMs).toISOString() : undefined,
    };
  });

  // 展示顺序：每日 → 每周 → 其他（同档保持上游顺序）
  const kindRank = { daily: 0, weekly: 1, other: 2 } as const;
  activeChallenges.sort((a, b) => kindRank[a.kind] - kindRank[b.kind]);

  return {
    season: raw.Season,
    phase: raw.Phase,
    activeChallenges,
  };
}

/**
 * Computes invasion completion percentage from count/goal when available.
 *
 * @param count - Upstream progress count (may be negative depending on side).
 * @param goal - Upstream goal magnitude.
 * @returns Percentage in `[0, 100]`, or `undefined` when inputs are unusable.
 */
function computeCompletionPct(
  count: number | undefined,
  goal: number | undefined,
): number | undefined {
  if (count === undefined || goal === undefined || goal === 0) {
    return undefined;
  }
  const pct = (Math.abs(count) / Math.abs(goal)) * 100;
  if (!Number.isFinite(pct)) {
    return undefined;
  }
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

/**
 * 将上游 `countedItems[0]` 映射为带数量的物品引用。
 *
 * @param reward - 进攻方 / 防守方奖励对象
 * @returns CatalogItemDto；无条目时 `undefined`
 */
function mapCountedReward(
  reward: { countedItems?: Array<{ ItemType?: string; ItemCount?: number }> } | undefined,
): CatalogItemDto | undefined {
  const row = reward?.countedItems?.[0];
  const itemType = row?.ItemType;
  if (!itemType || itemType.length === 0) {
    return undefined;
  }
  const quantity =
    typeof row?.ItemCount === 'number' && Number.isFinite(row.ItemCount) && row.ItemCount > 0
      ? Math.floor(row.ItemCount)
      : undefined;
  return {
    name: resolvePathLabel(itemType),
    uniqueName: itemType,
    ...(quantity !== undefined ? { quantity } : {}),
  };
}
