/**
 * MissionDeck / ExportRewards 目录适配。
 *
 * 奖励表取自 [warframe-public-export-plus](https://browse.wf/warframe-public-export-plus/)
 * 的 `ExportRewards.json`；仅 API 层使用，客户端不直连。
 */

import {
  buildMissionDeckCatalog,
  type MissionDeckCatalog,
  type MissionDeckRewardTable,
} from '../worldstate/resolve-mission-deck.js';
import { PUBLIC_EXPORT_PLUS_BASE } from './item-icon-catalog.js';

/**
 * 拉取并编成 MissionDeck 奖励表目录。
 *
 * @param options - 可选镜像根与 fetch
 * @returns uniqueName（奖励表路径）→ 二维掉落表
 * @throws 网络或 JSON 解析失败时抛出 Error
 */
export async function fetchMissionDeckCatalog(options?: {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<MissionDeckCatalog> {
  const base = options?.baseUrl ?? PUBLIC_EXPORT_PLUS_BASE;
  const fetchImpl = options?.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const url = `${base.replace(/\/$/, '')}/ExportRewards.json`;
  const response = await fetchImpl(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`ExportRewards fetch failed: HTTP ${response.status}`);
  }
  const raw = (await response.json()) as Record<string, MissionDeckRewardTable | undefined>;
  return buildMissionDeckCatalog(raw);
}
