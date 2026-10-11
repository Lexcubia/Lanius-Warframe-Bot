import type { Locale, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { laniusTokens } from '@lanius/ui/tokens';

import { buildQqShell } from './qq-shell.js';
import { clipText, el, type SatoriNode } from './satori-el.js';

/**
 * 午夜电波模块卡片选项。
 */
export type NightwaveCardOptions = {
  worldstate: WorldstateDto;
  locale: Locale;
  stale?: boolean;
};

/**
 * 估算午夜电波卡片高度。
 *
 * @param options - 建树选项
 * @returns 像素高度
 */
export function estimateNightwaveCardHeight(options: NightwaveCardOptions): number {
  const n = Math.min(options.worldstate.nightwave?.activeChallenges.length ?? 0, 8);
  const pad = laniusTokens.card.padding;
  // 赛季行 + 挑战行（标题+描述）
  return pad * 2 + 6 + 40 + 28 + 32 + (n === 0 ? 40 : n * 58) + 10;
}

/**
 * 构建午夜电波模块 Satori 树（独立于世界状态周期）。
 *
 * @param options - DTO 与 locale
 * @returns Satori 元素树
 */
export function buildNightwaveCardTree(options: NightwaveCardOptions): SatoriNode {
  const { worldstate, locale, stale } = options;
  const zh = locale !== 'en';
  const nw = worldstate.nightwave;
  const challenges = nw?.activeChallenges.slice(0, 8) ?? [];

  const body = !nw
    ? [
        el('div', {
          style: {
            display: 'flex',
            color: laniusTokens.color.textMuted,
            fontSize: 14,
          },
          children: zh ? '暂无午夜电波数据' : 'No Nightwave data',
        }),
      ]
    : [
        el('div', {
          style: {
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            marginBottom: 12,
            color: laniusTokens.color.textMuted,
            fontSize: 12,
          },
          children: [
            el('div', {
              style: { display: 'flex' },
              children: `${zh ? '赛季' : 'Season'} ${nw.season ?? '—'} · ${
                zh ? '阶段' : 'Phase'
              } ${nw.phase ?? '—'}`,
            }),
            el('div', {
              style: {
                display: 'flex',
                background: '#e8f5fc',
                color: laniusTokens.color.brand,
                borderRadius: 999,
                paddingLeft: 8,
                paddingRight: 8,
                fontWeight: 700,
              },
              children: String(challenges.length),
            }),
          ],
        }),
        ...challenges.map((challenge, index) =>
          el('div', {
            key: challenge.id,
            style: {
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              marginBottom: index === challenges.length - 1 ? 0 : 10,
              alignItems: 'flex-start',
            },
            children: [
              el('div', {
                style: {
                  display: 'flex',
                  width: 22,
                  height: 22,
                  marginRight: 8,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: index % 2 === 0 ? '#e8f5fc' : '#fff4e8',
                  color:
                    index % 2 === 0
                      ? laniusTokens.color.brand
                      : laniusTokens.color.warn,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'Rajdhani',
                  flexShrink: 0,
                },
                children: String(index + 1),
              }),
              el('div', {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                },
                children: [
                  el('div', {
                    style: {
                      display: 'flex',
                      fontSize: 13,
                      fontWeight: 600,
                      color: laniusTokens.color.text,
                    },
                    children: clipText(
                      challenge.title
                        ? pickLocalized(challenge.title, locale)
                        : challenge.id,
                      22,
                    ),
                  }),
                  challenge.description
                    ? el('div', {
                        style: {
                          display: 'flex',
                          marginTop: 2,
                          fontSize: 11,
                          color: laniusTokens.color.textMuted,
                        },
                        children: clipText(
                          pickLocalized(challenge.description, locale),
                          30,
                        ),
                      })
                    : null,
                ].filter(Boolean),
              }),
            ],
          }),
        ),
      ];

  return buildQqShell({
    title: zh ? '午夜电波' : 'NIGHTWAVE',
    subtitle: 'Nightwave',
    stale,
    zh,
    body,
  });
}
