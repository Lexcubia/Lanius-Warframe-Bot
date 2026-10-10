import type { Locale, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

/**
 * 将 worldstate DTO 格式化为适合 QQ 的短文本回复。
 *
 * @param worldstate - 来自 Lanius API 的规范化世界状态
 * @param locale - 回复 locale
 * @param options - 可选陈旧标记与公开站深链
 * @returns 可供官方 QQ sendText 发送的纯文本
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

  lines.push(
    zh
      ? `入侵 ${worldstate.invasions.length} 条：`
      : `Invasions ${worldstate.invasions.length}:`,
  );
  for (const row of worldstate.invasions.slice(0, 5)) {
    const pct = row.completionPct !== undefined ? ` ${row.completionPct}%` : '';
    const node = pickLocalized(row.node, locale);
    const attacker = pickLocalized(row.attackingFaction, locale);
    const defender = pickLocalized(row.defendingFaction, locale);
    lines.push(`${bullet} ${node}${pct} (${attacker}/${defender})`);
  }
  if (worldstate.invasions.length === 0) {
    lines.push(zh ? `${bullet} 暂无活跃入侵` : `${bullet} none active`);
  }

  if (worldstate.nightwave) {
    lines.push(
      zh
        ? `夜浪 赛季${worldstate.nightwave.season ?? '—'} / 阶段${worldstate.nightwave.phase ?? '—'}`
        : `Nightwave S${worldstate.nightwave.season ?? '—'} / P${worldstate.nightwave.phase ?? '—'}`,
    );
    for (const challenge of worldstate.nightwave.activeChallenges.slice(0, 3)) {
      const title = challenge.title
        ? zh
          ? challenge.title.zh
          : challenge.title.en
        : challenge.id;
      lines.push(`${bullet} ${title}`);
    }
  } else {
    lines.push(zh ? '夜浪：暂无数据' : 'Nightwave: n/a');
  }

  if (options.siteUrl) {
    lines.push(`${options.siteUrl}`);
  }

  return lines.join('\n');
}
