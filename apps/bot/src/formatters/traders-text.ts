import {
  pickLocalized,
  type Locale,
  type RotationWeaponDto,
  type VarziaDto,
  type VoidTraderDto,
  type WeaponRotationDto,
} from '@lanius/core';

/**
 * 格式化虚空商人文本回复。
 *
 * @param data - VoidTraderDto
 * @param locale - 语言
 * @param options - stale 等
 * @returns 多行文本
 */
export function formatVoidTraderText(
  data: VoidTraderDto,
  locale: Locale,
  options: { stale?: boolean } = {},
): string {
  const zh = locale === 'zh';
  const bullet = '·';
  const lines = [
    zh
      ? `【Lanius ${bullet} ${pickLocalized(data.character, locale)}】`
      : `[Lanius ${bullet} ${pickLocalized(data.character, locale)}]`,
  ];
  if (options.stale) {
    lines.push(zh ? '（数据可能延迟）' : '(data may be delayed)');
  }
  const mins = Math.max(0, Math.round(data.remainingMs / 60_000));
  const node = pickLocalized(data.node, locale);
  if (data.active) {
    lines.push(
      zh
        ? `${bullet} 驻留 ${node}，约 ${mins} 分钟后离开`
        : `${bullet} At ${node}, leaves in ~${mins}m`,
    );
  } else {
    lines.push(
      zh
        ? `${bullet} 未在场，约 ${mins} 分钟后抵达 ${node}`
        : `${bullet} Arrives at ${node} in ~${mins}m`,
    );
  }
  if (data.inventory.length === 0) {
    lines.push(zh ? `${bullet} 货架暂无条目` : `${bullet} inventory empty`);
  } else {
    for (const item of data.inventory.slice(0, 25)) {
      const name = formatBilingualItemName(item.name, locale);
      const ducats = item.ducats != null ? ` ${item.ducats}d` : '';
      const credits =
        item.credits != null
          ? zh
            ? ` ${Math.round(item.credits / 1000)}k`
            : ` ${Math.round(item.credits / 1000)}k cr`
          : '';
      lines.push(`${bullet} ${name}${ducats}${credits}`);
    }
  }
  return lines.join('\n');
}

/**
 * 格式化瓦奇娅文本回复。
 *
 * @param data - VarziaDto
 * @param locale - 语言
 * @param options - stale 等
 * @returns 多行文本
 */
export function formatVarziaText(
  data: VarziaDto,
  locale: Locale,
  options: { stale?: boolean } = {},
): string {
  const zh = locale === 'zh';
  const bullet = '·';
  const lines = [
    zh
      ? `【Lanius ${bullet} ${pickLocalized(data.character, locale)}】`
      : `[Lanius ${bullet} ${pickLocalized(data.character, locale)}]`,
  ];
  if (options.stale) {
    lines.push(zh ? '（数据可能延迟）' : '(data may be delayed)');
  }
  if (data.remainingMs != null) {
    const mins = Math.max(0, Math.round(data.remainingMs / 60_000));
    lines.push(zh ? `${bullet} 剩余约 ${mins} 分钟` : `${bullet} ~${mins}m left`);
  }
  if (data.inventory.length === 0) {
    lines.push(zh ? `${bullet} 货架为空或未开放` : `${bullet} empty / inactive`);
  } else {
    for (const item of data.inventory.slice(0, 30)) {
      lines.push(`${bullet} ${formatBilingualItemName(item.name, locale)}`);
    }
  }
  return lines.join('\n');
}

/**
 * 格式化武器轮换文本回复（货架平级列出）。
 *
 * @param data - WeaponRotationDto
 * @param locale - 语言
 * @returns 多行文本
 */
export function formatRotationText(data: WeaponRotationDto, locale: Locale): string {
  const zh = locale === 'zh';
  const bullet = '·';
  const title =
    data.kind === 'tenet'
      ? zh
        ? '信条武器商店'
        : 'Tenet shop'
      : zh
        ? '终幕武器商店'
        : 'Coda shop';
  const days = Math.max(0, Math.round(data.remainingMs / 86_400_000));
  const lines = [
    zh ? `【Lanius ${bullet} ${title}】` : `[Lanius ${bullet} ${title}]`,
    zh
      ? `${bullet} 约 ${days} 天后刷新 Valence`
      : `${bullet} Valence refreshes in ~${days}d`,
  ];
  for (const weapon of data.offerings) {
    lines.push(`${bullet} ${formatRotationWeaponLine(weapon, locale)}`);
  }
  return lines.join('\n');
}

/**
 * 主语言译名 + 另一语言对照（译名相同时不重复）。
 *
 * @param name - 双语名
 * @param locale - 当前语言
 * @returns 展示字符串
 */
function formatBilingualItemName(
  name: { zh: string; en: string },
  locale: Locale,
): string {
  const primary = pickLocalized(name, locale);
  const secondary = locale === 'zh' ? name.en : name.zh;
  if (!secondary || secondary === primary) {
    return primary;
  }
  return `${primary}（${secondary}）`;
}

/**
 * 轮换武器一行：译名 + 可选 Valence。
 *
 * @param weapon - RotationWeaponDto
 * @param locale - 语言
 * @returns 单行文案
 */
function formatRotationWeaponLine(
  weapon: RotationWeaponDto,
  locale: Locale,
): string {
  const base = formatBilingualItemName(weapon.name, locale);
  if (!weapon.elementLabel && weapon.bonusPct == null) {
    return base;
  }
  const el = weapon.elementLabel
    ? pickLocalized(weapon.elementLabel, locale)
    : '';
  const pct =
    weapon.bonusPct != null
      ? `${Number(weapon.bonusPct.toFixed(1))}%`
      : '';
  const valence = [el, pct].filter(Boolean).join(' ');
  return valence ? `${base} [${valence}]` : base;
}
