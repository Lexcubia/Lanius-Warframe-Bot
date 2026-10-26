<script setup lang="ts">
import type {
  ArchimedeaDifficultyDto,
  ArchimedeaKind,
  ArchimedeaSeasonDto,
  LocalizedName,
  WorldstateDto,
} from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 科研 QQ 截图卡：分层标题 + 任务行；偏差|风险两栏铺满。
 * 独立于警报；可按 `kind` 只展示精英或时光。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  /** 仅展示子类；缺省同时展示精英 + 时光 */
  kind?: ArchimedeaKind;
  skin?: CardSkinId;
}>();

/**
 * 卡片内任务行视图（已选好展示难度）。
 */
type MissionRowView = {
  index: number;
  typeLabel: string;
  factionLabel: string;
  deviationLabel: string;
  riskLabel: string;
};

/**
 * 季节块视图。
 */
type SeasonView = {
  kind: ArchimedeaKind;
  title: string;
  expiry: string;
  missions: MissionRowView[];
  variablesLabel: string;
};

/**
 * 子类标题。
 */
const KIND_TITLE: Record<ArchimedeaKind, LocalizedName> = {
  lab: { zh: '精英科研', en: 'Deep Archimedea' },
  hex: { zh: '时光科研', en: 'Temporal Archimedea' },
};

/**
 * 取双语字段。
 *
 * @param name - LocalizedName
 * @returns 当前 locale 文案
 */
function label(name: LocalizedName): string {
  return pickLocalized(name, props.locale);
}

/**
 * 优先精英档难度。
 *
 * @param difficulties - 难度列表
 * @returns 展示档
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
 * 缩短过期时间展示。
 *
 * @param iso - ISO8601
 * @returns 短文案
 */
function expiryLabel(iso: string | undefined): string {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) {
    return '';
  }
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return props.locale === 'en' ? `until ${mm}-${dd} UTC` : `至 ${mm}-${dd} UTC`;
}

/**
 * 将季节 DTO 转为卡片视图。
 *
 * @param season - 季节 DTO
 * @returns 视图块
 */
function toSeasonView(season: ArchimedeaSeasonDto): SeasonView {
  const missions: MissionRowView[] = season.missions.map((mission, index) => {
    const diff = pickDifficulty(mission.difficulties);
    return {
      index: index + 1,
      typeLabel: mission.missionType ? label(mission.missionType) : (mission.missionTypeKey ?? '—'),
      factionLabel: mission.faction ? label(mission.faction) : '',
      deviationLabel: diff?.deviation ? label(diff.deviation) : '',
      riskLabel: diff?.risks?.map((row) => label(row)).join(' · ') ?? '',
    };
  });
  const variablesLabel =
    season.variables?.map((row) => label(row)).join(' · ') ?? season.variableKeys.join(' · ');
  return {
    kind: season.kind,
    title: label(KIND_TITLE[season.kind]),
    expiry: expiryLabel(season.expiry),
    missions,
    variablesLabel,
  };
}

/**
 * 卡片主标题（总览或单子类）。
 *
 * @returns 标题文案
 */
const cardTitle = computed(() => {
  if (props.kind) {
    return label(KIND_TITLE[props.kind]);
  }
  return props.locale === 'en' ? 'ARCHIMEDEA' : '科研';
});

/**
 * 抓取时间戳。
 *
 * @returns 副标题时间
 */
const stamp = computed(() => formatTimestamp(props.worldstate.fetchedAt));

/**
 * 过滤并投影后的季节块。
 *
 * @returns 季节视图列表
 */
const seasonViews = computed((): SeasonView[] => {
  const all = props.worldstate.archimedea?.seasons ?? [];
  const filtered = props.kind ? all.filter((row) => row.kind === props.kind) : all;
  return filtered.map(toSeasonView);
});
</script>

<template>
  <QqCardShell
    :title="cardTitle"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <template v-if="seasonViews.length">
      <section
        v-for="season in seasonViews"
        :key="season.kind"
        class="arc__season"
        :data-kind="season.kind"
      >
        <header class="arc__season-head">
          <h4 class="arc__season-title">{{ season.title }}</h4>
          <span v-if="season.expiry" class="arc__expiry">{{ season.expiry }}</span>
        </header>

        <ul v-if="season.missions.length" class="arc__missions">
          <li v-for="mission in season.missions" :key="mission.index" class="arc__mission">
            <div class="arc__mission-main">
              <span class="arc__idx">{{ mission.index }}</span>
              <span class="arc__type">{{ mission.typeLabel }}</span>
              <span v-if="mission.factionLabel" class="arc__faction">{{
                mission.factionLabel
              }}</span>
            </div>
            <div v-if="mission.deviationLabel || mission.riskLabel" class="arc__mods">
              <span v-if="mission.deviationLabel" class="arc__dev">
                <em>{{ locale === 'en' ? 'Dev' : '偏差' }}</em>
                {{ mission.deviationLabel }}
              </span>
              <span v-if="mission.riskLabel" class="arc__risk">
                <em>{{ locale === 'en' ? 'Risk' : '风险' }}</em>
                {{ mission.riskLabel }}
              </span>
            </div>
          </li>
        </ul>
        <p v-else class="arc__empty-inline">
          {{ locale === 'en' ? 'No mission chain' : '本轮无任务链' }}
        </p>

        <p v-if="season.variablesLabel" class="arc__vars">
          <em>{{ locale === 'en' ? 'Mods' : '修正' }}</em>
          {{ season.variablesLabel }}
        </p>
      </section>
    </template>
    <p v-else class="arc__empty">
      {{ locale === 'en' ? 'No Archimedea data' : '当前无科研数据' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.arc__season {
  margin-bottom: 6px;
  width: 100%;
}
.arc__season:last-child {
  margin-bottom: 0;
}
.arc__season-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
  width: 100%;
}
.arc__season-title {
  margin: 0;
  font-size: var(--lanius-type-meta, 12px);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--lanius-accent-dim);
}
.arc__season[data-kind='hex'] .arc__season-title {
  color: var(--lanius-warn);
}
.arc__expiry {
  font-size: var(--lanius-type-caption, 11px);
  color: var(--lanius-text-muted);
  flex-shrink: 0;
}
.arc__missions {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--lanius-border);
}
.arc__mission {
  padding: 4px 0 5px;
  border-bottom: 1px solid var(--lanius-border);
}
.arc__mission-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--lanius-type-body, 14px);
  min-width: 0;
  width: 100%;
}
.arc__idx {
  flex-shrink: 0;
  width: 1.15em;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--lanius-text-muted);
}
.arc__type {
  font-weight: 700;
  color: var(--lanius-text);
  flex: 1;
  min-width: 0;
}
.arc__faction {
  color: var(--lanius-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 42%;
  margin-left: auto;
  text-align: right;
  font-weight: 600;
}
.arc__mods {
  display: flex;
  gap: 2px 10px;
  margin: 3px 0 0 1.4em;
  font-size: var(--lanius-type-caption, 11px);
  line-height: 1.35;
  color: var(--lanius-text-muted);
  width: calc(100% - 1.4em);
  box-sizing: border-box;
}
.arc__mods em {
  font-style: normal;
  font-weight: 700;
  color: var(--lanius-accent-dim);
  margin-right: 3px;
}
.arc__dev,
.arc__risk {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.arc__vars {
  margin: 4px 0 0;
  font-size: var(--lanius-type-caption, 11px);
  line-height: 1.35;
  color: var(--lanius-text-muted);
}
.arc__vars em {
  font-style: normal;
  font-weight: 700;
  color: var(--lanius-text);
  margin-right: 4px;
}
.arc__empty,
.arc__empty-inline {
  margin: 0;
  font-size: var(--lanius-type-body, 14px);
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 10px 0;
}
.arc__empty-inline {
  text-align: left;
  padding: 4px 0;
  font-size: var(--lanius-type-meta, 12px);
}
</style>
