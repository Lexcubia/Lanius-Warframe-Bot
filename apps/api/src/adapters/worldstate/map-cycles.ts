import type { LocalizedName, OpenWorldCycleDto } from '@lanius/core';

import type { UpstreamSyndicateMission, UpstreamWorldstate } from './types.js';

/**
 * 从官方 worldState 推导开放世界周期列表。
 * 算法对齐 WFCD worldstate-parser（地球/山谷/双衍用墙钟；平原/魔胎/扎里曼依赖赏金到期）。
 *
 * @param raw - 上游 worldState 根对象
 * @param nowMs - 计算时刻（毫秒），便于单测注入
 * @returns 固定顺序的 6 条周期
 */
export function mapOpenWorldCycles(
  raw: UpstreamWorldstate,
  nowMs: number = Date.now(),
): OpenWorldCycleDto[] {
  const cetusExpiryMs = syndicateExpiryMs(raw, 'CetusSyndicate');
  const zarimanExpiryMs = syndicateExpiryMs(raw, 'ZarimanSyndicate');
  const cetus = computeCetusLike(nowMs, cetusExpiryMs);
  const cambionState = cetus.state === 'day' ? 'fass' : 'vome';

  return [
    computeEarth(nowMs),
    {
      id: 'cetus',
      name: { zh: '希图斯（平原）', en: 'Cetus (Plains)' },
      state: cetus.state,
      stateLabel: stateLabel(cetus.state),
      expiry: new Date(cetus.expiryMs).toISOString(),
      remainingMs: cetus.remainingMs,
      progress: cetus.progress,
    },
    {
      id: 'cambion',
      name: { zh: '魔胎之境', en: 'Cambion Drift' },
      state: cambionState,
      stateLabel: stateLabel(cambionState),
      expiry: new Date(cetus.expiryMs).toISOString(),
      remainingMs: cetus.remainingMs,
      progress: cetus.progress,
    },
    computeVallis(nowMs),
    computeDuviri(nowMs),
    computeZariman(nowMs, zarimanExpiryMs),
  ];
}

/**
 * 读取赏金联盟任务到期毫秒时间戳。
 *
 * @param raw - 上游根对象
 * @param tag - SyndicateMissions.Tag
 * @returns 到期 Unix ms；缺失时返回 `undefined`
 */
function syndicateExpiryMs(
  raw: UpstreamWorldstate,
  tag: string,
): number | undefined {
  const mission = (raw.SyndicateMissions ?? []).find(
    (row: UpstreamSyndicateMission) => row.Tag === tag,
  );
  const value = Number(mission?.Expiry?.$date?.$numberLong);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * 地球昼夜：8h 一轮，各 4h。
 *
 * @param nowMs - 当前毫秒
 * @returns 周期 DTO
 */
function computeEarth(nowMs: number): OpenWorldCycleDto {
  const cycleSec = Math.floor(nowMs / 1000) % 28800;
  const isDay = cycleSec < 14400;
  const remainingSec = 14400 - (cycleSec % 14400);
  const remainingMs = remainingSec * 1000;
  const stateDurationMs = 14400 * 1000;
  return {
    id: 'earth',
    name: { zh: '地球', en: 'Earth' },
    state: isDay ? 'day' : 'night',
    stateLabel: stateLabel(isDay ? 'day' : 'night'),
    expiry: new Date(nowMs + remainingMs).toISOString(),
    remainingMs,
    progress: 1 - remainingMs / stateDurationMs,
  };
}

/**
 * 希图斯昼夜：依赖 CetusSyndicate 赏金结束（夜间结束点）。
 *
 * @param nowMs - 当前毫秒
 * @param bountiesEndMs - 赏金结束时刻
 * @returns 中间结果
 */
function computeCetusLike(
  nowMs: number,
  bountiesEndMs: number | undefined,
): { state: string; expiryMs: number; remainingMs: number; progress: number } {
  const nightSec = 3000;
  const dayMs = 6_000_000;
  const nightMs = 3_000_000;
  // 无赏金到期时回退到地球节奏，避免整块空白
  if (bountiesEndMs === undefined) {
    const earth = computeEarth(nowMs);
    return {
      state: earth.state,
      expiryMs: Date.parse(earth.expiry),
      remainingMs: earth.remainingMs,
      progress: earth.progress,
    };
  }
  const end = new Date(bountiesEndMs);
  end.setSeconds(0, 0);
  let millisLeft = end.getTime() - nowMs;
  if (millisLeft < 0) {
    millisLeft = 0;
  }
  const secondsToNightEnd = Math.round(millisLeft / 1000);
  const isDay = secondsToNightEnd > nightSec;
  const secondsRemaining = isDay ? secondsToNightEnd - nightSec : secondsToNightEnd;
  const remainingMs = Math.max(0, secondsRemaining * 1000);
  const stateDurationMs = isDay ? dayMs : nightMs;
  return {
    state: isDay ? 'day' : 'night',
    expiryMs: nowMs + remainingMs,
    remainingMs,
    progress: stateDurationMs > 0 ? 1 - remainingMs / stateDurationMs : 1,
  };
}

/**
 * 奥布山谷冷暖：1600s 一轮，暖 400s。
 *
 * @param nowMs - 当前毫秒
 * @returns 周期 DTO
 */
function computeVallis(nowMs: number): OpenWorldCycleDto {
  const loopStart = Date.parse('2026-02-04T19:46:48.000Z');
  const loopTime = 1_600_000;
  const warmTime = 400_000;
  const coldTime = loopTime - warmTime;
  const sinceLast = ((nowMs - loopStart) % loopTime + loopTime) % loopTime;
  const toNextFull = loopTime - sinceLast;
  const isWarm = toNextFull > coldTime;
  const remainingMs = isWarm ? toNextFull - coldTime : toNextFull;
  const stateDurationMs = isWarm ? warmTime : coldTime;
  return {
    id: 'vallis',
    name: { zh: '奥布山谷', en: 'Orb Vallis' },
    state: isWarm ? 'warm' : 'cold',
    stateLabel: stateLabel(isWarm ? 'warm' : 'cold'),
    expiry: new Date(nowMs + remainingMs).toISOString(),
    remainingMs,
    progress: stateDurationMs > 0 ? 1 - remainingMs / stateDurationMs : 1,
  };
}

/**
 * 双衍王境情绪：36000s 一轮，每态 7200s。
 *
 * @param nowMs - 当前毫秒
 * @returns 周期 DTO
 */
function computeDuviri(nowMs: number): OpenWorldCycleDto {
  const states = ['sorrow', 'fear', 'joy', 'anger', 'envy'] as const;
  const cycleTime = 36000;
  const stateTime = 7200;
  const cycleDelta = (Math.floor(nowMs / 1000) - 52) % cycleTime;
  const stateInd = Math.floor(cycleDelta / stateTime);
  const stateDelta = cycleDelta % stateTime;
  const remainingMs = (stateTime - stateDelta) * 1000;
  const state = states[stateInd] ?? 'sorrow';
  return {
    id: 'duviri',
    name: { zh: '双衍王境', en: 'Duviri' },
    state,
    stateLabel: stateLabel(state),
    expiry: new Date(nowMs + remainingMs).toISOString(),
    remainingMs,
    progress: 1 - remainingMs / (stateTime * 1000),
  };
}

/**
 * 扎里曼阵营：18h 一轮，各 2.5h；用 ZarimanSyndicate 赏金到期对齐。
 *
 * @param nowMs - 当前毫秒
 * @param bountiesEndMs - 赏金结束
 * @returns 周期 DTO
 */
function computeZariman(
  nowMs: number,
  bountiesEndMs: number | undefined,
): OpenWorldCycleDto {
  const corpusAnchor = 1_655_182_800_000;
  const fullCycle = 18_000_000;
  const stateMaximum = 9_000_000;
  if (bountiesEndMs === undefined) {
    return {
      id: 'zariman',
      name: { zh: '扎里曼', en: 'Zariman' },
      state: 'corpus',
      stateLabel: stateLabel('corpus'),
      expiry: new Date(nowMs).toISOString(),
      remainingMs: 0,
      progress: 1,
    };
  }
  const bountiesClone = bountiesEndMs - 5000;
  const millisLeft = Math.max(0, bountiesClone - nowMs);
  const cycleTimeElapsed =
    (((bountiesClone - corpusAnchor) % fullCycle) + fullCycle) % fullCycle;
  const cycleTimeLeft = fullCycle - cycleTimeElapsed;
  const isCorpus = cycleTimeLeft > stateMaximum;
  const state = isCorpus ? 'corpus' : 'grineer';
  return {
    id: 'zariman',
    name: { zh: '扎里曼', en: 'Zariman' },
    state,
    stateLabel: stateLabel(state),
    expiry: new Date(nowMs + millisLeft).toISOString(),
    remainingMs: millisLeft,
    progress: stateMaximum > 0 ? 1 - Math.min(millisLeft, stateMaximum) / stateMaximum : 1,
  };
}

/**
 * 状态键 → 中英展示文案。
 *
 * @param state - 状态键
 * @returns LocalizedName
 */
function stateLabel(state: string): LocalizedName {
  const table: Record<string, LocalizedName> = {
    day: { zh: '白昼', en: 'Day' },
    night: { zh: '夜晚', en: 'Night' },
    fass: { zh: 'Fass', en: 'Fass' },
    vome: { zh: 'Vome', en: 'Vome' },
    warm: { zh: '温暖', en: 'Warm' },
    cold: { zh: '寒冷', en: 'Cold' },
    corpus: { zh: 'Corpus', en: 'Corpus' },
    grineer: { zh: '格林尼尔', en: 'Grineer' },
    sorrow: { zh: '悲伤', en: 'Sorrow' },
    fear: { zh: '恐惧', en: 'Fear' },
    joy: { zh: '喜悦', en: 'Joy' },
    anger: { zh: '愤怒', en: 'Anger' },
    envy: { zh: '嫉妒', en: 'Envy' },
  };
  return table[state] ?? { zh: state, en: state };
}
