import {
  VALENCE_ELEMENT_LABEL_EN,
  VALENCE_ELEMENT_LABEL_ZH,
  WikiDtoSchema,
  TranslateDtoSchema,
  ValenceFusionDtoSchema,
  bilingualLookup,
  fusionStepsToCap,
  parseValenceMaterialTokens,
  valenceFusion,
  type BilingualNameIndex,
  type Locale,
  type TranslateDto,
  type ValenceElement,
  type ValenceFusionDto,
  type WikiDto,
} from '@lanius/core';

import { loadBilingualNameIndex } from '../adapters/names/bilingual-catalog.js';
import { buildHuijiWikiPageUrl, buildHuijiWikiSearchUrl } from '../adapters/wiki/huiji-url.js';
import { resolvePlayTerm } from '../adapters/wiki/play-terms.js';

/**
 * Wiki / 翻译 / 效价工具服务依赖。
 */
export type WikiToolsServiceDeps = {
  /** 可注入双语索引（测试） */
  bilingualIndex?: BilingualNameIndex;
};

/**
 * Wave3 资料工具：wiki 深链、中英名翻译、效价融合（纯本地 / 捆绑表，无客户端上游）。
 */
export class WikiToolsService {
  private readonly bilingualIndex: BilingualNameIndex;

  /**
   * @param deps - 可选注入索引
   */
  constructor(deps: WikiToolsServiceDeps = {}) {
    this.bilingualIndex = deps.bilingualIndex ?? loadBilingualNameIndex();
  }

  /**
   * 灰机维基深链 + 短简介（非全文镜像）。
   *
   * 优先级：玩法词 → 双语表精确/候选 → 搜索页兜底。
   *
   * @param query - 用户关键词
   * @param locale - 展示 locale（影响简介行用语）
   * @returns WikiDto
   */
  lookupWiki(query: string, locale: Locale = 'zh'): WikiDto {
    const q = query.trim();
    if (!q) {
      return WikiDtoSchema.parse({
        query: q || '—',
        found: false,
        pageName: locale === 'en' ? 'Missing keyword' : '缺少关键词',
        pageUrl: buildHuijiWikiSearchUrl(''),
        lines: [
          locale === 'en' ? 'Usage: /wiki <keyword>' : '用法：/wiki 关键词（如「wiki 夜灵平野」）',
        ],
        alts: [],
        mode: 'search',
      });
    }

    const play = resolvePlayTerm(q);
    if (play) {
      return WikiDtoSchema.parse({
        query: q,
        found: true,
        pageName: play,
        pageUrl: buildHuijiWikiPageUrl(play),
        lines: buildShortIntro(play, undefined, locale, 'play'),
        alts: [],
        mode: 'page',
      });
    }

    const lookup = bilingualLookup(this.bilingualIndex, q, 5);
    const best = lookup.hits[0] ?? lookup.candidates[0];
    if (best) {
      // 国际服灰机页面名优先英文官方名（战甲名 DE 不译）；中文查询时仍用中文标题更易命中灰机。
      const pageName = lookup.direction === 'zh_to_en' ? best.zh : best.en;
      const alts = (lookup.hits.length > 0 ? lookup.hits : lookup.candidates)
        .slice(1)
        .map((p) => (locale === 'en' ? p.en : p.zh))
        .filter((name) => name !== pageName);
      return WikiDtoSchema.parse({
        query: q,
        found: true,
        pageName,
        pageUrl: buildHuijiWikiPageUrl(pageName),
        lines: buildShortIntro(best.zh, best.en, locale, 'item'),
        alts,
        mode: 'page',
      });
    }

    return WikiDtoSchema.parse({
      query: q,
      found: false,
      pageName: q,
      pageUrl: buildHuijiWikiSearchUrl(q),
      lines: [
        locale === 'en'
          ? `No local name hit for “${q}”. Open the search link below.`
          : `本地词库未收录「${q}」。请点下方搜索链接，或换官方中英名重试。`,
        locale === 'en'
          ? 'Short intro only — Lanius does not mirror the full wiki.'
          : '仅深链与短简介 — Lanius 不做全文百科镜像。',
      ],
      alts: [],
      mode: 'search',
    });
  }

  /**
   * 中英名称翻译（捆绑 DE language 同键对；不发明社区外号）。
   *
   * @param query - 名称
   * @returns TranslateDto
   */
  translateName(query: string): TranslateDto {
    const q = query.trim();
    if (!q) {
      return TranslateDtoSchema.parse({
        query: '—',
        direction: 'zh_to_en',
        hits: [],
        candidates: [],
      });
    }
    const r = bilingualLookup(this.bilingualIndex, q, 5);
    return TranslateDtoSchema.parse({
      query: q,
      direction: r.direction,
      hits: r.hits,
      candidates: r.candidates,
    });
  }

  /**
   * 效价融合 / 到满值规划。
   *
   * @param tokens - 根命令后词元（如 `电60` `火58` 或单值 `44`）
   * @param locale - 文案 locale
   * @returns ValenceFusionDto
   */
  computeValence(tokens: readonly string[], locale: Locale = 'zh'): ValenceFusionDto {
    const mats = parseValenceMaterialTokens(tokens);
    if (mats.length >= 2) {
      const a = mats[0]!;
      const b = mats[1]!;
      // 未写元素时用占位键参与计算；卡面不展示硬编「火焰」
      const elemA = a.element ?? 'heat';
      const elemB = b.element ?? 'heat';
      const hasElem = Boolean(a.element || b.element);
      const fusion = valenceFusion(elemA, a.percent, elemB, b.percent);
      const options = fusion.options.map((element) => ({
        element,
        label: elementLabel(element),
      }));
      const note =
        fusion.noteKind === 'same'
          ? locale === 'en'
            ? 'Same element — no choice needed'
            : '同元素，无需选择'
          : locale === 'en'
            ? 'Pick either element; they do not combine'
            : '两者任选其一，不会合成复合元素';
      const formula =
        locale === 'en'
          ? `result = higher ${Math.max(a.percent, b.percent)}% × 1.1` +
            (fusion.percent >= 60 ? ' → ≥58% snaps to 60%' : '')
          : `结果 = 较高值 ${Math.max(a.percent, b.percent)}% × 1.1` +
            (fusion.percent >= 60 ? ' → ≥58% 直接进位 60%' : '');

      let resultLine =
        locale === 'en'
          ? `Result: +${formatPct(fusion.percent)}%`
          : `◆ 融合结果：加成 ${formatPct(fusion.percent)}%`;
      if (fusion.percent < 60) {
        const steps = fusionStepsToCap(fusion.percent);
        resultLine +=
          locale === 'en'
            ? ` · ${steps.length} more same-value fusion(s) to cap`
            : `｜到满值还需 ${steps.length} 次融合（用同数值材料）`;
      }

      const matLabel = (m: (typeof mats)[number]) => {
        if (!hasElem) {
          return `${formatPct(m.percent)}%`;
        }
        const el = m.element ? elementLabel(m.element) : undefined;
        const name = el ? (locale === 'en' ? el.en : el.zh) : '—';
        return `${name}${formatPct(m.percent)}%`;
      };

      const lines = [
        resultLine,
        locale === 'en'
          ? `Materials: ${matLabel(a)} + ${matLabel(b)}`
          : `◆ 融合材料：${matLabel(a)} ＋ ${matLabel(b)}`,
      ];
      if (hasElem) {
        const optText = options
          .map((o) => (locale === 'en' ? o.label.en : o.label.zh))
          .join(locale === 'en' ? ' or ' : ' 或 ');
        lines.push(
          locale === 'en' ? `Element: ${optText} (${note})` : `◆ 元素：${optText}（${note}）`,
        );
      }
      lines.push(locale === 'en' ? `Formula: ${formula}` : `◆ 公式：${formula}`);
      lines.push(
        locale === 'en'
          ? '※ Same weapon only (same Kuva/Tenet/Coda name)'
          : '※ 必须是同款武器（同一把 Kuva/Tenet/Coda，同系列不同名不行）',
      );
      lines.push(
        locale === 'en'
          ? '※ Only the receiver is kept — catalyst / Forma / stance Forma / lens do not transfer'
          : '※ 只有受体会被保留：材料的催化剂 / Forma / 架式 Forma / 透镜都不转移',
      );
      lines.push(
        locale === 'en'
          ? '※ Cap rule: ≥58% snaps to 60% (material ≥52.8% can one-shot cap)'
          : '※ 满值判定：≥58% 即进位到 60%，所以材料 ≥52.8% 可一步满值',
      );

      return ValenceFusionDtoSchema.parse({
        mode: 'fusion',
        percent: fusion.percent,
        options: hasElem ? options : [],
        note,
        formula,
        materials: [
          {
            percent: a.percent,
            ...(a.element ? { element: a.element, elementLabel: elementLabel(a.element) } : {}),
          },
          {
            percent: b.percent,
            ...(b.element ? { element: b.element, elementLabel: elementLabel(b.element) } : {}),
          },
        ],
        steps: [],
        lines,
      });
    }

    if (mats.length === 1) {
      const start = mats[0]!.percent;
      const steps = fusionStepsToCap(start);
      const lines =
        locale === 'en'
          ? [
              `Need ${steps.length} fusion(s) with same-value material`,
              `Trace from ${formatPct(start)}% → 60%`,
              `· ${steps.map((s) => `${formatPct(s)}%`).join(' → ') || 'already capped'}`,
              '※ Material ≥58% snaps the receiver to 60% regardless of its own value',
            ]
          : [
              `◆ 共需：${steps.length} 次融合（用同数值材料；材料数值越高可少几次）`,
              `◆ 融合轨迹（从 ${formatPct(start)}% 到 60%）`,
              `· ${steps.map((s) => `${formatPct(s)}%`).join(' → ') || '已是满值'}`,
              '※ 材料 ≥58% 时受体无需再看自身数值，融合后直接 60%',
            ];
      return ValenceFusionDtoSchema.parse({
        mode: 'plan',
        materials: [{ percent: start }],
        steps,
        lines,
        options: [],
      });
    }

    return usageValence(locale);
  }
}

/**
 * 构造短简介行（名称对照或玩法说明；非百科全文）。
 *
 * @param zh - 中文名
 * @param en - 英文名（可选）
 * @param locale - 展示语言
 * @param kind - 玩法或物品
 * @returns 简介行
 */
function buildShortIntro(
  zh: string,
  en: string | undefined,
  locale: Locale,
  kind: 'play' | 'item',
): string[] {
  if (kind === 'play') {
    return locale === 'en'
      ? [`Activity: ${zh}`, 'Huiji wiki deep-link (short intro only).']
      : [`玩法：${zh}`, '灰机维基深链（短简介，非全文镜像）。'];
  }
  const lines: string[] = [];
  if (locale === 'en') {
    if (en) lines.push(`EN: ${en}`);
    lines.push(`ZH: ${zh}`);
  } else {
    lines.push(`中文名：${zh}`);
    if (en) lines.push(`英文名：${en}`);
  }
  lines.push(
    locale === 'en'
      ? 'Short intro only — open the link for full wiki.'
      : '短简介 — 完整条目请点灰机维基链接。',
  );
  return lines;
}

/**
 * 元素双语标签。
 *
 * @param element - 规范键
 * @returns LocalizedName
 */
function elementLabel(element: ValenceElement) {
  return {
    zh: VALENCE_ELEMENT_LABEL_ZH[element],
    en: VALENCE_ELEMENT_LABEL_EN[element],
  };
}

/**
 * 百分比展示（去掉多余尾零）。
 *
 * @param n - 数值
 * @returns 短字符串
 */
function formatPct(n: number): string {
  return Number.parseFloat(n.toFixed(1)).toString();
}

/**
 * 用法说明 DTO。
 *
 * @param locale - 语言
 * @returns ValenceFusionDto
 */
function usageValence(locale: Locale): ValenceFusionDto {
  const lines =
    locale === 'en'
      ? [
          'Usage examples:',
          '· /valence elec60 heat58 — fusion result + element choice',
          '· /valence 44 — fusions needed from 44% to 60%',
          'Elements: impact / heat / cold / electricity / toxin / magnetic / radiation',
        ]
      : [
          '用法示例：',
          '· /武器融合 电60 火58　两把融合的结果与可选元素',
          '· /武器融合 44　　　　　从 44% 到 60% 需要融合几次',
          '支持元素：电 / 火 / 冰 / 毒 / 冲击 / 磁力 / 辐射',
        ];
  return ValenceFusionDtoSchema.parse({
    mode: 'usage',
    lines,
    options: [],
    materials: [],
    steps: [],
  });
}
