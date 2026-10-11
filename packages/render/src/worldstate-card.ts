import type { Locale, OpenWorldCycleDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { laniusTokens } from '@lanius/ui/tokens';

import { buildCycleRingDataUrl } from './cycle-ring-svg.js';
import { buildQqShell } from './qq-shell.js';
import {
  clipText,
  el,
  formatRemaining,
  type SatoriNode,
} from './satori-el.js';

/**
 * 构建开放世界周期卡片（真正的「世界状态」模块）的选项。
 */
export type WorldstateCardOptions = {
  worldstate: WorldstateDto;
  locale: Locale;
  stale?: boolean;
};

/** 周期环边长（移动端宫格内可读） */
const RING_SIZE = 86;

/**
 * 估算周期卡片高度（2×3 宫格铺满）。
 * 单格含：上下内边距 + 标题 + 环 + 徽章 + 倒计时。
 *
 * @param _options - 建树选项（高度由行数决定）
 * @returns 像素高度
 */
export function estimateWorldstateCardHeight(_options: WorldstateCardOptions): number {
  const pad = laniusTokens.card.padding;
  const gap = laniusTokens.card.gap;
  const header = 40;
  // 10+10 内边距 + 标题区 + 环 + 间距 + 徽章 + 倒计时
  const tileH = 10 + 10 + 22 + RING_SIZE + 8 + 26 + 22;
  const rows = 2;
  return pad * 2 + 6 + header + rows * tileH + gap;
}

/**
 * 构建世界状态（开放世界周期）Satori 树：移动端 2×3 宫格铺满。
 *
 * @param options - DTO 与 locale
 * @returns Satori 元素树
 */
export function buildWorldstateCardTree(options: WorldstateCardOptions): SatoriNode {
  const { worldstate, locale, stale } = options;
  const zh = locale !== 'en';
  const cycles = worldstate.cycles.slice(0, 6);
  const gap = laniusTokens.card.gap;
  const rows = [cycles.slice(0, 3), cycles.slice(3, 6)];

  const stamp = worldstate.fetchedAt.replace('T', ' ').replace(/\.\d+Z$/, '');

  return buildQqShell({
    title: zh ? '世界状态' : 'WORLD STATE',
    subtitle: stamp || 'LANIUS',
    stale,
    zh,
    panel: false,
    body: [
      el('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        },
        children: rows.map((row, rowIndex) =>
          el('div', {
            key: `row-${rowIndex}`,
            style: {
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-between',
              marginBottom: rowIndex === rows.length - 1 ? 0 : gap,
            },
            children: row.map((cycle) => cycleTile(cycle, zh, locale)),
          }),
        ),
      }),
    ],
  });
}

/**
 * 单个周期小卡（名称 / SVG 环 / 状态徽章 / 倒计时），横向均分铺满。
 *
 * @param cycle - 周期 DTO
 * @param zh - 是否中文
 * @param locale - locale
 * @returns Satori 节点
 */
function cycleTile(cycle: OpenWorldCycleDto, zh: boolean, locale: Locale): SatoriNode {
  const colors = accentColors(cycle.state);
  const ringSrc = buildCycleRingDataUrl({
    progress: cycle.progress,
    activeColor: colors.ring,
    trackColor: colors.track,
    glyph: cycleGlyph(cycle.id),
    size: RING_SIZE,
  });

  return el('div', {
    key: cycle.id,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flexGrow: 1,
      flexBasis: 0,
      marginLeft: 3,
      marginRight: 3,
      background: laniusTokens.color.panel,
      border: `1px solid ${laniusTokens.color.border}`,
      borderRadius: laniusTokens.card.radius,
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 4,
      paddingRight: 4,
    },
    children: [
      el('div', {
        style: {
          display: 'flex',
          fontSize: 12,
          fontWeight: 600,
          color: laniusTokens.color.brand,
          marginBottom: 6,
          textAlign: 'center',
        },
        children: clipText(pickLocalized(cycle.name, locale), 8),
      }),
      el('img', {
        src: ringSrc,
        width: RING_SIZE,
        height: RING_SIZE,
        style: {
          width: RING_SIZE,
          height: RING_SIZE,
        },
      }),
      el('div', {
        style: {
          display: 'flex',
          marginTop: 8,
          background: colors.badgeBg,
          color: colors.badgeFg,
          fontSize: 12,
          fontWeight: 700,
          paddingTop: 3,
          paddingBottom: 3,
          paddingLeft: 10,
          paddingRight: 10,
          borderRadius: 8,
        },
        children: pickLocalized(cycle.stateLabel, locale),
      }),
      el('div', {
        style: {
          display: 'flex',
          marginTop: 6,
          fontSize: 14,
          fontWeight: 700,
          color: colors.badgeFg,
          fontFamily: 'Rajdhani',
        },
        children: formatRemaining(cycle.remainingMs, zh),
      }),
    ],
  });
}

/**
 * 周期中心简写（无图标资源时的占位）。
 *
 * @param id - 周期 id
 * @returns 1–2 字符
 */
function cycleGlyph(id: OpenWorldCycleDto['id']): string {
  const map: Record<OpenWorldCycleDto['id'], string> = {
    earth: 'E',
    cetus: 'C',
    cambion: 'D',
    vallis: 'V',
    duviri: 'U',
    zariman: 'Z',
  };
  return map[id];
}

/**
 * 按状态取环/徽章配色。
 * `track` 为对立相位色，形成参考站同款双色环。
 *
 * @param state - 状态键
 * @returns 颜色组
 */
function accentColors(state: string): {
  ring: string;
  track: string;
  badgeBg: string;
  badgeFg: string;
} {
  if (state === 'day' || state === 'fass' || state === 'warm' || state === 'anger') {
    return {
      ring: '#f0a030',
      track: '#2f5f8a',
      badgeBg: '#fff4e8',
      badgeFg: '#d97706',
    };
  }
  if (state === 'night' || state === 'vome' || state === 'cold' || state === 'corpus') {
    return {
      ring: '#3aa7d6',
      track: '#e8a060',
      badgeBg: '#e8f5fc',
      badgeFg: '#2486bb',
    };
  }
  if (state === 'grineer') {
    return {
      ring: '#6b8f3a',
      track: '#cfe3f0',
      badgeBg: '#eef6e4',
      badgeFg: '#4d6b28',
    };
  }
  if (state === 'fear' || state === 'sorrow') {
    return {
      ring: '#7c8a99',
      track: '#d4dbe3',
      badgeBg: '#eef1f4',
      badgeFg: '#5a7388',
    };
  }
  if (state === 'joy') {
    return {
      ring: '#e6b422',
      track: '#cfe3f0',
      badgeBg: '#fff8e0',
      badgeFg: '#b8860b',
    };
  }
  if (state === 'envy') {
    return {
      ring: '#2fbf7a',
      track: '#cfe3f0',
      badgeBg: '#e8faf0',
      badgeFg: '#1f8f5a',
    };
  }
  return {
    ring: laniusTokens.color.accent,
    track: laniusTokens.color.border,
    badgeBg: '#e8f5fc',
    badgeFg: laniusTokens.color.brand,
  };
}
