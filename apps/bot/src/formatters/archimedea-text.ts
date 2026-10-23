import type {
  ArchimedeaDifficultyDto,
  ArchimedeaKind,
  ArchimedeaSeasonDto,
  Locale,
  WorldstateDto,
} from '@lanius/core';
import { pickLocalized } from '@lanius/core';

/**
 * 科研子类标题。
 */
const KIND_TITLE: Record<ArchimedeaKind, { zh: string; en: string }> = {
  lab: { zh: '精英科研', en: 'Deep Archimedea' },
  hex: { zh: '时光科研', en: 'Temporal Archimedea' },
};

/**
 * 将科研切片格式化为 QQ 文本（可按 kind 过滤）。
 *
 * @param worldstate - 世界状态 DTO
 * @param locale - 语言
 * @param options - stale / kind 过滤 / 站点 URL
 * @returns QQ 文本
 */
export function formatArchimedeaText(
  worldstate: WorldstateDto,
  locale: Locale,
  options: {
    stale?: boolean;
    siteUrl?: string;
    /** 仅展示精英 / 时光；缺省同时摘要两者 */
    kind?: ArchimedeaKind;
  } = {},
): string {
  const zh = locale !== 'en';
  const bullet = String.fromCharCode(0xb7);
  const seasons = filterSeasons(worldstate.archimedea?.seasons ?? [], options.kind);
  const title =
    options.kind != null
      ? pickLocalized(KIND_TITLE[options.kind], locale)
      : zh
        ? '科研'
        : 'Archimedea';

  const lines: string[] = [];
  lines.push(zh ? `【Lanius ${bullet} ${title}】` : `[Lanius ${bullet} ${title}]`);
  if (options.stale) {
    lines.push(zh ? '（数据可能延迟）' : '(data may be delayed)');
  }

  if (seasons.length === 0) {
    lines.push(
      zh
        ? `${bullet} 当前无科研数据（可试：/精英科研 · /时光科研）`
        : `${bullet} no Archimedea data (try: /精英科研 · /时光科研)`,
    );
  } else {
    for (const season of seasons) {
      lines.push(...formatSeasonBlock(season, locale, bullet));
    }
  }

  if (options.siteUrl) {
    lines.push(options.siteUrl);
  }
  return lines.join('\n');
}

/**
 * 按命令子类过滤季节列表。
 *
 * @param seasons - 全部季节
 * @param kind - 可选过滤
 * @returns 过滤后的季节
 */
function filterSeasons(
  seasons: ArchimedeaSeasonDto[],
  kind: ArchimedeaKind | undefined,
): ArchimedeaSeasonDto[] {
  if (!kind) {
    return seasons;
  }
  return seasons.filter((row) => row.kind === kind);
}

/**
 * 格式化单季科研文本块。
 *
 * @param season - 单季 DTO
 * @param locale - 语言
 * @param bullet - 项目符号
 * @returns 文本行
 */
function formatSeasonBlock(season: ArchimedeaSeasonDto, locale: Locale, bullet: string): string[] {
  const zh = locale !== 'en';
  const lines: string[] = [];
  const head = pickLocalized(KIND_TITLE[season.kind], locale);
  const expiry = season.expiry
    ? zh
      ? `至 ${shortStamp(season.expiry)}`
      : `until ${shortStamp(season.expiry)}`
    : '';
  lines.push(expiry ? `${bullet} ${head} · ${expiry}` : `${bullet} ${head}`);

  season.missions.forEach((mission, index) => {
    const typeName = mission.missionType
      ? pickLocalized(mission.missionType, locale)
      : (mission.missionTypeKey ?? '—');
    const factionName = mission.faction
      ? pickLocalized(mission.faction, locale)
      : (mission.factionKey ?? '');
    const headLine = factionName
      ? `  ${index + 1}. ${typeName} · ${factionName}`
      : `  ${index + 1}. ${typeName}`;
    lines.push(headLine);

    const difficulty = pickDifficulty(mission.difficulties);
    if (difficulty) {
      const deviation = difficulty.deviation
        ? pickLocalized(difficulty.deviation, locale)
        : (difficulty.deviationKey ?? '');
      const risks =
        difficulty.risks?.map((name) => pickLocalized(name, locale)).join(zh ? '·' : ',') ??
        difficulty.riskKeys.join(zh ? '·' : ',');
      if (deviation || risks) {
        lines.push(
          zh
            ? `     偏差 ${deviation || '—'} | 风险 ${risks || '—'}`
            : `     Dev ${deviation || '—'} | Risk ${risks || '—'}`,
        );
      }
    }
  });

  if (season.missions.length === 0) {
    lines.push(zh ? '  （本轮无任务链）' : '  (no mission chain)');
  }

  const variables =
    season.variables?.map((name) => pickLocalized(name, locale)) ?? season.variableKeys;
  if (variables.length > 0) {
    lines.push(zh ? `  修正：${variables.join(' · ')}` : `  Mods: ${variables.join(' · ')}`);
  }

  return lines;
}

/**
 * 优先取精英档（CD_HARD），否则取首档。
 *
 * @param difficulties - 难度列表
 * @returns 展示用难度或 undefined
 */
function pickDifficulty(
  difficulties: ArchimedeaDifficultyDto[],
): ArchimedeaDifficultyDto | undefined {
  return (
    difficulties.find((row) => row.typeKey === 'CD_HARD') ??
    difficulties.find((row) => row.typeKey === 'CD_NORMAL') ??
    difficulties[0]
  );
}

/**
 * 缩短 ISO 时间为 `MM-DD HH:mm`（UTC 展示）。
 *
 * @param iso - ISO8601
 * @returns 短时间戳
 */
function shortStamp(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) {
    return iso;
  }
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi} UTC`;
}
