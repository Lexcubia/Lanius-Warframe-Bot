import type { FissureDto, FissurePath, Locale, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { laniusTokens } from '@lanius/ui/tokens';

import { buildQqShell } from './qq-shell.js';
import { loadRelicIconDataUrl } from './relic-icons.js';
import { clipText, el, formatRemaining, type SatoriNode } from './satori-el.js';

/**
 * 虚空裂隙模块卡片选项。
 */
export type FissuresCardOptions = {
  worldstate: WorldstateDto;
  locale: Locale;
  stale?: boolean;
};

/**
 * 路径档展示顺序与中英标题。
 */
const PATH_SECTIONS: Array<{ path: FissurePath; zh: string; en: string }> = [
  { path: 'normal', zh: '普通', en: 'Normal' },
  { path: 'steelPath', zh: '钢铁之路', en: 'Steel Path' },
  { path: 'empyrean', zh: '九重天（虚空风暴）', en: 'Empyrean (Void Storm)' },
];

/**
 * 估算裂隙卡片高度。
 *
 * @param options - 建树选项
 * @returns 像素高度
 */
export function estimateFissuresCardHeight(options: FissuresCardOptions): number {
  const n = Math.min(options.worldstate.fissures.length, 14);
  const sections = PATH_SECTIONS.filter((section) =>
    options.worldstate.fissures.some((row) => row.path === section.path),
  ).length;
  const pad = laniusTokens.card.padding;
  // 外壳头 + 内卡垫 + 分段标题 + 行高（图标 40 + 行间距）
  return pad * 2 + 6 + 40 + 28 + sections * 26 + (n === 0 ? 40 : n * 54) + 10;
}

/**
 * 构建虚空裂隙模块 Satori 树。
 *
 * @param options - DTO 与 locale
 * @returns Satori 元素树
 */
export function buildFissuresCardTree(options: FissuresCardOptions): SatoriNode {
  const { worldstate, locale, stale } = options;
  const zh = locale !== 'en';
  const fissures = worldstate.fissures.slice(0, 14);

  if (fissures.length === 0) {
    return buildQqShell({
      title: zh ? '虚空裂隙' : 'FISSURES',
      subtitle: 'Void Fissures',
      stale,
      zh,
      body: [
        el('div', {
          style: {
            display: 'flex',
            color: laniusTokens.color.textMuted,
            fontSize: 14,
          },
          children: zh ? '当前无活跃裂隙' : 'No active fissures',
        }),
      ],
    });
  }

  const body: unknown[] = [];
  for (const section of PATH_SECTIONS) {
    const rows = fissures.filter((row) => row.path === section.path);
    if (rows.length === 0) {
      continue;
    }
    body.push(
      el('div', {
        key: `sec-${section.path}`,
        style: {
          display: 'flex',
          width: '100%',
          marginBottom: 8,
          marginTop: body.length === 0 ? 0 : 6,
          fontSize: 12,
          fontWeight: 700,
          color: pathAccent(section.path),
          fontFamily: 'Rajdhani',
        },
        children: zh ? section.zh : section.en,
      }),
    );
    rows.forEach((row, index) => {
      body.push(fissureRow(row, locale, zh, index === rows.length - 1));
    });
  }

  return buildQqShell({
    title: zh ? '虚空裂隙' : 'FISSURES',
    subtitle: 'Void Fissures',
    stale,
    zh,
    body,
  });
}

/**
 * 单条裂隙行：遗物图标 + 纪元/任务/节点 + 倒计时。
 *
 * @param row - 裂隙 DTO
 * @param locale - locale
 * @param zh - 是否中文
 * @param isLast - 是否段落末行
 * @returns Satori 节点
 */
function fissureRow(
  row: FissureDto,
  locale: Locale,
  zh: boolean,
  isLast: boolean,
): SatoriNode {
  const iconSrc = loadRelicIconDataUrl(row.era);
  const eraText = pickLocalized(row.eraLabel, locale);
  const mission = pickLocalized(row.missionType, locale);
  const node = pickLocalized(row.node, locale);

  return el('div', {
    key: row.id,
    style: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      alignItems: 'center',
      marginBottom: isLast ? 4 : 8,
      paddingBottom: isLast ? 0 : 8,
      borderBottom: isLast ? 'none' : `1px solid ${laniusTokens.color.border}`,
    },
    children: [
      iconSrc
        ? el('img', {
            src: iconSrc,
            width: 40,
            height: 40,
            style: {
              width: 40,
              height: 40,
              marginRight: 10,
              objectFit: 'contain',
            },
          })
        : el('div', {
            style: {
              display: 'flex',
              width: 40,
              height: 40,
              marginRight: 10,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              background: '#e8f5fc',
              color: laniusTokens.color.brand,
              fontSize: 11,
              fontWeight: 700,
            },
            children: eraText.slice(0, 2),
          }),
      el('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
        },
        children: [
          el('div', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              marginBottom: 2,
            },
            children: [
              el('div', {
                style: {
                  display: 'flex',
                  fontSize: 13,
                  fontWeight: 700,
                  color: laniusTokens.color.text,
                  marginRight: 8,
                },
                children: eraText,
              }),
              el('div', {
                style: {
                  display: 'flex',
                  fontSize: 12,
                  color: laniusTokens.color.accentDim,
                },
                children: clipText(mission, 16),
              }),
            ],
          }),
          el('div', {
            style: {
              display: 'flex',
              fontSize: 11,
              color: laniusTokens.color.textMuted,
            },
            children: clipText(node, 28),
          }),
        ],
      }),
      el('div', {
        style: {
          display: 'flex',
          fontFamily: 'Rajdhani',
          fontSize: 15,
          fontWeight: 700,
          color: pathAccent(row.path),
          marginLeft: 8,
          flexShrink: 0,
        },
        children: formatRemaining(row.remainingMs, zh),
      }),
    ],
  });
}

/**
 * 路径档强调色。
 *
 * @param path - 裂隙路径档
 * @returns CSS 颜色
 */
function pathAccent(path: FissurePath): string {
  if (path === 'steelPath') {
    return laniusTokens.color.highlight;
  }
  if (path === 'empyrean') {
    return '#7b6fd6';
  }
  return laniusTokens.color.brand;
}
