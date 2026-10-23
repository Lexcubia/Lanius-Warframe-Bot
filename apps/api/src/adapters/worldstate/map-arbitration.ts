import type { ArbitrationDto, LocalizedName } from '@lanius/core';

import {
  resolveFactionLabel,
  resolveMissionTypeLabel,
  resolveNodeLabel,
} from './resolve-labels.js';
import type { UpstreamArbitration } from './types.js';
import { WARFRAMESTAT_ARBITRATION_SOURCE } from './warframestat-arbitration.js';

/**
 * 社区源敌人展示名 → 官方 `FC_*`（便于走既有阵营解析）。
 */
const ENEMY_TO_FACTION_KEY: Record<string, string> = {
  Corpus: 'FC_CORPUS',
  Grineer: 'FC_GRINEER',
  Infested: 'FC_INFESTATION',
  Infestation: 'FC_INFESTATION',
  Orokin: 'FC_OROKIN',
  Sentient: 'FC_SENTIENT',
  Narmer: 'FC_NARMER',
  Crossfire: 'FC_CROSSFIRE',
};

/**
 * 将 warframestat 薄上游映射为 Lanius `ArbitrationDto`。
 * 已过期或缺关键字段时返回 `null`（调用方保持 worldstate 切片为 null）。
 *
 * @param raw - 社区源仲裁对象
 * @param nowMs - 当前时刻（毫秒），用于过期判定
 * @returns 规范化 DTO，或 `null`
 */
export function mapArbitration(
  raw: UpstreamArbitration,
  nowMs: number = Date.now(),
): ArbitrationDto | null {
  if (raw.expired === true) {
    return null;
  }

  const expiryMs = raw.expiry ? Date.parse(raw.expiry) : Number.NaN;
  if (Number.isFinite(expiryMs) && expiryMs <= nowMs) {
    return null;
  }

  const nodeKey = raw.nodeKey?.trim() || undefined;
  const missionTypeKey = (raw.typeKey ?? raw.type)?.trim() || undefined;
  const enemyRaw = raw.enemy?.trim() || undefined;

  // 至少要有节点或任务类型之一，否则无法对用户展示有意义的一行
  if (!nodeKey && !raw.node && !missionTypeKey) {
    return null;
  }

  const node = resolveArbitrationNode(nodeKey, raw.node);
  const missionType = missionTypeKey ? resolveMissionTypeLabel(missionTypeKey) : undefined;
  const enemy = enemyRaw ? resolveArbitrationEnemy(enemyRaw) : undefined;

  const activationMs = raw.activation ? Date.parse(raw.activation) : Number.NaN;

  return {
    ...(nodeKey ? { nodeKey } : {}),
    ...(node ? { node } : {}),
    ...(missionTypeKey ? { missionTypeKey } : {}),
    ...(missionType ? { missionType } : {}),
    ...(enemyRaw ? { enemyKey: enemyRaw } : {}),
    ...(enemy ? { enemy } : {}),
    ...(Number.isFinite(activationMs) ? { activation: new Date(activationMs).toISOString() } : {}),
    ...(Number.isFinite(expiryMs) ? { expiry: new Date(expiryMs).toISOString() } : {}),
    source: WARFRAMESTAT_ARBITRATION_SOURCE,
  };
}

/**
 * 解析仲裁节点显示名：优先 SolNode 键，否则回退社区源展示串。
 *
 * @param nodeKey - 上游 `nodeKey`（如 `SolNode64`）
 * @param fallbackNode - 上游 `node` 展示串
 * @returns 双语节点名，或缺省 `undefined`
 */
function resolveArbitrationNode(
  nodeKey: string | undefined,
  fallbackNode: string | undefined,
): LocalizedName | undefined {
  if (nodeKey) {
    return resolveNodeLabel(nodeKey);
  }
  if (fallbackNode && fallbackNode.trim().length > 0) {
    const text = fallbackNode.trim();
    return { zh: text, en: text };
  }
  return undefined;
}

/**
 * 解析仲裁敌对阵营：英文名映射到 `FC_*` 后再走阵营表。
 *
 * @param enemyRaw - 社区源 `enemy`（如 `Corpus`）
 * @returns 双语阵营名
 */
function resolveArbitrationEnemy(enemyRaw: string): LocalizedName {
  const factionKey = ENEMY_TO_FACTION_KEY[enemyRaw] ?? enemyRaw;
  return resolveFactionLabel(factionKey);
}
