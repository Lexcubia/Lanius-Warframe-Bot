import type { TimersDto, TimerRowDto, WorldstateDto } from '@lanius/core';

import { nextWeeklyResetIso } from './map-shops-rotations.js';

/**
 * 由世界状态切片聚合「时效」总览行（对齐 SDJK `/时效`）。
 *
 * @param worldstate - 已映射的 WorldstateDto
 * @param extras - 可选额外到期（侵袭 / 沉沦等已在 worldstate 内）
 * @returns TimersDto
 */
export function buildTimersFromWorldstate(
  worldstate: WorldstateDto,
  extras: {
    incursionsExpiry?: string;
    incarnonExpiry?: string;
    nextArbSwitchIso?: string;
  } = {},
): TimersDto {
  const nowMs = Date.parse(worldstate.fetchedAt);
  const base = Number.isFinite(nowMs) ? nowMs : Date.now();
  const rows: TimerRowDto[] = [];

  for (const cycle of worldstate.cycles) {
    rows.push(row(`cycle:${cycle.id}`, cycle.name, cycle.expiry, base, cycle.stateLabel));
  }

  if (extras.nextArbSwitchIso) {
    rows.push(row('arbitration', { zh: '仲裁', en: 'Arbitration' }, extras.nextArbSwitchIso, base));
  } else if (worldstate.arbitration?.expiry) {
    rows.push(
      row('arbitration', { zh: '仲裁', en: 'Arbitration' }, worldstate.arbitration.expiry, base),
    );
  }

  if (worldstate.sortie?.expiry) {
    rows.push(row('sortie', { zh: '每日突击', en: 'Sortie' }, worldstate.sortie.expiry, base));
  }
  if (worldstate.archon?.expiry) {
    rows.push(
      row('archon', { zh: '执刑官猎杀', en: 'Archon Hunt' }, worldstate.archon.expiry, base),
    );
  }
  if (extras.incursionsExpiry) {
    rows.push(
      row('incursions', { zh: '钢铁侵蚀', en: 'SP Incursions' }, extras.incursionsExpiry, base),
    );
  }
  if (worldstate.nightwave?.activeChallenges?.[0]?.expiry) {
    rows.push(
      row(
        'nightwave',
        { zh: '午夜电波', en: 'Nightwave' },
        worldstate.nightwave.activeChallenges[0]!.expiry!,
        base,
      ),
    );
  }
  if (worldstate.calendar1999?.expiry) {
    rows.push(
      row(
        'calendar1999',
        { zh: '1999日历', en: '1999 Calendar' },
        worldstate.calendar1999.expiry,
        base,
      ),
    );
  }
  for (const season of worldstate.archimedea?.seasons ?? []) {
    if (!season.expiry) {
      continue;
    }
    const label =
      season.kind === 'lab'
        ? { zh: '深层科研', en: 'Deep Archimedea' }
        : { zh: '时光科研', en: 'Temporal Archimedea' };
    rows.push(row(`archimedea:${season.kind}`, label, season.expiry, base));
  }
  if (worldstate.descendia?.expiry) {
    rows.push(
      row('descendia', { zh: '沉沦之地', en: 'Descendia' }, worldstate.descendia.expiry, base),
    );
  }
  if (extras.incarnonExpiry) {
    rows.push(
      row('incarnon', { zh: '钢铁回廊灵化', en: 'Circuit Incarnon' }, extras.incarnonExpiry, base),
    );
  }
  rows.push(
    row('weeklyReset', { zh: '周常重置', en: 'Weekly reset' }, nextWeeklyResetIso(base), base),
  );

  return {
    fetchedAt: worldstate.fetchedAt,
    rows,
  };
}

/**
 * 构造单行时效。
 *
 * @param id - 稳定 id
 * @param label - 双语标签
 * @param expiry - ISO 到期
 * @param nowMs - 当前毫秒
 * @param note - 可选附注
 * @returns TimerRowDto
 */
function row(
  id: string,
  label: TimerRowDto['label'],
  expiry: string | undefined,
  nowMs: number,
  note?: TimerRowDto['note'],
): TimerRowDto {
  const expMs = expiry ? Date.parse(expiry) : Number.NaN;
  return {
    id,
    label,
    ...(expiry ? { expiry } : {}),
    ...(Number.isFinite(expMs) ? { remainingMs: Math.max(0, expMs - nowMs) } : {}),
    ...(note ? { note } : {}),
  };
}
