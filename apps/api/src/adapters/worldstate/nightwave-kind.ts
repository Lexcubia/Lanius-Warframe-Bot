import type { LocalizedName, NightwaveChallengeKind } from '@lanius/core';

/**
 * 午夜电波挑战周期档双语标签。
 */
export const NIGHTWAVE_KIND_LABELS: Record<
  NightwaveChallengeKind,
  LocalizedName
> = {
  daily: { zh: '每日', en: 'Daily' },
  weekly: { zh: '每周', en: 'Weekly' },
  other: { zh: '其他', en: 'Other' },
};

/**
 * 从上游挑战路径与可选 Daily 标志推断周期档。
 *
 * 优先 `Daily` 布尔；否则匹配路径中的 `/Daily/`、`/Weekly/`
 * 或 `SeasonDaily` / `SeasonWeekly` 片段。
 *
 * @param challengePath - `ActiveChallenges[].Challenge` 路径
 * @param dailyFlag - 上游 `Daily` 字段（若有）
 * @returns `daily` | `weekly` | `other`
 */
export function resolveNightwaveChallengeKind(
  challengePath: string | undefined,
  dailyFlag?: boolean,
): NightwaveChallengeKind {
  if (dailyFlag === true) {
    return 'daily';
  }
  if (dailyFlag === false) {
    return 'weekly';
  }
  if (!challengePath) {
    return 'other';
  }
  if (/\/Daily\//i.test(challengePath) || /SeasonDaily/i.test(challengePath)) {
    return 'daily';
  }
  if (
    /\/Weekly\//i.test(challengePath) ||
    /SeasonWeekly/i.test(challengePath)
  ) {
    return 'weekly';
  }
  return 'other';
}
