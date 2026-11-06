import type { Calendar1999Dto, DescendiaDto, LocalizedName } from '@lanius/core';

import { mongoToIso, parseMongoMs } from './mongo-date.js';
import { resolvePathLabel } from './resolve-labels.js';
import type { UpstreamCalendarSeason, UpstreamDescent, UpstreamWorldstate } from './types.js';

/**
 * 映射 1999 日历（KnownCalendarSeasons 当前季）。
 *
 * @param raw - 上游 worldState
 * @param nowMs - 当前毫秒
 * @returns Calendar1999Dto 或 null
 */
export function mapCalendar1999(raw: UpstreamWorldstate, nowMs: number): Calendar1999Dto | null {
  const seasons = raw.KnownCalendarSeasons ?? [];
  if (seasons.length === 0) {
    return null;
  }
  const current =
    seasons.find((s) => {
      const act = parseMongoMs(s.Activation) ?? 0;
      const exp = parseMongoMs(s.Expiry) ?? Number.POSITIVE_INFINITY;
      return act <= nowMs && nowMs < exp;
    }) ?? seasons[0];
  if (!current) {
    return null;
  }
  return mapOneCalendar(current);
}

/**
 * 映射单季日历。
 *
 * @param season - 上游日历季
 * @returns Calendar1999Dto
 */
function mapOneCalendar(season: UpstreamCalendarSeason): Calendar1999Dto {
  const days = [];
  for (const d of season.Days ?? []) {
    const events = [];
    for (const ev of d.events ?? []) {
      const ref = ev.reward ?? ev.UpgradeType ?? ev.typeName ?? ev.type;
      events.push({
        ...(ev.type ? { type: ev.type } : {}),
        ...(ref ? { ref } : {}),
        ...(ref ? { name: resolvePathLabel(ref) } : {}),
      });
    }
    days.push({
      ...(typeof d.day === 'number' ? { day: d.day } : {}),
      ...(d.date ? { date: d.date } : {}),
      events,
    });
  }
  return {
    ...(season.Season ? { season: season.Season } : {}),
    ...(mongoToIso(season.Activation) ? { activation: mongoToIso(season.Activation) } : {}),
    ...(mongoToIso(season.Expiry) ? { expiry: mongoToIso(season.Expiry) } : {}),
    days,
  };
}

/**
 * 沉沦之地任务类型简表（官方 CircleOfHell 缺键时回退）。
 */
const DESCENT_TYPE_FALLBACK: Record<string, LocalizedName> = {
  DT_EXTERMINATE: { zh: '歼灭', en: 'Exterminate' },
  DT_SURVIVAL: { zh: '生存', en: 'Survival' },
  DT_DEFENSE: { zh: '防御', en: 'Defense' },
  DT_MOBILE_DEFENSE: { zh: '移动防御', en: 'Mobile Defense' },
  DT_RESCUE: { zh: '救援', en: 'Rescue' },
  DT_SPY: { zh: '间谍', en: 'Spy' },
  DT_SABOTAGE: { zh: '破坏', en: 'Sabotage' },
  DT_ASSASSINATION: { zh: '刺杀', en: 'Assassination' },
  DT_BOSS: { zh: '首领', en: 'Boss' },
  DT_NETRACELLS: { zh: '净网牢房', en: 'Netracells' },
};

/**
 * 映射沉沦之地（Descents 当前周窗口）。
 *
 * @param raw - 上游 worldState
 * @param nowMs - 当前毫秒
 * @returns DescendiaDto 或 null
 */
export function mapDescendia(raw: UpstreamWorldstate, nowMs: number): DescendiaDto | null {
  const entries = raw.Descents ?? [];
  if (entries.length === 0) {
    return null;
  }
  const cur =
    entries.find((e) => {
      const act = parseMongoMs(e.Activation) ?? 0;
      const exp = parseMongoMs(e.Expiry) ?? 0;
      return act <= nowMs && nowMs < exp;
    }) ?? entries[0];
  if (!cur) {
    return null;
  }
  return mapOneDescendia(cur);
}

/**
 * 映射单周沉沦之地。
 *
 * @param cur - 上游 Descents 元素
 * @returns DescendiaDto
 */
function mapOneDescendia(cur: UpstreamDescent): DescendiaDto {
  const floors = [];
  for (const c of cur.Challenges ?? []) {
    const typeKey = (c.Type ?? '').trim();
    const challengeKey = (c.Challenge ?? '').trim();
    floors.push({
      ...(typeof c.Index === 'number' ? { index: c.Index } : {}),
      ...(typeKey ? { typeKey } : {}),
      ...(typeKey
        ? {
            type:
              DESCENT_TYPE_FALLBACK[typeKey] ??
              resolvePathLabel(`/Lotus/Language/CircleOfHell/${typeKey}`),
          }
        : {}),
      ...(challengeKey ? { challengeKey } : {}),
      ...(challengeKey
        ? { challenge: resolvePathLabel(`/Lotus/Language/CircleOfHell/${challengeKey}`) }
        : {}),
    });
  }
  return {
    ...(mongoToIso(cur.Activation) ? { activation: mongoToIso(cur.Activation) } : {}),
    ...(mongoToIso(cur.Expiry) ? { expiry: mongoToIso(cur.Expiry) } : {}),
    floors,
  };
}
