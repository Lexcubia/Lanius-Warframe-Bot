import {
  MARKET_ORDERS_PAGE_SIZE,
  type FissureEra,
  type OpenRelicDto,
  type PartsDto,
  type RelicQueryDto,
  type RelicRarity,
} from '@lanius/core';

import { notFoundError, validationError } from '../lib/http-error.js';
import { loadRelicIndex, loadRelicInverse } from '../lib/wave2-data.js';
import type { WorldstateService } from './worldstate-service.js';

/**
 * 纪元中文 → 裂隙 era 枚举。
 */
const ERA_MAP: ReadonlyArray<{ zh: string; en: FissureEra; aliases: string[] }> = [
  { zh: '古纪', en: 'lith', aliases: ['lith', '古纪'] },
  { zh: '前纪', en: 'meso', aliases: ['meso', '前纪'] },
  { zh: '中纪', en: 'neo', aliases: ['neo', '中纪'] },
  { zh: '后纪', en: 'axi', aliases: ['axi', '后纪'] },
  { zh: '安魂', en: 'requiem', aliases: ['requiem', '安魂'] },
  { zh: '全能', en: 'omnia', aliases: ['omnia', '全能'] },
];

/** 裂隙 era → 遗物索引英文专名 */
const ERA_EN_TITLE: Record<FissureEra, string> = {
  lith: 'Lith',
  meso: 'Meso',
  neo: 'Neo',
  axi: 'Axi',
  requiem: 'Requiem',
  omnia: 'Omnia',
};

/**
 * 速刷任务类型关键词（中英）。
 */
const FAST_MISSION = /歼灭|捕获|破坏|救援|间谍|exterminate|capture|sabotage|rescue|spy/i;

/**
 * 稀有度中文 → DTO。
 */
const RARITY_MAP: Record<string, RelicRarity> = {
  常见: 'common',
  罕见: 'uncommon',
  稀有: 'rare',
  common: 'common',
  uncommon: 'uncommon',
  rare: 'rare',
};

/**
 * Wave 2 遗物 / 部件 / 开核桃服务。
 */
export class RelicService {
  private readonly worldstateService?: WorldstateService;

  /**
   * @param deps - 可选世界状态（开核桃需要裂隙）
   */
  constructor(deps: { worldstateService?: WorldstateService } = {}) {
    this.worldstateService = deps.worldstateService;
  }

  /**
   * 查询遗物奖励或纪元列表。
   *
   * @param query - 遗物名 / 纪元；空则帮助
   * @param page - 页码
   * @param pageSize - 每页
   * @returns 遗物 DTO
   */
  getRelic(query: string, page = 1, pageSize = MARKET_ORDERS_PAGE_SIZE): RelicQueryDto {
    const size = Math.min(Math.max(1, pageSize), MARKET_ORDERS_PAGE_SIZE);
    const pg = Math.max(1, page);
    const q = query.trim();
    const index = loadRelicIndex();
    const updatedAt = new Date().toISOString();

    if (!q) {
      return {
        query: q,
        mode: 'help',
        page: 1,
        pageSize: size,
        total: 0,
        updatedAt,
      };
    }

    const era = matchEra(q);
    if (era && !looksLikeSpecificRelic(q)) {
      const keys = Object.keys(index).filter((k) => k.includes(era.zh) || k.includes(era.en));
      const total = keys.length;
      const slice = keys.slice((pg - 1) * size, pg * size).map((key) => ({
        key,
        name: { zh: key, en: toEnRelicKey(key) },
        era: ERA_EN_TITLE[era.en],
      }));
      return {
        query: q,
        mode: 'tierList',
        list: slice,
        page: pg,
        pageSize: size,
        total,
        updatedAt,
      };
    }

    const key = resolveRelicKey(q, index);
    if (!key) {
      throw notFoundError(`未匹配到遗物：${q}`);
    }
    const rewards = index[key]!;
    return {
      query: q,
      mode: 'relic',
      relic: {
        key,
        name: { zh: key, en: toEnRelicKey(key) },
        rewards: flattenRewards(rewards),
      },
      page: 1,
      pageSize: size,
      total: 1,
      updatedAt,
    };
  }

  /**
   * 部件反查遗物来源。
   *
   * @param query - 部件名
   * @param page - 页码
   * @param pageSize - 每页
   * @returns 部件 DTO
   */
  getParts(query: string, page = 1, pageSize = MARKET_ORDERS_PAGE_SIZE): PartsDto {
    const q = query.trim();
    if (!q) {
      throw validationError('query is required');
    }
    const size = Math.min(Math.max(1, pageSize), MARKET_ORDERS_PAGE_SIZE);
    const pg = Math.max(1, page);
    const inverse = loadRelicInverse();
    const partName = resolvePartName(q, inverse);
    if (!partName) {
      throw notFoundError(`未匹配到部件：${q}`);
    }
    const sources = (inverse[partName] ?? []).map((row) => ({
      relicKey: row.relic,
      relicName: { zh: row.relic, en: toEnRelicKey(row.relic) },
      rarity: RARITY_MAP[row.rarity] ?? ('common' as const),
    }));
    const total = sources.length;
    return {
      query: q,
      partName,
      sources: sources.slice((pg - 1) * size, pg * size),
      page: pg,
      pageSize: size,
      total,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 结合当前裂隙推荐可开纪元。
   *
   * @returns 开核桃 DTO
   */
  async getOpenRelic(): Promise<OpenRelicDto> {
    if (!this.worldstateService) {
      return {
        rows: [],
        note: '世界状态服务未注入，无法读取裂隙。',
        updatedAt: new Date().toISOString(),
      };
    }
    const { data: ws } = await this.worldstateService.getWorldstate('international', 'zh');
    const byEra = new Map<
      FissureEra,
      { fissureCount: number; fastCount: number; nodes: string[] }
    >();
    for (const era of ERA_MAP) {
      byEra.set(era.en, { fissureCount: 0, fastCount: 0, nodes: [] });
    }
    for (const fissure of ws.fissures ?? []) {
      const bucket = byEra.get(fissure.era);
      if (!bucket) {
        continue;
      }
      bucket.fissureCount += 1;
      const mission = fissure.missionType.zh || fissure.missionType.en;
      const node = fissure.node.zh || fissure.node.en;
      if (FAST_MISSION.test(mission) || FAST_MISSION.test(fissure.missionTypeKey)) {
        bucket.fastCount += 1;
      }
      if (bucket.nodes.length < 3) {
        bucket.nodes.push(`${node} · ${mission}`);
      }
    }
    const rows = ERA_MAP.map((era) => {
      const bucket = byEra.get(era.en)!;
      return {
        era: ERA_EN_TITLE[era.en],
        eraZh: era.zh,
        fissureCount: bucket.fissureCount,
        fastCount: bucket.fastCount,
        sampleNodes: bucket.nodes,
      };
    }).filter((r) => r.fissureCount > 0);
    rows.sort((a, b) => b.fastCount - a.fastCount || b.fissureCount - a.fissureCount);
    return {
      rows,
      note: '速刷优先歼灭/捕获/破坏/救援/间谍；结合当前国际服裂隙。',
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * 匹配纪元。
 *
 * @param q - 查询
 * @returns 纪元或 null
 */
function matchEra(q: string): (typeof ERA_MAP)[number] | null {
  const key = q.trim().toLowerCase();
  return ERA_MAP.find((e) => e.aliases.some((a) => a.toLowerCase() === key)) ?? null;
}

/**
 * 是否像具体遗物名（含字母编号）。
 *
 * @param q - 查询
 * @returns 是否具体
 */
function looksLikeSpecificRelic(q: string): boolean {
  return /[a-z]\s*\d+/i.test(q) || /[甲乙丙丁]|[A-Z]\d+/i.test(q);
}

/**
 * 解析遗物索引键。
 *
 * @param q - 查询
 * @param index - 索引
 * @returns 键
 */
function resolveRelicKey(q: string, index: Record<string, unknown>): string | null {
  const normalized = q
    .replace(/遗物|relic/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (index[normalized]) {
    return normalized;
  }
  // 英文 Axi A2 → 后纪 Axi A2
  const enMatch = normalized.match(/^(lith|meso|neo|axi|requiem|omnia)\s*([a-z]?\d+)$/i);
  if (enMatch) {
    const eraToken = enMatch[1]!.toLowerCase() as FissureEra;
    const era = ERA_MAP.find((e) => e.en === eraToken);
    if (era) {
      const code = enMatch[2]!.toUpperCase();
      const key = `${era.zh} ${ERA_EN_TITLE[era.en]} ${code}`;
      if (index[key]) {
        return key;
      }
    }
  }
  // 中文 古纪 A1 / 古纪 Lith A1
  const loose = Object.keys(index).find((k) => {
    const compact = k.replace(/\s+/g, '').toLowerCase();
    const qCompact = normalized.replace(/\s+/g, '').toLowerCase();
    return compact.includes(qCompact) || qCompact.includes(compact);
  });
  return loose ?? null;
}

/**
 * 中文遗物键 → 英文展示。
 *
 * @param key - 索引键
 * @returns 英文
 */
function toEnRelicKey(key: string): string {
  const parts = key.split(/\s+/);
  if (parts.length >= 3) {
    return `${parts[1]} ${parts[2]} Relic`;
  }
  return key;
}

/**
 * 展开奖励槽。
 *
 * @param rewards - 中文稀有度桶
 * @returns 槽列表
 */
function flattenRewards(rewards: {
  常见?: string[];
  罕见?: string[];
  稀有?: string[];
}): Array<{ rarity: RelicRarity; itemName: string }> {
  const out: Array<{ rarity: RelicRarity; itemName: string }> = [];
  for (const [zhRarity, items] of Object.entries(rewards)) {
    const rarity = RARITY_MAP[zhRarity];
    if (!rarity || !items) {
      continue;
    }
    for (const itemName of items) {
      out.push({ rarity, itemName });
    }
  }
  return out;
}

/**
 * 解析部件名（精确或包含）。
 *
 * @param q - 查询
 * @param inverse - 反查表
 * @returns 部件名
 */
function resolvePartName(q: string, inverse: Record<string, unknown>): string | null {
  if (inverse[q]) {
    return q;
  }
  const compact = q.replace(/\s+/g, '');
  const hit = Object.keys(inverse).find((k) => k.replace(/\s+/g, '').includes(compact));
  return hit ?? null;
}
