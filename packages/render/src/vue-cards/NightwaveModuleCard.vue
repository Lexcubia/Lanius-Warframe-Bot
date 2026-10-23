<script setup lang="ts">
import type { NightwaveChallengeDto, NightwaveChallengeKind, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 午夜电波 QQ 截图卡：分组紧；挑战单行 标题…声望。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  maxItems?: number;
  skin?: CardSkinId;
}>();

const KIND_ORDER: NightwaveChallengeKind[] = ['daily', 'weekly', 'other'];

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
 * 午夜电波切片。
 *
 * @returns nightwave DTO 或 null
 */
const nw = computed(() => props.worldstate.nightwave);

/**
 * 截断后的挑战列表。
 *
 * @returns 挑战行
 */
const challenges = computed((): NightwaveChallengeDto[] => {
  const limit = props.maxItems ?? 8;
  return nw.value?.activeChallenges.slice(0, limit) ?? [];
});

/**
 * 按周期档分组。
 *
 * @returns 分组列表
 */
const groups = computed(() => {
  const byKind = new Map<NightwaveChallengeKind, NightwaveChallengeDto[]>();
  for (const kind of KIND_ORDER) {
    byKind.set(kind, []);
  }
  for (const row of challenges.value) {
    byKind.get(row.kind)?.push(row);
  }
  return KIND_ORDER.filter((kind) => (byKind.get(kind)?.length ?? 0) > 0).map((kind) => ({
    kind,
    label: byKind.get(kind)?.[0]?.kindLabel ?? { zh: kind, en: kind },
    items: byKind.get(kind) ?? [],
  }));
});

/**
 * 抓取时间戳短文案。
 *
 * @returns 卡片副标题用时间
 */
const stamp = computed(() => formatTimestamp(props.worldstate.fetchedAt));
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'NIGHTWAVE' : '午夜电波'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <template v-if="nw">
      <div class="nw__meta">
        <span>
          {{ locale === 'en' ? 'Season' : '赛季' }} {{ nw.season ?? '—' }} ·
          {{ locale === 'en' ? 'Phase' : '阶段' }} {{ nw.phase ?? '—' }}
        </span>
        <span class="nw__count">{{ challenges.length }}</span>
      </div>
      <template v-if="groups.length">
        <section v-for="group in groups" :key="group.kind" class="nw__group">
          <h4 class="nw__group-title" :data-kind="group.kind">{{ label(group.label) }}</h4>
          <ul class="nw__list">
            <li v-for="challenge in group.items" :key="challenge.id" class="nw__row">
              <span class="nw__title">{{
                challenge.title ? label(challenge.title) : challenge.id
              }}</span>
              <span v-if="challenge.reputation != null" class="nw__rep">{{
                challenge.reputation
              }}</span>
            </li>
          </ul>
        </section>
      </template>
      <p v-else class="nw__empty">
        {{ locale === 'en' ? 'No active challenges' : '当前无活跃挑战' }}
      </p>
    </template>
    <p v-else class="nw__empty">
      {{ locale === 'en' ? 'No Nightwave data' : '暂无午夜电波数据' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.nw__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.nw__count {
  font-weight: 700;
  color: var(--lanius-accent-dim);
}
.nw__group {
  margin-bottom: 4px;
}
.nw__group:last-child {
  margin-bottom: 0;
}
.nw__group-title {
  margin: 0 0 2px;
  font-size: 10px;
  font-weight: 700;
  color: var(--lanius-text-muted);
  letter-spacing: 0.04em;
}
.nw__group-title[data-kind='daily'] {
  color: var(--lanius-accent-dim);
}
.nw__group-title[data-kind='weekly'] {
  color: var(--lanius-warn);
}
.nw__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--lanius-border);
}
.nw__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 3px 2px;
  border-bottom: 1px solid var(--lanius-border);
  font-size: 11px;
}
.nw__title {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  color: var(--lanius-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nw__rep {
  margin-left: auto;
  flex-shrink: 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--lanius-accent);
}
.nw__empty {
  margin: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
</style>
