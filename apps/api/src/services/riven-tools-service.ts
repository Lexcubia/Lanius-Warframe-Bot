import {
  MARKET_ORDERS_PAGE_SIZE,
  RIVEN_STAT_ZH,
  UNIFIED_DISPOSITION,
  analyzeRivenStats,
  listSpliceRecipes,
  listStatRangesForClass,
  parseRivenAnalysisText,
  resolveBestItem,
  resolveRivenStatId,
  resolveRivenWeaponClass,
  type DispositionDto,
  type ItemIndexRow,
  type LichAuctionsDto,
  type RivenAnalysisDto,
  type RivenRangesDto,
  type RivenSpliceDto,
  type RivenWeaponClass,
} from '@lanius/core';

import { WarframeMarketClient } from '../adapters/warframe-market/client.js';
import type { CacheStore } from '../cache/types.js';
import { notFoundError, validationError } from '../lib/http-error.js';
import {
  loadDispositionEntries,
  loadLichWeapons,
  type DispositionEntry,
  type LichWeaponRow,
} from '../lib/wave2-data.js';

const RIVEN_ITEMS_TTL_MS = 6 * 60 * 60_000;

/**
 * Wave 2 紫卡工具：分析 / 范围 / 融合 / 倾向 / 玄骸。
 */
export class RivenToolsService {
  private readonly cache: CacheStore;
  private readonly client: WarframeMarketClient;

  /**
   * @param deps - 缓存与 WFM
   */
  constructor(deps: { cache: CacheStore; client?: WarframeMarketClient }) {
    this.cache = deps.cache;
    this.client = deps.client ?? new WarframeMarketClient();
  }

  /**
   * 紫卡词条卷度分析（文字或分行）。
   *
   * @param input - 文本 / 行 / 可选覆盖
   * @returns 分析 DTO
   */
  async analyze(input: {
    text?: string;
    lines?: string[];
    disposition?: number;
    cls?: RivenWeaponClass;
  }): Promise<RivenAnalysisDto> {
    const source: 'text' | 'lines' = input.lines?.length ? 'lines' : 'text';
    const raw = source === 'lines' ? (input.lines ?? []).join(' ') : (input.text ?? '').trim();
    if (!raw) {
      throw validationError('text or lines required');
    }
    const parsed = parseRivenAnalysisText(raw);
    if (parsed.stats.length === 0) {
      throw validationError('未解析到词条数值；示例：绝路 暴击几率 180 -装填速度 40');
    }

    let cls: RivenWeaponClass = input.cls ?? 'rifle';
    let weaponName = { zh: parsed.weaponQuery || '未知武器', en: parsed.weaponQuery || 'Unknown' };
    let urlName: string | undefined;
    let legacy: number | null = null;

    if (parsed.weaponQuery) {
      const resolved = await this.resolveWeaponMeta(parsed.weaponQuery);
      if (resolved) {
        cls = input.cls ?? resolved.cls;
        weaponName = resolved.name;
        urlName = resolved.urlName;
        legacy = resolved.legacyDisposition;
      }
    }

    const dispositionUsed = input.disposition ?? UNIFIED_DISPOSITION;
    const stats = analyzeRivenStats({
      cls,
      stats: parsed.stats,
      disposition: dispositionUsed,
    }).map((s) => ({
      id: s.id,
      name: { zh: s.nameZh, en: s.id },
      value: s.value,
      positive: s.positive,
      lo: s.lo,
      hi: s.hi,
      deviationPct: s.deviationPct,
      positionPct: s.positionPct,
    }));

    return {
      query: raw,
      weapon: {
        ...(urlName ? { urlName } : {}),
        name: weaponName,
        cls,
        disposition: dispositionUsed,
        legacyDisposition: legacy,
      },
      dispositionUsed,
      stats,
      notes: parsed.notes,
      source,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 词条范围。
   *
   * @param query - 武器名或类名
   * @returns 范围 DTO
   */
  async getRanges(query: string): Promise<RivenRangesDto> {
    const q = query.trim();
    if (!q) {
      throw validationError('query is required');
    }
    const asClass = normalizeClassToken(q);
    let cls: RivenWeaponClass = asClass ?? 'rifle';
    let weapon: RivenRangesDto['weapon'];
    if (!asClass) {
      const meta = await this.resolveWeaponMeta(q);
      if (!meta) {
        throw notFoundError(`未匹配到武器：${q}`);
      }
      cls = meta.cls;
      weapon = { urlName: meta.urlName, name: meta.name, cls };
    }
    const ranges = listStatRangesForClass(cls, UNIFIED_DISPOSITION);
    const mapRow = (s: (typeof ranges.positives)[number]) => ({
      id: s.id,
      name: { zh: s.nameZh, en: s.id },
      value: s.value,
      positive: s.positive,
      lo: s.lo,
      hi: s.hi,
      deviationPct: s.deviationPct,
      positionPct: s.positionPct,
    });
    return {
      query: q,
      ...(weapon ? { weapon } : {}),
      cls,
      disposition: UNIFIED_DISPOSITION,
      positives: ranges.positives.map(mapRow),
      negatives: ranges.negatives.map(mapRow),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 融合配方。
   *
   * @param query - 可选词条 / 类过滤
   * @returns 配方 DTO
   */
  getSplice(query = ''): RivenSpliceDto {
    const q = query.trim();
    const cls = q ? normalizeClassToken(q) : null;
    const stat = q && !cls ? resolveRivenStatId(q) : null;
    const recipes = listSpliceRecipes(cls ?? undefined, stat ?? undefined).map((r) => ({
      aId: r.a,
      bId: r.b,
      resultId: r.result,
      a: { zh: labelStat(r.a), en: r.a },
      b: { zh: labelStat(r.b), en: r.b },
      result: { zh: labelStat(r.result), en: r.result },
      classes: [...r.classes],
    }));
    return {
      query: q,
      cls,
      recipes,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 倾向查询。
   *
   * @param query - 武器名
   * @returns 倾向 DTO
   */
  async getDisposition(query: string): Promise<DispositionDto> {
    const q = query.trim();
    if (!q) {
      throw validationError('query is required');
    }
    const entries = loadDispositionEntries();
    const rows: DispositionDto['rows'] = [];
    const qNorm = q.toLowerCase().replace(/\s+/g, '');
    for (const [enName, entry] of Object.entries(entries)) {
      const zh = entry.zh ?? enName;
      const hay = `${enName}${zh}${entry.url_name ?? ''}`.toLowerCase().replace(/\s+/g, '');
      if (!hay.includes(qNorm) && qNorm.length > 1) {
        continue;
      }
      if (qNorm.length > 1 || enName.toLowerCase() === q.toLowerCase()) {
        const legacy = entry.disposition > 0 ? entry.disposition : UNIFIED_DISPOSITION;
        rows.push({
          urlName: entry.url_name ?? enName.toLowerCase().replace(/\s+/g, '_'),
          name: { zh, en: enName },
          legacyDisposition: legacy,
          unifiedDisposition: 1.2,
          scale: Math.round((UNIFIED_DISPOSITION / legacy) * 100) / 100,
          cls: entry.riven_type ?? entry.group,
        });
      }
      if (rows.length >= 20) {
        break;
      }
    }
    // 精确优先：若模糊过多，再尝试 WFM 武器索引
    if (rows.length === 0) {
      const meta = await this.resolveWeaponMeta(q);
      if (meta) {
        const legacy = meta.legacyDisposition ?? UNIFIED_DISPOSITION;
        rows.push({
          urlName: meta.urlName,
          name: meta.name,
          legacyDisposition: legacy,
          unifiedDisposition: 1.2,
          scale: Math.round((UNIFIED_DISPOSITION / legacy) * 100) / 100,
          cls: meta.cls,
        });
      }
    }
    if (rows.length === 0) {
      throw notFoundError(`未匹配到武器倾向：${q}`);
    }
    return {
      query: q,
      rows,
      note: '现期所有紫卡统一倾向 1.2；表内为取消前旧值，供旧截图对照。',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 玄骸拍卖。
   *
   * @param input - 查询与筛选
   * @returns 拍卖 DTO
   */
  async getLichAuctions(input: {
    query: string;
    element?: string;
    damageMax?: number;
    page: number;
    pageSize: number;
  }): Promise<LichAuctionsDto> {
    const q = input.query.trim();
    if (!q) {
      throw validationError('query is required');
    }
    const hit = resolveLichWeapon(q);
    if (!hit) {
      throw notFoundError(`未匹配到玄骸武器：${q}`);
    }
    const pageSize = Math.min(
      Math.max(1, input.pageSize || MARKET_ORDERS_PAGE_SIZE),
      MARKET_ORDERS_PAGE_SIZE,
    );
    const page = Math.max(1, input.page || 1);
    const marketSupported = hit.row.wm !== false;
    let listings: LichAuctionsDto['orders'] = [];
    if (marketSupported) {
      const raw = await this.client.searchLichAuctions(hit.slug, {
        lichType: hit.row.type,
        element: input.element,
        damageMax: input.damageMax,
      });
      listings = raw
        .map((a) => {
          const statusRaw = a.owner?.status;
          if (statusRaw !== 'online' && statusRaw !== 'ingame') {
            return null;
          }
          const status = statusRaw as 'online' | 'ingame';
          const platinum = a.buyout_price ?? a.starting_price ?? 0;
          return {
            platinum,
            element: a.item?.element ?? null,
            damage: typeof a.item?.damage === 'number' ? a.item.damage : null,
            havingEphemera: Boolean(a.item?.having_ephemera),
            seller: a.owner?.ingame_name?.trim() || 'unknown',
            sellerReputation:
              typeof a.owner?.reputation === 'number' && a.owner.reputation >= 0
                ? Math.trunc(a.owner.reputation)
                : 0,
            status,
            updatedAt: a.updated ?? new Date().toISOString(),
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .sort((a, b) => a.platinum - b.platinum);
    }
    const total = listings.length;
    const start = (page - 1) * pageSize;
    return {
      query: q,
      resolved: {
        urlName: hit.slug,
        name: { zh: hit.row.zh, en: hit.row.en },
        kind: hit.row.type,
        marketSupported,
      },
      page,
      pageSize,
      total,
      orders: listings.slice(start, start + pageSize),
      element: input.element ?? null,
      damageMax: input.damageMax ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 解析武器类 / 旧倾向 / 展示名。
   *
   * @param query - 武器关键词
   * @returns 元数据或 null
   */
  private async resolveWeaponMeta(query: string): Promise<{
    urlName: string;
    name: { zh: string; en: string };
    cls: RivenWeaponClass;
    legacyDisposition: number | null;
  } | null> {
    const [zhIndex, enIndex] = await Promise.all([
      this.getRivenIndex('zh-hans'),
      this.getRivenIndex('en'),
    ]);
    const hit = resolveBestItem(query, mergeIndex(zhIndex, enIndex));
    if (!hit) {
      // 尝试倾向表英文键
      const entries = loadDispositionEntries();
      const entryHit = findDispositionEntry(query, entries);
      if (!entryHit) {
        return null;
      }
      const [enName, entry] = entryHit;
      return {
        urlName: entry.url_name ?? enName.toLowerCase().replace(/\s+/g, '_'),
        name: { zh: entry.zh ?? enName, en: enName },
        cls: resolveRivenWeaponClass(entry.riven_type ?? '', entry.group ?? ''),
        legacyDisposition: entry.disposition,
      };
    }
    const zh = zhIndex.find((r) => r.urlName === hit.urlName);
    const en = enIndex.find((r) => r.urlName === hit.urlName);
    const entries = loadDispositionEntries();
    const byUrl = Object.entries(entries).find(([, e]) => e.url_name === hit.urlName);
    const byEn = en?.itemName ? entries[en.itemName] : undefined;
    const entry = byUrl?.[1] ?? byEn;
    return {
      urlName: hit.urlName,
      name: {
        zh: zh?.itemName ?? hit.itemName,
        en: en?.itemName ?? hit.urlName.replace(/_/g, ' '),
      },
      cls: resolveRivenWeaponClass(entry?.riven_type ?? '', entry?.group ?? ''),
      legacyDisposition: entry?.disposition ?? null,
    };
  }

  /**
   * 带缓存的紫卡武器索引。
   *
   * @param language - 语言
   * @returns 索引
   */
  private async getRivenIndex(language: 'zh-hans' | 'en'): Promise<ItemIndexRow[]> {
    const key = `wfm:riven:index:v2:${language}`;
    const cached = await this.cache.getFresh<ItemIndexRow[]>(key);
    if (cached?.value) {
      return cached.value;
    }
    const rows = (await this.client.listRivenItems(language)).map((r) => ({
      urlName: r.url_name,
      itemName: r.item_name,
    }));
    await this.cache.set(key, rows, RIVEN_ITEMS_TTL_MS);
    return rows;
  }
}

/**
 * 词条 id → 中文标签。
 *
 * @param id - 标准 id
 * @returns 展示名
 */
function labelStat(id: string): string {
  return RIVEN_STAT_ZH[id] ?? id;
}

/**
 * 将用户输入归一为武器类列名。
 *
 * @param token - 类名或中文
 * @returns 列名或 null
 */
function normalizeClassToken(token: string): RivenWeaponClass | null {
  const key = token.trim().toLowerCase();
  const map: Record<string, RivenWeaponClass> = {
    rifle: 'rifle',
    步枪: 'rifle',
    shotgun: 'shotgun',
    霰弹: 'shotgun',
    霰弹枪: 'shotgun',
    pistol: 'pistol',
    手枪: 'pistol',
    secondary: 'pistol',
    archgun: 'archgun',
    空战: 'archgun',
    melee: 'melee',
    近战: 'melee',
  };
  return map[key] ?? null;
}

/**
 * 合并中英索引。
 *
 * @param zh - 中文
 * @param en - 英文
 * @returns 合并行
 */
function mergeIndex(zh: ItemIndexRow[], en: ItemIndexRow[]): ItemIndexRow[] {
  const map = new Map<string, ItemIndexRow>();
  for (const row of en) {
    map.set(row.urlName, row);
  }
  for (const row of zh) {
    map.set(row.urlName, row);
  }
  return [...map.values()];
}

/**
 * 在旧倾向表中模糊查找。
 *
 * @param query - 关键词
 * @param entries - 表
 * @returns 命中条目
 */
function findDispositionEntry(
  query: string,
  entries: Record<string, DispositionEntry>,
): [string, DispositionEntry] | null {
  const q = query.toLowerCase().replace(/\s+/g, '');
  for (const [enName, entry] of Object.entries(entries)) {
    const zh = (entry.zh ?? '').toLowerCase().replace(/\s+/g, '');
    const slug = (entry.url_name ?? '').toLowerCase();
    if (
      enName.toLowerCase().replace(/\s+/g, '').includes(q) ||
      zh.includes(q) ||
      slug.includes(q)
    ) {
      return [enName, entry];
    }
  }
  return null;
}

/**
 * 解析玄骸武器 slug。
 *
 * @param query - 用户输入
 * @returns slug 与行
 */
function resolveLichWeapon(query: string): { slug: string; row: LichWeaponRow } | null {
  const table = loadLichWeapons();
  const q = query
    .trim()
    .toLowerCase()
    .replace(/[·・\s]/g, '');
  for (const [slug, row] of Object.entries(table)) {
    const keys = [slug, row.en, row.zh, row.zh_nodot ?? '', ...(row.alias ?? [])].map((s) =>
      s.toLowerCase().replace(/[·・\s]/g, ''),
    );
    if (keys.some((k) => k === q || (q.length >= 2 && k.includes(q)))) {
      return { slug, row };
    }
  }
  // 前缀兜底：kuva_/tenet_/coda_
  const slugGuess = query.trim().toLowerCase().replace(/\s+/g, '_');
  if (table[slugGuess]) {
    return { slug: slugGuess, row: table[slugGuess]! };
  }
  return null;
}
