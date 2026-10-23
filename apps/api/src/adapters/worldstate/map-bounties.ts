import type { BountyJobDto, BountySyndicateDto, LocalizedName } from '@lanius/core';

import { resolveMissionDeckRewards, type MissionDeckCatalog } from './resolve-mission-deck.js';
import { resolvePathLabel } from './resolve-labels.js';
import type {
  UpstreamSyndicateJob,
  UpstreamSyndicateMission,
  UpstreamWorldstate,
} from './types.js';

/**
 * 优先展示的开放世界赏金联盟（有 Jobs 时完整展开；空 Jobs 仍占位空态）。
 * 顺序即卡片 / 文本默认排序。
 */
export const BOUNTY_PRIORITY_TAGS = [
  'CetusSyndicate',
  'SolarisSyndicate',
  'EntratiSyndicate',
] as const;

/**
 * 已知开放世界赏金 Tag → 双语显示名。
 */
const SYNDICATE_LABELS: Record<string, LocalizedName> = {
  CetusSyndicate: { zh: '希图斯平原', en: 'Cetus Plains' },
  SolarisSyndicate: { zh: '奥布山谷', en: 'Orb Vallis' },
  EntratiSyndicate: { zh: '魔胎之境', en: 'Cambion Drift' },
  ZarimanSyndicate: { zh: '扎里曼', en: 'Zariman' },
  HexSyndicate: { zh: '1999', en: '1999' },
};

/**
 * 将 `SyndicateMissions` 映射为赏金切片。
 * 优先输出 Cetus / Solaris / Entrati；其它联盟仅在有 Jobs 时收录。
 * `Jobs` 为空时仍返回块（含刷新时间），rewards 为空数组，由客户端展示诚实空态。
 *
 * @param raw - 上游 worldState 根对象
 * @param missionDeck - 可选 MissionDeck 目录；缺省时 rewards 保持空（仍保留 rewardTablePath）
 * @returns 规范化赏金联盟列表
 */
export function mapBounties(
  raw: UpstreamWorldstate,
  missionDeck?: MissionDeckCatalog,
): BountySyndicateDto[] {
  const missions = raw.SyndicateMissions ?? [];
  const byTag = new Map<string, UpstreamSyndicateMission>();
  for (const row of missions) {
    const tag = row.Tag?.trim();
    if (!tag) {
      continue;
    }
    byTag.set(tag, row);
  }

  const selected: UpstreamSyndicateMission[] = [];
  const seen = new Set<string>();

  // 优先三段：有则输出（含空 Jobs）
  for (const tag of BOUNTY_PRIORITY_TAGS) {
    const hit = byTag.get(tag);
    if (hit) {
      selected.push(hit);
      seen.add(tag);
    }
  }

  // 其余：仅有 Jobs 时收录（如扎里曼本轮有表）
  for (const row of missions) {
    const tag = row.Tag?.trim();
    if (!tag || seen.has(tag)) {
      continue;
    }
    if ((row.Jobs?.length ?? 0) > 0) {
      selected.push(row);
      seen.add(tag);
    }
  }

  return selected
    .map((row) => mapSyndicate(row, missionDeck))
    .filter((row): row is BountySyndicateDto => row !== null);
}

/**
 * 映射单联盟赏金块。
 *
 * @param raw - 上游 SyndicateMissions 行
 * @param missionDeck - 可选奖励表目录
 * @returns DTO；缺 Tag 时 `null`
 */
function mapSyndicate(
  raw: UpstreamSyndicateMission,
  missionDeck: MissionDeckCatalog | undefined,
): BountySyndicateDto | null {
  const tag = raw.Tag?.trim();
  if (!tag) {
    return null;
  }

  const activationMs = Number(raw.Activation?.$date?.$numberLong);
  const expiryMs = Number(raw.Expiry?.$date?.$numberLong);

  return {
    tag,
    name: SYNDICATE_LABELS[tag] ?? { zh: tag, en: tag },
    activation: Number.isFinite(activationMs) ? new Date(activationMs).toISOString() : undefined,
    expiry: Number.isFinite(expiryMs) ? new Date(expiryMs).toISOString() : undefined,
    jobs: (raw.Jobs ?? []).map((job) => mapJob(job, missionDeck)),
  };
}

/**
 * 映射单条 Job（含 MissionDeck 奖励展开）。
 *
 * @param raw - 上游 Job
 * @param missionDeck - 可选奖励表目录
 * @returns Job DTO
 */
function mapJob(
  raw: UpstreamSyndicateJob,
  missionDeck: MissionDeckCatalog | undefined,
): BountyJobDto {
  const jobType = raw.jobType?.trim() || undefined;
  const rewardTablePath = raw.rewards?.trim() || undefined;

  const rewards =
    rewardTablePath && missionDeck
      ? resolveMissionDeckRewards(rewardTablePath, missionDeck, {
          resolveItemName: (uniqueName) => resolvePathLabel(uniqueName),
        })
      : [];

  return {
    ...(jobType ? { jobType } : {}),
    ...(jobType ? { title: resolvePathLabel(jobType) } : {}),
    ...(typeof raw.masteryReq === 'number' && Number.isFinite(raw.masteryReq)
      ? { masteryReq: Math.max(0, Math.floor(raw.masteryReq)) }
      : {}),
    ...(typeof raw.minEnemyLevel === 'number' && Number.isFinite(raw.minEnemyLevel)
      ? { minEnemyLevel: Math.max(0, Math.floor(raw.minEnemyLevel)) }
      : {}),
    ...(typeof raw.maxEnemyLevel === 'number' && Number.isFinite(raw.maxEnemyLevel)
      ? { maxEnemyLevel: Math.max(0, Math.floor(raw.maxEnemyLevel)) }
      : {}),
    ...(typeof raw.endless === 'boolean' ? { endless: raw.endless } : {}),
    ...(rewardTablePath ? { rewardTablePath } : {}),
    rewards,
  };
}
