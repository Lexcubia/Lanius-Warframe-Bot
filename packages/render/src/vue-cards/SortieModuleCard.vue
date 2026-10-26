<script setup lang="ts">
import type { SortieDto, SortieMissionDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 每日突击 QQ 截图卡：Boss + 至多三步任务链（类型 / 节点 / 修正）。
 * 单列铺满：任务类型左、节点右；修正占满次行。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  skin?: CardSkinId;
}>();

/**
 * 取双语字段。
 *
 * @param name - LocalizedName
 * @returns 当前 locale 文案
 */
function label(name: { zh: string; en: string }): string {
  return pickLocalized(name, props.locale);
}

/**
 * 突击切片。
 *
 * @returns SortieDto 或 null
 */
const chain = computed((): SortieDto | null => props.worldstate.sortie);

/**
 * 抓取时间戳短文案。
 *
 * @returns 卡片副标题用时间
 */
const stamp = computed(() => formatTimestamp(props.worldstate.fetchedAt));

/**
 * Boss 显示名。
 *
 * @returns Boss 文案
 */
const bossName = computed(() => {
  const row = chain.value;
  if (!row) {
    return '';
  }
  if (row.boss) {
    return label(row.boss);
  }
  return row.bossKey ?? '—';
});

/**
 * 过期时间短展示。
 *
 * @returns 副信息；无过期时空串
 */
const expiryLabel = computed(() => {
  const expiry = chain.value?.expiry;
  if (!expiry) {
    return '';
  }
  return formatTimestamp(expiry);
});

/**
 * 单步任务类型文案。
 *
 * @param mission - 任务步
 * @returns 类型；缺省 —
 */
function missionType(mission: SortieMissionDto): string {
  if (mission.missionType) {
    return label(mission.missionType);
  }
  return mission.missionTypeKey ?? '—';
}

/**
 * 单步节点文案。
 *
 * @param mission - 任务步
 * @returns 节点；缺省空串
 */
function missionNode(mission: SortieMissionDto): string {
  if (mission.node) {
    return label(mission.node);
  }
  return mission.nodeKey ?? '';
}

/**
 * 单步修正文案。
 *
 * @param mission - 任务步
 * @returns 修正；无则空串
 */
function missionModifier(mission: SortieMissionDto): string {
  if (mission.modifier) {
    return label(mission.modifier);
  }
  return '';
}
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'SORTIE' : '突击'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <template v-if="chain">
      <div class="sortie__meta">
        <strong class="sortie__boss">{{ bossName }}</strong>
        <span v-if="expiryLabel" class="sortie__expiry">{{
          locale === 'en' ? `Until ${expiryLabel}` : `至 ${expiryLabel}`
        }}</span>
      </div>
      <ol v-if="chain.missions.length" class="sortie__list">
        <li
          v-for="(mission, index) in chain.missions"
          :key="`${mission.nodeKey ?? index}-${mission.missionTypeKey ?? index}`"
          class="sortie__row"
          :class="{ 'sortie__row--zebra': index % 2 === 1 }"
        >
          <span class="sortie__idx">{{ index + 1 }}</span>
          <div class="sortie__body">
            <div class="sortie__primary">
              <span class="sortie__type">{{ missionType(mission) }}</span>
              <span v-if="missionNode(mission)" class="sortie__node">{{
                missionNode(mission)
              }}</span>
            </div>
            <span v-if="missionModifier(mission)" class="sortie__mod">{{
              missionModifier(mission)
            }}</span>
          </div>
        </li>
      </ol>
      <p v-else class="sortie__empty">
        {{ locale === 'en' ? 'No missions listed' : '暂无任务' }}
      </p>
    </template>
    <p v-else class="sortie__empty">
      {{ locale === 'en' ? 'No Sortie data' : '暂无突击数据' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.sortie__meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 3px;
  width: 100%;
}
.sortie__boss {
  font-size: var(--lanius-type-lead, 16px);
  font-weight: 700;
  color: var(--lanius-text);
  min-width: 0;
}
.sortie__expiry {
  flex-shrink: 0;
  font-size: var(--lanius-type-meta, 12px);
  color: var(--lanius-text-muted);
}
.sortie__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--lanius-border);
}
.sortie__row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid var(--lanius-border);
  width: 100%;
  box-sizing: border-box;
}
.sortie__row--zebra {
  background: color-mix(in srgb, var(--lanius-accent) 6%, transparent);
}
.sortie__idx {
  flex-shrink: 0;
  width: 1.15em;
  font-size: var(--lanius-type-body, 14px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--lanius-accent-dim);
  line-height: 1.35;
}
.sortie__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sortie__primary {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  width: 100%;
}
.sortie__type {
  font-size: var(--lanius-type-body, 14px);
  font-weight: 700;
  color: var(--lanius-text);
  min-width: 0;
}
.sortie__node {
  flex-shrink: 0;
  max-width: 58%;
  font-size: var(--lanius-type-body, 14px);
  font-weight: 600;
  color: var(--lanius-text);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sortie__mod {
  font-size: var(--lanius-type-meta, 12px);
  color: var(--lanius-text-muted);
  line-height: 1.3;
}
.sortie__empty {
  margin: 0;
  font-size: var(--lanius-type-body, 14px);
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
</style>
