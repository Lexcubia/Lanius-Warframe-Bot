import type { Locale, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { laniusTokens } from '@lanius/ui/tokens';

/**
 * 构建供 Satori 使用的世界状态卡片元素树的选项。
 */
export type WorldstateCardOptions = {
  worldstate: WorldstateDto;
  locale: Locale;
  stale?: boolean;
};

type SatoriNode = {
  type: string;
  props: Record<string, unknown>;
};

/**
 * 创建 Satori 元素节点（兼容 React element 的普通对象）。
 *
 * @param type - HTML 标签名。
 * @param props - 传给 Satori 的 style / children 等属性。
 * @returns Satori 可接受的普通元素对象。
 */
function el(type: string, props: Record<string, unknown>): SatoriNode {
  return { type, props };
}

/**
 * 构建世界状态卡片的 Satori 元素树。
 * 配色与面板节奏对齐 Web 端 `@lanius/ui` token。
 *
 * @param options - worldstate DTO、locale，以及可选 stale 标记。
 * @returns 供 Satori 消费的元素树。
 */
export function buildWorldstateCardTree(options: WorldstateCardOptions): SatoriNode {
  const { worldstate, locale, stale } = options;
  const zh = locale !== 'en';
  const invasions = worldstate.invasions.slice(0, 5);
  const challenges = worldstate.nightwave?.activeChallenges.slice(0, 4) ?? [];

  const invasionChildren =
    invasions.length === 0
      ? [
          el('div', {
            style: { color: laniusTokens.color.textMuted, fontSize: 14 },
            children: zh ? '当前无活跃入侵' : 'No active invasions',
          }),
        ]
      : invasions.map((row) =>
          el('div', {
            key: row.id,
            style: {
              display: 'flex',
              flexDirection: 'column',
              marginBottom: 10,
            },
            children: [
              el('div', {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 15,
                  fontWeight: 600,
                },
                children: [
                  el('span', { children: pickLocalized(row.node, locale) }),
                  el('span', {
                    children:
                      row.completionPct !== undefined ? `${row.completionPct}%` : '',
                  }),
                ],
              }),
              el('div', {
                style: {
                  color: laniusTokens.color.textMuted,
                  fontSize: 12,
                  marginTop: 2,
                },
                children: `${pickLocalized(row.attackingFaction, locale)} → ${pickLocalized(row.defendingFaction, locale)}`,
              }),
              row.completionPct !== undefined
                ? el('div', {
                    style: {
                      marginTop: 6,
                      height: 4,
                      background: laniusTokens.color.border,
                      borderRadius: 999,
                      display: 'flex',
                    },
                    children: [
                      el('div', {
                        style: {
                          width: `${row.completionPct}%`,
                          height: 4,
                          background: laniusTokens.color.accent,
                          borderRadius: 999,
                        },
                      }),
                    ],
                  })
                : null,
            ].filter(Boolean),
          }),
        );

  const nightwaveChildren = worldstate.nightwave
    ? [
        el('div', {
          style: {
            color: laniusTokens.color.textMuted,
            fontSize: 13,
            marginBottom: 8,
          },
          children: `${zh ? '赛季' : 'Season'} ${worldstate.nightwave.season ?? '—'} · ${
            zh ? '阶段' : 'Phase'
          } ${worldstate.nightwave.phase ?? '—'}`,
        }),
        ...challenges.map((challenge) =>
          el('div', {
            key: challenge.id,
            style: { fontSize: 14, marginBottom: 8, color: laniusTokens.color.text },
            children: challenge.title
              ? pickLocalized(challenge.title, locale)
              : challenge.id,
          }),
        ),
      ]
    : [
        el('div', {
          style: { color: laniusTokens.color.textMuted, fontSize: 14 },
          children: zh ? '暂无夜浪数据' : 'No Nightwave data',
        }),
      ];

  return el('div', {
    style: {
      width: laniusTokens.card.width,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: `linear-gradient(165deg, ${laniusTokens.color.panelRaised} 0%, ${laniusTokens.color.void} 70%)`,
      color: laniusTokens.color.text,
      padding: laniusTokens.card.padding,
      fontFamily: 'IBM Plex Sans, Noto Sans SC',
      border: `1px solid ${laniusTokens.color.border}`,
      borderRadius: laniusTokens.card.radius,
    },
    children: [
      el('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 18,
        },
        children: [
          el('div', {
            style: { display: 'flex', flexDirection: 'column' },
            children: [
              el('div', {
                style: {
                  color: laniusTokens.color.accent,
                  fontSize: 14,
                  letterSpacing: 4,
                  fontFamily: 'Rajdhani',
                  textTransform: 'uppercase',
                },
                children: zh ? '世界状态' : 'WORLD STATE',
              }),
              el('div', {
                style: {
                  fontSize: 34,
                  fontWeight: 700,
                  fontFamily: 'Rajdhani',
                  color: laniusTokens.color.brand,
                  marginTop: 4,
                },
                children: 'LANIUS',
              }),
            ],
          }),
          el('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 6,
            },
            children: [
              el('div', {
                style: {
                  background: laniusTokens.color.highlight,
                  color: '#ffffff',
                  fontFamily: 'Rajdhani',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 2,
                  padding: '4px 10px',
                  borderRadius: 999,
                },
                children: 'LIVE',
              }),
              el('div', {
                style: { color: laniusTokens.color.textMuted, fontSize: 12 },
                children: worldstate.fetchedAt,
              }),
            ],
          }),
        ],
      }),
      stale
        ? el('div', {
            style: { color: laniusTokens.color.warn, fontSize: 13, marginBottom: 10 },
            children: zh ? '数据可能延迟（缓存降级）' : 'Data may be delayed (stale cache)',
          })
        : null,
      el('div', {
        style: { display: 'flex', gap: 14, flex: 1 },
        children: [
          el('div', {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: laniusTokens.color.panel,
              border: `1px solid ${laniusTokens.color.border}`,
              borderRadius: laniusTokens.card.radius,
              padding: 14,
            },
            children: [
              el('div', {
                style: {
                  fontFamily: 'Rajdhani',
                  fontSize: 18,
                  letterSpacing: 2,
                  color: laniusTokens.color.brand,
                  marginBottom: 10,
                },
                children: zh ? '入侵' : 'INVASIONS',
              }),
              ...invasionChildren,
            ],
          }),
          el('div', {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: laniusTokens.color.panel,
              border: `1px solid ${laniusTokens.color.border}`,
              borderRadius: laniusTokens.card.radius,
              padding: 14,
            },
            children: [
              el('div', {
                style: {
                  fontFamily: 'Rajdhani',
                  fontSize: 18,
                  letterSpacing: 2,
                  color: laniusTokens.color.brand,
                  marginBottom: 10,
                },
                children: zh ? '夜浪' : 'NIGHTWAVE',
              }),
              ...nightwaveChildren,
            ],
          }),
        ],
      }),
    ].filter(Boolean),
  });
}
