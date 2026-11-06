import type {
  AcrithisDto,
  EssenceShopDto,
  IncarnonRotationDto,
  IncursionsDto,
  LocalizedName,
  ShopOfferDto,
} from '@lanius/core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveNodeLabel, resolvePathLabel } from './resolve-labels.js';

/**
 * browse.wf 钢铁侵袭排期表。
 */
export const SP_INCURSIONS_URL = 'https://browse.wf/sp-incursions.txt';

/**
 * 计算下一个「周一 00:00 UTC」重置点。
 *
 * @param nowMs - 当前毫秒
 * @param weekday - 目标星期（0=周一…与 JS getUTCDay 不同：此处 0=周一）
 * @param hourUtc - 小时
 * @returns ISO 重置时刻
 */
export function nextWeeklyResetIso(
  nowMs: number = Date.now(),
  weekday: number = 0,
  hourUtc: number = 0,
): string {
  const now = new Date(nowMs);
  // JS：0=周日…；目标：0=周一 → jsWeekday = (weekday+1)%7
  const targetJs = (weekday + 1) % 7;
  const days = (targetJs - now.getUTCDay() + 7) % 7;
  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, hourUtc, 0, 0, 0),
  );
  if (target.getTime() <= nowMs) {
    target.setUTCDate(target.getUTCDate() + 7);
  }
  return target.toISOString();
}

/**
 * 映射钢铁精华商店（wiki 静态表 + 周轮换推算）。
 *
 * @param nowMs - 当前毫秒
 * @returns EssenceShopDto
 */
export function mapSteelPathShop(nowMs: number = Date.now()): EssenceShopDto {
  const data = loadJson<{
    evergreen?: Array<{ name?: string; cost?: number; group?: string }>;
    weekly?: Array<{ name?: string; cost?: number }>;
    rotation?: { epoch?: string; period_hours?: number; index_at_epoch?: number };
  }>('steel_shop.json');
  const evergreen = (data.evergreen ?? []).map(mapShopRow);
  const weeklyPool = data.weekly ?? [];
  const rot = data.rotation ?? {};
  const epochMs = Date.parse(rot.epoch ?? '2024-01-01T00:00:00Z');
  const periodMs = Math.max(1, Number(rot.period_hours ?? 168)) * 3_600_000;
  const anchor = Number(rot.index_at_epoch ?? 0);
  const passed = Number.isFinite(epochMs) ? Math.floor(Math.max(0, nowMs - epochMs) / periodMs) : 0;
  const idx =
    weeklyPool.length > 0
      ? (((anchor + passed) % weeklyPool.length) + weeklyPool.length) % weeklyPool.length
      : 0;
  const currentWeekly = weeklyPool[idx];
  const weekly: ShopOfferDto[] = currentWeekly
    ? [{ ...mapShopRow(currentWeekly), weekly: true }]
    : [];
  return {
    kind: 'steelPath',
    fetchedAt: new Date(nowMs).toISOString(),
    nextReset: nextWeeklyResetIso(nowMs, 0, 0),
    evergreen,
    weekly,
    sourceNote: {
      zh: '来源 wiki Steel Essence 页（每周轮换 1 件；中文名 DE language 表）',
      en: 'From wiki Steel Essence page (1 weekly offer; DE language names)',
    },
  };
}

/**
 * 映射碎银商店（Palladino；常驻无轮换库存）。
 *
 * @param nowMs - 当前毫秒
 * @returns EssenceShopDto
 */
export function mapSliverShop(nowMs: number = Date.now()): EssenceShopDto {
  const data = loadJson<{
    evergreen?: Array<{ name?: string; cost?: number; limit?: number }>;
  }>('palladino_shop.json');
  return {
    kind: 'sliverShop',
    fetchedAt: new Date(nowMs).toISOString(),
    nextReset: nextWeeklyResetIso(nowMs, 0, 0),
    evergreen: (data.evergreen ?? []).map(mapShopRow),
    weekly: [],
    sourceNote: {
      zh: '来源 wiki Riven Sliver · 全表常驻，每周限购周一 00:00 UTC 重置',
      en: 'From wiki Riven Sliver · evergreen stock; weekly purchase limit resets Mon 00:00 UTC',
    },
  };
}

/**
 * 映射本周灵化轮换（rotations-wave1.json · incarnon）。
 *
 * @param nowMs - 当前毫秒
 * @returns IncarnonRotationDto
 */
export function mapIncarnonRotation(nowMs: number = Date.now()): IncarnonRotationDto {
  const data = loadJson<{
    incarnon?: {
      epoch?: string;
      period_hours?: number;
      anchor_week?: number;
      weeks?: Array<Array<{ cn?: string; en?: string; variant?: string }>>;
    };
  }>('rotations-wave1.json');
  const inc = data.incarnon ?? {};
  const weeks = inc.weeks ?? [];
  if (weeks.length === 0) {
    return {
      fetchedAt: new Date(nowMs).toISOString(),
      weekIndex: 1,
      weekTotal: 1,
      current: [],
      next: [],
      sourceNote: {
        zh: '灵化轮换表尚未接线',
        en: 'Incarnon rotation table not wired',
      },
    };
  }
  const epochMs = Date.parse(inc.epoch ?? '2024-12-16T00:00:00Z');
  const periodMs = Math.max(1, Number(inc.period_hours ?? 168)) * 3_600_000;
  const anchor = Math.max(1, Number(inc.anchor_week ?? 1));
  const passed = Number.isFinite(epochMs) ? Math.floor(Math.max(0, nowMs - epochMs) / periodMs) : 0;
  const weekIndex = ((anchor - 1 + passed) % weeks.length) + 1;
  const cur = weeks[weekIndex - 1] ?? [];
  const nxt = weeks[weekIndex % weeks.length] ?? [];
  const periodStart = Number.isFinite(epochMs) ? epochMs + passed * periodMs : nowMs;
  const expiry = new Date(periodStart + periodMs).toISOString();
  return {
    fetchedAt: new Date(nowMs).toISOString(),
    weekIndex,
    weekTotal: weeks.length,
    expiry,
    current: cur.map((w) => ({
      name: { zh: w.cn ?? w.en ?? '?', en: w.en ?? w.cn ?? '?' },
      ...(w.variant ? { variant: w.variant } : {}),
    })),
    next: nxt.map((w) => ({
      name: { zh: w.cn ?? w.en ?? '?', en: w.en ?? w.cn ?? '?' },
      ...(w.variant ? { variant: w.variant } : {}),
    })),
    sourceNote: {
      zh: '来源 Update 43 官方轮换表（本地 seed）',
      en: 'From Update 43 official rotation table (local seed)',
    },
  };
}

/**
 * 映射言录使（候选池；当期 wiki 快照 Wave4 再接线刷新）。
 *
 * @param nowMs - 当前毫秒
 * @returns AcrithisDto
 */
export function mapAcrithis(nowMs: number = Date.now()): AcrithisDto {
  const rot = loadJson<{
    acrithis?: {
      reset_weekday?: number;
      reset_hour_utc?: number;
      items?: Array<{ cn?: string; en?: string; price?: number }>;
      _note?: string;
    };
  }>('rotations-wave1.json');
  const cfg = rot.acrithis ?? {};
  const offers = (cfg.items ?? []).slice(0, 24).map((it) => ({
    name: { zh: it.cn ?? it.en ?? '?', en: it.en ?? it.cn ?? '?' } satisfies LocalizedName,
    ...(typeof it.price === 'number' ? { price: it.price } : {}),
    currency: { zh: '杜卡德', en: 'Ducats' } satisfies LocalizedName,
  }));
  return {
    fetchedAt: new Date(nowMs).toISOString(),
    nextReset: nextWeeklyResetIso(
      nowMs,
      Number(cfg.reset_weekday ?? 0),
      Number(cfg.reset_hour_utc ?? 0),
    ),
    offers,
    stalePool: true,
    sourceNote: {
      zh:
        cfg._note ?? '当期货单需 wiki/社区快照；当前展示候选池（非本周实售）。Wave4 可接自动刷新。',
      en: 'Current week needs wiki/community snapshot; showing candidate pool (not live week).',
    },
  };
}

/**
 * 解析 browse.wf 钢铁侵袭文本。
 *
 * @param text - sp-incursions.txt 正文
 * @param nowMs - 当前毫秒
 * @returns IncursionsDto
 */
export function parseIncursionsText(text: string, nowMs: number = Date.now()): IncursionsDto {
  const day = Math.floor(nowMs / 86_400_000) * 86_400;
  const nodes: IncursionsDto['nodes'] = [];
  for (const line of text.trim().split('\n')) {
    if (!line.includes(';')) {
      continue;
    }
    const [head, rest] = line.split(';', 2);
    if (Number(head?.trim()) !== day) {
      continue;
    }
    for (const n of (rest ?? '').split(',')) {
      const nodeKey = n.trim();
      if (!nodeKey) {
        continue;
      }
      nodes.push({ nodeKey, node: resolveNodeLabel(nodeKey) });
    }
    break;
  }
  return {
    fetchedAt: new Date(nowMs).toISOString(),
    expiry: new Date((day + 86_400) * 1000).toISOString(),
    nodes,
    sourceNote: {
      zh: '来源 browse.wf/sp-incursions.txt（DE worldState 不下发侵袭）',
      en: 'From browse.wf/sp-incursions.txt (not in DE worldState)',
    },
  };
}

/**
 * 拉取钢铁侵袭。
 *
 * @param options - 超时与 fetch
 * @returns IncursionsDto（失败时空 nodes）
 */
export async function fetchIncursions(options: {
  timeoutMs: number;
  fetchImpl?: typeof fetch;
  nowMs?: number;
}): Promise<IncursionsDto> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const nowMs = options.nowMs ?? Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), options.timeoutMs);
    try {
      const res = await fetchImpl(SP_INCURSIONS_URL, {
        signal: ctrl.signal,
        headers: {
          'User-Agent':
            'Lanius-Warframe-Bot/wave1 (browse.wf; +https://github.com/Lexcubia/Lanius-Warframe-Bot)',
        },
      });
      if (!res.ok) {
        throw new Error(`incursions ${res.status}`);
      }
      return parseIncursionsText(await res.text(), nowMs);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return {
      fetchedAt: new Date(nowMs).toISOString(),
      nodes: [],
      sourceNote: {
        zh: '钢铁侵袭排期暂不可用（browse.wf）',
        en: 'Steel Path incursions unavailable (browse.wf)',
      },
    };
  }
}

/**
 * 商店行 → ShopOfferDto。
 *
 * @param row - 静态表行（`name` / `cost`）
 * @returns ShopOfferDto
 */
function mapShopRow(row: { name?: string; cost?: number; uniqueName?: string }): ShopOfferDto {
  const label = (row.name ?? '?').trim() || '?';
  const name = { zh: label, en: label };
  return {
    name,
    ...(typeof row.cost === 'number' ? { cost: row.cost } : {}),
    ...(row.uniqueName
      ? {
          uniqueName: row.uniqueName,
          item: { name: resolvePathLabel(row.uniqueName), uniqueName: row.uniqueName },
        }
      : {}),
  };
}

/**
 * 读取适配器 data 目录 JSON。
 *
 * @param name - 文件名
 * @returns 解析对象
 */
function loadJson<T>(name: string): T {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    return JSON.parse(readFileSync(join(here, 'data', name), 'utf8')) as T;
  } catch {
    return {} as T;
  }
}
