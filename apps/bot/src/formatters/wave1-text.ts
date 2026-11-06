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

/**
 * 文本格式化公共选项。
 */
type TextOpts = { stale?: boolean };

/**
 * 将剩余毫秒格式化为短文案。
 *
 * @param remainingMs - 剩余毫秒
 * @param locale - 语言
 * @returns 短时串
 */
function remain(remainingMs: number | undefined, locale: Locale): string {
  if (remainingMs == null) {
    return '';
  }
  const zh = locale !== 'en';
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (days > 0) {
    return zh ? `${days}天${hours}时` : `${days}d${hours}h`;
  }
  if (hours > 0) {
    return zh ? `${hours}时${minutes}分` : `${hours}h${minutes}m`;
  }
  return zh ? `${minutes}分` : `${minutes}m`;
}

/**
 * 时效总览文本。
 *
 * @param data - TimersDto
 * @param locale - 语言
 * @param opts - stale 等
 * @returns QQ 文本
 */
export function formatTimersText(data: TimersDto, locale: Locale, opts: TextOpts = {}): string {
  const zh = locale !== 'en';
  const lines = [zh ? '◆ 时效总览' : '◆ Timers'];
  for (const row of data.rows) {
    const label = pickLocalized(row.label, locale);
    const left = remain(row.remainingMs, locale);
    const note = row.note ? pickLocalized(row.note, locale) : '';
    lines.push(`· ${label}${left ? ` 剩 ${left}` : ''}${note ? ` ${note}` : ''}`);
  }
  if (opts.stale) {
    lines.push(zh ? '※ 缓存可能过期' : '※ Possibly stale cache');
  }
  return lines.join('\n');
}

/**
 * 达沃特惠文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @param opts - stale
 * @returns QQ 文本
 */
export function formatDailyDealsText(
  ws: WorldstateDto,
  locale: Locale,
  opts: TextOpts = {},
): string {
  const zh = locale !== 'en';
  const deals = ws.dailyDeals;
  if (deals.length === 0) {
    return zh ? '◆ 今日特惠：暂无' : '◆ No daily deals';
  }
  const lines = [zh ? `◆ 今日特惠：${deals.length} 件` : `◆ Daily deals: ${deals.length}`];
  for (const d of deals) {
    const name = pickLocalized(d.item.name, locale);
    const stock =
      d.amountTotal != null && d.amountSold != null
        ? `${Math.max(0, d.amountTotal - d.amountSold)}/${d.amountTotal}`
        : '';
    const left = d.expiry ? remain(Math.max(0, Date.parse(d.expiry) - Date.now()), locale) : '';
    lines.push(
      `· ${name} ${d.salePrice ?? '?'}p / ${d.originalPrice ?? '?'}${stock ? ` 余 ${stock}` : ''}${left ? ` 剩 ${left}` : ''}`,
    );
  }
  if (opts.stale) lines.push(zh ? '※ 缓存可能过期' : '※ Possibly stale cache');
  return lines.join('\n');
}

/**
 * 新闻文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @param opts - stale
 * @returns QQ 文本
 */
export function formatNewsText(ws: WorldstateDto, locale: Locale, opts: TextOpts = {}): string {
  const zh = locale !== 'en';
  const items = ws.news.slice(0, 6);
  if (items.length === 0) {
    return zh ? '◆ 暂无新闻' : '◆ No news';
  }
  const lines = [zh ? `◆ 最近新闻：${items.length} 条` : `◆ News: ${items.length}`];
  for (const n of items) {
    const tag = n.community ? (zh ? '［社区］' : '[Community] ') : '';
    lines.push(`· ${tag}${pickLocalized(n.message, locale)}`);
    if (n.link) {
      lines.push(` ${n.link.replace(/^https?:\/\//, '')}`);
    }
  }
  if (opts.stale) lines.push(zh ? '※ 缓存可能过期' : '※ Possibly stale cache');
  return lines.join('\n');
}

/**
 * 赤毒文本（含停摆说明）。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatKuvaText(ws: WorldstateDto, locale: Locale): string {
  const zh = locale !== 'en';
  const kuva = ws.kuva;
  const note = kuva?.sourceNote ? pickLocalized(kuva.sourceNote, locale) : undefined;
  if (!kuva || kuva.missions.length === 0) {
    return [
      zh ? '◆ 赤毒/血紊虹吸' : '◆ Kuva / Siphons',
      note ?? (zh ? '当前没有赤毒任务' : 'No kuva missions'),
    ].join('\n');
  }
  const lines = [zh ? '◆ 赤毒/血紊虹吸' : '◆ Kuva / Siphons'];
  for (const m of kuva.missions) {
    lines.push(
      `· ${m.node ? pickLocalized(m.node, locale) : '?'}${m.missionType ? ` · ${pickLocalized(m.missionType, locale)}` : ''}`,
    );
  }
  if (note) lines.push(`※ ${note}`);
  return lines.join('\n');
}

/**
 * 结合目标文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatSynthTargetsText(ws: WorldstateDto, locale: Locale): string {
  const zh = locale !== 'en';
  const items = ws.synthTargets.slice(0, 20);
  if (items.length === 0) {
    return zh ? '◆ 暂无结合目标表' : '◆ No synthesis targets';
  }
  const lines = [zh ? `◆ 结合目标：${items.length}+` : `◆ Synth targets: ${items.length}+`];
  for (const t of items.slice(0, 12)) {
    lines.push(
      `· ${pickLocalized(t.name, locale)}${t.planet ? ` ${pickLocalized(t.planet, locale)}` : ''}${t.node ? ` · ${pickLocalized(t.node, locale)}` : ''}`,
    );
  }
  return lines.join('\n');
}

/**
 * 舰队进度文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatConstructionText(ws: WorldstateDto, locale: Locale): string {
  const zh = locale !== 'en';
  const c = ws.construction;
  if (!c || (c.projects.length === 0 && c.assaults.length === 0)) {
    return zh ? '◆ 舰队建造：暂无进度' : '◆ Construction: none';
  }
  const lines = [zh ? '◆ 舰队建造进度' : '◆ Fleet construction'];
  for (const p of c.projects) {
    lines.push(`· ${pickLocalized(p.name, locale)} ${p.pct.toFixed(1)}%`);
  }
  for (const a of c.assaults) {
    lines.push(
      `· ${pickLocalized(a.name, locale)}${a.victimNode ? ` → ${pickLocalized(a.victimNode, locale)}` : ''}${a.healthPct != null ? ` HP ${a.healthPct.toFixed(1)}%` : ''}`,
    );
  }
  return lines.join('\n');
}

/**
 * 九重天风暴文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatVoidStormsText(ws: WorldstateDto, locale: Locale): string {
  const zh = locale !== 'en';
  if (ws.voidStorms.length === 0) {
    return zh ? '◆ 当前无虚空风暴' : '◆ No void storms';
  }
  const lines = [
    zh ? `◆ 九重天：${ws.voidStorms.length}` : `◆ Void storms: ${ws.voidStorms.length}`,
  ];
  for (const s of ws.voidStorms) {
    lines.push(
      `· ${s.node ? pickLocalized(s.node, locale) : '?'}${s.tier ? ` [${s.tier}]` : ''}${s.remainingMs != null ? ` 剩 ${remain(s.remainingMs, locale)}` : ''}`,
    );
  }
  return lines.join('\n');
}

/**
 * 限时活动文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatEventsText(ws: WorldstateDto, locale: Locale): string {
  const zh = locale !== 'en';
  if (ws.events.length === 0) {
    return zh ? '◆ 当前无限时活动' : '◆ No events';
  }
  const lines = [zh ? `◆ 活动：${ws.events.length}` : `◆ Events: ${ws.events.length}`];
  for (const e of ws.events.slice(0, 10)) {
    const left = e.expiry ? remain(Math.max(0, Date.parse(e.expiry) - Date.now()), locale) : '';
    lines.push(
      `· ${e.ended ? (zh ? '［已结束］' : '[Ended] ') : ''}${pickLocalized(e.name, locale)}${left ? ` 剩 ${left}` : ''}`,
    );
  }
  return lines.join('\n');
}

/**
 * 武形秘仪文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatConclaveText(ws: WorldstateDto, locale: Locale): string {
  const zh = locale !== 'en';
  if (ws.conclave.length === 0) {
    return zh ? '◆ 暂无武形秘仪挑战' : '◆ No conclave challenges';
  }
  const lines = [zh ? '◆ 武形秘仪' : '◆ Conclave'];
  for (const c of ws.conclave) {
    lines.push(
      `· [${pickLocalized(c.categoryLabel, locale)}] ${c.mode ? pickLocalized(c.mode, locale) + ' · ' : ''}${pickLocalized(c.text, locale)}`,
    );
  }
  return lines.join('\n');
}

/**
 * 氏族奖励文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatClanRewardsText(ws: WorldstateDto, locale: Locale): string {
  const zh = locale !== 'en';
  if (ws.clanRewards.length === 0) {
    return zh ? '◆ 暂无氏族周奖励' : '◆ No clan rewards';
  }
  const lines = [zh ? '◆ 氏族周奖励' : '◆ Clan weekly rewards'];
  for (const c of ws.clanRewards) {
    lines.push(`◆ ${pickLocalized(c.region, locale)}`);
    for (const r of c.rewards) {
      lines.push(
        `· ${r.points != null ? `${r.points}pt ` : ''}${pickLocalized(r.item.name, locale)}`,
      );
    }
  }
  return lines.join('\n');
}

/**
 * 商城折扣文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatFlashSalesText(ws: WorldstateDto, locale: Locale): string {
  const zh = locale !== 'en';
  if (ws.flashSales.length === 0) {
    return zh ? '◆ 暂无商城闪购' : '◆ No flash sales';
  }
  const lines = [
    zh ? `◆ 商城折扣：${ws.flashSales.length}` : `◆ Flash sales: ${ws.flashSales.length}`,
  ];
  for (const s of ws.flashSales.slice(0, 15)) {
    lines.push(
      `· ${pickLocalized(s.item.name, locale)}${s.remainingMs != null ? ` 剩 ${remain(s.remainingMs, locale)}` : ''}`,
    );
  }
  return lines.join('\n');
}

/**
 * 1999 日历文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatCalendar1999Text(ws: WorldstateDto, locale: Locale): string {
  const zh = locale !== 'en';
  const cal = ws.calendar1999;
  if (!cal || cal.days.length === 0) {
    return zh ? '◆ 暂无 1999 日历' : '◆ No 1999 calendar';
  }
  const lines = [
    zh
      ? `◆ 1999 日历${cal.season ? ` · ${cal.season}` : ''}`
      : `◆ 1999 Calendar${cal.season ? ` · ${cal.season}` : ''}`,
  ];
  for (const d of cal.days.slice(0, 10)) {
    const names = d.events
      .map((e) => (e.name ? pickLocalized(e.name, locale) : (e.ref ?? e.type ?? '')))
      .filter(Boolean)
      .join(zh ? '、' : ', ');
    lines.push(`· Day ${d.day ?? '?'}${names ? ` ${names}` : ''}`);
  }
  return lines.join('\n');
}

/**
 * 沉沦之地文本。
 *
 * @param ws - WorldstateDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatDescendiaText(ws: WorldstateDto, locale: Locale): string {
  const zh = locale !== 'en';
  const d = ws.descendia;
  if (!d || d.floors.length === 0) {
    return zh ? '◆ 暂无沉沦之地数据' : '◆ No Descendia data';
  }
  const left = d.expiry ? remain(Math.max(0, Date.parse(d.expiry) - Date.now()), locale) : '';
  const lines = [
    zh ? `◆ 沉沦之地${left ? ` 剩 ${left}` : ''}` : `◆ Descendia${left ? ` ${left}` : ''}`,
  ];
  for (const f of d.floors.slice(0, 21)) {
    lines.push(
      `· #${f.index ?? '?'}${f.type ? ` ${pickLocalized(f.type, locale)}` : ''}${f.challenge ? ` · ${pickLocalized(f.challenge, locale)}` : ''}`,
    );
  }
  return lines.join('\n');
}

/**
 * 仲裁表文本（截断前若干行）。
 *
 * @param data - ArbTableDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatArbTableText(data: ArbTableDto, locale: Locale): string {
  const zh = locale !== 'en';
  if (data.rows.length === 0) {
    return [
      zh ? '◆ 仲裁表' : '◆ Arbitration table',
      data.sourceNote ? pickLocalized(data.sourceNote, locale) : zh ? '暂无排期' : 'Empty',
    ].join('\n');
  }
  const lines = [
    zh ? `◆ 仲裁表（${Math.min(24, data.rows.length)}/${data.rows.length}）` : `◆ Arb table`,
  ];
  for (const r of data.rows.slice(0, 24)) {
    const when = r.start.slice(5, 16).replace('T', ' ');
    lines.push(
      `· ${when} ${pickLocalized(r.node, locale)}${r.missionType ? ` · ${pickLocalized(r.missionType, locale)}` : ''}${r.tier ? ` [${r.tier}]` : ''}`,
    );
  }
  if (data.sourceNote) lines.push(`※ ${pickLocalized(data.sourceNote, locale)}`);
  return lines.join('\n');
}

/**
 * 精华商店文本。
 *
 * @param data - EssenceShopDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatEssenceShopText(data: EssenceShopDto, locale: Locale): string {
  const zh = locale !== 'en';
  const title =
    data.kind === 'steelPath'
      ? zh
        ? '钢铁精华兑换'
        : 'Steel Essence shop'
      : zh
        ? '裂罅碎块兑换'
        : 'Riven Sliver shop';
  const lines = [`◆ ${title}`];
  if (data.nextReset) {
    lines.push(
      zh
        ? `◆ 重置 剩 ${remain(Math.max(0, Date.parse(data.nextReset) - Date.now()), locale)}`
        : `◆ Reset in ${remain(Math.max(0, Date.parse(data.nextReset) - Date.now()), locale)}`,
    );
  }
  if (data.weekly.length) {
    lines.push(zh ? '◆ 本周轮换' : '◆ Weekly');
    for (const o of data.weekly) {
      lines.push(`· ${pickLocalized(o.name, locale)}${o.cost != null ? ` ${o.cost}` : ''}`);
    }
  }
  lines.push(zh ? `◆ 常驻：${data.evergreen.length}` : `◆ Evergreen: ${data.evergreen.length}`);
  for (const o of data.evergreen.slice(0, 12)) {
    lines.push(`· ${pickLocalized(o.name, locale)}${o.cost != null ? ` ${o.cost}` : ''}`);
  }
  if (data.sourceNote) lines.push(`※ ${pickLocalized(data.sourceNote, locale)}`);
  return lines.join('\n');
}

/**
 * 侵袭文本。
 *
 * @param data - IncursionsDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatIncursionsText(data: IncursionsDto, locale: Locale): string {
  const zh = locale !== 'en';
  if (data.nodes.length === 0) {
    return [
      zh ? '◆ 钢铁侵袭' : '◆ SP Incursions',
      data.sourceNote ? pickLocalized(data.sourceNote, locale) : zh ? '暂无节点' : 'Empty',
    ].join('\n');
  }
  const left = data.expiry ? remain(Math.max(0, Date.parse(data.expiry) - Date.now()), locale) : '';
  const lines = [
    zh ? `◆ 钢铁侵袭${left ? ` 剩 ${left}` : ''}` : `◆ Incursions${left ? ` ${left}` : ''}`,
  ];
  for (const n of data.nodes) {
    lines.push(`· ${pickLocalized(n.node, locale)}`);
  }
  return lines.join('\n');
}

/**
 * 灵化轮换文本。
 *
 * @param data - IncarnonRotationDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatIncarnonText(data: IncarnonRotationDto, locale: Locale): string {
  const zh = locale !== 'en';
  const left = data.expiry ? remain(Math.max(0, Date.parse(data.expiry) - Date.now()), locale) : '';
  const lines = [
    zh
      ? `◆ 本周灵化 ${data.weekIndex}/${data.weekTotal}${left ? ` 剩 ${left}` : ''}`
      : `◆ Incarnon week ${data.weekIndex}/${data.weekTotal}${left ? ` ${left}` : ''}`,
  ];
  for (const w of data.current) {
    lines.push(`· ${pickLocalized(w.name, locale)}${w.variant ? `（${w.variant}）` : ''}`);
  }
  if (data.next.length) {
    lines.push(
      zh
        ? `◆ 下周：${data.next.map((w) => pickLocalized(w.name, locale)).join('、')}`
        : `◆ Next: ${data.next.map((w) => pickLocalized(w.name, locale)).join(', ')}`,
    );
  }
  return lines.join('\n');
}

/**
 * 言录使文本。
 *
 * @param data - AcrithisDto
 * @param locale - 语言
 * @returns QQ 文本
 */
export function formatAcrithisText(data: AcrithisDto, locale: Locale): string {
  const zh = locale !== 'en';
  const lines = [
    zh
      ? `◆ 言录使${data.stalePool ? '（候选池）' : ''}`
      : `◆ Acrithis${data.stalePool ? ' (pool)' : ''}`,
  ];
  for (const o of data.offers.slice(0, 12)) {
    lines.push(
      `· ${pickLocalized(o.name, locale)}${o.price != null ? ` ${o.price}` : ''}${o.currency ? ` ${pickLocalized(o.currency, locale)}` : ''}`,
    );
  }
  if (data.sourceNote) lines.push(`※ ${pickLocalized(data.sourceNote, locale)}`);
  return lines.join('\n');
}
