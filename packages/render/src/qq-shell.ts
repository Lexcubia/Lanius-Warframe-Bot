import { laniusTokens } from '@lanius/ui/tokens';

import { el, type SatoriNode } from './satori-el.js';

/**
 * QQ 移动端卡片外壳选项。
 */
export type QqShellOptions = {
  /** 主标题（中文或英文展示串） */
  title: string;
  /** 副标题 / 英文标 */
  subtitle: string;
  /** 是否陈旧数据 */
  stale?: boolean;
  /** 是否中文文案 */
  zh: boolean;
  /** 主体内容节点 */
  body: unknown[];
  /**
   * 是否再包一层白底内卡。
   * 世界状态宫格直接铺满时可关。
   */
  panel?: boolean;
};

/**
 * QQ 图片通用外壳：移动端宽度、紧凑边距、内容区铺满。
 *
 * @param options - 标题与主体
 * @returns Satori 根节点
 */
export function buildQqShell(options: QqShellOptions): SatoriNode {
  const { title, subtitle, stale, zh, body, panel = true } = options;
  const pad = laniusTokens.card.padding;

  const content = panel
    ? [
        el('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            background: laniusTokens.color.panel,
            border: `1px solid ${laniusTokens.color.border}`,
            borderRadius: laniusTokens.card.radius,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 12,
            paddingRight: 12,
          },
          children: body,
        }),
      ]
    : body;

  return el('div', {
    style: {
      width: laniusTokens.card.width,
      // 探测画布内铺满浅底；最终高度由 rasterizeCard 像素扫描裁切
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: `linear-gradient(180deg, ${laniusTokens.color.panelRaised} 0%, ${laniusTokens.color.void} 100%)`,
      paddingTop: pad,
      paddingBottom: pad,
      paddingLeft: pad,
      paddingRight: pad,
      fontFamily: 'IBM Plex Sans, Noto Sans SC',
      color: laniusTokens.color.text,
    },
    children: [
      el('div', {
        style: {
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: `1px solid ${laniusTokens.color.borderBright}`,
          flexShrink: 0,
        },
        children: [
          el('div', {
            style: {
              display: 'flex',
              fontSize: 17,
              fontWeight: 700,
              color: laniusTokens.color.brand,
              fontFamily: 'Rajdhani',
            },
            children: title,
          }),
          el('div', {
            style: {
              display: 'flex',
              fontSize: 10,
              color: laniusTokens.color.textMuted,
            },
            children: subtitle,
          }),
        ],
      }),
      stale
        ? el('div', {
            style: {
              display: 'flex',
              marginBottom: 6,
              fontSize: 11,
              color: laniusTokens.color.warn,
              flexShrink: 0,
            },
            children: zh ? '数据可能延迟' : 'Data may be delayed',
          })
        : null,
      ...content,
    ].filter(Boolean),
  });
}
