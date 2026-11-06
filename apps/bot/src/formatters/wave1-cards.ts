import {
  pickLocalized,
  type AcrithisDto,
  type ArbTableDto,
  type EssenceShopDto,
  type IncarnonRotationDto,
  type IncursionsDto,
  type Locale,
  type TimersDto,
  type WorldstateDto,
} from '@lanius/core';
import type { DenseListCardPayload } from '@lanius/render';

/**
 * 剩余毫秒短文案。
 *
 * @param remainingMs - 剩余毫秒
 * @param locale - 语言
 * @returns 短时串
 */
function remain(remainingMs: number | undefined, locale: Locale): string | undefined {
  if (remainingMs == null) return undefined;
  const zh = locale !== 'en';
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return zh ? `${hours}时${minutes}分` : `${hours}h${minutes}m`;
  return zh ? `${minutes}分` : `${minutes}m`;
}

/**
 * 时效 → DenseList。
 *
 * @param data - TimersDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function timersCardPayload(data: TimersDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'TIMERS' : '时效',
    kicker: 'TIMERS',
    fetchedAt: data.fetchedAt,
    emptyText: locale === 'en' ? 'No timers' : '暂无时效',
    rows: data.rows.map((r) => ({
      primary: pickLocalized(r.label, locale),
      secondary: r.note ? pickLocalized(r.note, locale) : undefined,
      remain: remain(r.remainingMs, locale),
    })),
  };
}

/**
 * 达沃 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function dailyDealsCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'DARVO' : '达沃特惠',
    kicker: 'DAILY DEALS',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'No deals' : '今日暂无特惠',
    rows: ws.dailyDeals.map((d) => ({
      primary: pickLocalized(d.item.name, locale),
      secondary: `${d.salePrice ?? '?'}p / ${d.originalPrice ?? '?'}`,
      meta:
        d.amountTotal != null && d.amountSold != null
          ? `${Math.max(0, d.amountTotal - d.amountSold)}/${d.amountTotal}`
          : undefined,
      remain: d.expiry ? remain(Math.max(0, Date.parse(d.expiry) - Date.now()), locale) : undefined,
      iconUrl: d.item.iconUrl,
    })),
  };
}

/**
 * 新闻 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function newsCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'NEWS' : '新闻',
    kicker: 'NEWS',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'No news' : '暂无新闻',
    rows: ws.news.slice(0, 8).map((n) => ({
      primary: `${n.community ? (locale === 'en' ? '[C] ' : '［社区］') : ''}${pickLocalized(n.message, locale)}`,
      secondary: n.link?.replace(/^https?:\/\//, ''),
    })),
  };
}

/**
 * 赤毒 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function kuvaCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  const note = ws.kuva?.sourceNote ? pickLocalized(ws.kuva.sourceNote, locale) : undefined;
  return {
    title: locale === 'en' ? 'KUVA' : '赤毒',
    kicker: 'KUVA',
    fetchedAt: ws.fetchedAt,
    emptyText: note ?? (locale === 'en' ? 'No missions' : '当前没有赤毒任务'),
    note,
    rows: (ws.kuva?.missions ?? []).map((m) => ({
      primary: m.node ? pickLocalized(m.node, locale) : '?',
      secondary: m.missionType ? pickLocalized(m.missionType, locale) : undefined,
    })),
  };
}

/**
 * 结合目标 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function synthCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'SYNTHESIS' : '结合目标',
    kicker: 'SYNTH',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'Empty' : '暂无目标',
    rows: ws.synthTargets.slice(0, 16).map((t) => ({
      primary: pickLocalized(t.name, locale),
      secondary: [
        t.planet && pickLocalized(t.planet, locale),
        t.node && pickLocalized(t.node, locale),
      ]
        .filter(Boolean)
        .join(' · '),
    })),
  };
}

/**
 * 舰队进度 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function constructionCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  const c = ws.construction;
  const rows = [
    ...(c?.projects ?? []).map((p) => ({
      primary: pickLocalized(p.name, locale),
      meta: `${p.pct.toFixed(1)}%`,
    })),
    ...(c?.assaults ?? []).map((a) => ({
      primary: pickLocalized(a.name, locale),
      secondary: a.victimNode ? pickLocalized(a.victimNode, locale) : undefined,
      meta: a.healthPct != null ? `HP ${a.healthPct.toFixed(1)}%` : undefined,
    })),
  ];
  return {
    title: locale === 'en' ? 'CONSTRUCTION' : '舰队进度',
    kicker: 'FLEET',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'No progress' : '暂无进度',
    rows,
  };
}

/**
 * 虚空风暴 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function voidStormsCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'VOID STORMS' : '九重天',
    kicker: 'EMPYREAN',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'No storms' : '当前无虚空风暴',
    rows: ws.voidStorms.map((s) => ({
      primary: s.node ? pickLocalized(s.node, locale) : '?',
      secondary: s.tier,
      remain: remain(s.remainingMs, locale),
    })),
  };
}

/**
 * 活动 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function eventsCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'EVENTS' : '活动',
    kicker: 'EVENTS',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'No events' : '当前无活动',
    rows: ws.events.slice(0, 12).map((e) => ({
      primary: `${e.ended ? (locale === 'en' ? '[Ended] ' : '［已结束］') : ''}${pickLocalized(e.name, locale)}`,
      remain: e.expiry ? remain(Math.max(0, Date.parse(e.expiry) - Date.now()), locale) : undefined,
    })),
  };
}

/**
 * 武形秘仪 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function conclaveCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'CONCLAVE' : '武形秘仪',
    kicker: 'CONCLAVE',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'No challenges' : '暂无挑战',
    rows: ws.conclave.map((c) => ({
      primary: pickLocalized(c.text, locale),
      secondary: [
        pickLocalized(c.categoryLabel, locale),
        c.mode ? pickLocalized(c.mode, locale) : undefined,
      ]
        .filter(Boolean)
        .join(' · '),
    })),
  };
}

/**
 * 氏族奖励 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function clanRewardsCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  const rows = ws.clanRewards.flatMap((c) =>
    c.rewards.map((r) => ({
      primary: pickLocalized(r.item.name, locale),
      secondary: pickLocalized(c.region, locale),
      meta: r.points != null ? `${r.points}pt` : undefined,
      iconUrl: r.item.iconUrl,
    })),
  );
  return {
    title: locale === 'en' ? 'CLAN REWARDS' : '氏族奖励',
    kicker: 'CLAN',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'Empty' : '暂无奖励',
    rows,
  };
}

/**
 * 闪购 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function flashSalesCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'FLASH SALES' : '商城折扣',
    kicker: 'MARKET',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'No sales' : '暂无闪购',
    rows: ws.flashSales.slice(0, 16).map((s) => ({
      primary: pickLocalized(s.item.name, locale),
      remain: remain(s.remainingMs, locale),
      iconUrl: s.item.iconUrl,
    })),
  };
}

/**
 * 日历 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function calendarCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  const cal = ws.calendar1999;
  return {
    title: locale === 'en' ? '1999 CALENDAR' : '1999日历',
    kicker: 'CALENDAR',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'Empty' : '暂无日历',
    rows: (cal?.days ?? []).slice(0, 14).map((d) => ({
      primary: `Day ${d.day ?? '?'}`,
      secondary: d.events
        .map((e) => (e.name ? pickLocalized(e.name, locale) : (e.ref ?? '')))
        .filter(Boolean)
        .join(locale === 'en' ? ', ' : '、'),
    })),
  };
}

/**
 * 沉沦 → DenseList。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function descendiaCardPayload(ws: WorldstateDto, locale: Locale): DenseListCardPayload {
  const d = ws.descendia;
  return {
    title: locale === 'en' ? 'DESCENDIA' : '沉沦之地',
    kicker: 'HELLSCAPE',
    fetchedAt: ws.fetchedAt,
    emptyText: locale === 'en' ? 'Empty' : '暂无数据',
    note: d?.expiry ? remain(Math.max(0, Date.parse(d.expiry) - Date.now()), locale) : undefined,
    rows: (d?.floors ?? []).slice(0, 21).map((f) => ({
      primary: `#${f.index ?? '?'} ${f.type ? pickLocalized(f.type, locale) : ''}`,
      secondary: f.challenge ? pickLocalized(f.challenge, locale) : undefined,
    })),
  };
}

/**
 * 仲裁表 → DenseList。
 *
 * @param data - ArbTableDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function arbTableCardPayload(data: ArbTableDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'ARB TABLE' : '仲裁表',
    kicker: 'ARBITRATION',
    fetchedAt: data.fetchedAt,
    emptyText: locale === 'en' ? 'Empty' : '暂无排期',
    note: data.sourceNote ? pickLocalized(data.sourceNote, locale) : undefined,
    rows: data.rows.slice(0, 28).map((r) => ({
      primary: pickLocalized(r.node, locale),
      secondary: [
        r.start.slice(5, 16).replace('T', ' '),
        r.missionType ? pickLocalized(r.missionType, locale) : undefined,
        r.tier ? `[${r.tier}]` : undefined,
      ]
        .filter(Boolean)
        .join(' · '),
    })),
  };
}

/**
 * 商店 → DenseList。
 *
 * @param data - EssenceShopDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function shopCardPayload(data: EssenceShopDto, locale: Locale): DenseListCardPayload {
  const title =
    data.kind === 'steelPath'
      ? locale === 'en'
        ? 'STEEL ESSENCE'
        : '钢铁精华'
      : locale === 'en'
        ? 'RIVEN SLIVER'
        : '碎银兑换';
  const rows = [
    ...data.weekly.map((o) => ({
      primary: pickLocalized(o.name, locale),
      secondary: locale === 'en' ? 'Weekly' : '本周轮换',
      meta: o.cost != null ? String(o.cost) : undefined,
    })),
    ...data.evergreen.slice(0, 16).map((o) => ({
      primary: pickLocalized(o.name, locale),
      meta: o.cost != null ? String(o.cost) : undefined,
    })),
  ];
  return {
    title,
    kicker: data.kind === 'steelPath' ? 'TESHIN' : 'PALLADINO',
    fetchedAt: data.fetchedAt,
    emptyText: locale === 'en' ? 'Empty' : '暂无商品',
    note: data.sourceNote ? pickLocalized(data.sourceNote, locale) : undefined,
    rows,
  };
}

/**
 * 侵袭 → DenseList。
 *
 * @param data - IncursionsDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function incursionsCardPayload(data: IncursionsDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'INCURSIONS' : '钢铁侵袭',
    kicker: 'STEEL PATH',
    fetchedAt: data.fetchedAt,
    emptyText: locale === 'en' ? 'Empty' : '暂无节点',
    note: data.sourceNote ? pickLocalized(data.sourceNote, locale) : undefined,
    rows: data.nodes.map((n) => ({
      primary: pickLocalized(n.node, locale),
    })),
  };
}

/**
 * 灵化 → DenseList。
 *
 * @param data - IncarnonRotationDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function incarnonCardPayload(
  data: IncarnonRotationDto,
  locale: Locale,
): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'INCARNON' : '本周灵化',
    kicker: 'CIRCUIT',
    fetchedAt: data.fetchedAt,
    emptyText: locale === 'en' ? 'Empty' : '暂无轮换',
    note: `Week ${data.weekIndex}/${data.weekTotal}`,
    rows: data.current.map((w) => ({
      primary: pickLocalized(w.name, locale),
      secondary: w.variant,
    })),
  };
}

/**
 * 言录使 → DenseList。
 *
 * @param data - AcrithisDto
 * @param locale - 语言
 * @returns 卡片载荷
 */
export function acrithisCardPayload(data: AcrithisDto, locale: Locale): DenseListCardPayload {
  return {
    title: locale === 'en' ? 'ACRITHIS' : '言录使',
    kicker: 'DUVIRI',
    fetchedAt: data.fetchedAt,
    emptyText: locale === 'en' ? 'Empty' : '暂无货单',
    note: data.sourceNote ? pickLocalized(data.sourceNote, locale) : undefined,
    rows: data.offers.map((o) => ({
      primary: pickLocalized(o.name, locale),
      meta:
        o.price != null
          ? `${o.price}${o.currency ? ' ' + pickLocalized(o.currency, locale) : ''}`
          : undefined,
    })),
  };
}
