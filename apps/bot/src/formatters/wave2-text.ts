import {
  pickLocalized,
  type DispositionDto,
  type DucatJunkDto,
  type LichAuctionsDto,
  type Locale,
  type MarketRankDto,
  type MarketTrendDto,
  type OpenRelicDto,
  type PartsDto,
  type RelicQueryDto,
  type RivenAnalysisDto,
  type RivenRangesDto,
  type RivenSpliceDto,
} from '@lanius/core';

/**
 * 价格趋势文本行。
 *
 * @param data - 趋势 DTO
 * @param locale - 语言
 * @returns 行
 */
export function formatMarketTrendText(data: MarketTrendDto, locale: Locale): string[] {
  const name = pickLocalized(data.resolved.name, locale);
  const s = data.summary;
  const change =
    s.changePct == null
      ? '—'
      : `${s.changePct > 0 ? '+' : ''}${s.changePct.toFixed(1)}%`;
  if (locale === 'en') {
    return [
      name,
      `48h vol ${s.vol48} · median ${s.median48 ?? '—'}`,
      `90d vol ${s.vol90} · median ${s.median90 ?? '—'}`,
      `last ${s.last ?? '—'} vs base ${s.base ?? '—'} (${s.baseSpan}) → ${change}`,
    ];
  }
  return [
    name,
    `48h 成交 ${s.vol48} · 中位 ${s.median48 ?? '—'}`,
    `90d 成交 ${s.vol90} · 中位 ${s.median90 ?? '—'}`,
    `最新 ${s.last ?? '—'} vs 基线 ${s.base ?? '—'}（${s.baseSpan === '90d' ? '90天' : '48小时'}）→ ${change}`,
  ];
}

/**
 * 市场排行文本行。
 *
 * @param data - 排行 DTO
 * @param locale - 语言
 * @returns 行
 */
export function formatMarketRankText(data: MarketRankDto, locale: Locale): string[] {
  const head =
    locale === 'en'
      ? `Rank · ${data.category}${data.sampled ? ' (sample)' : ''} · p${data.page}`
      : `排行 · ${data.category}${data.sampled ? '（抽样）' : ''} · 第${data.page}页`;
  const rows = data.rows.map((row, i) => {
    const name = pickLocalized(row.name, locale);
    const idx = (data.page - 1) * data.pageSize + i + 1;
    return `${idx}. ${name}  ${row.median48}p  vol48=${row.vol48}`;
  });
  return [head, ...rows];
}

/**
 * 杜卡德垃圾文本行。
 *
 * @param data - 垃圾榜
 * @param locale - 语言
 * @returns 行
 */
export function formatDucatsText(data: DucatJunkDto, locale: Locale): string[] {
  const tierZh = { gold: '金', silver: '银', bronze: '铜' }[data.tier];
  const head =
    locale === 'en'
      ? `${data.tier} junk · ducats/plat ↓ · p${data.page}/${Math.max(1, Math.ceil(data.total / data.pageSize) || 1)}`
      : `${tierZh}垃圾 · 杜/白 ↓ · 第${data.page}/${Math.max(1, Math.ceil(data.total / data.pageSize) || 1)}页`;
  const rows = data.rows.map((row, i) => {
    const name = pickLocalized(row.name, locale);
    const idx = (data.page - 1) * data.pageSize + i + 1;
    return `${idx}. ${name}  ${row.ducats}d  dpp=${row.ducatsPerPlatinum.toFixed(2)}  ~${row.median}p`;
  });
  return [head, ...rows];
}

/**
 * 紫卡分析文本行。
 *
 * @param data - 分析 DTO
 * @param locale - 语言
 * @returns 行
 */
export function formatRivenAnalysisText(data: RivenAnalysisDto, locale: Locale): string[] {
  const weapon = data.weapon ? pickLocalized(data.weapon.name, locale) : '—';
  const head =
    locale === 'en'
      ? `${weapon} · D=${data.dispositionUsed} · ${data.weapon?.cls ?? ''}`
      : `${weapon} · 倾向 ${data.dispositionUsed} · ${data.weapon?.cls ?? ''}`;
  const lines = data.stats.map((s) => {
    const name = pickLocalized(s.name, locale);
    const sign = s.positive ? '+' : '−';
    return `${sign}${name} ${s.value}  [${s.lo}–${s.hi}]  Δ${s.deviationPct}%  pos${s.positionPct}%`;
  });
  return [head, ...lines, ...data.notes.map((n) => `· ${n}`)];
}

/**
 * 词条范围文本（截断）。
 *
 * @param data - 范围 DTO
 * @param locale - 语言
 * @returns 行
 */
export function formatRivenRangesText(data: RivenRangesDto, locale: Locale): string[] {
  const head =
    locale === 'en'
      ? `Ranges · ${data.cls} · D=${data.disposition}`
      : `词条范围 · ${data.cls} · D=${data.disposition}`;
  const pos = data.positives.slice(0, 12).map((s) => {
    const name = pickLocalized(s.name, locale);
    return `+${name}  ${s.lo}–${s.hi}`;
  });
  const neg = data.negatives.slice(0, 8).map((s) => {
    const name = pickLocalized(s.name, locale);
    return `−${name}  ${s.lo}–${s.hi}`;
  });
  return [head, ...(locale === 'en' ? ['Positive'] : ['正向']), ...pos, ...(locale === 'en' ? ['Negative'] : ['负向']), ...neg];
}

/**
 * 融合配方文本。
 *
 * @param data - 融合 DTO
 * @param locale - 语言
 * @returns 行
 */
export function formatRivenSpliceText(data: RivenSpliceDto, locale: Locale): string[] {
  const head = locale === 'en' ? `Splicer recipes (${data.recipes.length})` : `融合配方（${data.recipes.length}）`;
  return [
    head,
    ...data.recipes.slice(0, 18).map((r) => {
      const a = pickLocalized(r.a, locale);
      const b = pickLocalized(r.b, locale);
      const result = pickLocalized(r.result, locale);
      return `${a} + ${b} → ${result}`;
    }),
  ];
}

/**
 * 倾向文本。
 *
 * @param data - 倾向 DTO
 * @param locale - 语言
 * @returns 行
 */
export function formatDispositionText(data: DispositionDto, locale: Locale): string[] {
  const lines = data.rows.map((r) => {
    const name = pickLocalized(r.name, locale);
    return locale === 'en'
      ? `${name}  legacy ${r.legacyDisposition} → ×${r.scale} = 1.2`
      : `${name}  旧 ${r.legacyDisposition} → ×${r.scale} = 1.2`;
  });
  return [...lines, data.note];
}

/**
 * 玄骸拍卖文本。
 *
 * @param data - 玄骸 DTO
 * @param locale - 语言
 * @returns 行
 */
export function formatLichAuctionsText(data: LichAuctionsDto, locale: Locale): string[] {
  const name = pickLocalized(data.resolved.name, locale);
  if (!data.resolved.marketSupported) {
    return [
      locale === 'en'
        ? `${name}: WFM has no auction category for this weapon`
        : `${name}：WFM 暂无该武器挂单类目`,
    ];
  }
  const head =
    locale === 'en'
      ? `${name} · ${data.resolved.kind} · p${data.page}`
      : `${name} · ${data.resolved.kind} · 第${data.page}页`;
  const rows = data.orders.map((o, i) => {
    const idx = (data.page - 1) * data.pageSize + i + 1;
    const elem = o.element ?? '—';
    const dmg = o.damage != null ? `${o.damage}%` : '—';
    return `${idx}. ${o.platinum}p  ${elem} ${dmg}  ${o.seller} (${o.status})`;
  });
  return [head, ...rows];
}

/**
 * 遗物文本。
 *
 * @param data - 遗物 DTO
 * @param locale - 语言
 * @returns 行
 */
export function formatRelicText(data: RelicQueryDto, locale: Locale): string[] {
  if (data.mode === 'help') {
    return locale === 'en'
      ? ['Usage: /relic <name|era>', 'e.g. /relic axi a2 · /relic lith']
      : ['用法：/遗物 <名|纪元>', '例：/遗物 后纪 A2 · /遗物 古纪'];
  }
  if (data.mode === 'tierList') {
    const head = locale === 'en' ? `Relics · p${data.page}` : `遗物列表 · 第${data.page}页`;
    return [head, ...(data.list ?? []).map((r) => pickLocalized(r.name, locale))];
  }
  const relic = data.relic!;
  const head = pickLocalized(relic.name, locale);
  const rarityZh: Record<string, string> = { common: '常见', uncommon: '罕见', rare: '稀有' };
  const rows = (relic.rewards ?? []).map((slot) => {
    const rarity = locale === 'en' ? slot.rarity : rarityZh[slot.rarity] ?? slot.rarity;
    return `${rarity} · ${slot.itemName}`;
  });
  return [head, ...rows];
}

/**
 * 部件来源文本。
 *
 * @param data - 部件 DTO
 * @param locale - 语言
 * @returns 行
 */
export function formatPartsText(data: PartsDto, locale: Locale): string[] {
  const head = locale === 'en' ? `Parts · ${data.partName}` : `部件 · ${data.partName}`;
  const rarityZh: Record<string, string> = { common: '常见', uncommon: '罕见', rare: '稀有' };
  return [
    head,
    ...data.sources.map((s) => {
      const rarity = locale === 'en' ? s.rarity : rarityZh[s.rarity] ?? s.rarity;
      return `${pickLocalized(s.relicName, locale)} · ${rarity}`;
    }),
  ];
}

/**
 * 开核桃文本。
 *
 * @param data - 开核桃 DTO
 * @param locale - 语言
 * @returns 行
 */
export function formatOpenRelicText(data: OpenRelicDto, locale: Locale): string[] {
  const head = locale === 'en' ? 'Open relic tips' : '开核桃推荐';
  const rows = data.rows.map((r) => {
    const label = locale === 'en' ? r.era : `${r.eraZh}(${r.era})`;
    return `${label}  fissures=${r.fissureCount} fast=${r.fastCount}  ${r.sampleNodes[0] ?? ''}`;
  });
  return [head, ...rows, data.note];
}
