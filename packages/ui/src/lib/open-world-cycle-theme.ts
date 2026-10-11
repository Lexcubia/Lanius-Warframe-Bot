import type { OpenWorldCycleId } from '@lanius/core';

/**
 * 开放世界周期视觉主题（六地各一色，供环进度 / 文案强调）。
 */
export type OpenWorldCycleTheme = {
  /** 进度环与强调色 */
  accent: string;
  /** 环底轨道色 */
  track: string;
  /** 状态徽章底 */
  badgeBg: string;
  /** 状态徽章字色 */
  badgeFg: string;
};

/**
 * 六地固定色板（与昼夜/冷暖状态无关，保证卡片间可区分）。
 */
const CYCLE_THEME: Record<OpenWorldCycleId, OpenWorldCycleTheme> = {
  /** 地球：草木绿 */
  earth: {
    accent: '#4f9f5a',
    track: '#d5ebd8',
    badgeBg: '#e8f6ea',
    badgeFg: '#2f7a3a',
  },
  /** 希图斯平原：沙金 */
  cetus: {
    accent: '#e0a020',
    track: '#f7e4bc',
    badgeBg: '#fff4e0',
    badgeFg: '#a86d0c',
  },
  /** 魔胎之境：侵染玫红 */
  cambion: {
    accent: '#d14f8c',
    track: '#f3d4e4',
    badgeBg: '#fceaf2',
    badgeFg: '#9a2f62',
  },
  /** 奥布山谷：冻原青 */
  vallis: {
    accent: '#2f9fbc',
    track: '#d0eaf1',
    badgeBg: '#e6f6fa',
    badgeFg: '#1d6f86',
  },
  /** 双衍法理：奇想紫 */
  duviri: {
    accent: '#7b63d4',
    track: '#e2dcf5',
    badgeBg: '#f0ecfb',
    badgeFg: '#5542a0',
  },
  /** 扎里曼：虚空金 */
  zariman: {
    accent: '#c49a3c',
    track: '#f0e6c8',
    badgeBg: '#faf3e0',
    badgeFg: '#8a6a1f',
  },
};

/**
 * 取周期主题色；未知 id 时回退希图斯金。
 *
 * @param id - 开放世界周期 id
 * @returns 主题色板
 */
export function resolveOpenWorldCycleTheme(
  id: OpenWorldCycleId | string,
): OpenWorldCycleTheme {
  if (id in CYCLE_THEME) {
    return CYCLE_THEME[id as OpenWorldCycleId];
  }
  return CYCLE_THEME.cetus;
}

/**
 * 环心图标种类（按地点语义，非状态）。
 */
export type OpenWorldCycleIconKind =
  | 'globe'
  | 'sun'
  | 'spore'
  | 'snow'
  | 'spiral'
  | 'void';

/**
 * 周期 id → 环心图标种类。
 */
const CYCLE_ICON: Record<OpenWorldCycleId, OpenWorldCycleIconKind> = {
  earth: 'globe',
  cetus: 'sun',
  cambion: 'spore',
  vallis: 'snow',
  duviri: 'spiral',
  zariman: 'void',
};

/**
 * 解析环心图标种类。
 *
 * @param id - 开放世界周期 id
 * @returns 图标种类
 */
export function resolveOpenWorldCycleIconKind(
  id: OpenWorldCycleId | string,
): OpenWorldCycleIconKind {
  if (id in CYCLE_ICON) {
    return CYCLE_ICON[id as OpenWorldCycleId];
  }
  return 'sun';
}
