import type { CatalogItemDto, Locale, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

/**
 * 将剩余毫秒格式化为短时文案。
 *
 * @param remainingMs - 剩余毫秒
 * @param zh - 是否中文
 * @returns 短时字符串
 */
function formatRemaining(remainingMs: number, zh: boolean): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) {
    return zh ? `${hours}时${minutes}分` : `${hours}h${minutes}m`;
  }
  return zh ? `${minutes}分` : `${minutes}m`;
}

/**
 * 世界状态文本：仅开放世界周期。
 *
 * @param worldstate - DTO
 * @param locale - locale
 * @param options - stale 等
 * @returns QQ 文本
 */
export function formatWorldstateText(
  worldstate: WorldstateDto,
  locale: Locale,
  options: { stale?: boolean; siteUrl?: string } = {},
): string {
  const zh = locale !== 'en';
  const bullet = String.fromCharCode(0xb7);
  const lines: string[] = [];
  lines.push(zh ? `【Lanius ${bullet} 世界状态】` : `[Lanius ${bullet} World State]`);
  if (options.stale) {
    lines.push(zh ? '（数据可能延迟）' : '(data may be delayed)');
  }
  for (const cycle of worldstate.cycles) {
    lines.push(
      `${bullet} ${pickLocalized(cycle.name, locale)} ${pickLocalized(cycle.stateLabel, locale)} ${formatRemaining(cycle.remainingMs, zh)}`,
    );
  }
  if (worldstate.cycles.length === 0) {
    lines.push(zh ? `${bullet} 暂无周期数据` : `${bullet} no cycle data`);
  }
  if (options.siteUrl) {
    lines.push(options.siteUrl);
  }
  return lines.join('\n');
}

/**
 * 入侵模块文本。
 *
 * @param worldstate - DTO
 * @param locale - locale
 * @param options - stale 等
 * @returns QQ 文本
 */
export function formatInvasionsText(
  worldstate: WorldstateDto,
  locale: Locale,
  options: { stale?: boolean; siteUrl?: string } = {},
): string {
  const zh = locale !== 'en';
  const bullet = String.fromCharCode(0xb7);
  const lines: string[] = [];
  lines.push(zh ? `【Lanius ${bullet} 入侵】` : `[Lanius ${bullet} Invasions]`);
  if (options.stale) {
    lines.push(zh ? '（数据可能延迟）' : '(data may be delayed)');
  }
  for (const row of worldstate.invasions.slice(0, 8)) {
    const pct = row.completionPct !== undefined ? ` ${row.completionPct}%` : '';
    lines.push(
      `${bullet} ${pickLocalized(row.node, locale)}${pct} (${pickLocalized(row.attackingFaction, locale)}/${pickLocalized(row.defendingFaction, locale)})`,
    );
    const atk = formatInvasionReward(row.attackerReward, locale);
    const def = formatInvasionReward(row.defenderReward, locale);
    if (atk || def) {
      lines.push(
        zh
          ? `  ${pickLocalized(row.attackingFaction, locale)}：${atk ?? '—'} / ${pickLocalized(row.defendingFaction, locale)}：${def ?? '—'}`
          : `  ${pickLocalized(row.attackingFaction, locale)}: ${atk ?? '—'} / ${pickLocalized(row.defendingFaction, locale)}: ${def ?? '—'}`,
      );
    }
  }
  if (worldstate.invasions.length === 0) {
    lines.push(zh ? `${bullet} 暂无活跃入侵` : `${bullet} none active`);
  }
  if (options.siteUrl) {
    lines.push(options.siteUrl);
  }
  return lines.join('\n');
}

/**
 * 虚空裂隙模块文本。
 *
 * @param worldstate - DTO（可已按子参数筛选）
 * @param locale - locale
 * @param options - stale / 筛选摘要等
 * @returns QQ 文本
 */
export function formatFissuresText(
  worldstate: WorldstateDto,
  locale: Locale,
  options: {
    stale?: boolean;
    siteUrl?: string;
    /** 已应用的筛选摘要（展示在标题下） */
    filterSummary?: string;
  } = {},
): string {
  const zh = locale !== 'en';
  const bullet = String.fromCharCode(0xb7);
  const lines: string[] = [];
  lines.push(zh ? `【Lanius ${bullet} 虚空裂隙】` : `[Lanius ${bullet} Fissures]`);
  if (options.filterSummary) {
    lines.push(
      zh
        ? `筛选：${options.filterSummary}`
        : `Filter: ${options.filterSummary}`,
    );
  }
  if (options.stale) {
    lines.push(zh ? '（数据可能延迟）' : '(data may be delayed)');
  }
  for (const row of worldstate.fissures.slice(0, 12)) {
    lines.push(
      `${bullet} ${pickLocalized(row.eraLabel, locale)} ${pickLocalized(row.missionType, locale)} · ${pickLocalized(row.node, locale)} · ${pickLocalized(row.pathLabel, locale)} ${formatRemaining(row.remainingMs, zh)}`,
    );
  }
  if (worldstate.fissures.length === 0) {
    lines.push(
      zh
        ? `${bullet} 暂无匹配裂隙（可试：/裂隙 古纪 · /裂隙 钢铁 · /裂隙 生存）`
        : `${bullet} no matching fissures (try: /fissures lith · /fissures steel · /fissures survival)`,
    );
  }
  if (options.siteUrl) {
    lines.push(options.siteUrl);
  }
  return lines.join('\n');
}

/**
 * 格式化入侵单侧奖励（数量大于 1 时附带 ×N）。
 *
 * @param reward - 奖励物品
 * @param locale - 语言
 * @returns 文案；无奖励时 `undefined`
 */
function formatInvasionReward(
  reward: CatalogItemDto | undefined,
  locale: Locale,
): string | undefined {
  if (!reward) {
    return undefined;
  }
  const name = pickLocalized(reward.name, locale);
  if (reward.quantity != null && reward.quantity > 1) {
    return `${name} ×${reward.quantity}`;
  }
  return name;
}

/**
 * 午夜电波模块文本。
 *
 * @param worldstate - DTO
 * @param locale - locale
 * @param options - stale 等
 * @returns QQ 文本
 */
export function formatNightwaveText(
  worldstate: WorldstateDto,
  locale: Locale,
  options: { stale?: boolean; siteUrl?: string } = {},
): string {
  const zh = locale !== 'en';
  const bullet = String.fromCharCode(0xb7);
  const lines: string[] = [];
  lines.push(zh ? `【Lanius ${bullet} 午夜电波】` : `[Lanius ${bullet} Nightwave]`);
  if (options.stale) {
    lines.push(zh ? '（数据可能延迟）' : '(data may be delayed)');
  }
  if (!worldstate.nightwave) {
    lines.push(zh ? `${bullet} 暂无数据` : `${bullet} n/a`);
  } else {
    lines.push(
      zh
        ? `赛季${worldstate.nightwave.season ?? '—'} / 阶段${worldstate.nightwave.phase ?? '—'}`
        : `S${worldstate.nightwave.season ?? '—'} / P${worldstate.nightwave.phase ?? '—'}`,
    );
    for (const challenge of worldstate.nightwave.activeChallenges.slice(0, 8)) {
      const kind = pickLocalized(challenge.kindLabel, locale);
      const title = challenge.title
        ? pickLocalized(challenge.title, locale)
        : challenge.id;
      lines.push(`${bullet} [${kind}] ${title}`);
    }
  }
  if (options.siteUrl) {
    lines.push(options.siteUrl);
  }
  return lines.join('\n');
}
