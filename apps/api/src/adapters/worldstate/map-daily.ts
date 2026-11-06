import type {
  CatalogItemDto,
  ClanRewardDto,
  ConclaveChallengeDto,
  ConstructionDto,
  DailyDealDto,
  EventDto,
  FlashSaleDto,
  KuvaDto,
  LocalizedName,
  NewsItemDto,
  SynthTargetDto,
  VoidStormDto,
} from '@lanius/core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mongoToIso, parseMongoMs } from './mongo-date.js';
import {
  resolveFactionLabel,
  resolveMissionTypeLabel,
  resolveNodeLabel,
  resolvePathLabel,
} from './resolve-labels.js';
import type {
  UpstreamDailyDeal,
  UpstreamFlashSale,
  UpstreamGoal,
  UpstreamNewsEvent,
  UpstreamPvpChallenge,
  UpstreamVoidStorm,
  UpstreamWorldstate,
} from './types.js';

/**
 * 武形秘仪模式键 → 双语名。
 */
const PVP_MODE_LABELS: Record<string, LocalizedName> = {
  PVPMODE_SPEEDBALL: { zh: '月动球', en: 'Lunaro' },
  PVPMODE_LUNARO: { zh: '月动球', en: 'Lunaro' },
  PVPMODE_CAPTURETHEFLAG: { zh: '中枢捕获', en: 'Cephalon Capture' },
  PVPMODE_TEAMDEATHMATCH: { zh: '团队歼灭', en: 'Team Annihilation' },
  PVPMODE_DEATHMATCH: { zh: '歼灭', en: 'Annihilation' },
  PVPMODE_ANNIHILATION: { zh: '歼灭', en: 'Annihilation' },
  PVPMODE_TEAMANNIHILATION: { zh: '团队歼灭', en: 'Team Annihilation' },
  PVPMODE_FACEOFF: { zh: '对峙', en: 'Faceoff' },
  PVPMODE_ALL: { zh: '全部模式', en: 'All modes' },
  PVPMODE_NONE: { zh: '不限', en: 'Any' },
};

/**
 * 九重天虚空风暴档位短标。
 */
const VOIDSTORM_TIER: Record<string, string> = {
  VoidT1: 'T1',
  VoidT2: 'T2',
  VoidT3: 'T3',
  VoidT4: 'T4',
};

/**
 * 舰队建造项目（ProjectPct 下标 → 名称）。
 */
const PROJECT_KEYS: Array<{
  name: LocalizedName;
  faction?: LocalizedName;
  event?: LocalizedName;
}> = [
  {
    name: { zh: '巴罗尔巨人战舰', en: 'Balor Fomorian' },
    faction: { zh: 'Grineer', en: 'Grineer' },
    event: { zh: '战舰破坏', en: 'Fomorian Sabotage' },
  },
  {
    name: { zh: '利刃豺狼舰队', en: 'Razorback Armada' },
    faction: { zh: 'Corpus', en: 'Corpus' },
    event: { zh: '利刃豺狼舰队', en: 'Razorback Armada' },
  },
  {
    name: { zh: '未知项目', en: 'Unknown project' },
  },
];

/**
 * 行星英文 → 双语（氏族奖励区域）。
 */
const PLANET_LABELS: Record<string, LocalizedName> = {
  Earth: { zh: '地球', en: 'Earth' },
  Venus: { zh: '金星', en: 'Venus' },
  Mercury: { zh: '水星', en: 'Mercury' },
  Mars: { zh: '火星', en: 'Mars' },
  Phobos: { zh: '火卫一', en: 'Phobos' },
  Deimos: { zh: '火卫二', en: 'Deimos' },
  Ceres: { zh: '谷神星', en: 'Ceres' },
  Jupiter: { zh: '木星', en: 'Jupiter' },
  Europa: { zh: '欧罗巴', en: 'Europa' },
  Saturn: { zh: '土星', en: 'Saturn' },
  Uranus: { zh: '天王星', en: 'Uranus' },
  Neptune: { zh: '海王星', en: 'Neptune' },
  Pluto: { zh: '冥王星', en: 'Pluto' },
  Eris: { zh: '阋神星', en: 'Eris' },
  Sedna: { zh: '赛德娜', en: 'Sedna' },
  Void: { zh: '虚空', en: 'Void' },
  Lua: { zh: '月球', en: 'Lua' },
  KuvaFortress: { zh: '赤毒要塞', en: 'Kuva Fortress' },
};

/**
 * 赤毒源停摆说明（对齐 SDJK：原 10o.io 社区源已失效）。
 */
export const KUVA_STALLED_NOTE: LocalizedName = {
  zh: '赤毒/血紊虹吸社区源（原 10o.io）已停摆；官方 worldState 不下发该字段。可用裂隙/仲裁等替代时效查询。',
  en: 'Kuva/Siphon community source (formerly 10o.io) is stalled; official worldState has no field. Use fissures/arbitration timers instead.',
};

/**
 * 映射达沃每日特惠。
 *
 * @param raw - 上游 worldState
 * @returns DailyDealDto 列表
 */
export function mapDailyDeals(raw: UpstreamWorldstate): DailyDealDto[] {
  const out: DailyDealDto[] = [];
  for (const row of raw.DailyDeals ?? []) {
    const mapped = mapOneDeal(row);
    if (mapped) {
      out.push(mapped);
    }
  }
  return out;
}

/**
 * 映射单条达沃特惠。
 *
 * @param row - 上游 DailyDeals 元素
 * @returns DailyDealDto 或 null
 */
function mapOneDeal(row: UpstreamDailyDeal): DailyDealDto | null {
  const uniqueName = row.StoreItem;
  if (!uniqueName) {
    return null;
  }
  return {
    uniqueName,
    item: catalogFromPath(uniqueName),
    ...(typeof row.OriginalPrice === 'number' ? { originalPrice: row.OriginalPrice } : {}),
    ...(typeof row.SalePrice === 'number' ? { salePrice: row.SalePrice } : {}),
    ...(typeof row.Discount === 'number' ? { discountPct: row.Discount } : {}),
    ...(typeof row.AmountTotal === 'number' ? { amountTotal: row.AmountTotal } : {}),
    ...(typeof row.AmountSold === 'number' ? { amountSold: row.AmountSold } : {}),
    ...(mongoToIso(row.Expiry) ? { expiry: mongoToIso(row.Expiry) } : {}),
  };
}

/**
 * 映射官方新闻（Events.Messages；仅 zh/zh-hans/en）。
 *
 * @param raw - 上游 worldState
 * @returns NewsItemDto 列表（新→旧）
 */
export function mapNews(raw: UpstreamWorldstate): NewsItemDto[] {
  const out: NewsItemDto[] = [];
  for (const entry of raw.Events ?? []) {
    const mapped = mapOneNews(entry);
    if (mapped) {
      out.push(mapped);
    }
  }
  out.sort((a, b) => {
    const aMs = a.date ? Date.parse(a.date) : 0;
    const bMs = b.date ? Date.parse(b.date) : 0;
    if (bMs !== aMs) {
      return bMs - aMs;
    }
    return Number(Boolean(b.priority)) - Number(Boolean(a.priority));
  });
  return out;
}

/**
 * 映射单条新闻。
 *
 * @param entry - 上游 Events 元素
 * @returns NewsItemDto 或 null
 */
function mapOneNews(entry: UpstreamNewsEvent): NewsItemDto | null {
  const id = entry._id?.$oid;
  if (!id) {
    return null;
  }
  const message = pickNewsMessage(entry.Messages ?? []);
  if (!message) {
    return null;
  }
  return {
    id,
    message,
    ...(entry.Prop ? { link: entry.Prop } : {}),
    ...(mongoToIso(entry.Date) ? { date: mongoToIso(entry.Date) } : {}),
    ...(entry.Priority != null ? { priority: Boolean(entry.Priority) } : {}),
    ...(entry.Community != null ? { community: Boolean(entry.Community) } : {}),
  };
}

/**
 * 从 Messages 挑选 zh → zh-hans → en 文案。
 *
 * @param messages - 上游多语言消息
 * @returns LocalizedName 或 null
 */
function pickNewsMessage(
  messages: Array<{ LanguageCode?: string; Message?: string }>,
): LocalizedName | null {
  const byCode = new Map<string, string>();
  for (const m of messages) {
    const code = (m.LanguageCode ?? '').toLowerCase();
    const text = (m.Message ?? '').trim();
    if (code && text && !text.startsWith('/Lotus/')) {
      byCode.set(code, text);
    }
  }
  const zh = byCode.get('zh') ?? byCode.get('zh-hans');
  const en = byCode.get('en');
  if (!zh && !en) {
    return null;
  }
  return { zh: zh ?? en ?? '', en: en ?? zh ?? '' };
}

/**
 * 赤毒切片：社区源停摆 → 空 missions + 说明。
 *
 * @returns KuvaDto
 */
export function mapKuvaStalled(): KuvaDto {
  return {
    missions: [],
    sourceNote: KUVA_STALLED_NOTE,
  };
}

/**
 * 映射结合目标（静态 WFCD 表；DE 不下发）。
 *
 * @returns SynthTargetDto 列表
 */
export function mapSynthTargets(): SynthTargetDto[] {
  const table = loadSynthTargetsTable();
  const out: SynthTargetDto[] = [];
  for (const [enName, locs] of Object.entries(table)) {
    const first = Array.isArray(locs) && locs.length > 0 ? locs[0] : undefined;
    if (!first || typeof first !== 'object') {
      continue;
    }
    const mission = typeof first.mission === 'string' ? first.mission : '';
    const planetEn = typeof first.planet === 'string' ? first.planet : '';
    const factionEn = typeof first.faction === 'string' ? first.faction : '';
    const typeEn = typeof first.type === 'string' ? first.type : '';
    const spawn = typeof first.spawn === 'string' ? first.spawn : undefined;
    out.push({
      name: { zh: enName, en: enName },
      ...(planetEn ? { planet: PLANET_LABELS[planetEn] ?? { zh: planetEn, en: planetEn } } : {}),
      ...(mission ? { node: { zh: mission, en: mission } } : {}),
      ...(typeEn ? { missionType: { zh: typeEn, en: typeEn } } : {}),
      ...(factionEn ? { faction: resolveFactionLabel(factionEn) } : {}),
      ...(spawn ? { spawn } : {}),
    });
  }
  return out;
}

/**
 * 映射舰队建造进度 + 袭击。
 *
 * @param raw - 上游 worldState
 * @returns ConstructionDto 或 null（无进度）
 */
export function mapConstruction(raw: UpstreamWorldstate): ConstructionDto | null {
  const pct = raw.ProjectPct ?? [];
  if (pct.length === 0) {
    return null;
  }
  const projects = [];
  for (let i = 0; i < PROJECT_KEYS.length && i < pct.length; i += 1) {
    const val = Number(pct[i] ?? 0);
    if (!Number.isFinite(val) || val <= 0) {
      continue;
    }
    const meta = PROJECT_KEYS[i]!;
    projects.push({
      name: meta.name,
      ...(meta.faction ? { faction: meta.faction } : {}),
      ...(meta.event ? { event: meta.event } : {}),
      pct: Math.min(100, Math.max(0, val)),
    });
  }
  const assaults = [];
  for (const g of raw.Goals ?? []) {
    if (!g.VictimNode) {
      continue;
    }
    const tag = JSON.stringify(g);
    const hit = PROJECT_KEYS.find(
      (p) =>
        p.name.en &&
        tag.toLowerCase().replace(/\s+/g, '').includes(p.name.en.toLowerCase().replace(/\s+/g, '')),
    );
    if (!hit) {
      continue;
    }
    assaults.push({
      name: hit.name,
      victimNode: resolveNodeLabel(g.VictimNode),
      ...(typeof g.HealthPct === 'number'
        ? { healthPct: Math.min(100, Math.max(0, g.HealthPct)) }
        : {}),
      ...(mongoToIso(g.Expiry) ? { expiry: mongoToIso(g.Expiry) } : {}),
    });
  }
  if (projects.length === 0 && assaults.length === 0) {
    return null;
  }
  return { projects, assaults };
}

/**
 * 映射九重天虚空风暴（过滤已过期）。
 *
 * @param raw - 上游 worldState
 * @param nowMs - 当前毫秒
 * @returns VoidStormDto 列表（剩余升序）
 */
export function mapVoidStorms(raw: UpstreamWorldstate, nowMs: number): VoidStormDto[] {
  const out: VoidStormDto[] = [];
  for (const row of raw.VoidStorms ?? []) {
    const mapped = mapOneStorm(row, nowMs);
    if (mapped) {
      out.push(mapped);
    }
  }
  out.sort(
    (a, b) =>
      (a.remainingMs ?? Number.POSITIVE_INFINITY) - (b.remainingMs ?? Number.POSITIVE_INFINITY),
  );
  return out;
}

/**
 * 映射单条虚空风暴。
 *
 * @param row - 上游 VoidStorms 元素
 * @param nowMs - 当前毫秒
 * @returns VoidStormDto 或 null
 */
function mapOneStorm(row: UpstreamVoidStorm, nowMs: number): VoidStormDto | null {
  const id = row._id?.$oid ?? `${row.Node ?? 'storm'}-${row.Expiry?.$date?.$numberLong ?? ''}`;
  const expiryMs = parseMongoMs(row.Expiry);
  if (expiryMs !== undefined && expiryMs <= nowMs) {
    return null;
  }
  const nodeKey = row.Node;
  const tierRaw = row.ActiveMissionTier ?? '';
  return {
    id,
    ...(nodeKey
      ? {
          nodeKey,
          node: resolveNodeLabel(nodeKey),
          missionType: resolveMissionTypeLabel(nodeKey, { fromNode: true }),
        }
      : {}),
    ...(tierRaw ? { tier: VOIDSTORM_TIER[tierRaw] ?? tierRaw } : {}),
    ...(expiryMs !== undefined
      ? {
          expiry: new Date(expiryMs).toISOString(),
          remainingMs: Math.max(0, expiryMs - nowMs),
        }
      : {}),
  };
}

/**
 * 映射限时活动 Goals（保留 GracePeriod 内已结束条目）。
 *
 * @param raw - 上游 worldState
 * @param nowMs - 当前毫秒
 * @returns EventDto 列表
 */
export function mapEvents(raw: UpstreamWorldstate, nowMs: number): EventDto[] {
  const out: EventDto[] = [];
  for (const g of raw.Goals ?? []) {
    const mapped = mapOneGoal(g, nowMs);
    if (mapped) {
      out.push(mapped);
    }
  }
  out.sort((a, b) => {
    const endedCmp = Number(Boolean(a.ended)) - Number(Boolean(b.ended));
    if (endedCmp !== 0) {
      return endedCmp;
    }
    const aMs = a.expiry ? Date.parse(a.expiry) : Number.POSITIVE_INFINITY;
    const bMs = b.expiry ? Date.parse(b.expiry) : Number.POSITIVE_INFINITY;
    return aMs - bMs;
  });
  return out;
}

/**
 * 映射单条 Goal。
 *
 * @param g - 上游 Goals 元素
 * @param nowMs - 当前毫秒
 * @returns EventDto 或 null
 */
function mapOneGoal(g: UpstreamGoal, nowMs: number): EventDto | null {
  const end = parseMongoMs(g.Expiry);
  const grace = parseMongoMs(g.GracePeriod);
  if (end !== undefined && end < nowMs && (grace === undefined || grace < nowMs)) {
    return null;
  }
  const id = g._id?.$oid ?? g.Tag ?? `goal-${end ?? nowMs}`;
  const descRaw = (g.Desc ?? '').trim();
  const tipRaw = (g.ToolTip ?? '').trim();
  const nameEn = tipRaw || descRaw || g.Tag || 'Event';
  const nameZh = descRaw || tipRaw || g.Tag || '活动';
  const rewards: CatalogItemDto[] = [];
  for (const path of g.Reward?.items ?? []) {
    if (path) {
      rewards.push(catalogFromPath(path));
    }
  }
  for (const ci of g.Reward?.countedItems ?? []) {
    if (!ci.ItemType) {
      continue;
    }
    rewards.push({
      ...catalogFromPath(ci.ItemType),
      ...(typeof ci.ItemCount === 'number' && ci.ItemCount > 0
        ? { quantity: Math.floor(ci.ItemCount) }
        : {}),
    });
  }
  return {
    id,
    name: { zh: nameZh, en: nameEn },
    ...(g.Tag ? { tag: g.Tag } : {}),
    ...(tipRaw ? { desc: { zh: tipRaw, en: tipRaw } } : {}),
    ...(g.Faction ? { faction: resolveFactionLabel(g.Faction) } : {}),
    ...(g.Node ? { node: resolveNodeLabel(g.Node) } : {}),
    ...(typeof g.Count === 'number' ? { count: g.Count } : {}),
    ...(typeof g.Goal === 'number' ? { goal: g.Goal } : {}),
    ...(end !== undefined ? { expiry: new Date(end).toISOString() } : {}),
    ...(grace !== undefined ? { grace: new Date(grace).toISOString() } : {}),
    ended: Boolean(end !== undefined && end < nowMs),
    rewards,
  };
}

/**
 * 映射武形秘仪挑战。
 *
 * @param raw - 上游 worldState
 * @returns ConclaveChallengeDto 列表
 */
export function mapConclave(raw: UpstreamWorldstate): ConclaveChallengeDto[] {
  const out: ConclaveChallengeDto[] = [];
  for (const c of raw.PVPChallengeInstances ?? []) {
    const mapped = mapOneConclave(c);
    if (mapped) {
      out.push(mapped);
    }
  }
  out.sort((a, b) => {
    const cat = a.category.localeCompare(b.category);
    if (cat !== 0) {
      return cat;
    }
    return (a.mode?.en ?? '').localeCompare(b.mode?.en ?? '');
  });
  return out;
}

/**
 * 映射单条武形秘仪挑战。
 *
 * @param c - 上游 PVPChallengeInstances 元素
 * @returns ConclaveChallengeDto 或 null
 */
function mapOneConclave(c: UpstreamPvpChallenge): ConclaveChallengeDto | null {
  const ref = c.challengeTypeRefID ?? '';
  const id = c._id?.$oid ?? (ref || `pvp-${c.PVPMode ?? 'x'}`);
  const catRaw = (c.Category ?? '').toUpperCase();
  const category: ConclaveChallengeDto['category'] = catRaw.includes('WEEKLY')
    ? 'weekly'
    : catRaw.includes('DAILY')
      ? 'daily'
      : 'other';
  const categoryLabel: LocalizedName =
    category === 'weekly'
      ? { zh: '每周', en: 'Weekly' }
      : category === 'daily'
        ? { zh: '每日', en: 'Daily' }
        : { zh: '其他', en: 'Other' };
  let value: string | number | undefined;
  for (const p of c.params ?? []) {
    if (p.n === 'ScriptParamValue' && p.v != null) {
      value = p.v;
      break;
    }
  }
  const modeKey = c.PVPMode ?? '';
  const pretty = ref ? resolvePathLabel(ref) : { zh: '挑战', en: 'Challenge' };
  return {
    id,
    ...(modeKey ? { mode: PVP_MODE_LABELS[modeKey] ?? { zh: modeKey, en: modeKey } } : {}),
    text: pretty,
    category,
    categoryLabel,
    ...(value !== undefined ? { value } : {}),
    ...(mongoToIso(c.endDate) ? { expiry: mongoToIso(c.endDate) } : {}),
  };
}

/**
 * 映射氏族周奖励。
 *
 * @param raw - 上游 worldState
 * @returns ClanRewardDto 列表
 */
export function mapClanRewards(raw: UpstreamWorldstate): ClanRewardDto[] {
  const out: ClanRewardDto[] = [];
  for (const w of raw.WeeklyVaultBonusRewards ?? []) {
    const regionParts = (w.BonusRegion ?? '').split('/');
    const regionKey = regionParts.at(-1) || 'Unknown';
    const region = PLANET_LABELS[regionKey] ?? { zh: regionKey, en: regionKey };
    const rewards = [];
    for (const r of w.Rewards ?? []) {
      if (!r.Reward) {
        continue;
      }
      rewards.push({
        ...(typeof r.PointThreshold === 'number' ? { points: r.PointThreshold } : {}),
        item: {
          ...catalogFromPath(r.Reward),
          ...(typeof r.ItemCount === 'number' && r.ItemCount > 0
            ? { quantity: Math.floor(r.ItemCount) }
            : {}),
        },
      });
    }
    out.push({
      ...(typeof w.WeekCount === 'number' ? { week: w.WeekCount } : {}),
      region,
      rewards,
    });
  }
  return out;
}

/**
 * 映射商城闪购（仅 ShowInMarket）。
 *
 * @param raw - 上游 worldState
 * @param nowMs - 当前毫秒
 * @returns FlashSaleDto 列表
 */
export function mapFlashSales(raw: UpstreamWorldstate, nowMs: number): FlashSaleDto[] {
  const out: FlashSaleDto[] = [];
  for (const s of raw.FlashSales ?? []) {
    const mapped = mapOneFlash(s, nowMs);
    if (mapped) {
      out.push(mapped);
    }
  }
  out.sort((a, b) => {
    const aMs = a.end ? Date.parse(a.end) : Number.POSITIVE_INFINITY;
    const bMs = b.end ? Date.parse(b.end) : Number.POSITIVE_INFINITY;
    return aMs - bMs;
  });
  return out;
}

/**
 * 映射单条闪购。
 *
 * @param s - 上游 FlashSales 元素
 * @param nowMs - 当前毫秒
 * @returns FlashSaleDto 或 null
 */
function mapOneFlash(s: UpstreamFlashSale, nowMs: number): FlashSaleDto | null {
  if (!s.ShowInMarket || !s.TypeName) {
    return null;
  }
  const endMs = parseMongoMs(s.EndDate);
  return {
    uniqueName: s.TypeName,
    item: catalogFromPath(s.TypeName),
    ...(mongoToIso(s.StartDate) ? { start: mongoToIso(s.StartDate) } : {}),
    ...(endMs !== undefined
      ? {
          end: new Date(endMs).toISOString(),
          remainingMs: Math.max(0, endMs - nowMs),
        }
      : {}),
  };
}

/**
 * 由资产路径构造 CatalogItemDto（标签解析；图标稍后 enrich）。
 *
 * @param path - uniqueName / StoreItems 路径
 * @returns CatalogItemDto
 */
function catalogFromPath(path: string): CatalogItemDto {
  return {
    name: resolvePathLabel(path),
    uniqueName: path,
  };
}

/**
 * 结合目标静态表形状。
 */
type SynthTable = Record<string, Array<Record<string, unknown>>>;

/**
 * 懒加载结合目标表。
 */
let synthCache: SynthTable | null = null;

/**
 * 读取 `data/synth-targets.json`。
 *
 * @returns 目标名 → 地点列表
 */
function loadSynthTargetsTable(): SynthTable {
  if (synthCache) {
    return synthCache;
  }
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const text = readFileSync(join(here, 'data', 'synth-targets.json'), 'utf8');
    const parsed = JSON.parse(text) as SynthTable;
    synthCache = parsed;
    return parsed;
  } catch {
    synthCache = {};
    return synthCache;
  }
}
