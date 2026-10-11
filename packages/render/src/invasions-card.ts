import type { Locale, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { laniusTokens } from '@lanius/ui/tokens';

import { buildQqShell } from './qq-shell.js';
import { clipText, el, type SatoriNode } from './satori-el.js';

/**
 * 入侵模块卡片选项。
 */
export type InvasionsCardOptions = {
  worldstate: WorldstateDto;
  locale: Locale;
  stale?: boolean;
};

/**
 * 估算入侵卡片高度。
 *
 * @param options - 建树选项
 * @returns 像素高度
 */
export function estimateInvasionsCardHeight(options: InvasionsCardOptions): number {
  const n = Math.min(options.worldstate.invasions.length, 6);
  const pad = laniusTokens.card.padding;
  // 标题行 + 进度条 + 阵营行 + 分隔间距
  return pad * 2 + 6 + 40 + 28 + (n === 0 ? 40 : n * 76) + 10;
}

/**
 * 构建入侵模块 Satori 树（独立于世界状态周期）。
 *
 * @param options - DTO 与 locale
 * @returns Satori 元素树
 */
export function buildInvasionsCardTree(options: InvasionsCardOptions): SatoriNode {
  const { worldstate, locale, stale } = options;
  const zh = locale !== 'en';
  const invasions = worldstate.invasions.slice(0, 6);

  const rows =
    invasions.length === 0
      ? [
          el('div', {
            style: {
              display: 'flex',
              color: laniusTokens.color.textMuted,
              fontSize: 14,
            },
            children: zh ? '当前无活跃入侵' : 'No active invasions',
          }),
        ]
      : invasions.map((row, index) => {
          const pct = Math.max(0, Math.min(100, row.completionPct ?? 0));
          const isLast = index === invasions.length - 1;
          return el('div', {
            key: row.id,
            style: {
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              marginBottom: isLast ? 0 : 10,
              paddingBottom: isLast ? 0 : 10,
              borderBottom: isLast ? 'none' : `1px solid ${laniusTokens.color.border}`,
            },
            children: [
              el('div', {
                style: {
                  display: 'flex',
                  width: '100%',
                  fontSize: 14,
                  fontWeight: 600,
                  color: laniusTokens.color.text,
                  marginBottom: 6,
                },
                children: clipText(pickLocalized(row.node, locale), 28),
              }),
              row.completionPct !== undefined
                ? el('div', {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      width: '100%',
                      height: 12,
                      borderRadius: 999,
                      overflow: 'hidden',
                      background: laniusTokens.color.border,
                      marginBottom: 6,
                    },
                    children: [
                      el('div', {
                        style: {
                          display: 'flex',
                          flexGrow: Math.max(pct, 2),
                          flexBasis: 0,
                          height: 12,
                          background: laniusTokens.color.barAttack,
                        },
                      }),
                      el('div', {
                        style: {
                          display: 'flex',
                          flexGrow: Math.max(100 - pct, 2),
                          flexBasis: 0,
                          height: 12,
                          background: laniusTokens.color.barDefend,
                        },
                      }),
                    ],
                  })
                : null,
              el('div', {
                style: {
                  display: 'flex',
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                },
                children: [
                  el('div', {
                    style: {
                      display: 'flex',
                      flex: 1,
                      fontSize: 12,
                      color: laniusTokens.color.barAttack,
                    },
                    children: clipText(pickLocalized(row.attackingFaction, locale), 14),
                  }),
                  el('div', {
                    style: {
                      display: 'flex',
                      fontFamily: 'Rajdhani',
                      fontSize: 14,
                      fontWeight: 700,
                      color: laniusTokens.color.accentDim,
                      paddingLeft: 8,
                      paddingRight: 8,
                    },
                    children:
                      row.completionPct !== undefined ? `${row.completionPct}%` : '—',
                  }),
                  el('div', {
                    style: {
                      display: 'flex',
                      flex: 1,
                      justifyContent: 'flex-end',
                      fontSize: 12,
                      color: laniusTokens.color.barDefend,
                    },
                    children: clipText(pickLocalized(row.defendingFaction, locale), 14),
                  }),
                ],
              }),
            ].filter(Boolean),
          });
        });

  return buildQqShell({
    title: zh ? '入侵' : 'INVASIONS',
    subtitle: 'Invasions',
    stale,
    zh,
    body: rows,
  });
}
