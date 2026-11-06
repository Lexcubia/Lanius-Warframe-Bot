import type { ArbTableDto, ArbTableRowDto, LocalizedName } from '@lanius/core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * arbi.wf.wiki 数据基址（社区排期；见 docs/DATA_SOURCES.md）。
 */
export const ARBI_WIKI_BASE = 'https://arbi.wf.wiki/data/';

/**
 * 拉取仲裁表依赖。
 */
export type FetchArbTableOptions = {
  /** 覆盖基址（测试） */
  baseUrl?: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
  /** 排期小时数上限（默认约 14 天 = 336） */
  hours?: number;
  nowMs?: number;
};

/**
 * 排期 JSON 形状。
 */
type ArbSchedule = {
  startTs: number;
  stepSec?: number;
  seq: number[];
  nodes: string[];
};

/**
 * 节点表形状。
 */
type ArbNodeMeta = {
  nameZh?: string;
  systemNameZh?: string;
  missionNameZh?: string;
  factionNameZh?: string;
};

/**
 * 从 arbi.wf.wiki 拉取并映射约 N 小时仲裁表（含评级三级回落）。
 *
 * @param options - 超时 / fetch / 小时数
 * @returns ArbTableDto
 * @throws 网络或结构错误时抛出（由服务层降级）
 */
export async function fetchArbTable(options: FetchArbTableOptions): Promise<ArbTableDto> {
  const base = (options.baseUrl ?? ARBI_WIKI_BASE).replace(/\/+$/, '') + '/';
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const nowMs = options.nowMs ?? Date.now();
  const hours = options.hours ?? 336;

  const [sched, nodesDoc, tierDoc] = await Promise.all([
    fetchJson<ArbSchedule>(`${base}arbys.schedule.v2.json`, options.timeoutMs, fetchImpl),
    fetchJson<{ nodes?: Record<string, ArbNodeMeta> }>(
      `${base}arbys.nodes.zh.json`,
      options.timeoutMs,
      fetchImpl,
    ),
    fetchJson<{ tierBuckets?: Record<string, string[]> }>(
      `${base}tierlist.default.json`,
      options.timeoutMs,
      fetchImpl,
    ).catch(() => ({ tierBuckets: {} })),
  ]);

  const nodes = nodesDoc.nodes ?? {};
  const tierOf = mergeMeasuredTiers(flattenTier(tierDoc.tierBuckets ?? {}));
  const stepSec = sched.stepSec ?? 3600;
  const startTs = sched.startTs;
  const seq = sched.seq ?? [];
  const keys = sched.nodes ?? [];
  const idxNow = Math.floor((nowMs / 1000 - startTs) / stepSec);
  if (idxNow < 0 || idxNow >= seq.length) {
    return {
      fetchedAt: new Date(nowMs).toISOString(),
      rows: [],
      sourceNote: {
        zh: '仲裁排期表已过期或尚未覆盖当前时刻（arbi.wf.wiki）',
        en: 'Arbitration schedule expired or does not cover now (arbi.wf.wiki)',
      },
    };
  }

  const rows: ArbTableRowDto[] = [];
  const limit = Math.min(hours, seq.length - idxNow);
  for (let i = 0; i < limit; i += 1) {
    const idx = idxNow + i;
    const key = keys[seq[idx]!] ?? '';
    if (!key) {
      continue;
    }
    const meta = nodes[key] ?? {};
    const start = new Date((startTs + idx * stepSec) * 1000).toISOString();
    const end = new Date((startTs + (idx + 1) * stepSec) * 1000).toISOString();
    const missionZh = normalizeMissionZh(meta.missionNameZh);
    const factionRaw = (meta.factionNameZh ?? '').trim();
    const factionFixed = factionRaw === 'Infestation' ? 'Infested' : factionRaw;
    const tier = tierOf.get(key);
    rows.push({
      start,
      end,
      nodeKey: key,
      node: {
        zh: meta.nameZh ?? key,
        en: meta.nameZh ?? key,
      },
      ...(meta.systemNameZh ? { system: { zh: meta.systemNameZh, en: meta.systemNameZh } } : {}),
      ...(missionZh ? { missionType: { zh: missionZh, en: missionZh } } : {}),
      ...(factionFixed ? { faction: { zh: factionFixed, en: factionFixed } } : {}),
      ...(tier?.tier ? { tier: tier.tier, tierSource: tier.source } : {}),
      ...(tier?.median != null ? { measuredMedian: tier.median } : {}),
    });
  }

  return {
    fetchedAt: new Date(nowMs).toISOString(),
    rows,
    sourceNote: {
      zh: '排期·节点·等级 arbi.wf.wiki；评级：tierlist 优先，缺省用社区实测中位数',
      en: 'Schedule/nodes/tiers from arbi.wf.wiki; tiers: tierlist then measured median',
    },
  };
}

/**
 * 展平 tierBuckets → nodeKey → tier。
 *
 * @param buckets - arbi tierlist.default.json
 * @returns Map
 */
function flattenTier(buckets: Record<string, string[]>): Map<string, string> {
  const out = new Map<string, string>();
  for (const [tier, list] of Object.entries(buckets)) {
    for (const key of list) {
      out.set(key, tier);
    }
  }
  return out;
}

/**
 * 评级三级回落：arbi tierlist → 本地实测 → 未评级。
 *
 * @param arbiTiers - arbi 官方档
 * @returns nodeKey → { tier, source, median? }
 */
function mergeMeasuredTiers(
  arbiTiers: Map<string, string>,
): Map<string, { tier: string; source: 'arbi' | 'measured' | ''; median?: number }> {
  const measured = loadMeasuredRatings();
  const out = new Map<
    string,
    { tier: string; source: 'arbi' | 'measured' | ''; median?: number }
  >();
  const keys = new Set([...arbiTiers.keys(), ...Object.keys(measured)]);
  for (const key of keys) {
    const arbi = arbiTiers.get(key);
    const m = measured[key];
    if (arbi) {
      out.set(key, {
        tier: arbi,
        source: 'arbi',
        ...(typeof m?.median === 'number' ? { median: m.median } : {}),
      });
    } else if (m?.tier) {
      out.set(key, {
        tier: String(m.tier),
        source: 'measured',
        ...(typeof m.median === 'number' ? { median: m.median } : {}),
      });
    }
  }
  return out;
}

/**
 * 规范化 Infested Salvage 中文名。
 *
 * @param raw - arbi missionNameZh
 * @returns 规范中文任务类型
 */
function normalizeMissionZh(raw?: string): string {
  const mt = (raw ?? '').trim();
  if (mt.toUpperCase().startsWith('INFESTED ')) {
    return mt.slice(9).trim();
  }
  return mt;
}

/**
 * 实测评级种子形状。
 */
type MeasuredFile = {
  nodes?: Record<string, { median?: number; tier?: string; n?: number }>;
};

/**
 * 懒加载本地 arb-ratings.json。
 */
let measuredCache: MeasuredFile['nodes'] | null = null;

/**
 * 读取社区实测中位数表。
 *
 * @returns nodes map
 */
function loadMeasuredRatings(): NonNullable<MeasuredFile['nodes']> {
  if (measuredCache) {
    return measuredCache;
  }
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const text = readFileSync(join(here, 'data', 'arb-ratings.json'), 'utf8');
    const parsed = JSON.parse(text) as MeasuredFile;
    measuredCache = parsed.nodes ?? {};
    return measuredCache;
  } catch {
    measuredCache = {};
    return measuredCache;
  }
}

/**
 * 带超时的 JSON GET。
 *
 * @param url - 绝对 URL
 * @param timeoutMs - 超时毫秒
 * @param fetchImpl - fetch 实现
 * @returns 解析后的 JSON
 */
async function fetchJson<T>(url: string, timeoutMs: number, fetchImpl: typeof fetch): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Lanius-Warframe-Bot/wave1 (arbi.wf.wiki; +https://github.com/Lexcubia/Lanius-Warframe-Bot)',
      },
    });
    if (!res.ok) {
      throw new Error(`arbi fetch ${res.status} ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 导出 LocalizedName 便利（测试用）。
 *
 * @param zh - 中文
 * @param en - 英文
 * @returns LocalizedName
 */
export function loc(zh: string, en: string): LocalizedName {
  return { zh, en };
}
