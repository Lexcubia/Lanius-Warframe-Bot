import type { Locale, WorldstateDto } from '@lanius/core';
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
 * @param worldstate - DTO
 * @param locale - locale
 * @param options - stale 等
 * @returns QQ 文本
 */
export function formatFissuresText(
  worldstate: WorldstateDto,
  locale: Locale,
  options: { stale?: boolean; siteUrl?: string } = {},
): string {
  const zh = locale !== 'en';
  const bullet = String.fromCharCode(0xb7);
  const lines: string[] = [];
  lines.push(zh ? `【Lanius ${bullet} 虚空裂隙】` : `[Lanius ${bullet} Fissures]`);
  if (options.stale) {
    lines.push(zh ? '（数据可能延迟）' : '(data may be delayed)');
  }
  for (const row of worldstate.fissures.slice(0, 12)) {
    lines.push(
      `${bullet} ${pickLocalized(row.eraLabel, locale)} ${pickLocalized(row.missionType, locale)} · ${pickLocalized(row.node, locale)} · ${pickLocalized(row.pathLabel, locale)} ${formatRemaining(row.remainingMs, zh)}`,
    );
  }
  if (worldstate.fissures.length === 0) {
    lines.push(zh ? `${bullet} 暂无活跃裂隙` : `${bullet} none active`);
  }
  if (options.siteUrl) {
    lines.push(options.siteUrl);
  }
  return lines.join('\n');
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
    for (const challenge of worldstate.nightwave.activeChallenges.slice(0, 6)) {
      const title = challenge.title
        ? pickLocalized(challenge.title, locale)
        : challenge.id;
      lines.push(`${bullet} ${title}`);
    }
  }
  if (options.siteUrl) {
    lines.push(options.siteUrl);
  }
  return lines.join('\n');
}
